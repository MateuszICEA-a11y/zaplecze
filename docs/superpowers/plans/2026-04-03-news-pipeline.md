# News Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an automated daily news pipeline that collects signals from RSS/Google Trends/Google Alerts, picks the best topic, generates a news article via GPT-5.4, and publishes it to BusManiak.pl without human intervention.

**Architecture:** GitHub Actions cron workflow (7:00 CET) runs a Python orchestrator that: (1) collects signals from 3 sources, (2) scores and selects the best topic via algorithmic scoring + GPT-5.4 judge, (3) generates content via GPT-5.4, (4) post-processes (typography, linking, validation), (5) commits to repo for auto-deploy via Cloudflare Pages.

**Tech Stack:** Python 3.12, OpenAI SDK (GPT-5.4), feedparser, pytrends, PyYAML, difflib (stdlib). GitHub Actions for scheduling. Hugo for rendering.

**Design spec:** `docs/superpowers/specs/2026-04-03-news-pipeline-design.md`

---

## File Structure

```
pipeline/news-generator/
├── config.yaml          # scoring thresholds, Trends seeds, general settings
├── feeds.yaml           # RSS feed URLs with categories
├── published.json       # history of published topics (starts as empty array)
├── main.py              # orchestrator – runs full pipeline
├── collector.py         # signal collection: RSS, Google Trends, Google Alerts
├── scorer.py            # topic scoring algorithm + GPT-5.4 judge
├── generator.py         # content generation via GPT-5.4
├── postprocessor.py     # frontmatter validation, typography, internal linking
├── requirements.txt     # Python dependencies
└── tests/
    ├── __init__.py
    ├── test_collector.py
    ├── test_scorer.py
    ├── test_generator.py
    └── test_postprocessor.py

portals/busmaniak.pl/
├── content/news/_index.md   # NEW – section landing page
└── hugo.toml                # MODIFY – add News menu entry

.github/workflows/
└── news-generator.yml       # NEW – scheduled workflow

shared/theme/layouts/news/   # NEW – news-specific layouts (optional, falls back to _default)
└── single.html              # NEW – news article layout with "news" badge
```

---

### Task 1: Hugo Section Setup

**Files:**
- Create: `portals/busmaniak.pl/content/news/_index.md`
- Modify: `portals/busmaniak.pl/hugo.toml`

- [ ] **Step 1: Create news section _index.md**

```yaml
---
title: "News"
description: "Najnowsze wiadomości ze świata busów, vanów, kamperów i motoryzacji dostawczej"
draft: false
h1: "News – najświeższe wiadomości"
---
```

Write this to `portals/busmaniak.pl/content/news/_index.md`.

- [ ] **Step 2: Add News to Hugo menu**

In `portals/busmaniak.pl/hugo.toml`, add after the last `[[menus.main]]` entry (Narzędzia, weight 10):

```toml
[[menus.main]]
name = "News"
url = "/news/"
weight = 11
```

- [ ] **Step 3: Verify Hugo builds with new section**

Run:
```bash
cd portals/busmaniak.pl && hugo --quiet 2>&1 | head -20
```
Expected: Build succeeds, no errors.

- [ ] **Step 4: Commit**

```bash
git add portals/busmaniak.pl/content/news/_index.md portals/busmaniak.pl/hugo.toml
git commit -m "feat(news): add /news/ section and menu entry"
```

---

### Task 2: Config Files

**Files:**
- Create: `pipeline/news-generator/config.yaml`
- Create: `pipeline/news-generator/feeds.yaml`
- Create: `pipeline/news-generator/published.json`
- Create: `pipeline/news-generator/requirements.txt`

- [ ] **Step 1: Create feeds.yaml**

```yaml
feeds:
  - url: "https://news.google.com/rss/search?q=bus+OR+van+OR+kamper+OR+dostawczy&hl=pl&gl=PL&ceid=PL:pl"
    category: "general"
    name: "Google News PL"

  - url: "https://news.google.com/rss/search?q=fiat+ducato+OR+mercedes+sprinter+OR+ford+transit&hl=pl&gl=PL&ceid=PL:pl"
    category: "modele"
    name: "Google News modele"

  - url: "https://news.google.com/rss/search?q=kamper+OR+campervan+OR+vanlife&hl=pl&gl=PL&ceid=PL:pl"
    category: "kampery"
    name: "Google News kampery"

  - url: "https://news.google.com/rss/search?q=paliwo+diesel+OR+ceny+paliw+polska&hl=pl&gl=PL&ceid=PL:pl"
    category: "serwis"
    name: "Google News paliwo"

  - url: "https://news.google.com/rss/search?q=prawo+drogowe+OR+regulacje+transport&hl=pl&gl=PL&ceid=PL:pl"
    category: "przepisy"
    name: "Google News przepisy"
```

Write to `pipeline/news-generator/feeds.yaml`.

- [ ] **Step 2: Create config.yaml**

```yaml
pipeline:
  name: "BusManiak News Generator"
  portal: "busmaniak.pl"
  content_dir: "portals/busmaniak.pl/content"
  data_dir: "portals/busmaniak.pl/data"
  output_section: "news"
  author: "Redakcja BusManiak.pl"

scoring:
  min_score_threshold: 0.4
  freshness_weight: 0.3
  relevance_weight: 0.3
  trend_weight: 0.2
  uniqueness_weight: 0.2
  max_age_hours: 48
  published_history_days: 90
  dedup_similarity_threshold: 0.7

trends:
  geo: "PL"
  category: 47  # Vehicles & Transportation
  seeds_static:
    - "bus dostawczy"
    - "van"
    - "kamper"
    - "furgon"
    - "paliwo diesel"
    - "prawo jazdy C"
    - "regulacje transport"
  seeds_dynamic_from: "buses.json"  # load model names from data

llm:
  model: "gpt-5.4"
  temperature_judge: 0.3
  temperature_writer: 0.7
  max_tokens_judge: 500
  max_tokens_short: 2000
  max_tokens_analysis: 4000

format:
  short_max_words: 600
  short_min_words: 400
  analysis_max_words: 1200
  analysis_min_words: 800
  short_h2_count: "2-3"
  analysis_h2_count: "4-5"
```

