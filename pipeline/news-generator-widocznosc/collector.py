"""Signal collector – RSS feeds, Google Trends (DataForSEO), Google Alerts."""

from __future__ import annotations

import json
import os
import re
import time
import urllib.request
import urllib.error
from base64 import b64encode
from dataclasses import dataclass, asdict
from datetime import datetime, timezone, timedelta
from difflib import SequenceMatcher
from html import unescape
from time import mktime

import feedparser


@dataclass
class Signal:
    title: str
    summary: str
    source: str  # "rss", "trends", "alerts"
    category: str
    published: datetime
    url: str
    trend_score: float = 0.0
    source_name: str | None = None  # real publisher name from feeds.yaml (RSS only)

    def to_dict(self) -> dict:
        d = asdict(self)
        d["published"] = self.published.isoformat()
        return d


# Filtr AI dla feedów ogólnotechnicznych – wpuszcza tylko wpisy realnie
# dotyczące modeli/AI-software. CELOWO bez terminów sprzętowo-infrastrukturalnych
# (nvidia, data center) – to one przepuszczały „pierdoły" sprzętowe jako „AI".
# „AI" z granicami słów, by nie łapać „said" itp.
_AI_TERMS = [
    r"\bAI\b", "artificial intelligence", "sztuczn", "chatgpt", "openai",
    "anthropic", "claude", "gemini", r"\bLLM", "generative", "generatyw",
    "perplexity", "copilot", "machine learning", "deep learning", "neural net",
    "agentic", "language model", "model językow",
]
_AI_RE = re.compile("|".join(_AI_TERMS), re.IGNORECASE)


def _is_ai_relevant(text: str) -> bool:
    return bool(_AI_RE.search(text or ""))


