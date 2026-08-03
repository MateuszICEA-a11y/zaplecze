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


class TestFilterBlocked:
    def test_wietnamskie_tematy_odpadaja_przed_scoringiem(self):
        from scorer import filter_blocked

        signals = [
            _make_signal("Hanoi zamknie część ulicy Van Cao"),
            _make_signal("Da Nang modernizuje obwodnicę Nam Hai Van za 2 000 mld VND"),
            _make_signal("Zrównoważony pieprz z Wietnamu zaczyna się na polu"),
            _make_signal("Ford Transit Custom Van odpowiada na nowe przepisy"),
        ]
        patterns = ["wietnam", "hanoi", "ho chi minh", "da nang", "sajgon", r"\bvnd\b"]
        left = filter_blocked(signals, patterns)
        assert [s.title for s in left] == ["Ford Transit Custom Van odpowiada na nowe przepisy"]

    def test_brak_wzorcow_niczego_nie_wycina(self):
        from scorer import filter_blocked

        signals = [_make_signal("Dowolny tytuł")]
        assert filter_blocked(signals, []) == signals


class TestSelectTopicWeto:
    def test_odrzucenie_calej_stawki_przez_sedziego(self, monkeypatch):
        import scorer

        monkeypatch.setattr(scorer, "llm_judge_and_format", lambda *a, **k: (None, "short"))
        topic = scorer.select_topic(
            signals=[_make_signal("Virgil van Dijk wybrał nowy klub")],
            clusters=[],
            published_history=[],
            scoring_config={},
            llm_config={},
        )
        assert topic is None

    def test_zablokowane_sygnaly_nie_docieraja_do_sedziego(self, monkeypatch):
        import scorer

        def boom(*args, **kwargs):
            raise AssertionError("sędzia nie powinien być wołany")

        monkeypatch.setattr(scorer, "llm_judge_and_format", boom)
        topic = scorer.select_topic(
            signals=[_make_signal("Mieszkania socjalne w Ho Chi Minh City drożeją")],
            clusters=[],
            published_history=[],
            scoring_config={"blocked_title_patterns": ["ho chi minh"]},
            llm_config={},
        )
        assert topic is None
