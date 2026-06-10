"""Tests for signal collector."""

from datetime import datetime, timezone, timedelta
from unittest.mock import patch, MagicMock
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent.parent))

from collector import (
    parse_rss_feeds,
    parse_sitemap_feeds,
    deduplicate_signals,
    filter_already_published,
    _extract_meta,
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


def _sitemap_xml(entries: list[tuple[str, str]]) -> str:
    """entries: list of (path, lastmod_iso)."""
    urls = "\n".join(
        f"<url><loc>https://www.anthropic.com{p}</loc><lastmod>{lm}</lastmod></url>"
        for p, lm in entries
    )
    return f'<?xml version="1.0" encoding="UTF-8"?><urlset>{urls}</urlset>'


_PAGE_HTML = (
    "<html><head>"
    '<title>Some Headline \\ Anthropic</title>'
    '<meta property="og:title" content="Claude Fable 5 and Claude Mythos 5"/>'
    '<meta property="og:description" content="Today we are launching Claude Fable 5."/>'
    "</head><body>x</body></html>"
)


class TestParseSitemapFeeds:
    def _fetch(self, sitemap_xml: str, page_html: str = _PAGE_HTML):
        def side_effect(url: str) -> str:
            return sitemap_xml if url.endswith("sitemap.xml") else page_html
        return side_effect

    def _cfg(self, **over) -> list[dict]:
        cfg = {
            "url": "https://www.anthropic.com/sitemap.xml",
            "category": "llm",
            "name": "Anthropic",
            "type": "sitemap",
            "path_filter": "/news/",
        }
        cfg.update(over)
        return [cfg]

    def test_extracts_fresh_news_entry_as_signal(self):
        now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")
        xml = _sitemap_xml([
            ("/news/old-post", "2025-01-01T00:00:00.000Z"),
            ("/news/claude-fable-5-mythos-5", now),
        ])
        with patch("collector._http_get", side_effect=self._fetch(xml)):
            signals = parse_sitemap_feeds(self._cfg(), max_age_hours=48)

        assert len(signals) == 1
        s = signals[0]
        assert s.title == "Claude Fable 5 and Claude Mythos 5"
        assert s.summary == "Today we are launching Claude Fable 5."
        assert s.source == "rss"
        assert s.source_name == "Anthropic"
        assert s.category == "llm"
        assert s.url == "https://www.anthropic.com/news/claude-fable-5-mythos-5"

    def test_skips_entries_older_than_max_age(self):
        xml = _sitemap_xml([("/news/old-post", "2025-01-01T00:00:00.000Z")])
        with patch("collector._http_get", side_effect=self._fetch(xml)):
            signals = parse_sitemap_feeds(self._cfg(), max_age_hours=48)
        assert signals == []

    def test_respects_path_filter(self):
        now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")
        xml = _sitemap_xml([("/research/some-paper", now)])
        with patch("collector._http_get", side_effect=self._fetch(xml)):
            signals = parse_sitemap_feeds(self._cfg(), max_age_hours=48)
        assert signals == []

    def test_caps_at_max_items(self):
        now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")
        xml = _sitemap_xml([(f"/news/post-{i}", now) for i in range(10)])
        with patch("collector._http_get", side_effect=self._fetch(xml)):
            signals = parse_sitemap_feeds(self._cfg(max_items=3), max_age_hours=48)
        assert len(signals) == 3


class TestParseRssFeedsSkipsNonRss:
    def test_sitemap_typed_feed_is_skipped_by_rss_parser(self):
        feeds_config = [{
            "url": "https://www.anthropic.com/sitemap.xml",
            "category": "llm",
            "name": "Anthropic",
            "type": "sitemap",
        }]
        with patch("collector.feedparser.parse") as mock_parse:
            signals = parse_rss_feeds(feeds_config)
        assert signals == []
        mock_parse.assert_not_called()


class TestExtractMeta:
    def test_extracts_og_title_and_description(self):
        title, desc = _extract_meta(_PAGE_HTML)
        assert title == "Claude Fable 5 and Claude Mythos 5"
        assert desc == "Today we are launching Claude Fable 5."

    def test_content_before_property_attribute_order(self):
        html = '<meta content="Reversed Title" property="og:title"/>'
        title, _ = _extract_meta(html)
        assert title == "Reversed Title"

    def test_falls_back_to_title_tag_without_anthropic_suffix(self):
        html = "<head><title>Just A Headline \\ Anthropic</title></head>"
        title, _ = _extract_meta(html)
        assert title == "Just A Headline"


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