Write to `pipeline/news-generator/config.yaml`.

- [ ] **Step 3: Create empty published.json**

```json
[]
```

Write to `pipeline/news-generator/published.json`.

- [ ] **Step 4: Create requirements.txt**

```
openai>=1.40.0
feedparser>=6.0.0
pytrends>=4.9.0
pyyaml>=6.0
```

Write to `pipeline/news-generator/requirements.txt`.

- [ ] **Step 5: Commit**

```bash
git add pipeline/news-generator/config.yaml pipeline/news-generator/feeds.yaml pipeline/news-generator/published.json pipeline/news-generator/requirements.txt
git commit -m "feat(news): add pipeline config, feeds, and dependencies"
```

---

### Task 3: Signal Collector

**Files:**
- Create: `pipeline/news-generator/collector.py`
- Create: `pipeline/news-generator/tests/__init__.py`
- Create: `pipeline/news-generator/tests/test_collector.py`

- [ ] **Step 1: Write tests for RSS collector**

```python
"""Tests for signal collector."""

import json
from datetime import datetime, timezone
from unittest.mock import patch, MagicMock
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent.parent))

from collector import (
    parse_rss_feeds,
    parse_trends,
    deduplicate_signals,
    Signal,
)


def _make_rss_entry(title: str, summary: str, published: str, link: str) -> dict:
    return {
        "title": title,
        "summary": summary,
        "published_parsed": datetime.strptime(published, "%Y-%m-%d").timetuple(),
        "link": link,
    }


class TestParseRssFeeds:
    def test_extracts_signals_from_feed(self):
        mock_feed = MagicMock()
        mock_feed.entries = [
            _make_rss_entry(
                "Nowy Fiat Ducato 2027 – premiera",
                "Fiat zaprezentował nową generację Ducato...",
                "2026-04-03",
                "https://example.com/ducato-2027",
            ),
        ]
        mock_feed.bozo = False

        with patch("collector.feedparser.parse", return_value=mock_feed):
            feeds_config = [{"url": "https://example.com/feed", "category": "modele", "name": "Test"}]
            signals = parse_rss_feeds(feeds_config)

        assert len(signals) == 1
        assert signals[0].title == "Nowy Fiat Ducato 2027 – premiera"
        assert signals[0].source == "rss"
        assert signals[0].category == "modele"

    def test_skips_entries_older_than_max_age(self):
        mock_feed = MagicMock()
        mock_feed.entries = [
            _make_rss_entry(
                "Stary news",
                "Bardzo stary artykuł...",
                "2026-01-01",
                "https://example.com/old",
            ),
        ]
        mock_feed.bozo = False

        with patch("collector.feedparser.parse", return_value=mock_feed):
            feeds_config = [{"url": "https://example.com/feed", "category": "general", "name": "Test"}]
            signals = parse_rss_feeds(feeds_config, max_age_hours=48)

        assert len(signals) == 0


class TestDeduplicateSignals:
    def test_removes_similar_titles(self):
        signals = [
            Signal(title="Fiat Ducato 2027 – premiera nowego modelu", summary="a", source="rss", category="modele", published=datetime.now(timezone.utc), url="https://a.com"),
            Signal(title="Fiat Ducato 2027 – premiera nowej generacji", summary="b", source="rss", category="modele", published=datetime.now(timezone.utc), url="https://b.com"),
            Signal(title="Ceny paliw w Polsce – kwiecień 2026", summary="c", source="rss", category="serwis", published=datetime.now(timezone.utc), url="https://c.com"),
        ]
        result = deduplicate_signals(signals, threshold=0.7)
        assert len(result) == 2
        titles = {s.title for s in result}
        assert "Ceny paliw w Polsce – kwiecień 2026" in titles

    def test_keeps_unique_signals(self):
        signals = [
            Signal(title="Temat A", summary="a", source="rss", category="modele", published=datetime.now(timezone.utc), url="https://a.com"),
            Signal(title="Temat B", summary="b", source="rss", category="serwis", published=datetime.now(timezone.utc), url="https://b.com"),
        ]
        result = deduplicate_signals(signals, threshold=0.7)
        assert len(result) == 2
```

Write to `pipeline/news-generator/tests/test_collector.py`. Also create empty `pipeline/news-generator/tests/__init__.py`.

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd pipeline/news-generator && pip install -r requirements.txt -q && python -m pytest tests/test_collector.py -v 2>&1 | tail -20
```
Expected: FAIL – `collector` module not found.

- [ ] **Step 3: Implement collector.py**

```python
"""Signal collector – RSS feeds, Google Trends, Google Alerts."""

from __future__ import annotations

import time
from dataclasses import dataclass, asdict
from datetime import datetime, timezone, timedelta
from difflib import SequenceMatcher
from time import mktime

import feedparser

try:
    from pytrends.request import TrendReq
except ImportError:
    TrendReq = None


@dataclass
class Signal:
    title: str
    summary: str
    source: str  # "rss", "trends", "alerts"
    category: str
    published: datetime
    url: str
    trend_score: float = 0.0

    def to_dict(self) -> dict:
        d = asdict(self)
        d["published"] = self.published.isoformat()
        return d


def parse_rss_feeds(
    feeds_config: list[dict],
    max_age_hours: int = 48,
) -> list[Signal]:
    """Parse RSS feeds and return signals within max_age_hours."""
    cutoff = datetime.now(timezone.utc) - timedelta(hours=max_age_hours)
    signals: list[Signal] = []

    for feed_cfg in feeds_config:
        try:
            feed = feedparser.parse(feed_cfg["url"])
            if feed.bozo and not feed.entries:
                continue

            for entry in feed.entries:
                published = _parse_entry_date(entry)
                if published is None or published < cutoff:
                    continue

                signals.append(Signal(
                    title=entry.get("title", "").strip(),
                    summary=entry.get("summary", "").strip(),
                    source="rss",
                    category=feed_cfg.get("category", "general"),
                    published=published,
                    url=entry.get("link", ""),
                ))
        except Exception:
            continue

    return signals


