"""Potencjał wpisów konkurencji z Senuto – ranking raz w tygodniu, szacunek dla młodych wpisów.

Ranking: pełna lista fraz domeny konkurenta (Analiza Widoczności, positions/getData).
Senuto liczy jedno zapytanie na domenę na dobę, nie na adres, więc całość to kilka
zapytań tygodniowo. Frazy agregujemy per URL do `rank`:
- traffic – suma visibility, czyli szacowany miesięczny ruch z pozycji w TOP10,
- keywords / top10 – liczba fraz adresu i ile z nich w TOP10,
- keyword / position – fraza, która daje najwięcej ruchu (bez ruchu – największa),
- demand – suma wyszukiwań 10 największych fraz adresu z pozycji 1–20 (popyt tematu;
  ogólne frazy, na które wpis wisi na 40. miejscu, zawyżały go setki razy).
Wiersze z breadcrumbem („delante.pl › Blog › …”) zamiast adresu pomijamy – Senuto
ostrzega, że dopasowanie ich do adresu trafia w ~20%.

Szacunek (`estimate`) dla wpisów do 90 dni od publikacji, które nie mają jeszcze
frazy w TOP10 – zero w Senuto nie znaczy tam „brak potencjału”, tylko „za wcześnie”.
Model wyciąga z tytułu frazę główną i szerszą, Baza Słów Kluczowych (getKeywords,
jedno zapytanie na frazę) zwraca je z powiązanymi; demand = suma 10 największych
fraz zawierających wszystkie słowa frazy (dopasowanie „narrow” Senuto dokłada też
niepowiązane – „qwen3.8-max” dawało 2 mln). Wąska fraza bez danych → szersza
(co najmniej 2 słowa – samo „seo” czy „gemini” to kategoria, nie potencjał wpisu).
Bez szacunku dla newsów, wpisów firmowych i ofert: „Wandalizm w Mapach Google”
dostawał popyt „mapy google” (6 mln), a potencjał newsa i tak wygasa po tygodniu.
Liczony raz na wpis.
"""
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta

from ._http import DEFAULT_HEADERS
from .competitor_kind import MODEL, item_text

POSITIONS_ENDPOINT = "https://api.senuto.com/api/visibility_analysis/reports/positions/getData"
KEYWORDS_ENDPOINT = "https://api.senuto.com/api/keywords_analysis/reports/keywords/getKeywords"
POSITIONS_COUNTRY_ID = 200  # baza 2.0 – ta sama co w app.senuto.com
KEYWORDS_COUNTRY_ID = 1  # Baza Słów Kluczowych nie zna bazy 2.0
RANK_EVERY_DAYS = 7
YOUNG_DAYS = 90
DEMAND_TOP = 10
DEMAND_MAX_POSITION = 20
PAGE_LIMIT = 100
MAX_PAGES = 500  # 50 tys. fraz na domenę – delante.pl ma ~7 tys.
ESTIMATE_LIMIT = 80  # szacunków na przebieg (1 zapytanie Senuto + ułamek wywołania modelu każdy)
PHRASE_BATCH = 40
TIMEOUT_S = 60


def url_key(url: str) -> str | None:
    """Wspólny klucz adresu z sitemapy i z Senuto: bez schematu, www, parametrów i końcowego /."""
    if not url or "›" in url or " " in url.strip():
        return None
    if "://" not in url:
        url = "https://" + url
    parts = urllib.parse.urlsplit(url.strip())
    host = parts.netloc.lower().removeprefix("www.")
    if not host:
        return None
    return host + (parts.path.rstrip("/") or "")


def _post(url: str, body: dict, token: str) -> dict:
    req = urllib.request.Request(url, data=json.dumps(body).encode(), method="POST", headers={
        **DEFAULT_HEADERS, "Authorization": f"Bearer {token}",
        "Content-Type": "application/json", "Accept": "application/json",
    })
    with urllib.request.urlopen(req, timeout=TIMEOUT_S) as resp:
        return json.loads(resp.read().decode("utf-8"))


def site_scope(site: dict) -> tuple[str, str]:
    """(domena lub ścieżka, fetch_mode). `senuto: host/blog` w domains.yaml zawęża do katalogu."""
    scope = site.get("senuto")
    if scope:
        return scope, "catalog"
    return site["host"].removeprefix("www."), "topLevelDomain"


def positions(scope: str, fetch_mode: str, token: str) -> list[dict]:
    """Wszystkie frazy domeny (albo katalogu) z adresem, pozycją, wolumenem i ruchem."""
    rows, page = [], 1
    while page <= MAX_PAGES:
        resp = _post(POSITIONS_ENDPOINT, {"domain": scope, "fetch_mode": fetch_mode,
                                          "country_id": POSITIONS_COUNTRY_ID, "limit": PAGE_LIMIT, "page": page}, token)
        if not resp.get("success"):
            raise ValueError(f"Senuto bez success=true (strona {page})")
        for row in resp.get("data") or []:
            stats = row.get("statistics") or {}
            rows.append({
                "keyword": row.get("keyword"),
                "position": (stats.get("position") or {}).get("current"),
                "searches": (stats.get("searches") or {}).get("current") or 0,
                "visibility": (stats.get("visibility") or {}).get("current") or 0,
                "url": (stats.get("url") or {}).get("current") or "",
            })
        if not (resp.get("pagination") or {}).get("has_next_page"):
            break
        page += 1
        time.sleep(0.25)
    return rows


