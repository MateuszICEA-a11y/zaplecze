"""Dopasowanie fraz kluczowych w tekście – z odmianą i przyimkami.

Lustro matchera z edytora (`dashboard/app/src/pages/[domain]/content-watcher/
edytor.astro`: `stem`, `fold`, `tokens`, `findPhrase`). To musi być ta sama
heurystyka po obu stronach: edytor liczy „pokrycie fraz" z gotowego dokumentu,
a pipeline sprawdza je przed oddaniem propozycji. Rozjazd oznaczałby, że
pipeline melduje 7/7, a użytkownik widzi 3/7.

Surowa fraza z wyszukiwarki („leady fotowoltaika") wchodzi do tekstu odmieniona
i z przyimkiem („leadów na fotowoltaikę") – reguła redakcyjna tego wymaga, więc
matcher musi to znosić: porównujemy rdzenie słów, a przyimki i spójniki mogą
stać między słowami frazy (maks. dwa) i są ignorowane w samej frazie.
"""
import re

SUFFIXES = ("ami", "ach", "iem", "em", "ow", "om", "ie", "y", "i", "e", "a", "u")
STEM_MIN = 4  # krótszy rdzeń zaczyna sklejać różne słowa
FOLD = {"ą": "a", "ć": "c", "ę": "e", "ł": "l", "ń": "n", "ó": "o", "ś": "s", "ź": "z", "ż": "z"}
PHRASE_FILLERS = frozenset({
    "na", "w", "we", "z", "ze", "do", "dla", "o", "u", "od", "po", "przy", "pod", "nad",
    "bez", "przez", "i", "oraz", "a", "albo", "lub", "czy", "sie", "jak",
})
MAX_FILLER_GAP = 2

_WORD = re.compile(r"[a-z0-9]+")


def stem(word: str) -> str:
    """Rdzeń słowa: do dwóch końcówek, bo „pozycjonowania" to „a" + „i"."""
    out = word
    for _ in range(2):
        for suffix in SUFFIXES:
            if out.endswith(suffix) and len(out) - len(suffix) >= STEM_MIN:
                out = out[: -len(suffix)]
                break
        else:
            break
    return out


#  Wymiany spółgłoskowe na końcu rdzenia: „fotowoltaika" → „w fotowoltaice",
#  „droga" → „na drodze". Bez tego naturalny miejscownik nie liczył się jako
#  pokrycie frazy i model dostawał sprzeczny sygnał (napisał poprawnie, a wynik
#  pokazywał brak). Zamiana tylko na samym końcu rdzenia i tylko gdy zostaje
#  co najmniej STEM_MIN znaków.
SOFT_ENDINGS = (("dz", "g"), ("sz", "ch"), ("c", "k"))


def soft(word: str) -> str:
    for ending, base in SOFT_ENDINGS:
        if word.endswith(ending) and len(word) - len(ending) + len(base) >= STEM_MIN:
            return word[: -len(ending)] + base
    return word


def fold(text: str) -> str:
    """Uproszczenie tekstu ZNAK W ZNAK – długość musi zostać ta sama, inaczej
    `phrase_variant` wycięłoby fragment obok trafienia."""
    out = []
    for character in text:
        lower = character.lower()
        if len(lower) != 1:  # np. „İ" – zamiana zmieniłaby długość, zostawiamy jak jest
            lower = character
        mapped = FOLD.get(lower, lower)
        out.append(mapped if _WORD.fullmatch(mapped) else " ")
    return "".join(out)


def tokens(text: str) -> list[dict]:
    """Słowa tekstu z pozycjami – pozycje służą do pokazania użytej odmiany."""
    return [
        {"stem": soft(stem(match.group(0))), "start": match.start(), "end": match.end()}
        for match in _WORD.finditer(fold(text))
    ]


def find_phrase(text: str, phrase: str) -> list[tuple[int, int]]:
    """Zakresy tekstu, w których stoi fraza (odmiana słów + przyimki, ten sam szyk)."""
    needle = [token["stem"] for token in tokens(phrase) if token["stem"] not in PHRASE_FILLERS]
    if not needle:
        return []
    hay = tokens(text)
    hits = []
    for i, token in enumerate(hay):
        if token["stem"] != needle[0]:
            continue
        last, ok = i, True
        for word in needle[1:]:
            j, gap = last + 1, 0
            while j < len(hay) and gap < MAX_FILLER_GAP and hay[j]["stem"] in PHRASE_FILLERS:
                j += 1
                gap += 1
            if j < len(hay) and hay[j]["stem"] == word:
                last = j
            else:
                ok = False
                break
        if ok:
            hits.append((token["start"], hay[last]["end"]))
    return hits


def has_phrase(text: str, phrase: str) -> bool:
    return bool(find_phrase(text, phrase))


def phrase_variant(text: str, phrase: str) -> str | None:
    """Odmiana frazy faktycznie użyta w tekście – do raportu w edytorze."""
    hits = find_phrase(text, phrase)
    if not hits:
        return None
    start, end = hits[0]
    return " ".join(text[start:end].split())


def coverage(text: str, phrases) -> dict:
    """Podział fraz na pokryte i brakujące + użyte odmiany."""
    covered, missing, variants = [], [], {}
    for phrase in phrases:
        if not (phrase or "").strip():
            continue
        variant = phrase_variant(text, phrase)
        if variant is None:
            missing.append(phrase)
        else:
            covered.append(phrase)
            variants[phrase] = variant
    total = len(covered) + len(missing)
    return {
        "covered": covered,
        "missing": missing,
        "variants": variants,
        "ratio": (len(covered) / total) if total else 1.0,
    }