def _parse_entry_date(entry: dict) -> datetime | None:
    """Extract datetime from a feedparser entry."""
    parsed = entry.get("published_parsed") or entry.get("updated_parsed")
    if parsed:
        try:
            return datetime.fromtimestamp(mktime(parsed), tz=timezone.utc)
        except (ValueError, OverflowError):
            return None
    return None


def fetch_google_trends(
    seeds: list[str],
    geo: str = "PL",
    category: int = 47,
) -> list[Signal]:
    """Fetch trending queries from Google Trends related to seed keywords."""
    if TrendReq is None:
        return []

    signals: list[Signal] = []
    now = datetime.now(timezone.utc)

    try:
        pytrends = TrendReq(hl="pl-PL", tz=-60)

        # Process seeds in batches of 5 (pytrends limit)
        for i in range(0, len(seeds), 5):
            batch = seeds[i : i + 5]
            try:
                pytrends.build_payload(batch, cat=category, geo=geo, timeframe="now 1-d")
                related = pytrends.related_queries()

                for keyword, data in related.items():
                    if data and data.get("rising") is not None:
                        for _, row in data["rising"].iterrows():
                            query = row.get("query", "")
                            value = row.get("value", 0)
                            if query:
                                signals.append(Signal(
                                    title=query,
                                    summary=f"Rising trend for '{keyword}': {query}",
                                    source="trends",
                                    category="general",
                                    published=now,
                                    url="",
                                    trend_score=min(value / 500, 1.0),
                                ))
                time.sleep(1)  # Rate limiting
            except Exception:
                continue
    except Exception:
        pass

    return signals


def deduplicate_signals(
    signals: list[Signal],
    threshold: float = 0.7,
) -> list[Signal]:
    """Remove near-duplicate signals based on title similarity."""
    if not signals:
        return []

    unique: list[Signal] = [signals[0]]

    for candidate in signals[1:]:
        is_duplicate = False
        for existing in unique:
            similarity = SequenceMatcher(
                None,
                candidate.title.lower(),
                existing.title.lower(),
            ).ratio()
            if similarity >= threshold:
                is_duplicate = True
                break
        if not is_duplicate:
            unique.append(candidate)

    return unique


def filter_already_published(
    signals: list[Signal],
    published_history: list[dict],
    threshold: float = 0.7,
) -> list[Signal]:
    """Remove signals that match already published topics."""
    published_titles = [p.get("title", "").lower() for p in published_history]

    filtered: list[Signal] = []
    for signal in signals:
        is_published = False
        for pub_title in published_titles:
            similarity = SequenceMatcher(
                None,
                signal.title.lower(),
                pub_title,
            ).ratio()
            if similarity >= threshold:
                is_published = True
                break
        if not is_published:
            filtered.append(signal)

    return filtered


def collect_all_signals(
    feeds_config: list[dict],
    trends_seeds: list[str],
    trends_geo: str,
    trends_category: int,
    max_age_hours: int,
    published_history: list[dict],
    dedup_threshold: float,
) -> list[Signal]:
    """Run all collectors and return deduplicated, filtered signals."""
    signals: list[Signal] = []

    # 1. RSS feeds
    rss_signals = parse_rss_feeds(feeds_config, max_age_hours=max_age_hours)
    signals.extend(rss_signals)

    # 2. Google Trends
    trends_signals = fetch_google_trends(
        seeds=trends_seeds,
        geo=trends_geo,
        category=trends_category,
    )
    signals.extend(trends_signals)

    # 3. Deduplicate
    signals = deduplicate_signals(signals, threshold=dedup_threshold)

    # 4. Filter already published
    signals = filter_already_published(signals, published_history, threshold=dedup_threshold)

    return signals
```

Write to `pipeline/news-generator/collector.py`.

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd pipeline/news-generator && python -m pytest tests/test_collector.py -v 2>&1 | tail -20
```
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add pipeline/news-generator/collector.py pipeline/news-generator/tests/
git commit -m "feat(news): signal collector – RSS, Trends, deduplication"
```

---

### Task 4: Topic Scorer

**Files:**
- Create: `pipeline/news-generator/scorer.py`
- Create: `pipeline/news-generator/tests/test_scorer.py`

- [ ] **Step 1: Write tests for scorer**

```python
"""Tests for topic scorer."""

import json
from datetime import datetime, timezone, timedelta
from unittest.mock import patch, MagicMock
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent.parent))

from collector import Signal
from scorer import score_signals, match_section


def _make_signal(
    title: str,
    hours_ago: float = 1,
    category: str = "modele",
    trend_score: float = 0.0,
) -> Signal:
    return Signal(
        title=title,
        summary=f"Summary of {title}",
        source="rss",
        category=category,
        published=datetime.now(timezone.utc) - timedelta(hours=hours_ago),
        url=f"https://example.com/{title.replace(' ', '-')}",
        trend_score=trend_score,
    )


class TestScoreSignals:
    def test_fresher_signal_scores_higher(self):
        signals = [
            _make_signal("Fresh news", hours_ago=1),
            _make_signal("Old news", hours_ago=40),
        ]
        scored = score_signals(
            signals,
            clusters=[],
            published_history=[],
            weights={"freshness": 1.0, "relevance": 0.0, "trend": 0.0, "uniqueness": 0.0},
            max_age_hours=48,
        )
        assert scored[0].title == "Fresh news"

    def test_trending_signal_scores_higher(self):
        signals = [
            _make_signal("Normal topic", trend_score=0.0),
            _make_signal("Trending topic", trend_score=0.9),
        ]
        scored = score_signals(
            signals,
            clusters=[],
            published_history=[],
            weights={"freshness": 0.0, "relevance": 0.0, "trend": 1.0, "uniqueness": 0.0},
            max_age_hours=48,
        )
        assert scored[0].title == "Trending topic"


class TestMatchSection:
    def test_matches_section_from_clusters(self):
        clusters = [
            {
                "id": "modele-busow",
                "name": "Modele busow i vanow",
                "pillar": {"keyword": "samochod dostawczy"},
                "satellites": [
                    {"keyword": "fiat ducato"},
                    {"keyword": "mercedes sprinter"},
                ],
            },
            {
                "id": "kampery",
                "name": "Kampery i camper vany",
                "pillar": {"keyword": "kamper"},
                "satellites": [
                    {"keyword": "camper van"},
                ],
            },
        ]
        section = match_section("Nowy Fiat Ducato 2027 zaprezentowany", clusters)
        assert section == "modele"

    def test_fallback_to_general_when_no_match(self):
        section = match_section("Pogoda na weekend", [])
        assert section == "news"