def aggregate(rows: list[dict]) -> dict[str, dict]:
    """Frazy → `rank` per klucz adresu (patrz docstring modułu)."""
    by_url: dict[str, list[dict]] = {}
    for row in rows:
        key = url_key(row["url"])
        if key and isinstance(row.get("position"), int):
            by_url.setdefault(key, []).append(row)
    out = {}
    for key, group in by_url.items():
        main = max(group, key=lambda r: (r["visibility"], r["searches"]))
        biggest = sorted((r["searches"] for r in group if r["position"] <= DEMAND_MAX_POSITION), reverse=True)[:DEMAND_TOP]
        out[key] = {
            "traffic": round(sum(r["visibility"] for r in group), 1),
            "keywords": len(group),
            "top10": sum(1 for r in group if r["position"] <= 10),
            "keyword": main["keyword"],
            "position": main["position"],
            "demand": sum(biggest),
        }
    return out


def rankings_due(meta: dict | None, now: datetime) -> bool:
    try:
        last = datetime.strptime((meta or {}).get("fetched_at") or "", "%Y-%m-%d")
    except ValueError:
        return True
    return now.replace(tzinfo=None) - last >= timedelta(days=RANK_EVERY_DAYS)


def refresh_rankings(items: list[dict], sites: list[dict], token: str, now: datetime, log=print) -> dict:
    """Ustawia `rank` na wpisach; konkurent z błędem Senuto zachowuje poprzednie dane."""
    today = now.strftime("%Y-%m-%d")
    status = {}
    for site in sites:
        host = site["host"]
        scope, mode = site_scope(site)
        try:
            ranked = aggregate(positions(scope, mode, token))
        except Exception as err:  # noqa: BLE001 – jeden konkurent nie wywraca reszty
            status[host] = {"status": "error", "error": str(err)[:200]}
            log(f"  [competitors] senuto {host}: {err}")
            continue
        matched = 0
        for item in items:
            if item["host"] != host:
                continue
            rank = ranked.get(url_key(item["url"]))
            matched += 1 if rank else 0
            item["rank"] = {**(rank or {"traffic": 0, "keywords": 0, "top10": 0, "demand": 0}), "at": today}
        status[host] = {"status": "ok", "urls": len(ranked), "matched": matched}
    return status


PHRASE_PROMPT = """Dla każdego wpisu z bloga agencji marketingowej podaj dwie frazy, które ludzie
naprawdę wpisują w Google, szukając takiego tekstu:
- phrase – fraza główna tematu, 1–4 słowa,
- broad – szersza, popularniejsza fraza tego samego tematu, 2–3 słowa; nadal konkretny temat,
  nigdy sama kategoria ani marka („seo”, „google”, „ai”, „gemini”).
Małe litery, polskie znaki, bez nazwy serwisu, roku, miesiąca i numerów wersji; bez słów typu
„poradnik”, „jak”, „co to jest”, chyba że są istotą zapytania. Nie sklejaj kilku wątków w jedną frazę.
Przykłady:
„AI Content Gap – jak sprawdzić, gdzie AI poleca konkurencję” → {"phrase": "content gap", "broad": "analiza konkurencji"}
„Konkurencja na urlopie? 5 działań SEO na sierpień” → {"phrase": "działania seo", "broad": "strategia seo"}
„Jak ustawić własny H1 w Shoper” → {"phrase": "h1 shoper", "broad": "nagłówek h1"}
Odpowiedz wyłącznie JSON-em: {"items": [{"i": 1, "phrase": "...", "broad": "..."}]}.

"""


def _clean_phrase(value) -> str | None:
    phrase = re.sub(r"\s+", " ", str(value or "")).strip().lower()
    return phrase if 0 < len(phrase) <= 80 else None


def phrases(api_key: str, batch: list[dict]) -> dict[int, list[str]]:
    """Numer wpisu → [fraza główna, szersza] (bez duplikatów i pustych)."""
    lines = "\n".join(f"{n}. {item_text(item)}" for n, item in enumerate(batch, 1))
    body = json.dumps({
        "model": MODEL,
        "messages": [{"role": "user", "content": PHRASE_PROMPT + lines}],
        "response_format": {"type": "json_object"},
        "temperature": 0,
        "reasoning": {"effort": "minimal", "exclude": True},
        "max_tokens": 4000,
    }).encode("utf-8")
    req = urllib.request.Request("https://openrouter.ai/api/v1/chat/completions", data=body, headers={
        **DEFAULT_HEADERS, "Content-Type": "application/json", "Authorization": f"Bearer {api_key}",
        "X-Title": "zaplecze-dashboard competitor phrases"})
    with urllib.request.urlopen(req, timeout=120) as resp:
        content = json.loads(resp.read().decode("utf-8"))["choices"][0]["message"]["content"] or ""
    content = re.sub(r"^```(?:json)?\s*|\s*```$", "", content.strip())
    out = {}
    for row in json.loads(content).get("items", []):
        try:
            index = int(row.get("i"))
        except (TypeError, ValueError):
            continue
        broad = _clean_phrase(row.get("broad"))
        broad = broad if broad and len(broad.split()) >= 2 else None
        found = [p for p in (_clean_phrase(row.get("phrase")), broad) if p]
        if 1 <= index <= len(batch) and found:
            out[index] = list(dict.fromkeys(found))
    return out


