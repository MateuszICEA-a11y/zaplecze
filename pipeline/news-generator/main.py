#!/usr/bin/env python3
"""News pipeline orchestrator for BusManiak.pl.

Collects signals, scores topics, generates content, post-processes,
and writes the final markdown file.
"""

from __future__ import annotations

import json
import logging
import sys
from datetime import datetime, timezone
from pathlib import Path

import yaml

from collector import collect_all_signals
from scorer import select_topic
from generator import generate_article, parse_llm_output, find_related_articles
from postprocessor import postprocess, build_markdown, generate_slug

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger("news-generator")

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
PIPELINE_DIR = Path(__file__).resolve().parent


def load_config() -> dict:
    """Load pipeline configuration."""
    with open(PIPELINE_DIR / "config.yaml", encoding="utf-8") as f:
        return yaml.safe_load(f)


def load_feeds() -> list[dict]:
    """Load RSS feed configuration."""
    with open(PIPELINE_DIR / "feeds.yaml", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    return data.get("feeds", [])


def load_published() -> list[dict]:
    """Load published history."""
    path = PIPELINE_DIR / "published.json"
    if not path.exists():
        return []
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def save_published(history: list[dict]) -> None:
    """Save published history."""
    with open(PIPELINE_DIR / "published.json", "w", encoding="utf-8") as f:
        json.dump(history, f, ensure_ascii=False, indent=2)


def load_clusters(data_dir: Path) -> list[dict]:
    """Load keyword clusters from data directory."""
    path = data_dir / "clusters.json"
    if not path.exists():
        return []
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    return data.get("clusters", [])


def load_model_names(data_dir: Path) -> list[str]:
    """Load bus model names for Trends seeds."""
    path = data_dir / "buses.json"
    if not path.exists():
        return []
    with open(path, encoding="utf-8") as f:
        buses = json.load(f)
    names = set()
    for bus in buses:
        name = bus.get("name", "")
        # "Fiat Ducato L2H2" → "Fiat Ducato"
        parts = name.split()
        if len(parts) >= 2:
            names.add(" ".join(parts[:2]))
    return list(names)


def run() -> None:
    """Run the full news pipeline."""
    log.info("=== BusManiak News Pipeline ===")

    # 1. Load config
    config = load_config()
    feeds = load_feeds()
    published = load_published()
    scoring_cfg = config.get("scoring", {})
    llm_cfg = config.get("llm", {})
    fmt_cfg = config.get("format", {})
    trends_cfg = config.get("trends", {})
    pipeline_cfg = config.get("pipeline", {})

    content_dir = REPO_ROOT / pipeline_cfg.get("content_dir", "portals/busmaniak.pl/content")
    data_dir = REPO_ROOT / pipeline_cfg.get("data_dir", "portals/busmaniak.pl/data")

    # 2. Build Trends seeds (static + dynamic from buses.json)
    trends_seeds = list(trends_cfg.get("seeds_static", []))
    model_names = load_model_names(data_dir)
    trends_seeds.extend(model_names)
    log.info(
        "Trends seeds: %d static + %d models = %d total",
        len(trends_cfg.get("seeds_static", [])),
        len(model_names),
        len(trends_seeds),
    )

    # 3. Load clusters
    clusters = load_clusters(data_dir)
    log.info("Loaded %d clusters", len(clusters))

    # 4. Collect signals
    log.info("Collecting signals...")
    signals = collect_all_signals(
        feeds_config=feeds,
        trends_seeds=trends_seeds,
        max_age_hours=scoring_cfg.get("max_age_hours", 48),
        published_history=published,
        dedup_threshold=scoring_cfg.get("dedup_similarity_threshold", 0.7),
    )
    log.info("Collected %d unique signals", len(signals))

    if not signals:
        log.info("No signals found. Exiting.")
        return

    # 5. Score and select topic
    log.info("Scoring topics...")
    topic = select_topic(signals, clusters, published, scoring_cfg, llm_cfg)

    if topic is None:
        log.info("No topic scored above threshold. Exiting.")
        return

    log.info(
        "Selected: '%s' [%s, section=%s]",
        topic.signal.title,
        topic.format_type,
        topic.section,
    )

    # 6. Find related articles for internal linking (across all sections)
    related = find_related_articles(topic.section, str(content_dir), topic.signal.title)
    log.info("Found %d related articles for '%s'", len(related), topic.signal.title[:50])

    # 7. Generate article
    log.info("Generating article via %s...", llm_cfg.get("model", "gpt-5.4"))
    raw_output = generate_article(
        topic=topic,
        related_articles=related,
        model=llm_cfg.get("model", "gpt-5.4"),
        temperature=llm_cfg.get("temperature_writer", 0.7),
        max_completion_tokens=llm_cfg.get("max_tokens_short", 2000),
        format_config=fmt_cfg,
    )

    # 8. Parse LLM output
    try:
        fm, body = parse_llm_output(raw_output)
    except ValueError as e:
        log.error("Failed to parse LLM output: %s", e)
        log.error("Raw output:\n%s", raw_output[:500])
        sys.exit(1)

    # 9. Post-process
    image_map = config.get("images", {})
    fm, body, errors = postprocess(fm, body, section=topic.section, image_map=image_map)
    if errors:
        log.warning("Frontmatter validation warnings: %s", errors)
        fm.setdefault("title", topic.signal.title)
        fm.setdefault("date", datetime.now(timezone.utc).strftime("%Y-%m-%d"))
        fm.setdefault("description", topic.signal.summary[:160])
        fm.setdefault("draft", False)
        fm.setdefault("main_keyword", topic.signal.title.lower())
        fm.setdefault("lead", topic.signal.summary)

    # 10. Write file
    slug = generate_slug(fm.get("title", topic.signal.title))
    date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    filename = f"{date_str}-{slug}.md"
    output_path = content_dir / pipeline_cfg.get("output_section", "news") / filename

    output_path.parent.mkdir(parents=True, exist_ok=True)
    markdown = build_markdown(fm, body)
    output_path.write_text(markdown, encoding="utf-8")
    log.info("Written: %s", output_path.relative_to(REPO_ROOT))

    # 11. Update published history
    published.append({
        "title": fm.get("title", topic.signal.title),
        "date": date_str,
        "slug": slug,
        "section": topic.section,
        "format": topic.format_type,
        "source": topic.signal.source,
    })

    # Keep last N entries
    history_days = scoring_cfg.get("published_history_days", 90)
    if len(published) > history_days:
        published = published[-history_days:]

    save_published(published)
    log.info("Updated published.json (%d entries)", len(published))

    log.info("=== Pipeline complete ===")


if __name__ == "__main__":
    run()