```

Write to `pipeline/news-generator/tests/test_scorer.py`.

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd pipeline/news-generator && python -m pytest tests/test_scorer.py -v 2>&1 | tail -20
```
Expected: FAIL – `scorer` module not found.

- [ ] **Step 3: Implement scorer.py**

```python
"""Topic scorer – algorithmic scoring + LLM judge."""

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from datetime import datetime, timezone, timedelta
from difflib import SequenceMatcher

from openai import OpenAI

from collector import Signal


# Cluster ID → Hugo section mapping
CLUSTER_SECTION_MAP = {
    "modele-busow": "modele",
    "kampery": "kampery",
    "przerobki": "przerobki",
    "zabudowy": "zabudowy",
    "porownania": "porownania",
    "serwis": "serwis",
    "wynajem": "wynajem",
    "przepisy": "przepisy",
    "vanlife": "vanlife",
}


@dataclass
class ScoredSignal:
    signal: Signal
    score: float
    section: str
    format_type: str  # "short" or "analysis"


def score_signals(
    signals: list[Signal],
    clusters: list[dict],
    published_history: list[dict],
    weights: dict[str, float],
    max_age_hours: int = 48,
) -> list[Signal]:
    """Score signals and return sorted by score descending."""
    now = datetime.now(timezone.utc)
    max_age = timedelta(hours=max_age_hours)

    scored: list[tuple[float, Signal]] = []
    published_titles = [p.get("title", "").lower() for p in published_history[-30:]]

    for signal in signals:
        # Freshness: 1.0 for just now, 0.0 for max_age_hours old
        age = now - signal.published
        freshness = max(0.0, 1.0 - (age.total_seconds() / max_age.total_seconds()))

        # Relevance: check title against cluster keywords
        relevance = _compute_relevance(signal.title, clusters)

        # Trend momentum
        trend = signal.trend_score

        # Uniqueness: distance from recently published
        uniqueness = _compute_uniqueness(signal.title, published_titles)

        total = (
            weights.get("freshness", 0.3) * freshness
            + weights.get("relevance", 0.3) * relevance
            + weights.get("trend", 0.2) * trend
            + weights.get("uniqueness", 0.2) * uniqueness
        )

        scored.append((total, signal))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [s for _, s in scored]


def _compute_relevance(title: str, clusters: list[dict]) -> float:
    """Score how relevant a title is to BusManiak's clusters."""
    if not clusters:
        return 0.5  # Neutral if no clusters

    title_lower = title.lower()
    best = 0.0

    for cluster in clusters:
        keywords = [cluster.get("pillar", {}).get("keyword", "")]
        keywords += [s.get("keyword", "") for s in cluster.get("satellites", [])]

        for kw in keywords:
            if kw and kw.lower() in title_lower:
                return 1.0
            if kw:
                sim = SequenceMatcher(None, title_lower, kw.lower()).ratio()
                best = max(best, sim)

    return best


def _compute_uniqueness(title: str, published_titles: list[str]) -> float:
    """Score how unique a title is vs recently published titles."""
    if not published_titles:
        return 1.0

    max_sim = 0.0
    for pub in published_titles:
        sim = SequenceMatcher(None, title.lower(), pub).ratio()
        max_sim = max(max_sim, sim)

    return 1.0 - max_sim


def match_section(title: str, clusters: list[dict]) -> str:
    """Match a news title to the best Hugo section."""
    title_lower = title.lower()
    best_cluster_id = None
    best_score = 0.0

    for cluster in clusters:
        keywords = [cluster.get("pillar", {}).get("keyword", "")]
        keywords += [s.get("keyword", "") for s in cluster.get("satellites", [])]

        for kw in keywords:
            if not kw:
                continue
            if kw.lower() in title_lower:
                cluster_id = cluster.get("id", "")
                if cluster_id in CLUSTER_SECTION_MAP:
                    return CLUSTER_SECTION_MAP[cluster_id]
            sim = SequenceMatcher(None, title_lower, kw.lower()).ratio()
            if sim > best_score:
                best_score = sim
                best_cluster_id = cluster.get("id")

    if best_cluster_id and best_score > 0.3 and best_cluster_id in CLUSTER_SECTION_MAP:
        return CLUSTER_SECTION_MAP[best_cluster_id]

    return "news"


def llm_judge_and_format(
    candidates: list[Signal],
    model: str = "gpt-5.4",
    temperature: float = 0.3,
    max_tokens: int = 500,
) -> tuple[int, str]:
    """Use GPT-5.4 to pick the best topic and decide format.

    Returns: (index of chosen candidate, format_type: "short" or "analysis")
    """
    client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

    candidates_text = "\n".join(
        f"{i+1}. [{c.source}] {c.title} – {c.summary[:150]}"
        for i, c in enumerate(candidates)
    )

    response = client.chat.completions.create(
        model=model,
        temperature=temperature,
        max_tokens=max_tokens,
        messages=[
            {
                "role": "system",
                "content": (
                    "Jesteś redaktorem polskiego portalu BusManiak.pl o busach, vanach, kamperach "
                    "i motoryzacji dostawczej. Twoim zadaniem jest wybrać najciekawszy temat dnia "
                    "dla czytelników portalu."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Oto kandydaci na news dnia:\n\n{candidates_text}\n\n"
                    "Odpowiedz w formacie JSON:\n"
                    '{"chosen": <numer 1-N>, "reason": "<krótkie uzasadnienie>", '
                    '"format": "<short|analysis>"}\n\n'
                    "format=short dla lekkich tematów (premiera, wydarzenie, zmiana ceny) – 400-600 słów.\n"
                    "format=analysis dla głębszych (regulacje, analiza rynku, trend) – 800-1200 słów."
                ),
            },
        ],
        response_format={"type": "json_object"},
    )

    result = json.loads(response.choices[0].message.content)
    chosen_idx = int(result.get("chosen", 1)) - 1
    chosen_idx = max(0, min(chosen_idx, len(candidates) - 1))
    format_type = result.get("format", "short")
    if format_type not in ("short", "analysis"):
        format_type = "short"

    return chosen_idx, format_type


def select_topic(
    signals: list[Signal],
    clusters: list[dict],
    published_history: list[dict],
    scoring_config: dict,
    llm_config: dict,
) -> ScoredSignal | None:
    """Full scoring pipeline: algorithmic score → top 5 → LLM judge."""
    if not signals:
        return None

    weights = {
        "freshness": scoring_config.get("freshness_weight", 0.3),
        "relevance": scoring_config.get("relevance_weight", 0.3),
        "trend": scoring_config.get("trend_weight", 0.2),
        "uniqueness": scoring_config.get("uniqueness_weight", 0.2),
    }

    sorted_signals = score_signals(
        signals, clusters, published_history, weights,
        max_age_hours=scoring_config.get("max_age_hours", 48),
    )

    # Take top 5 for LLM judge
    top_candidates = sorted_signals[:5]
    if not top_candidates:
        return None

    chosen_idx, format_type = llm_judge_and_format(
        top_candidates,
        model=llm_config.get("model", "gpt-5.4"),
        temperature=llm_config.get("temperature_judge", 0.3),
        max_tokens=llm_config.get("max_tokens_judge", 500),
    )

    chosen = top_candidates[chosen_idx]
    section = match_section(chosen.title, clusters)

    return ScoredSignal(
        signal=chosen,
        score=0.0,
        section=section,
        format_type=format_type,
    )
```

