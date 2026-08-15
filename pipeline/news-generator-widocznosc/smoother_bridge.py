#!/usr/bin/env python3
"""Most między generatorem newsów a silnikiem wygładzania blog-polish (smoother.py).

`smooth_news(text)` wykonuje przejazd redaktorski newsa (REVIEW_MODEL przez OpenRouter,
domyślnie google/gemini-3.7-flash:online – z web searchem do weryfikacji faktów), zachowując
fail-safe: brak klucza / odrzucenie przez diff-guard / błąd API -> zwraca ORYGINAŁ + log.
Nigdy nie rzuca wyjątku w górę, żeby nie wywalić codziennej generacji newsa.

Newsom podajemy TYLKO prozaiczne reguły (słownik kalk, blacklista AI, fleksja) –
bez reguł strukturalnych bloga, które kusiłyby model do dodania tabel/linków/calloutów.
"""
from __future__ import annotations

import logging
import os
import sys
from pathlib import Path

# smoother.py leży w siostrzanym pipeline'ie blog-polish
_SMOOTHER_SCRIPTS = Path(__file__).resolve().parent.parent / "widocznosc-blog-polish" / "scripts"
sys.path.insert(0, str(_SMOOTHER_SCRIPTS))

import smoother  # noqa: E402

log = logging.getLogger("news-generator")

# Model przejazdu redaktorskiego – z web searchem (:online), żeby weryfikacja
# faktów nie była ślepa (recenzent bez :online nie widzi świeżych premier).
REVIEW_MODEL = os.environ.get("NEWS_REVIEW_MODEL", "google/gemini-3.7-flash:online")

REVIEW_SYSTEM_PROMPT = """Wciel się w doświadczonego polskiego redaktora językowego i dziennikarza technologicznego specjalizującego się w SEO, AI search, GEO (Generative Engine Optimization) i dużych modelach językowych. Sprawdź poniższy tekst pod kątem poprawności polszczyzny, fleksji i faktów.

Zwróć szczególną uwagę na:

* kalki językowe i złe kolokacje – dosłowne tłumaczenia z angielskiego („dostarczać wartość", „adresować problem", „lewarować dane", „dedykowany artykuł", „rankować na frazę"); zamieniaj je na naturalne polskie frazy („dawać realną wartość", „odpowiadać na problem", „wykorzystywać dane", „osobny artykuł", „zajmować pozycję na frazę"); tęp też marketingową nowomowę („rewolucyjny", „game changer", „w dzisiejszym dynamicznym świecie"),
* żargon branżowy – poprawne polskie nazewnictwo pojęć (okno kontekstowe, dane treningowe, data odcięcia wiedzy, halucynacje, cytowania w odpowiedziach AI, wzmianki marki, dane strukturalne, generowanie wspomagane wyszukiwaniem); przyjęte anglicyzmy zostaw, jeśli brzmią naturalnie (prompt, crawler, snippet, embedding, fine-tuning, RAG); pilnuj konsekwencji – jeden termin dla jednego pojęcia w całym tekście, bez mieszania „AI Overviews" z „przeglądami AI" w co drugim akapicie,
* odmianę nazw własnych – modeli, narzędzi i firm (z Claude'em, w Perplexity, o Gemini, z ChatGPT – konsekwentnie: albo odmieniamy, albo nie, bez wariacji w obrębie tekstu) – oraz poprawne nazwy produktów i funkcji (AI Overviews, AI Mode, ChatGPT Search, Microsoft Copilot) i skrótowce z poprawną odmianą (LLM-y, LLM-ów, w SGE),
* zgrabność i logikę zdań – popraw opisy mechanizmów, które po zwizualizowaniu nie mają sensu technicznego (mylenie treningu modelu z retrievalem, indeksowania z cytowaniem, RAG z fine-tuningiem, „model przeszukał internet" tam, gdzie chodzi o dane treningowe),
* wiarygodność twierdzeń – zweryfikuj fakty (nazwy i wersje modeli, funkcje produktów); jeśli twierdzenie brzmi wątpliwie, przeformułuj zdanie ostrożniej (np. dodaj „według producenta", „z reguły"), ale BEZ zmieniania samych liczb i dat.

Bądź bezlitosny dla stylu.

TWARDE OGRANICZENIA (przejazd automatyczny, bez człowieka w pętli):
- NIE zmieniaj ŻADNYCH liczb, dat, cen, procentów ani nazw/wersji modeli – jeśli liczba budzi wątpliwość, złagodź otaczające zdanie, nie liczbę,
- każde wystąpienie nazwy modelu z numerem wersji (np. „Grok 4.6", „Groka 4.5", „GPT-5.6 Sol") przepisz ZNAK W ZNAK tak, jak stoi w tekście – nie odmieniaj nieodmienionych i nie „prostuj" odmienionych; automat porównuje te formy dosłownie i odrzuci całą korektę przy jakiejkolwiek zmianie,
- NIE ruszaj tokenów §...§ – przepisz je DOKŁADNIE i w tym samym miejscu (to kod, linki, nagłówki, shortcode'y),
- NIE dodawaj, nie usuwaj i nie przestawiaj treści; zachowaj liczbę akapitów 1:1,
- cytaty w cudzysłowie zostaw dosłownie,
- ZACHOWAJ redakcyjne markery pierwszej osoby („naszym zdaniem", „w naszej ocenie", „uważamy", „nasz komentarz") – to celowy styl sekcji komentarza eksperckiego, nie zamieniaj ich na formy bezosobowe.

ZWRÓĆ WYŁĄCZNIE poprawiony tekst w tym samym formacie – bez listy błędów, bez komentarzy, bez ```fence```, bez nagłówka typu „Oto poprawiona wersja"."""


