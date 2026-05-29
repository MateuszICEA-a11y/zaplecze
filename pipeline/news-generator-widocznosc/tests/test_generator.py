"""Tests for content generator."""

from datetime import datetime, timezone
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

    def test_includes_related_articles(self):
        signal = Signal(
            title="Test",
            summary="...",
            source="rss",
            category="modele",
            published=datetime.now(timezone.utc),
            url="https://example.com/test",
        )
        scored = ScoredSignal(signal=signal, score=0.8, section="modele", format_type="short")
        related = [{"title": "Fiat Ducato – test", "url": "/modele/fiat-ducato/"}]
        prompt = build_prompt(scored, related_articles=related)
        assert "/modele/fiat-ducato/" in prompt


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

    def test_strips_code_fences(self):
        raw = '''```markdown
---
title: "Fenced"
date: 2026-04-03
description: "Desc"
draft: false
main_keyword: "test"
lead: "Lead."
---

## Content

Text.
```'''
        frontmatter, body = parse_llm_output(raw)
        assert frontmatter["title"] == "Fenced"
        assert "```" not in body