Write to `pipeline/news-generator/scorer.py`.

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd pipeline/news-generator && python -m pytest tests/test_scorer.py -v 2>&1 | tail -20
```
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add pipeline/news-generator/scorer.py pipeline/news-generator/tests/test_scorer.py
git commit -m "feat(news): topic scorer – algorithmic scoring + LLM judge"
```

---

### Task 5: Content Generator

**Files:**
- Create: `pipeline/news-generator/generator.py`
- Create: `pipeline/news-generator/tests/test_generator.py`

- [ ] **Step 1: Write tests for generator**

```python
"""Tests for content generator."""

import json
from datetime import datetime, timezone
from unittest.mock import patch, MagicMock
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent.parent))

from collector import Signal
from scorer import ScoredSignal
from generator import build_prompt, parse_llm_output


class TestBuildPrompt:
    def test_includes_topic_and_format(self):
        signal = Signal(
            title="Nowy Fiat Ducato 2027",
            summary="Fiat zaprezentował nową generację...",
            source="rss",
            category="modele",
            published=datetime.now(timezone.utc),
            url="https://example.com/ducato",
        )
        scored = ScoredSignal(signal=signal, score=0.8, section="modele", format_type="short")
        prompt = build_prompt(scored, related_articles=[])
        assert "Fiat Ducato 2027" in prompt
        assert "400-600 słów" in prompt
        assert "modele" in prompt

    def test_analysis_format_uses_longer_word_count(self):
        signal = Signal(
            title="Nowe regulacje EU",
            summary="...",
            source="rss",
            category="przepisy",
            published=datetime.now(timezone.utc),
            url="https://example.com/eu",
        )
        scored = ScoredSignal(signal=signal, score=0.8, section="przepisy", format_type="analysis")
        prompt = build_prompt(scored, related_articles=[])
        assert "800-1200 słów" in prompt


class TestParseLlmOutput:
    def test_parses_frontmatter_and_body(self):
        raw = '''---
title: "Test News"
date: 2026-04-03
description: "Test description"
draft: false
author: "Redakcja BusManiak.pl"
main_keyword: "test news"
lead: "This is the lead."
categories:
  - "modele"
tags:
  - "fiat ducato"
faq:
  - question: "What?"
    answer: "That."
sources:
  - "Reuters"
---

## First Section

Content here.
'''
        frontmatter, body = parse_llm_output(raw)
        assert frontmatter["title"] == "Test News"
        assert body.startswith("## First Section")

    def test_strips_intro_before_first_h2(self):
        raw = '''---
title: "Test"
date: 2026-04-03
description: "Desc"
draft: false
main_keyword: "test"
lead: "Lead."
---

Some intro paragraph that should be removed.

## Actual Content

Body text.
'''
        frontmatter, body = parse_llm_output(raw)
        assert body.startswith("## Actual Content")
        assert "intro paragraph" not in body
```

Write to `pipeline/news-generator/tests/test_generator.py`.

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd pipeline/news-generator && python -m pytest tests/test_generator.py -v 2>&1 | tail -20
```
Expected: FAIL – `generator` module not found.

- [ ] **Step 3: Implement generator.py**

```python
"""Content generator – produces news articles via GPT-5.4."""

from __future__ import annotations

import os
import re
from datetime import datetime, timezone

import yaml
from openai import OpenAI

from collector import Signal
from scorer import ScoredSignal


SYSTEM_PROMPT = """Jesteś dziennikarzem portalu BusManiak.pl – polskiego serwisu o busach, vanach, \
kamperach i motoryzacji dostawczej. Piszesz profesjonalne, rzeczowe newsy w języku polskim.

Zasady:
- Pisz po polsku, naturalnym językiem
- Używaj en-dash (–), nigdy em-dash (—)
- Nazwa portalu: BusManiak.pl (camelCase)
- Body artykułu MUSI zaczynać się od nagłówka ## H2 (lead jest w frontmatter)
- Nie powtarzaj treści z lead w body
- FAQ: 1-2 pytania, krótkie odpowiedzi
- Sources: podaj źródła informacji
- Linki wewnętrzne: jeśli podano powiązane artykuły, wstaw 1-2 linki w naturalnym kontekście
- Nie używaj shortcodów Hugo (image, table itp.) – tylko czysty markdown
- Listy: **Termin** – opis (bez bold+dwukropek)
- Nie upychaj słów kluczowych – pisz naturalnie
"""


