"""Content generator – produces news articles via GPT-5.4."""

from __future__ import annotations

import os
import re
from datetime import datetime, timezone

import yaml
from openai import OpenAI

from collector import Signal
from scorer import ScoredSignal


SYSTEM_PROMPT = (
    "Jesteś redaktorem widocznosc.ai – polskiego portalu o widoczności marek "
    "w wyszukiwarkach AI (ChatGPT, Claude, Gemini, Perplexity), GEO i modelach "
    "językowych. Piszesz po polsku, rzeczowo i angażująco, bez marketingowego bełkotu. "
    "Mówisz w imieniu naszej redakcji w 1. osobie liczby mnogiej – używasz zaimków "
    "dzierżawczych i sformułowań typu „naszym zdaniem”, „w naszej ocenie”, „uważamy”, "
    "„z naszej perspektywy”. ZAKAZ pisania o sobie w 3. osobie jako „widocznosc.ai” – "
    "NIGDY nie pisz np. „Z perspektywy widocznosc.ai…”. Zwracaj się bezpośrednio do "
    "czytelnika („Twoja marka”, „jeśli prowadzisz…”, „sprawdź…”), aby go zaangażować. "
    "NIGDY nie kopiujesz oryginału – streszczasz fakty własnymi słowami i dodajesz "
    "ekspercki komentarz. Używasz wyłącznie en-dash (–), nigdy em-dash."
)


def build_prompt(topic, related_articles, format_config) -> str:
    src_title = topic.signal.title
    src_url = getattr(topic.signal, "url", "")
    src_name = getattr(topic.signal, "source_name", None) or getattr(topic.signal, "source", "źródło")
    src_summary = getattr(topic.signal, "summary", "") or getattr(topic.signal, "description", "")
    lo = format_config.get("short_min_words", 400)
    hi = format_config.get("short_max_words", 600)
    return f"""Na podstawie poniższego anglojęzycznego newsa napisz polski wpis dla sekcji News portalu widocznosc.ai.

ŹRÓDŁO: {src_name}
TYTUŁ ORYGINAŁU: {src_title}
URL: {src_url}
STRESZCZENIE/FRAGMENT: {src_summary}

Wymagania:
- Długość całości: {lo}–{hi} słów.
- Zacznij od frontmatteru YAML między --- z polami: title (polski, zwięzły), lead (1–2 zdania), date (RRRR-MM-DD, dzisiejsza data), sourceName ("{src_name}"), sourceUrl ("{src_url}"), tags (2–4 polskie tagi).
- Po frontmatterze body w markdown w następującej strukturze:
  1. `## Co się wydarzyło` – streszczenie faktów własnymi słowami.
  2. Zaraz po tej sekcji wstaw jednozdaniowy wyróżnik jako cytat blockquote:
     `> **Nasz komentarz:** [jedno mocne, konkretne zdanie – nasza opinia/wniosek z perspektywy redakcji].`
  3. `## Co to oznacza dla Twojej marki` – ekspercki komentarz naszej redakcji: praktyczne wnioski, zaimki dzierżawcze („naszym zdaniem”, „w naszej ocenie”), bezpośrednie zwroty do czytelnika. Zaangażuj – pokaż, co czytelnik powinien z tym zrobić.
  4. `## W skrócie` na samym końcu – lista 3 punktów (myślniki) z najważniejszymi wnioskami do zapamiętania (TL;DR).
- ZAKAZ frazy „Z perspektywy widocznosc.ai” i pisania o sobie w 3. osobie. Pisz „naszym zdaniem”, „w naszej ocenie”, „uważamy”.
- NIE kopiuj zdań z oryginału. NIE wymyślaj faktów spoza źródła.
- Nie dodawaj sekcji FAQ ani CTA – zostaną dołożone automatycznie.
"""


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

    prompt = build_prompt(topic, related_articles, format_config or {})

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
