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