def build_prompt(
    topic: ScoredSignal,
    related_articles: list[dict],
    format_config: dict | None = None,
) -> str:
    """Build the user prompt for GPT-5.4."""
    cfg = format_config or {}

    if topic.format_type == "analysis":
        word_range = f"{cfg.get('analysis_min_words', 800)}-{cfg.get('analysis_max_words', 1200)} słów"
        h2_range = cfg.get("analysis_h2_count", "4-5")
        extra = "Dodaj minimum 1 tabelę lub listę. Pogłębiona analiza tematu."
    else:
        word_range = f"{cfg.get('short_min_words', 400)}-{cfg.get('short_max_words', 600)} słów"
        h2_range = cfg.get("short_h2_count", "2-3")
        extra = "Zwięzły news, najważniejsze fakty."

    related_text = ""
    if related_articles:
        links = "\n".join(
            f"- [{a['title']}]({a['url']})" for a in related_articles[:5]
        )
        related_text = f"\n\nPowiązane artykuły na BusManiak.pl (wstaw 1-2 linki w treści):\n{links}"

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    return f"""Napisz news dla BusManiak.pl na podstawie tematu:

**Temat:** {topic.signal.title}
**Opis źródłowy:** {topic.signal.summary}
**Źródło:** {topic.signal.url}
**Sekcja:** {topic.section}
**Format:** {word_range}, {h2_range} sekcji H2
**Data:** {today}

{extra}{related_text}

Zwróć kompletny plik markdown z frontmatter YAML. Struktura:

```
---
title: "..."
date: {today}
description: "... (max 160 znaków)"
draft: false
author: "Redakcja BusManiak.pl"
h1: "..."
main_keyword: "..."
lead: "... (2-3 zdania, intrygujący wstęp)"
categories:
  - "{topic.section}"
tags:
  - "..."
faq:
  - question: "..."
    answer: "..."
sources:
  - "..."
---

## Pierwszy H2

Treść...
```"""


def generate_article(
    topic: ScoredSignal,
    related_articles: list[dict],
    model: str = "gpt-5.4",
    temperature: float = 0.7,
    max_tokens: int = 2000,
    format_config: dict | None = None,
) -> str:
    """Generate a news article using GPT-5.4."""
    client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

    if topic.format_type == "analysis":
        max_tokens = format_config.get("max_tokens_analysis", 4000) if format_config else 4000

    prompt = build_prompt(topic, related_articles, format_config)

    response = client.chat.completions.create(
        model=model,
        temperature=temperature,
        max_tokens=max_tokens,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
    )

    return response.choices[0].message.content.strip()


def parse_llm_output(raw: str) -> tuple[dict, str]:
    """Parse LLM output into frontmatter dict and body string.

    Strips any text before the first ## H2 in the body.
    """
    # Strip markdown code fences if present
    raw = raw.strip()
    if raw.startswith("```"):
        raw = re.sub(r"^```\w*\n", "", raw)
        raw = re.sub(r"\n```$", "", raw)

    # Split frontmatter and body
    match = re.match(r"^---\n(.*?)\n---\n?(.*)", raw, re.DOTALL)
    if not match:
        raise ValueError("No frontmatter found in LLM output")

    fm_raw = match.group(1)
    body_raw = match.group(2).strip()

    frontmatter = yaml.safe_load(fm_raw)

    # Strip anything before first H2
    h2_match = re.search(r"^(## .+)$", body_raw, re.MULTILINE)
    if h2_match:
        body = body_raw[h2_match.start():]
    else:
        body = body_raw

    return frontmatter, body


def find_related_articles(
    section: str,
    content_dir: str,
) -> list[dict]:
    """Find existing articles in the given section for internal linking."""
    from pathlib import Path

    section_dir = Path(content_dir) / section
    if not section_dir.exists():
        return []

    articles = []
    for md_file in section_dir.rglob("*.md"):
        if md_file.name == "_index.md":
            continue

        text = md_file.read_text(encoding="utf-8")
        fm_match = re.match(r"^---\n(.*?)\n---", text, re.DOTALL)
        if not fm_match:
            continue

        try:
            fm = yaml.safe_load(fm_match.group(1))
        except yaml.YAMLError:
            continue

        if fm.get("draft", False):
            continue

        # Build URL from path
        relative = md_file.relative_to(Path(content_dir))
        slug = str(relative).replace(".md", "").replace("\\", "/")
        url = f"/{slug}/"

        articles.append({
            "title": fm.get("title", ""),
            "url": url,
            "main_keyword": fm.get("main_keyword", ""),
        })

    return articles
```

Write to `pipeline/news-generator/generator.py`.

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd pipeline/news-generator && python -m pytest tests/test_generator.py -v 2>&1 | tail -20
```
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add pipeline/news-generator/generator.py pipeline/news-generator/tests/test_generator.py
git commit -m "feat(news): content generator – GPT-5.4 article generation"
```

---

### Task 6: Post-processor

**Files:**
- Create: `pipeline/news-generator/postprocessor.py`
- Create: `pipeline/news-generator/tests/test_postprocessor.py`

- [ ] **Step 1: Write tests for post-processor**

```python
"""Tests for post-processor."""

from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent.parent))

from postprocessor import fix_typography, validate_frontmatter, clean_body, build_markdown


class TestFixTypography:
    def test_replaces_em_dash_with_en_dash(self):
        assert fix_typography("test — value") == "test – value"

    def test_preserves_existing_en_dash(self):
        assert fix_typography("test – value") == "test – value"

    def test_preserves_hyphens(self):
        assert fix_typography("BusManiak.pl - news") == "BusManiak.pl - news"


class TestValidateFrontmatter:
    def test_passes_with_all_required_fields(self):
        fm = {
            "title": "Test",
            "date": "2026-04-03",
            "description": "Desc",
            "draft": False,
            "main_keyword": "test",
            "lead": "Lead text.",
        }
        errors = validate_frontmatter(fm)
        assert errors == []

    def test_fails_on_missing_title(self):
        fm = {"date": "2026-04-03", "description": "Desc", "draft": False, "main_keyword": "kw", "lead": "L"}
        errors = validate_frontmatter(fm)
        assert "title" in errors[0]


