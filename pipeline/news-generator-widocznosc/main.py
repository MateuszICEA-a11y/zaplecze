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
from image_generator import generate_hero_image

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


def run() -> None:
    """Run the full news pipeline."""
    log.info("=== widocznosc.ai News Pipeline ===")

    # 1. Load config
    config = load_config()
    feeds = load_feeds()
    published = load_published()
    scoring_cfg = config.get("scoring", {})
    llm_cfg = config.get("llm", {})
    fmt_cfg = config.get("format", {})
    trends_cfg = config.get("trends", {})
    pipeline_cfg = config.get("pipeline", {})

    content_dir = REPO_ROOT / pipeline_cfg["content_dir"]
    assets_dir = REPO_ROOT / pipeline_cfg["assets_dir"]
    news_dir = content_dir / pipeline_cfg.get("output_section", "news")

    # 2. Build Trends seeds (static only)
    trends_seeds = list(trends_cfg.get("seeds_static", []))
    log.info("Trends seeds: %d static", len(trends_seeds))

    # 3. No keyword clusters for widocznosc.ai (Astro news section)
    clusters: list[dict] = []

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

    # 6. Find related articles for internal linking (best-effort; Astro news may be empty)
    try:
        related = find_related_articles(topic.section, str(content_dir), topic.signal.title)
    except Exception as e:
        log.warning("find_related_articles failed (%s). Using empty list.", e)
        related = []
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

    # 9. Ensure a title is present, then derive date + slug + paths
    fm.setdefault("title", topic.signal.title)
    date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    slug = generate_slug(fm["title"])
    filename = f"{date_str}-{slug}.md"

    # Guard: don't publish twice on the same day
    today_published = [p for p in published if p.get("date") == date_str]
    if today_published:
        log.info("Already published today: '%s'. Skipping.", today_published[0].get("title", ""))
        return
    output_path = news_dir / filename
    if output_path.exists():
        log.info("File already exists: %s. Skipping.", filename)
        return

    # 9b. Generate hero image BEFORE post-process (with fallback)
    image_rel = f"../../assets/images/news-{date_str}-{slug}.webp"
    image_dest = assets_dir / f"news-{date_str}-{slug}.webp"
    try:
        generate_hero_image(title=fm["title"], section="news", dest=image_dest)
    except Exception as e:
        log.warning("Image generation failed (%s). Using fallback.", e)
        image_rel = "../../assets/images/blog-geo-przewodnik.webp"

    # 10. Post-process (Astro frontmatter)
    fm, body, errors = postprocess(
        fm,
        body,
        image_path=image_rel,
        author=pipeline_cfg.get("author", "Redakcja widocznosc.ai"),
    )
    if errors:
        log.error("Frontmatter validation errors, not writing: %s", errors)
        return

    # 11. Write file
    news_dir.mkdir(parents=True, exist_ok=True)
    output_path.write_text(build_markdown(fm, body), encoding="utf-8")
    log.info("Written: %s", output_path.relative_to(REPO_ROOT))

    # 12. Update published history
    published.append({
        "title": fm.get("title", topic.signal.title),
        "date": date_str,
        "slug": slug,
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
