#!/usr/bin/env python3
"""Jednorazowy wiring grafik AI w biznesie: swap hero w frontmatter + wstawienie
infografiki przed 3. H2 w każdym z 12 artykułów. Idempotentny. Wzorzec jak
_wire_modele_llm.py. Uruchom raz: python3 pipeline/_wire_ai_biznes.py
"""
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BLOG = os.path.join(ROOT, "portals", "widocznosc.ai", "src", "content", "blog", "ai-w-biznesie")
IMG = "../../../assets/images"
PLACEHOLDER = f"image: {IMG}/blog1.png"

# stem -> (3. H2 anchor, alt-text infografiki)
WIRE = {
    "przewodnik": (
        "## Gdzie AI przynosi mierzalne efekty – przegląd zastosowań",
        "Trzy drogi do wdrożenia AI – Build (własne), Buy (gotowy SaaS) i "
        "Boost (rozszerzenie istniejących narzędzi) z kompromisami kontroli, "
        "kosztu i czasu",
    ),
    "od-czego-zaczac": (
        "## Trzy strategie technologiczne – budować, kupować czy integrować?",
        "Mapa drogowa wdrożenia AI w pięciu fazach na osiem miesięcy – audyt "
        "gotowości, eksploracja, proof of concept, pilotaż i produkcja",
    ),
    "roi-z-ai": (
        "## Jak liczyć ROI – krok po kroku",
        "Formuła ROI z AI – korzyści w liczniku (oszczędność czasu, wzrost "
        "przychodów) podzielone przez koszty w mianowniku (wdrożenie, "
        "licencje, utrzymanie)",
    ),
    "ai-w-marketingu": (
        "## Analiza wydźwięku i automatyzacja obsługi klienta",
        "Pięć zastosowań AI w marketingu – silniki rekomendacji, widzenie "
        "komputerowe, analiza wydźwięku, programmatic i dynamiczne ceny oraz "
        "przetwarzanie języka naturalnego",
    ),
    "ai-w-sprzedazy": (
        "## Asystenci handlowi AI – co robią zamiast handlowca",
        "Ścieżka AI w sprzedaży – od predykcyjnego lead scoringu przez "
        "priorytetyzację leadów i asystenta handlowego po analizę rozmów "
        "(Conversation Intelligence)",
    ),
    "ai-w-obsludze-klienta": (
        "## Model hybrydowy – kiedy AI musi przekazać sprawę człowiekowi",
        "Hybrydowy model obsługi klienta – chatbot AI oparty na RAG "
        "odpowiada na proste sprawy, a złożone przypadki eskaluje do "
        "konsultanta",
    ),
    "ai-w-hr": (
        "## Analityka pracownicza – przewidywanie odejść i optymalizacja zespołów",
        "AI w cyklu HR – wsparcie rekrutacji i selekcji CV, "
        "spersonalizowanego onboardingu oraz analityki pracowniczej "
        "przewidującej odejścia",
    ),
    "ai-act-rodo": (
        "## Role prawne: kto jest kim w RODO i AI Act",
        "Cztery kategorie ryzyka w AI Act – od systemów niedopuszczalnych "
        "(zakazanych) przez wysokie i ograniczone ryzyko po minimalne, im "
        "wyższe ryzyko, tym więcej obowiązków",
    ),
    "bezpieczenstwo-danych-llm": (
        "## Shadow AI – ryzyko, którego nie widać w logach",
        "Sześć zasad ochrony danych firmowych w pracy z LLM – opt-out "
        "trenowania, brak danych wrażliwych w promptach, umowa DPA, kontrola "
        "Shadow AI, wdrożenie lokalne oraz polityka i szkolenia",
    ),
    "build-vs-buy": (
        "## Kiedy kupić gotowe – argumenty za SaaS",
        "Porównanie Build kontra Buy – budowa własnego rozwiązania (kontrola, "
        "brak vendor lock-in, wysoki koszt) wobec gotowego SaaS (szybkie "
        "wdrożenie, niższy koszt startu, ryzyko lock-in)",
    ),
    "etyka-ai-w-firmie": (
        "## Jak stworzyć politykę AI – od zasad do dokumentu operacyjnego",
        "System zarządzania AI w firmie – polityka AI, komitet ds. AI, "
        "standardy NIST AI RMF i ISO 42001, pomiar stronniczości oraz "
        "zgodność z AI Act",
    ),
    "jak-rozmawiac-z-zarzadem": (
        "## Jak zbudować business case, który przeżyje salę zarządową",
        "Jak mówić o AI językiem zarządu – zamiana języka technologii (model "
        "LLM, fine-tuning, RAG) na język korzyści biznesowych (krótszy czas "
        "obsługi, niższe koszty, wyższa konwersja, zwrot z inwestycji)",
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

        hero = f"image: {IMG}/blog-ai-w-biznesie-{stem}.png"
        info_md = f"![{alt}]({IMG}/infographic-ai-w-biznesie-{stem}.png)"

        if PLACEHOLDER in text:
            text = text.replace(PLACEHOLDER, hero, 1)
        elif hero in text:
            pass
        else:
            errors.append(f"{stem}: nie znaleziono '{PLACEHOLDER}' ani hero")

        if info_md in text:
            pass
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