class TestCleanBody:
    def test_removes_nonexistent_shortcodes(self):
        body = '## Title\n\n{{< image src="test.jpg" >}}\n\nText here.'
        cleaned = clean_body(body)
        assert "{{<" not in cleaned
        assert "## Title" in cleaned
        assert "Text here." in cleaned

    def test_preserves_youtube_shortcode(self):
        body = '## Title\n\n{{% youtube "abc123" %}}\n\nText.'
        cleaned = clean_body(body)
        assert "{{% youtube" in cleaned


class TestBuildMarkdown:
    def test_combines_frontmatter_and_body(self):
        fm = {
            "title": "Test News",
            "date": "2026-04-03",
            "description": "Description",
            "draft": False,
            "main_keyword": "test",
            "lead": "Lead.",
        }
        body = "## Section\n\nContent."
        result = build_markdown(fm, body)
        assert result.startswith("---\n")
        assert "title: \"Test News\"" in result or "title: Test News" in result
        assert "## Section" in result
```

Write to `pipeline/news-generator/tests/test_postprocessor.py`.

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd pipeline/news-generator && python -m pytest tests/test_postprocessor.py -v 2>&1 | tail -20
```
Expected: FAIL – `postprocessor` module not found.

- [ ] **Step 3: Implement postprocessor.py**

```python
"""Post-processor – validation, typography, cleanup, markdown assembly."""

from __future__ import annotations

import re
from datetime import datetime

import yaml


REQUIRED_FIELDS = ["title", "date", "description", "draft", "main_keyword", "lead"]

# Shortcodes that Hugo actually supports in this project
ALLOWED_SHORTCODES = {"youtube"}


def fix_typography(text: str) -> str:
    """Fix typography: em-dash → en-dash."""
    # Replace em-dash with en-dash
    text = text.replace("—", "–")
    return text


def validate_frontmatter(fm: dict) -> list[str]:
    """Validate frontmatter has all required fields. Returns list of error messages."""
    errors = []
    for field in REQUIRED_FIELDS:
        if field not in fm or fm[field] is None or fm[field] == "":
            errors.append(f"Missing required frontmatter field: {field}")
    return errors


def clean_body(body: str) -> str:
    """Clean body text: remove invalid shortcodes, fix formatting."""
    # Remove shortcodes that don't exist in our Hugo setup
    # Match {{< name ... >}} and {{% name ... %}} patterns
    def replace_shortcode(match: re.Match) -> str:
        name = match.group(1).strip()
        if name in ALLOWED_SHORTCODES:
            return match.group(0)  # Keep allowed shortcodes
        return ""  # Remove unknown shortcodes

    body = re.sub(r"\{\{[<%]\s*(\w+)[^}>]*[%>]\}\}", replace_shortcode, body)

    # Clean up resulting empty lines (more than 2 consecutive)
    body = re.sub(r"\n{3,}", "\n\n", body)

    return body.strip()


def ensure_body_starts_with_h2(body: str) -> str:
    """Ensure body starts with ## H2 heading, strip any intro text."""
    h2_match = re.search(r"^(## .+)$", body, re.MULTILINE)
    if h2_match:
        return body[h2_match.start():]
    return body


def build_markdown(fm: dict, body: str) -> str:
    """Combine frontmatter and body into a complete markdown file."""
    # Ensure date is string
    if isinstance(fm.get("date"), datetime):
        fm["date"] = fm["date"].strftime("%Y-%m-%d")

    fm_str = yaml.dump(
        fm,
        default_flow_style=False,
        allow_unicode=True,
        sort_keys=False,
        width=1000,
    ).strip()

    return f"---\n{fm_str}\n---\n\n{body}\n"


def generate_slug(title: str) -> str:
    """Generate a URL-friendly slug from a title."""
    # Polish character mapping
    char_map = {
        "ą": "a", "ć": "c", "ę": "e", "ł": "l", "ń": "n",
        "ó": "o", "ś": "s", "ź": "z", "ż": "z",
        "Ą": "a", "Ć": "c", "Ę": "e", "Ł": "l", "Ń": "n",
        "Ó": "o", "Ś": "s", "Ź": "z", "Ż": "z",
    }
    slug = title.lower()
    for pl_char, ascii_char in char_map.items():
        slug = slug.replace(pl_char, ascii_char)

    slug = re.sub(r"[^a-z0-9\s-]", "", slug)
    slug = re.sub(r"[\s]+", "-", slug.strip())
    slug = re.sub(r"-+", "-", slug)
    return slug[:80].rstrip("-")


def postprocess(fm: dict, body: str) -> tuple[dict, str, list[str]]:
    """Run all post-processing steps. Returns (fm, body, errors)."""
    errors = validate_frontmatter(fm)

    # Fix typography in all string fields
    for key, val in fm.items():
        if isinstance(val, str):
            fm[key] = fix_typography(val)
        elif isinstance(val, list):
            fm[key] = [
                fix_typography(item) if isinstance(item, str) else (
                    {k: fix_typography(v) if isinstance(v, str) else v for k, v in item.items()}
                    if isinstance(item, dict) else item
                )
                for item in val
            ]

    # Ensure draft is False
    fm["draft"] = False

    # Fix body
    body = fix_typography(body)
    body = clean_body(body)
    body = ensure_body_starts_with_h2(body)

    return fm, body, errors
```

Write to `pipeline/news-generator/postprocessor.py`.

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd pipeline/news-generator && python -m pytest tests/test_postprocessor.py -v 2>&1 | tail -20
```
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add pipeline/news-generator/postprocessor.py pipeline/news-generator/tests/test_postprocessor.py
git commit -m "feat(news): post-processor – validation, typography, cleanup"
```

---

### Task 7: Main Orchestrator

**Files:**
- Create: `pipeline/news-generator/main.py`

- [ ] **Step 1: Implement main.py**

