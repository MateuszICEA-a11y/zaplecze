"""Tests for content generator."""

from datetime import datetime, timezone
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent.parent))

from collector import Signal
from scorer import ScoredSignal
from generator import build_prompt, parse_llm_output


FORMAT_CFG = {"short_min_words": 400, "short_max_words": 600}


class TestBuildPrompt:
    def test_includes_topic_and_word_count(self):
        signal = Signal(
            title="ChatGPT zmienia ranking źródeł",
            summary="OpenAI ogłosił zmianę sposobu cytowania...",
            source="rss",
            category="ai-search",
            published=datetime.now(timezone.utc),
            url="https://example.com/chatgpt",
            source_name="Search Engine Land – AI",
        )
        scored = ScoredSignal(signal=signal, score=0.8, section="news", format_type="short")
        prompt = build_prompt(scored, related_articles=[], format_config=FORMAT_CFG)
        assert "ChatGPT zmienia ranking źródeł" in prompt
        assert "400–600 słów" in prompt

    def test_uses_publisher_source_name(self):
        signal = Signal(
            title="Perplexity uruchamia nowy indeks",
            summary="...",
            source="rss",
            category="ai-search",
            published=datetime.now(timezone.utc),
            url="https://example.com/perplexity",
            source_name="Search Engine Land – AI",
        )
        scored = ScoredSignal(signal=signal, score=0.8, section="news", format_type="short")
        prompt = build_prompt(scored, related_articles=[], format_config=FORMAT_CFG)
        # Real publisher name, not the feed type ("rss")
        assert "Search Engine Land – AI" in prompt

    def test_falls_back_to_source_type_when_no_name(self):
        signal = Signal(
            title="Trend: GEO",
            summary="...",
            source="trends",
            category="general",
            published=datetime.now(timezone.utc),
            url="",
        )
        scored = ScoredSignal(signal=signal, score=0.8, section="news", format_type="short")
        prompt = build_prompt(scored, related_articles=[], format_config=FORMAT_CFG)
        assert "ŹRÓDŁO: trends" in prompt


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
