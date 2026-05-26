#!/usr/bin/env python3
"""Jednorazowy wiring grafik Modele LLM: swap hero w frontmatter + wstawienie
infografiki przed 3. H2 w każdym z 11 artykułów. Idempotentny (pomija jeśli już
podpięte). Uruchom raz: python3 pipeline/_wire_modele_llm.py
"""
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BLOG = os.path.join(ROOT, "portals", "widocznosc.ai", "src", "content", "blog", "modele-llm")
IMG = "../../../assets/images"
PLACEHOLDER = f"image: {IMG}/blog1.png"

# stem -> (3rd H2 anchor line, alt-text infografiki)
WIRE = {
    "przewodnik": (
        "## ChatGPT i ekosystem OpenAI",
        "Ekosystem dużych modeli językowych 2026 – ChatGPT, Claude, Gemini, "
        "Copilot, Perplexity, Grok i modele open source wraz z twórcami i "
        "mocnymi stronami",
    ),
    "chatgpt": (
        "## Plany i możliwości – co oferuje każda wersja",
        "Jak działa model GPT – przepływ od tekstu wejściowego przez "
        "tokenizację, embeddingi i mechanizm uwagi transformera do "
        "przewidzenia kolejnego tokenu i wygenerowania odpowiedzi",
    ),
    "claude": (
        "## Rodzina modeli Claude – Haiku, Sonnet, Opus",
        "Rodzina modeli Claude – Haiku, Sonnet i Opus uszeregowane według "
        "mocy i szybkości, oparte na Constitutional AI",
    ),
    "gemini": (
        "## Plany abonamentowe – Free, AI Plus, AI Pro, AI Ultra",
        "Ekosystem Google Gemini – modele Flash i Pro, Workspace, Gems, Deep "
        "Research, NotebookLM oraz Veo wokół wspólnego modelu",
    ),
    "copilot": (
        "## Windows 11 i Copilot jako system operacyjny oparty na agentach",
        "Cztery warianty Microsoft Copilot – dla Microsoft 365, Windows, "
        "GitHub oraz Copilot Studio do budowy własnych agentów",
    ),
    "perplexity": (
        "## Jak działa architektura RAG w Perplexity",
        "Architektura RAG w Perplexity – od pytania użytkownika przez "
        "wyszukiwanie w sieci i ocenę źródeł po odpowiedź z cytowaniami",
    ),
    "chatgpt-vs-claude": (
        "## Programowanie – kto pisze lepszy kod",
        "Porównanie ChatGPT i Claude według zastosowań – pisanie, "
        "programowanie, analiza dokumentów, wszechstronność i język polski",
    ),
    "chatgpt-vs-gemini": (
        "## Głos i tryb mobilny – jak działają asystenci głosowi",
        "Porównanie ChatGPT i Gemini 2026 – okno kontekstowe, ekosystem, "
        "multimodalność wideo oraz cena wejścia",
    ),
    "claude-vs-gemini": (
        "## Kodowanie – gdzie różnica sięga kilkunastu punktów procentowych",
        "Werdykt Claude kontra Gemini w pięciu scenariuszach – dokumenty, "
        "kodowanie, długi kontekst, ekosystem Google oraz cena",
    ),
    "claude-vs-chatgpt-programowanie": (
        "## Tabela porównawcza – modele, narzędzia, ceny, benchmarki",
        "Wyniki SWE-bench Verified dla Claude i ChatGPT (maj 2026) – Claude "
        "Opus 4.7, GPT-5.5 Codex, Claude Opus 4.5 i GPT-5.1 oraz SWE-bench Pro",
    ),
    "co-potrafi-chatgpt": (
        "## Jak pisać skuteczne prompty",
        "Główne zastosowania ChatGPT – pisanie i redakcja, tłumaczenia, "
        "analiza danych, programowanie, nauka oraz burza mózgów",
    ),
}


def main() -> int:
    errors = []
    for stem, (anchor, alt) in WIRE.items():
        path = os.path.join(BLOG, f"{stem}.md")
        if not os.path.exists(path):
            errors.append(f"{stem}: brak pliku {path}")
            continue
        with open(path, "r", encoding="utf-8") as f:
            text = f.read()

        hero = f"image: {IMG}/blog-modele-llm-{stem}.png"
        info_md = f"![{alt}]({IMG}/infographic-modele-llm-{stem}.png)"

        # 1) hero w frontmatter
        if PLACEHOLDER in text:
            text = text.replace(PLACEHOLDER, hero, 1)
        elif hero in text:
            pass  # już podpięte
        else:
            errors.append(f"{stem}: nie znaleziono '{PLACEHOLDER}' ani hero")

        # 2) infografika przed 3. H2
        if info_md in text:
            pass  # już wstawione
        elif anchor in text:
            text = text.replace(anchor, f"{info_md}\n\n{anchor}", 1)
        else:
            errors.append(f"{stem}: nie znaleziono kotwicy H2 '{anchor}'")

        with open(path, "w", encoding="utf-8") as f:
            f.write(text)
        print(f"✓ {stem}")

    if errors:
        print("\nBŁĘDY:")
        for e in errors:
            print(" ✗", e)
        return 1
    print(f"\nGotowe: {len(WIRE)} artykułów podpiętych")
    return 0


if __name__ == "__main__":
    sys.exit(main())
