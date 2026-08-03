"""Prawdziwe zdjęcia hero z otwartych baz: Wikimedia Commons + Openverse.

Generacje kie.ai wychodziły generycznie (scena z kategorii, nie z newsa),
a przy konkretnych modelach aut prawdziwe zdjęcie zawsze bije syntetyk.
Tylko licencje komercyjne (CC0/PD/BY/BY-SA), atrybucja idzie do frontmattera
(`image_credit`) i jest renderowana pod hero.

Kolejność: Wikimedia (lepsze zdjęcia konkretnych pojazdów) → Openverse.
Każdy kandydat przechodzi tę samą walidację wizyjną co generacje AI.
"""

from __future__ import annotations

import json
import logging
import re
import urllib.parse
import urllib.request
from pathlib import Path

log = logging.getLogger("news-generator.stock")

COMMONS_API = "https://commons.wikimedia.org/w/api.php"
OPENVERSE_API = "https://api.openverse.org/v1/images/"
USER_AGENT = "BusManiakNewsBot/1.0 (https://busmaniak.pl; kontakt@busmaniak.pl)"
TIMEOUT = 30
MAX_CANDIDATES = 4  # ile zdjęć per zapytanie schodzi do pobrania i walidacji

# Openverse: kody licencji dopuszczone do użytku komercyjnego bez ND/NC.
OPENVERSE_LICENSES = "cc0,pdm,by,by-sa"
# Wikimedia: LicenseShortName zaczynające się od tych prefiksów przechodzą.
COMMONS_LICENSE_PREFIXES = ("cc0", "public domain", "pd", "cc by", "cc-by", "attribution")
COMMONS_LICENSE_BLOCKED = ("nc", "nd")


def _get_json(url: str) -> dict | None:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(request, timeout=TIMEOUT) as response:
            return json.loads(response.read().decode("utf-8"))
    except Exception as e:  # noqa: BLE001
        log.warning("Zapytanie do bazy zdjęć padło (%s…): %s", url[:60], e)
        return None


def _commons_license_ok(short_name: str) -> bool:
    name = (short_name or "").lower()
    if not name.startswith(COMMONS_LICENSE_PREFIXES):
        return False
    return not any(block in name for block in COMMONS_LICENSE_BLOCKED)


def search_wikimedia(query: str, limit: int = 8) -> list[dict]:
    """Kandydaci z Wikimedia Commons: [{url, title, creator, license, source}]."""
    params = urllib.parse.urlencode({
        "action": "query",
        "format": "json",
        "generator": "search",
        "gsrsearch": f"filetype:bitmap {query}",
        "gsrnamespace": 6,
        "gsrlimit": limit,
        "prop": "imageinfo",
        "iiprop": "url|extmetadata|size",
        "iiurlwidth": 1400,
    })
    data = _get_json(f"{COMMONS_API}?{params}")
    pages = ((data or {}).get("query") or {}).get("pages") or {}

    results = []
    for page in pages.values():
        info = (page.get("imageinfo") or [{}])[0]
        meta = info.get("extmetadata") or {}
        license_name = (meta.get("LicenseShortName") or {}).get("value", "")
        if not _commons_license_ok(license_name):
            continue
        if (info.get("width") or 0) < 800:
            continue  # za małe na hero
        creator = (meta.get("Artist") or {}).get("value", "")
        # Artist bywa HTML-em – zdejmujemy znaczniki do atrybucji tekstowej.
        creator = re.sub(r"<[^>]+>", "", creator).strip() or "autor nieznany"
        results.append({
            "url": info.get("thumburl") or info.get("url"),
            "title": page.get("title", ""),
            "creator": creator[:80],
            "license": license_name,
            "source": "Wikimedia Commons",
        })
    return results


def search_openverse(query: str, limit: int = 8) -> list[dict]:
    """Kandydaci z Openverse (agregator otwartych licencji)."""
    params = urllib.parse.urlencode({
        "q": query,
        "license": OPENVERSE_LICENSES,
        "page_size": limit,
        "filter_dead": "true",
    })
    data = _get_json(f"{OPENVERSE_API}?{params}")

    results = []
    for row in (data or {}).get("results") or []:
        if (row.get("width") or 0) < 800:
            continue
        license_code = (row.get("license") or "").upper()
        version = row.get("license_version") or ""
        results.append({
            "url": row.get("url"),
            "title": row.get("title") or "",
            "creator": (row.get("creator") or "autor nieznany")[:80],
            "license": f"CC {license_code} {version}".strip() if license_code not in ("CC0", "PDM") else license_code,
            "source": row.get("source") or "Openverse",
        })
    return results


def build_credit(candidate: dict) -> str:
    return f"Fot. {candidate['creator']} / {candidate['license']}, via {candidate['source']}"


def find_stock_photo(
    queries: list[str],
    title: str,
    slug: str,
    static_dir: Path,
    vehicle_hint: str | None = None,
) -> dict | None:
    """Szuka, pobiera i waliduje prawdziwe zdjęcie hero.

    Zwraca {"hero_url", "credit"} albo None – wtedy wchodzi fallback kie.ai.
    Walidacja tym samym bramkarzem wizyjnym co generacje AI, więc zdjęcie
    niezwiązane z tematem (albo inny pojazd niż w tytule) nie przejdzie.
    """
    from image_generator import _download_and_optimize, _validate_image

    images_dir = static_dir / "images" / "news"
    images_dir.mkdir(parents=True, exist_ok=True)
    dest = images_dir / f"{slug}.webp"

    for query in queries:
        candidates = search_wikimedia(query) + search_openverse(query)
        log.info("Stock: '%s' → %d kandydatów", query, len(candidates))
        for candidate in candidates[:MAX_CANDIDATES]:
            if not candidate.get("url"):
                continue
            try:
                _download_and_optimize(candidate["url"], dest)
            except Exception as e:  # noqa: BLE001
                log.warning("  Pobranie padło (%s): %s", candidate["url"][:60], e)
                continue
            is_valid, reason = _validate_image(dest, title, vehicle_hint)
            if is_valid:
                log.info("  Stock przyjęty: %s (%s)", candidate["title"][:60], candidate["license"])
                return {"hero_url": f"/images/news/{slug}.webp", "credit": build_credit(candidate)}
            log.info("  Stock odrzucony: %s", reason)
            dest.unlink(missing_ok=True)

    return None