```python
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
    # Extract unique model names (without variant like L2H2)
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
    log.info("Trends seeds: %d static + %d models = %d total", len(trends_cfg.get("seeds_static", [])), len(model_names), len(trends_seeds))

    # 3. Load clusters
    clusters = load_clusters(data_dir)
    log.info("Loaded %d clusters", len(clusters))

    # 4. Collect signals
    log.info("Collecting signals...")
    signals = collect_all_signals(
        feeds_config=feeds,
        trends_seeds=trends_seeds,
        trends_geo=trends_cfg.get("geo", "PL"),
        trends_category=trends_cfg.get("category", 47),
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

    log.info("Selected: '%s' [%s, section=%s]", topic.signal.title, topic.format_type, topic.section)

    # 6. Find related articles for internal linking
    related = find_related_articles(topic.section, str(content_dir))
    log.info("Found %d related articles in /%s/", len(related), topic.section)

    # 7. Generate article
    log.info("Generating article via %s...", llm_cfg.get("model", "gpt-5.4"))
    raw_output = generate_article(
        topic=topic,
        related_articles=related,
        model=llm_cfg.get("model", "gpt-5.4"),
        temperature=llm_cfg.get("temperature_writer", 0.7),
        max_tokens=llm_cfg.get("max_tokens_short", 2000),
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
    fm, body, errors = postprocess(fm, body)
    if errors:
        log.warning("Frontmatter validation warnings: %s", errors)
        # Try to fix missing fields with defaults
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

    # Trim to last N days
    history_days = scoring_cfg.get("published_history_days", 90)
    cutoff = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    # Keep simple: just keep last 90 entries
    if len(published) > history_days:
        published = published[-history_days:]

    save_published(published)
    log.info("Updated published.json (%d entries)", len(published))

    log.info("=== Pipeline complete ===")


if __name__ == "__main__":
    run()
```

Write to `pipeline/news-generator/main.py`.

- [ ] **Step 2: Verify import chain works**

```bash
cd pipeline/news-generator && python -c "from main import load_config, load_feeds; print('imports OK')"
```
Expected: `imports OK`

- [ ] **Step 3: Commit**

```bash
git add pipeline/news-generator/main.py
git commit -m "feat(news): main orchestrator – full pipeline flow"
```

---

### Task 8: GitHub Actions Workflow

**Files:**
- Create: `.github/workflows/news-generator.yml`

- [ ] **Step 1: Create workflow file**

```yaml
name: News Generator

on:
  schedule:
    # 7:00 CET = 5:00 UTC (summer: 6:00 CET = 5:00 UTC)
    - cron: '0 5 * * *'
  workflow_dispatch:

permissions:
  contents: write

jobs:
  generate-news:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Install dependencies
        run: pip install -r pipeline/news-generator/requirements.txt

      - name: Run news pipeline
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        run: python pipeline/news-generator/main.py

      - name: Commit and push
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add portals/busmaniak.pl/content/news/ pipeline/news-generator/published.json
          git diff --cached --quiet || git commit -m "news: auto-generated daily news"
          git push
```

Write to `.github/workflows/news-generator.yml`.

- [ ] **Step 2: Validate YAML syntax**

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/news-generator.yml')); print('YAML OK')"
```
Expected: `YAML OK`

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/news-generator.yml
git commit -m "ci: add daily news generator workflow (7:00 CET)"
```

---

### Task 9: News Layout Template

**Files:**
- Create: `shared/theme/layouts/news/single.html`

- [ ] **Step 1: Check existing single.html layout for reference**

Read `shared/theme/layouts/_default/single.html` to understand the base template structure.

- [ ] **Step 2: Create news-specific single layout**

Create `shared/theme/layouts/news/single.html` that extends the default single layout but adds a "NEWS" badge in the article header. The badge should appear next to the date in the meta section.

Copy the full content of `_default/single.html` and modify the article badge section. Where the default layout shows the section name, add a CSS class `badge--news` alongside the existing badge:

Find the line that renders the section badge (something like `{{ .Section | upper }}`) and ensure it renders as "NEWS" with the `badge--news` class for visual distinction.

If the default layout already renders `{{ .Section | upper }}` dynamically, this file may not be needed – the section name "NEWS" will render automatically. In that case, skip creating this file.

- [ ] **Step 3: Commit (if file was created)**

```bash
git add shared/theme/layouts/news/
git commit -m "feat(news): news-specific layout with badge"
```

---

### Task 10: Integration Dry Run

- [ ] **Step 1: Run unit tests**

```bash
cd pipeline/news-generator && python -m pytest tests/ -v 2>&1
```
Expected: All tests PASS.

- [ ] **Step 2: Test config loading**

```bash
cd pipeline/news-generator && python -c "
from main import load_config, load_feeds, load_clusters, load_model_names
from pathlib import Path

config = load_config()
feeds = load_feeds()
print(f'Config loaded: {len(config)} sections')
print(f'Feeds loaded: {len(feeds)} feeds')

data_dir = Path(__file__).resolve().parent.parent.parent / config['pipeline']['data_dir']
clusters = load_clusters(data_dir)
models = load_model_names(data_dir)
print(f'Clusters: {len(clusters)}')
print(f'Model names: {len(models)} – {models[:3]}...')
"
```
Expected: Config, feeds, clusters, and model names load without errors.

- [ ] **Step 3: Test RSS collection (live)**

```bash
cd pipeline/news-generator && python -c "
from collector import parse_rss_feeds
from main import load_feeds

feeds = load_feeds()
signals = parse_rss_feeds(feeds[:2], max_age_hours=72)
print(f'Collected {len(signals)} signals from first 2 feeds')
for s in signals[:5]:
    print(f'  - [{s.source}] {s.title[:60]}...')
"
```
Expected: At least a few signals collected from Google News RSS.

- [ ] **Step 4: Test full pipeline with --dry-run (manual)**

Run manually with `OPENAI_API_KEY` set to verify end-to-end flow:

```bash
cd pipeline/news-generator && OPENAI_API_KEY=$OPENAI_API_KEY python main.py
```

Check the output file exists in `portals/busmaniak.pl/content/news/`.

- [ ] **Step 5: Verify Hugo builds with generated news**

```bash
cd portals/busmaniak.pl && hugo --quiet 2>&1 | head -5
```
Expected: Build succeeds.

- [ ] **Step 6: Final commit**

```bash
git add -A && git status
```

Review changes, then commit any remaining files:

```bash
git commit -m "feat(news): complete news pipeline – ready for production"
```
