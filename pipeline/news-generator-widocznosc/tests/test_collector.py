"""Tests for signal collector."""

from datetime import datetime, timezone, timedelta
from unittest.mock import patch, MagicMock
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent.parent))

from collector import (
    parse_rss_feeds,
    deduplicate_signals,
    filter_already_published,
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
                datetime.now(timezone.utc).strftime("%Y-%m-%d"),
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
        now = datetime.now(timezone.utc)
        signals = [
            Signal(title="Fiat Ducato 2027 – premiera nowego modelu", summary="a", source="rss", category="modele", published=now, url="https://a.com"),
            Signal(title="Fiat Ducato 2027 – premiera nowej generacji", summary="b", source="rss", category="modele", published=now, url="https://b.com"),
            Signal(title="Ceny paliw w Polsce – kwiecień 2026", summary="c", source="rss", category="serwis", published=now, url="https://c.com"),
        ]
        result = deduplicate_signals(signals, threshold=0.7)
        assert len(result) == 2
        titles = {s.title for s in result}
        assert "Ceny paliw w Polsce – kwiecień 2026" in titles

    def test_keeps_unique_signals(self):
        now = datetime.now(timezone.utc)
        signals = [
            Signal(title="Nowy Fiat Ducato zaprezentowany na targach", summary="a", source="rss", category="modele", published=now, url="https://a.com"),
            Signal(title="Ceny paliw w Polsce spadają trzeci tydzień z rzędu", summary="b", source="rss", category="serwis", published=now, url="https://b.com"),
        ]
        result = deduplicate_signals(signals, threshold=0.7)
        assert len(result) == 2


class TestFilterAlreadyPublished:
    def test_filters_matching_titles(self):
        now = datetime.now(timezone.utc)
        signals = [
            Signal(title="Fiat Ducato 2027 premiera", summary="a", source="rss", category="modele", published=now, url="https://a.com"),
            Signal(title="Ceny paliw kwiecień", summary="b", source="rss", category="serwis", published=now, url="https://b.com"),
        ]
        history = [{"title": "Fiat Ducato 2027 premiera nowego modelu", "date": "2026-04-02"}]
        result = filter_already_published(signals, history, threshold=0.7)
        assert len(result) == 1
        assert result[0].title == "Ceny paliw kwiecień"
