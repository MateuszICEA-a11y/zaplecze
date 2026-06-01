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
    "Jesteś ekspertem AI i analitykiem modeli językowych (GPT, Claude, Gemini, "
    "Perplexity i pokrewne) piszącym sekcję News portalu widocznosc.ai. Relacjonujesz "
    "i komentujesz NOWINKI ZE ŚWIATA AI – premiery i możliwości modeli, badania, "
    "wydarzenia branżowe – z perspektywy eksperta technologicznego, NIE brand-managera. "
    "Piszesz po polsku, rzeczowo i konkretnie, bez marketingowego bełkotu. "
    "Mówisz w 1. osobie liczby mnogiej („naszym zdaniem”, „w naszej ocenie”, „uważamy”) "
    "jako redakcja ekspercka; ZAKAZ pisania o sobie w 3. osobie („Z perspektywy "
    "widocznosc.ai…”). "
    "TWARDY ZAKAZ wątku marketingowego: NIE wspominaj o „widoczności marek”, SEO, GEO, "
    "„Twojej marce”, pozycjonowaniu ani nie dodawaj CTA. NIE pisz też zdań-„disclaimerów” "
    "typu „to nie ma przełożenia na widoczność marki / SEO” – po prostu pomijaj ten wątek "
    "i komentuj jak ekspert AI: co dane wydarzenie znaczy dla rozwoju modeli, ich "
    "możliwości, użytkowników i rynku AI. "
    "WIERNOŚĆ FAKTOM: trzymaj się ściśle faktów ze streszczenia źródła. NIE dodawaj nazw "
    "firm, liczb, dat ani szczegółów, których nie ma w źródle. Jeśli czegoś nie ma w "
    "streszczeniu – nie zakładaj i nie zmyślaj. NIGDY nie kopiujesz zdań oryginału – "
    "streszczasz własnymi słowami. Używasz wyłącznie en-dash (–), nigdy em-dash."
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
- Po frontmatterze body w markdown w następującej strukturze (zachowaj kolejność i funkcję sekcji, ale NAGŁÓWKI H2 sekcji 1 i 3 formułuj ZA KAŻDYM RAZEM INDYWIDUALNIE pod konkretny temat – NIE używaj szablonowych, powtarzalnych nagłówków):
  1. Sekcja faktów – streszczenie wydarzenia własnymi słowami. Nagłówek H2 napisz pod temat newsa, tak by oddawał jego sedno (np. nawiązanie do konkretu, liczby, firmy lub napięcia w historii). NIE używaj dosłownie „Co się wydarzyło?” – to zbyt szablonowe i powtarza się między newsami. Może mieć formę pytania albo zwięzłego stwierdzenia.
  2. Zaraz po tej sekcji wstaw jednozdaniowy wyróżnik jako cytat blockquote:
     `> **Nasz komentarz:** [jedno mocne, konkretne zdanie – nasza opinia/wniosek z perspektywy redakcji].`
  3. Sekcja eksperckiej analizy – rzeczowo, co ten news naprawdę oznacza dla świata AI. Pisz „naszym zdaniem”, „w naszej ocenie”, „uważamy”. Nagłówek H2 sformułuj INDYWIDUALNIE pod temat. Komentuj JAK EKSPERT AI: znaczenie dla rozwoju i możliwości modeli językowych, dla użytkowników, dla rynku i kierunku technologii. TWARDY ZAKAZ wątku marketingowego: NIE wspominaj o widoczności marek, SEO, GEO, „Twojej marce” ani nie dawaj porad/CTA marketingowych; NIE pisz też zdań-„disclaimerów”, że news nie ma przełożenia na markę – po prostu pomiń ten wątek. Lepszy jeden mocny, prawdziwy wniosek ekspercki niż wata słowna. Możesz – ale NIE musisz – użyć krótkiej listy w formacie `**Wniosek** – rozwinięcie` (myślniki `-`), tylko jeśli masz kilka odrębnych, konkretnych obserwacji. Unikaj ogólników typu „to ważny sygnał dla firm”.
  4. `## W skrócie` na samym końcu – ten jeden nagłówek zostaw DOSŁOWNIE „W skrócie”; pod nim lista 3 punktów (myślniki) z najważniejszymi wnioskami do zapamiętania (TL;DR).
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
