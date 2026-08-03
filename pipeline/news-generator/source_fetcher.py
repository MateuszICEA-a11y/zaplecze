"""Pobieranie treści artykułu źródłowego.

Generator pisał newsy z samego tytułu i zajawki RSS – model lał wodę
i dopowiadał szczegóły, których nie było w źródle. Treść realnego artykułu
(Jina Reader) daje mu fakty do ręki.

Linki z Google News RSS są opakowaniem (news.google.com/rss/articles/…),
więc najpierw próbujemy dojść do docelowego adresu; gdy się nie da,
Jina dostaje link Google – renderuje JS i przechodzi przekierowanie sama.
"""

from __future__ import annotations

import logging
import os
import re
import urllib.parse
import urllib.request

log = logging.getLogger("news-generator.source")

GOOGLE_NEWS_HOST = "news.google.com"
JINA_BASE = "https://r.jina.ai/"
BROWSER_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
MAX_SOURCE_CHARS = 6000
# Krótszy tekst to niemal na pewno ściana zgód/paywall, nie artykuł.
MIN_SOURCE_CHARS = 300
RESOLVE_TIMEOUT = 30
FETCH_TIMEOUT = 90


def resolve_source_url(url: str) -> str | None:
    """Adres docelowy artykułu spod opakowania Google News (albo None)."""
    if GOOGLE_NEWS_HOST in urllib.parse.urlparse(url).netloc:
        # Identyfikator artykułu jest zakodowany – dekoder gada z wewnętrznym
        # API Google (batchexecute); heurystyka niżej to tylko siatka ratunkowa.
        try:
            from googlenewsdecoder import gnewsdecoder
            decoded = gnewsdecoder(url)
            if decoded.get("status") and decoded.get("decoded_url"):
                return decoded["decoded_url"]
        except Exception as e:  # noqa: BLE001
            log.warning("Dekoder Google News padł: %s", e)

    request = urllib.request.Request(url, headers={"User-Agent": BROWSER_UA})
    try:
        with urllib.request.urlopen(request, timeout=RESOLVE_TIMEOUT) as response:
            final = response.geturl()
            html = response.read(200_000).decode("utf-8", "replace")
    except Exception as e:  # noqa: BLE001
        log.warning("Nie udało się rozwiązać adresu źródła: %s", e)
        return None

    if GOOGLE_NEWS_HOST not in urllib.parse.urlparse(final).netloc:
        return final

    # Strona pośrednia Google trzyma cel w data-n-au albo w pierwszym
    # zewnętrznym linku.
    match = re.search(r'data-n-au="(https?://[^"]+)"', html) or re.search(
        r'href="(https?://(?!news\.google|www\.google|support\.google|policies\.google)[^"]+)"', html
    )
    return match.group(1) if match else None


def fetch_source_text(url: str) -> dict | None:
    """Treść artykułu źródłowego przez Jina Reader.

    Zwraca {"url": adres_docelowy, "text": treść} albo None – wtedy generator
    pisze po staremu (sam tytuł i zajawka), ale przynajmniej o tym wie.
    """
    target = resolve_source_url(url) or url
    headers = {"User-Agent": BROWSER_UA, "X-Return-Format": "text"}
    api_key = os.environ.get("JINA_API_KEY", "").strip()
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    request = urllib.request.Request(JINA_BASE + target, headers=headers)
    try:
        with urllib.request.urlopen(request, timeout=FETCH_TIMEOUT) as response:
            text = response.read().decode("utf-8", "replace").strip()
    except Exception as e:  # noqa: BLE001
        log.warning("Jina nie oddała treści źródła (%s): %s", target[:80], e)
        return None

    if len(text) < MIN_SOURCE_CHARS:
        log.warning("Treść źródła za krótka (%d znaków) – pewnie ściana zgód", len(text))
        return None

    return {"url": target, "text": text[:MAX_SOURCE_CHARS]}
