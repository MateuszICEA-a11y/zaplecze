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
    max_completion_tokens: int = 500,
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
        max_completion_tokens=max_completion_tokens,
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
        max_completion_tokens=llm_config.get("max_tokens_judge", 500),
    )

    chosen = top_candidates[chosen_idx]
    section = match_section(chosen.title, clusters)

    return ScoredSignal(
        signal=chosen,
        score=0.0,
        section=section,
        format_type=format_type,
    )