def related(phrase: str, keyword: str) -> bool:
    """Fraza z Senuto zawiera każde słowo frazy głównej (jako fragment – „sklepu” pasuje do „sklep”
    tylko w tę stronę, więc liczymy od rdzenia: słowo bez 2 ostatnich liter, gdy ma ich > 5)."""
    keyword = keyword.lower()
    return all((word[:-2] if len(word) > 5 else word) in keyword for word in phrase.split())


def phrase_demand(phrase: str, token: str) -> dict:
    """Fraza z powiązanymi (Baza Słów Kluczowych, dopasowanie narrow) → wolumen i popyt."""
    resp = _post(KEYWORDS_ENDPOINT, {
        "offset": 0, "page": 1, "limit": 50, "filtering": [{"filters": []}],
        "parameters": [{"data_fetch_mode": "keyword", "value": [phrase]}],
        "country_id": KEYWORDS_COUNTRY_ID, "match_mode": "narrow",
    }, token)
    rows = [row for row in resp.get("data") or [] if related(phrase, row.get("keyword") or "")]
    volumes = sorted((row.get("searches") or 0 for row in rows), reverse=True)[:DEMAND_TOP]
    exact = next((row.get("searches") for row in rows if (row.get("keyword") or "").lower() == phrase), None)
    return {"searches": exact, "demand": sum(volumes), "related": len(rows)}


def is_young(item: dict, now: datetime) -> bool:
    born = item.get("published") or (None if item.get("baseline") else item.get("first_seen"))
    if not born:
        return False
    cutoff = (now - timedelta(days=YOUNG_DAYS)).strftime("%Y-%m-%d")
    return born >= cutoff


NO_ESTIMATE_KINDS = ("news", "firmowe", "oferta")


def needs_estimate(item: dict, now: datetime) -> bool:
    if item.get("estimate") or item.get("kind") in NO_ESTIMATE_KINDS or not is_young(item, now):
        return False
    return not (item.get("rank") or {}).get("top10")


def estimate_young(items: list[dict], token: str, api_key: str, now: datetime,
                   limit: int = ESTIMATE_LIMIT, log=print) -> dict:
    todo = [item for item in items if needs_estimate(item, now)][:limit]
    stats = {"todo": len(todo), "estimated": 0, "failed": 0}
    today = now.strftime("%Y-%m-%d")
    for start in range(0, len(todo), PHRASE_BATCH):
        batch = todo[start:start + PHRASE_BATCH]
        try:
            found = phrases(api_key, batch)
        except Exception as err:  # noqa: BLE001 – bez frazy nie ma szacunku, reszta przebiegu idzie dalej
            log(f"  [competitors] frazy główne: {str(err)[:160]}")
            stats["failed"] += len(batch)
            continue
        for index, item in enumerate(batch, 1):
            candidates = found.get(index)
            if not candidates:
                stats["failed"] += 1
                continue
            try:
                # Wąska fraza bez danych w bazie → szersza (najwyżej dwa zapytania na wpis).
                for phrase in candidates:
                    demand = phrase_demand(phrase, token)
                    time.sleep(0.25)
                    if demand["related"]:
                        break
                item["estimate"] = {"phrase": phrase, **demand, "at": today}
                stats["estimated"] += 1
            except Exception as err:  # noqa: BLE001
                log(f"  [competitors] senuto „{candidates[0]}”: {str(err)[:160]}")
                stats["failed"] += 1
    return stats


def update(items: list[dict], sites: list[dict], meta: dict | None, env, now: datetime, log=print) -> tuple[dict, dict]:
    """Ranking (co tydzień) i szacunki. Zwraca (meta do pliku, liczniki do podsumowania)."""
    meta = dict(meta or {})
    token = (env.get("SENUTO_API_KEY") or "").strip()
    if not token:
        return meta, {"skipped": "brak SENUTO_API_KEY"}
    stats = {}
    if rankings_due(meta, now):
        meta["sites"] = refresh_rankings(items, sites, token, now, log=log)
        if any(row["status"] == "ok" for row in meta["sites"].values()):
            meta["fetched_at"] = now.strftime("%Y-%m-%d")
        stats["rankings"] = meta["sites"]
    api_key = (env.get("OPENROUTER_API_KEY") or "").strip()
    if api_key:
        stats["estimates"] = estimate_young(items, token, api_key, now, log=log)
    return meta, stats
