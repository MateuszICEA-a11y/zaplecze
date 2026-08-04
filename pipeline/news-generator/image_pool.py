"""Kuratorowana pula zdjęć hero dla newsów – zamiast placeholderów per sekcja.

Do sierpnia 2026 news bez własnego hero dostawał obrazek z mapy `images:`
w config.yaml, przypisywany po sekcji tematycznej. Dawało to trafienia w rodzaju
łazienki kampera pod relacją z katastrofy autobusu albo tabeli danych silnika
pod wypadkiem na A4 – 44 ze 106 newsów miało obrazek bez związku z treścią.

Tutaj wybór idzie po kategorii SCENY rozpoznanej z tytułu, a zdjęcia pochodzą
z ręcznie sprawdzonej puli (Wikimedia Commons, licencje komercyjne, atrybucja
w `image_credit`). Zdarzenia drogowe dostają neutralne ujęcie drogi lub służb –
nigdy fotografię cudzego wypadku w roli relacji.
"""

from __future__ import annotations

import json
import zlib
from pathlib import Path

POOL_PATH = Path(__file__).resolve().parent / "image_pool.json"

# Kategorie z image_generator._CATEGORY_KEYWORDS, które nie mają własnej puli,
# spadają na scenę pokrewną.
CATEGORY_FALLBACK = {
    "market": "van",
    "model_specific": "van",
    "default": "van",
}

# Rozpoznanie sceny wyłącznie po słowach kluczowych – bez wywołań LLM, żeby
# backfill i codzienna generacja kosztowały tyle samo (zero).
# Kolejność ma znaczenie: zdarzenie drogowe bije typ pojazdu, bo "zapalił się
# kamper" to news o pożarze, nie o kamperach.
_SCENE_KEYWORDS: list[tuple[str, list[str]]] = [
    ("incident", ["wypadek", "wypadł", "katastrof", "zderz", "kolizj", "dachow",
                  "pożar", "spłon", "podpal", "zapalił", "wjechał", "wybuch",
                  "ranni", "ranne", "nie żyje", "ofiar", "tragedi", "tragiczn",
                  "przewrócił", "przewrócony", "utrudnienia", "wahadłow",
                  "zablokowan", "poszkodowan", "uderzył"]),
    ("fuel", ["paliw", "diesel", "diesla", "benzyn", "lpg", "tankowan", "ropa",
              "olej napędowy", "stacj", "e-petrol", "cpn", "akcyz"]),
    # Przed „electric”, bo news o opłatach drogowych dla aut elektrycznych
    # dotyczy przepisów, nie ładowania.
    ("regulations", ["przepis", "mandat", "prawo jazdy", "rejestracj", "kodeks",
                     "homologacj", "ubezpieczen", "przegląd techniczn", "e-toll",
                     "opłat", "zakaz", "kontrol", "itd ", "witd",
                     "inspekcj", "sąd", "nsa", "ustaw"]),
    ("electric", ["elektryczn", "ładowani", "ładowark", "bateri", "zeroemisyjn",
                  "hybryd"]),
    ("camper", ["kamper", "campervan", "kampervan", "motorhome", "vanlife",
                "przyczep", "caravan", "dom na kółkach", "zabudow"]),
    ("bus", ["autobus", "autokar", "minibus", "przewóz osób", "komunikacj",
             "pks", "solaris"]),
    ("van", ["bus", "van", "dostawcz", "furgon", "ducato", "sprinter", "transit",
             "crafter", "boxer", "master", "daily", "transporter", "vito",
             "berlingo", "combo", "trafic", "jumper", "movano", "vivaro",
             "proace", "expert"]),
]


def detect_scene(title: str) -> str:
    """Rozpoznaje kategorię sceny z tytułu newsa (bez LLM)."""
    lowered = title.lower()
    for scene, keywords in _SCENE_KEYWORDS:
        if any(kw in lowered for kw in keywords):
            return scene
    return "van"


def load_pool() -> dict[str, list[dict]]:
    if not POOL_PATH.exists():
        return {}
    return json.loads(POOL_PATH.read_text(encoding="utf-8"))


def pick_image(title: str, slug: str, *, rotation: int | None = None) -> dict | None:
    """Zwraca {"image", "credit", "scene"} z puli albo None, gdy puli brak.

    `rotation` pozwala wymusić indeks (backfill rozdaje po kolei w obrębie
    kategorii, żeby sąsiednie wpisy na liście nie miały tego samego zdjęcia).
    Bez niego indeks liczy się deterministycznie ze sluga – ten sam news zawsze
    dostaje to samo zdjęcie, także przy ponownym przejeździe pipeline'u.
    """
    pool = load_pool()
    if not pool:
        return None

    scene = detect_scene(title)
    candidates = pool.get(scene) or pool.get(CATEGORY_FALLBACK.get(scene, "van"))
    if not candidates:
        return None

    if rotation is None:
        rotation = zlib.crc32(slug.encode("utf-8"))
    chosen = candidates[rotation % len(candidates)]
    return {"image": chosen["file"], "credit": chosen["credit"], "scene": scene}
