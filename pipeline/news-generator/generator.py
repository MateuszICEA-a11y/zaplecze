"""Content generator – produces news articles via GPT-5.4."""

from __future__ import annotations

import os
import re
from datetime import datetime, timezone

import yaml
from openai import OpenAI

from collector import Signal
from scorer import ScoredSignal


SYSTEM_PROMPT = """\
Jesteś dziennikarzem portalu BusManiak.pl – polskiego serwisu o busach, vanach, \
kamperach i motoryzacji dostawczej. Piszesz profesjonalne, rzeczowe newsy w języku polskim.

Zasady:
- Pisz po polsku, naturalnym językiem
- Używaj en-dash (–), nigdy em-dash (—)
- Nazwa portalu: BusManiak.pl (camelCase)
- Body artykułu MUSI zaczynać się od nagłówka ## H2 (lead jest w frontmatter)
- Nie powtarzaj treści z lead w body
- NIE dodawaj sekcji FAQ – newsy nie mają FAQ
- Sources: podaj źródła informacji
- Linki wewnętrzne: OBOWIĄZKOWO wstaw podane linki do powiązanych artykułów w naturalnym kontekście. Każdy news MUSI zawierać co najmniej 1 link wewnętrzny.
- Nie używaj shortcodów Hugo (image, table itp.) – tylko czysty markdown
- Listy: **Termin** – opis (bez bold+dwukropek)
- Nie upychaj słów kluczowych – pisz naturalnie\
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
toc: false
main_keyword: "..."
lead: "... (2-3 zdania, intrygujący wstęp)"
categories:
  - "{topic.section}"
tags:
  - "..."
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
    max_completion_tokens: int = 2000,
    format_config: dict | None = None,
) -> str:
    """Generate a news article using GPT-5.4."""
    client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

    if topic.format_type == "analysis":
        max_completion_tokens = format_config.get("max_tokens_analysis", 4000) if format_config else 4000

    prompt = build_prompt(topic, related_articles, format_config)

    response = client.chat.completions.create(
        model=model,
        temperature=temperature,
        max_completion_tokens=max_completion_tokens,
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
    topic_title: str = "",
) -> list[dict]:
    """Find articles across all sections, ranked by relevance to topic title."""
    from pathlib import Path
    from difflib import SequenceMatcher

    content_path = Path(content_dir)
    if not content_path.exists():
        return []

    skip_sections = {"news", "autor", "narzedzia"}
    articles = []

    for md_file in content_path.rglob("*.md"):
        if md_file.name == "_index.md":
            continue

        # Skip non-content sections
        relative = md_file.relative_to(content_path)
        file_section = relative.parts[0] if relative.parts else ""
        if file_section in skip_sections:
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

        slug = str(relative).replace(".md", "").replace("\\", "/")
        url = f"/{slug}/"
        title = fm.get("title", "")
        main_kw = fm.get("main_keyword", "")

        # Score relevance to topic
        relevance = 0.0
        topic_lower = topic_title.lower()
        if main_kw and main_kw.lower() in topic_lower:
            relevance = 1.0
        elif title:
            relevance = SequenceMatcher(None, topic_lower, title.lower()).ratio()

        # Boost articles from the matched section
        if file_section == section:
            relevance += 0.2

        articles.append({
            "title": title,
            "url": url,
            "main_keyword": main_kw,
            "relevance": relevance,
        })

    # Sort by relevance, return top 5
    articles.sort(key=lambda a: a["relevance"], reverse=True)
    return articles[:5]

    return articles