def parse_rss_feeds(
    feeds_config: list[dict],
    max_age_hours: int = 48,
) -> list[Signal]:
    """Parse RSS feeds and return signals within max_age_hours."""
    cutoff = datetime.now(timezone.utc) - timedelta(hours=max_age_hours)
    signals: list[Signal] = []

    for feed_cfg in feeds_config:
        # Non-RSS sources (e.g. type: sitemap) are handled by their own collector.
        if feed_cfg.get("type", "rss") != "rss":
            continue
        try:
            feed = feedparser.parse(feed_cfg["url"])
            if feed.bozo and not feed.entries:
                continue

            ai_only = feed_cfg.get("ai_filter", False)
            for entry in feed.entries:
                published = _parse_entry_date(entry)
                if published is None or published < cutoff:
                    continue

                title = entry.get("title", "").strip()
                summary = entry.get("summary", "").strip()
                if ai_only and not _is_ai_relevant(f"{title} {summary}"):
                    continue

                signals.append(Signal(
                    title=title,
                    summary=summary,
                    source="rss",
                    category=feed_cfg.get("category", "general"),
                    published=published,
                    url=entry.get("link", ""),
                    source_name=feed_cfg.get("name"),
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


# ---------------------------------------------------------------------------
# Sitemap source – for publishers without an RSS feed (e.g. Anthropic).
# Reads <loc>/<lastmod> from an XML sitemap, keeps recent entries under
# ``path_filter``, then scrapes og:title/og:description from each page.
# ---------------------------------------------------------------------------

_UA = "Mozilla/5.0 (compatible; widocznosc-news/1.0; +https://widocznosc.ai)"


def _http_get(url: str, timeout: int = 15) -> str:
    """Fetch a URL and return its decoded text body (browser-like UA)."""
    req = urllib.request.Request(url, headers={"User-Agent": _UA})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        charset = resp.headers.get_content_charset() or "utf-8"
        return resp.read().decode(charset, errors="replace")


def _meta_content(html: str, prop: str, attr: str = "property") -> str:
    """Extract a <meta> content value, tolerant of attribute order."""
    p = re.escape(prop)
    m = re.search(
        rf'<meta[^>]+{attr}=["\']{p}["\'][^>]*?content=["\']([^"\']*)["\']',
        html, re.IGNORECASE,
    )
    if m:
        return m.group(1)
    m = re.search(
        rf'<meta[^>]+content=["\']([^"\']*)["\'][^>]+{attr}=["\']{p}["\']',
        html, re.IGNORECASE,
    )
    return m.group(1) if m else ""


def _extract_meta(html: str) -> tuple[str, str]:
    """Return (title, summary) from a page's social/meta tags.

    Prefers Open Graph tags; falls back to <title> (stripped of a trailing
    " \\ Anthropic"/"| Site" suffix) and the standard meta description.
    """
    title = _meta_content(html, "og:title")
    if not title:
        m = re.search(r"<title>(.*?)</title>", html, re.IGNORECASE | re.DOTALL)
        if m:
            title = re.split(r"\s*[\\|]\s*\w", m.group(1))[0].strip()
    summary = _meta_content(html, "og:description") or _meta_content(
        html, "description", attr="name"
    )
    return unescape((title or "").strip()), unescape((summary or "").strip())


def _parse_lastmod(value: str) -> datetime | None:
    """Parse an ISO-8601 sitemap <lastmod> into an aware UTC datetime."""
    s = value.strip().replace("Z", "+00:00")
    try:
        dt = datetime.fromisoformat(s)
    except ValueError:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def parse_sitemap_feeds(
    feeds_config: list[dict],
    max_age_hours: int = 48,
) -> list[Signal]:
    """Collect signals from feeds declared with ``type: sitemap``.

    For each such feed: fetch its XML sitemap, keep <url> entries whose <loc>
    contains ``path_filter`` and whose <lastmod> is within ``max_age_hours``,
    take the newest ``max_items``, and scrape each page for title/summary.
    """
    cutoff = datetime.now(timezone.utc) - timedelta(hours=max_age_hours)
    signals: list[Signal] = []

    for cfg in feeds_config:
        if cfg.get("type") != "sitemap":
            continue
        try:
            xml = _http_get(cfg["url"])
        except Exception:
            continue

        path_filter = cfg.get("path_filter", "/")
        max_items = cfg.get("max_items", 6)

        candidates: list[tuple[datetime, str]] = []
        for block in re.finditer(r"<url\b[^>]*>(.*?)</url>", xml, re.DOTALL | re.IGNORECASE):
            chunk = block.group(1)
            loc_m = re.search(r"<loc>\s*([^<]+?)\s*</loc>", chunk, re.IGNORECASE)
            if not loc_m or path_filter not in loc_m.group(1):
                continue
            lm_m = re.search(r"<lastmod>\s*([^<]+?)\s*</lastmod>", chunk, re.IGNORECASE)
            published = _parse_lastmod(lm_m.group(1)) if lm_m else None
            if published is None or published < cutoff:
                continue
            candidates.append((published, loc_m.group(1).strip()))

        candidates.sort(key=lambda c: c[0], reverse=True)

        for published, loc in candidates[:max_items]:
            try:
                html = _http_get(loc)
            except Exception:
                continue
            title, summary = _extract_meta(html)
            if not title:
                continue
            signals.append(Signal(
                title=title,
                summary=summary,
                source="rss",
                category=cfg.get("category", "general"),
                published=published,
                url=loc,
                source_name=cfg.get("name"),
            ))

    return signals


def fetch_google_trends(
    seeds: list[str],
    geo: str = "PL",
    category: int = 47,
) -> list[Signal]:
    """Fetch trending queries from DataForSEO Google Trends API.

    Uses 'explore' endpoint to get rising related queries for each seed keyword.
    Auth via DATAFORSEO_LOGIN + DATAFORSEO_PASSWORD env vars.
    """
    login = os.environ.get("DATAFORSEO_LOGIN", "")
    password = os.environ.get("DATAFORSEO_PASSWORD", "")
    if not login or not password:
        return []

    auth = b64encode(f"{login}:{password}".encode()).decode()
    signals: list[Signal] = []
    now = datetime.now(timezone.utc)

    # Process seeds one by one (DataForSEO handles one keyword per request)
    for seed in seeds:
        try:
            payload = json.dumps([{
                "keywords": [seed],
                "location_code": 2616,  # Poland
                "language_code": "pl",
                "type": "web",
                "time_range": "past_7_days",
            }]).encode("utf-8")

            req = urllib.request.Request(
                "https://api.dataforseo.com/v3/keywords_data/google_trends/explore/live",
                data=payload,
                headers={
                    "Authorization": f"Basic {auth}",
                    "Content-Type": "application/json",
                },
            )

            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read().decode())

            tasks = data.get("tasks", [])
            if not tasks or not tasks[0].get("result"):
                continue

            for result in tasks[0]["result"]:
                # Extract rising queries from related searches
                items = result.get("items", [])
                for item in items:
                    if item.get("type") != "google_trends_graph":
                        continue
                    # Main trend data – check if there's a spike
                    values = item.get("data", {}).get("values", [])
                    if not values:
                        continue
                    # Get the most recent value vs average
                    recent = values[-1].get("values", [0])[0] if values else 0
                    avg = sum(v.get("values", [0])[0] for v in values) / max(len(values), 1)
                    if avg > 0 and recent > avg * 1.3:
                        # Trend is rising – add as signal
                        spike_ratio = recent / avg
                        signals.append(Signal(
                            title=seed,
                            summary=f"Google Trends spike for '{seed}': {spike_ratio:.1f}x above average",
                            source="trends",
                            category="general",
                            published=now,
                            url="",
                            trend_score=min(spike_ratio / 5.0, 1.0),
                        ))

            time.sleep(0.5)  # Rate limiting
        except Exception:
            continue

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
    max_age_hours: int,
    published_history: list[dict],
    dedup_threshold: float,
) -> list[Signal]:
    """Run all collectors and return deduplicated, filtered signals."""
    signals: list[Signal] = []

    # 1. RSS feeds
    rss_signals = parse_rss_feeds(feeds_config, max_age_hours=max_age_hours)
    signals.extend(rss_signals)

    # 1b. Sitemap sources (publishers without RSS, e.g. Anthropic)
    sitemap_signals = parse_sitemap_feeds(feeds_config, max_age_hours=max_age_hours)
    signals.extend(sitemap_signals)

    # 2. Google Trends (DataForSEO)
    trends_signals = fetch_google_trends(seeds=trends_seeds)
    signals.extend(trends_signals)

    # 3. Deduplicate
    signals = deduplicate_signals(signals, threshold=dedup_threshold)

    # 4. Filter already published
    signals = filter_already_published(signals, published_history, threshold=dedup_threshold)

    return signals