def _call_review(protected_body: str, rules: str, api_key: str) -> str:
    """OpenRouter z promptem redaktorskim (REVIEW_MODEL zamiast smoother.MODEL)."""
    import json
    import urllib.request

    user_msg = (
        f"# Reguły redakcyjne (kontekst)\n\n{rules[:8000]}\n\n"
        f"# Tekst do redakcji\n\n{protected_body}\n\n"
        "Zwróć WYŁĄCZNIE poprawiony tekst."
    )
    req = urllib.request.Request(
        smoother.API_URL,
        data=json.dumps({
            "model": REVIEW_MODEL,
            "messages": [
                {"role": "system", "content": REVIEW_SYSTEM_PROMPT},
                {"role": "user", "content": user_msg},
            ],
            "temperature": 0.3,
        }).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://widocznosc.ai",
            "X-Title": "widocznosc.ai news review",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=smoother.TIMEOUT) as resp:
        body = json.loads(resp.read().decode("utf-8"))
    content = body["choices"][0]["message"].get("content")
    if not content:
        raise RuntimeError(f"Pusta odpowiedź modelu: {json.dumps(body)[:300]}")
    return content

# Nagłówki H2 z writing-rules.md, które są czystą prozą i bezpieczne dla newsa.
_NEWS_RULE_SECTIONS = ["Słownik GEO", "Zakazane zwroty AI", "Polska fleksja"]


def _extract_sections(md: str, headers: list[str]) -> str:
    """Zwraca konkatenację sekcji H2 (## ...), których nagłówek zawiera którąś z fraz `headers`.
    Sekcja trwa od swojego `## ` do następnego `## ` lub końca pliku."""
    out: list[str] = []
    capture = False
    for line in md.split("\n"):
        if line.startswith("## "):
            capture = any(h in line for h in headers)
        if capture:
            out.append(line)
    return "\n".join(out)


def news_rules() -> str:
    """Prozaiczny wyciąg z writing-rules.md: słownik kalk + blacklista AI + fleksja."""
    return _extract_sections(smoother.load_rules(), _NEWS_RULE_SECTIONS)


def smooth_news(text: str, call_fn=None) -> str:
    """Wygładza markdown newsa (frontmatter + body). Fail-safe: zawsze zwraca poprawny markdown.

    call_fn: opcjonalny wstrzykiwany wykonawca (do testów). Domyślnie OpenRouter z env-klucza.
    """
    if call_fn is None:
        key = os.environ.get("OPENROUTER_API_KEY", "").strip()
        if not key:
            log.warning("OPENROUTER_API_KEY brak – news publikowany bez przejazdu redaktorskiego")
            return text
        call_fn = lambda pb, r: _call_review(pb, r, key)  # noqa: E731

    result = smoother.process_text(text, news_rules(), call_fn)
    status = result["status"]
    if status in ("rejected", "error"):
        log.warning("news bez przejazdu redaktorskiego (%s): %s", status, result["detail"])
    elif status == "smoothed":
        log.info("news po przejeździe redaktorskim (%s)", REVIEW_MODEL)
    # process_text przy rejected/error/unchanged zwraca oryginał w 'text' – zawsze bezpieczne
    return result["text"]
