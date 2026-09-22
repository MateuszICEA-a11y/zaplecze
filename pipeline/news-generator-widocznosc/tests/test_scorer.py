"""Tests for topic scorer."""

from datetime import datetime, timezone, timedelta
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

    def test_fallback_to_news_when_no_match(self):
        section = match_section("Pogoda na weekend", [])
        assert section == "news"


class TestJudgeDuplicateVeto:
    def _signals(self):
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        return [Signal(title=f"t{i}", summary="s", source="rss", category="ai", published=now, url=f"https://u/{i}") for i in range(3)]

    def _fake_client(self, payload, captured):
        from unittest.mock import MagicMock
        client = MagicMock()
        def create(**kw):
            captured.update(kw)
            resp = MagicMock()
            resp.choices[0].message.content = payload
            return resp
        client.chat.completions.create.side_effect = create
        return client

    def test_recent_titles_in_prompt_and_veto(self, monkeypatch):
        import scorer
        captured = {}
        monkeypatch.setenv("OPENAI_API_KEY", "x")
        monkeypatch.setattr(scorer, "OpenAI", lambda **kw: self._fake_client('{"chosen": 0}', captured))
        idx, _ = scorer.llm_judge_and_format(self._signals(), recent_titles=["Gemini uzyskał dostęp do trzech firm"])
        assert idx == -1
        assert "Gemini uzyskał dostęp do trzech firm" in captured["messages"][1]["content"]

    def test_select_topic_returns_none_on_veto(self, monkeypatch):
        import scorer
        monkeypatch.setenv("OPENAI_API_KEY", "x")
        monkeypatch.setattr(scorer, "OpenAI", lambda **kw: self._fake_client('{"chosen": 0}', {}))
        assert scorer.select_topic(self._signals(), [], [{"title": "x"}], {}, {}) is None
