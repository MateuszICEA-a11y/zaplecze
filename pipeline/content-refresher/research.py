"""Research: frazy własne, SERP i frazy konkurencji.

Źródła (stan 2026-07-28 – Ahrefs wypadł z pipeline'u):
- Senuto Baza Słów Kluczowych (`keywords_analysis/reports/keywords/getKeywords`)
  – frazy dla konkretnego adresu, także cudzego. Jedno wywołanie przyjmuje
  listę URL-i, więc komplet konkurentów kosztuje jeden request.
- Senuto Analiza Widoczności (`visibility_analysis/reports/positions/getData`)
  – realne pozycje naszej domeny w polskiej bazie 2.0.
- SerpData (`api.serpdata.io/v1/search`) – żywy SERP Google PL: wyniki
  organiczne, AI Overview, People Also Ask i wyszukiwania powiązane.
- Search Console – realny popyt na nasz adres.

Gotcha Senuto: Baza Słów Kluczowych NIE obsługuje bazy 2.0 (`country_id` 200) –
tam obowiązuje `1`. Analiza Widoczności odwrotnie: 200 to baza z aplikacji.
"""
import json
import os
import time
import urllib.parse
import urllib.request
from datetime import date, timedelta

from config import (
    COMPETITOR_KEYWORDS_LIMIT,
    COMPETITOR_LIMIT,
    OWN_KEYWORDS_LIMIT,
    SENUTO_KEYWORDS_COUNTRY_ID,
    SERPDATA_TIMEOUT_S,
    USER_AGENT,
)

SENUTO_POSITIONS = "https://api.senuto.com/api/visibility_analysis/reports/positions/getData"
SENUTO_KEYWORDS = "https://api.senuto.com/api/keywords_analysis/reports/keywords/getKeywords"
SERPDATA_SEARCH = "https://api.serpdata.io/v1/search"


class ResearchError(RuntimeError):
    pass


def _request(url: str, headers: dict, data: bytes | None = None, timeout: int = 60) -> dict:
    request = urllib.request.Request(url, data=data, method="POST" if data else "GET")
    for key, value in headers.items():
        request.add_header(key, value)
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


def _senuto_token() -> str:
    token = os.environ.get("SENUTO_API_KEY", "").strip()
    if not token:
        raise ResearchError("brak SENUTO_API_KEY")
    return token


def _senuto_headers(token: str) -> dict:
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }


def keywords_for_urls(urls: list[str], match_mode: str = "narrow",
                      limit: int = OWN_KEYWORDS_LIMIT) -> list[dict]:
    """Frazy przypisane do podanych adresów (Senuto Baza Słów Kluczowych).

    Działa tak samo dla naszych i cudzych URL-i, a jedno wywołanie obsługuje
    całą listę – dlatego komplet konkurentów to jeden request, nie pięć.

    `narrow` zwraca frazy realnie związane z adresem; `wide` dokłada szerokie
    dopasowania (sonda 2026-07-28: dla dwóch URL-i o błędzie 403 wide dorzuciło
    frazy o UPO i e-deklaracjach), więc domyślnie trzymamy się `narrow`.
    """
    urls = [url for url in urls if url]
    if not urls:
        return []
    body = json.dumps({
        "offset": 0,
        "page": 1,
        "limit": min(max(limit, 1), 100),
        "filtering": [{"filters": []}],
        "parameters": [{"data_fetch_mode": "url", "value": urls}],
        "country_id": SENUTO_KEYWORDS_COUNTRY_ID,
        "match_mode": match_mode,
    }).encode()
    try:
        payload = _request(SENUTO_KEYWORDS, _senuto_headers(_senuto_token()), data=body)
    except ResearchError:
        raise
    except Exception as err:  # noqa: BLE001
        raise ResearchError(f"senuto keywords: {err}") from err
    rows = []
    for row in payload.get("data") or []:
        stats = row.get("statistics") or {}
        rows.append({
            "keyword": row.get("keyword"),
            "volume": row.get("searches"),
            "cpc": row.get("cpc"),
            "words": row.get("words_count"),
            # Snippety mówią, o jaki format wyniku gramy (featured, PAA, video).
            "snippets": sorted(set((stats.get("snippets") or {}).get("current") or [])),
        })
    rows.sort(key=lambda r: -(r.get("volume") or 0))
    return rows[:limit]


def own_keywords(url: str, limit: int = OWN_KEYWORDS_LIMIT) -> list[dict]:
    """Frazy, na które nasz adres jest widoczny – punkt wyjścia dla wytycznych."""
    return keywords_for_urls([url], match_mode="narrow", limit=limit)


def competitor_keywords(urls: list[str], limit: int = COMPETITOR_KEYWORDS_LIMIT) -> dict[str, list[dict]]:
    """Frazy konkurentów – jedno wywołanie na komplet adresów.

    Senuto zwraca wspólną pulę fraz bez przypisania do konkretnego URL-a, więc
    wynik to obraz całego zestawu konkurentów, nie ranking per strona. Do
    briefu to wystarcza: interesuje nas, czego my nie pokrywamy.
    """
    rows = keywords_for_urls(urls, match_mode="narrow", limit=limit)
    return {"keywords": rows, "urls": list(urls)}


def serp(keyword: str, own_domain: str, limit: int = COMPETITOR_LIMIT) -> dict:
    """Żywy SERP Google PL z SerpData: konkurenci, AI Overview, PAA, powiązane.

    Zwracamy jeden adres na domenę – dwie podstrony tego samego serwisu nie są
    dwoma punktami odniesienia.
    """
    token = os.environ.get("SERPDATA_API_KEY", "").strip()
    if not token:
        raise ResearchError("brak SERPDATA_API_KEY")
    query = urllib.parse.urlencode({
        "keyword": keyword, "hl": "pl", "gl": "pl",
        "snippets": "ai_overview,people_also_ask,related_searches",
    })
    payload = None
    last_error: Exception | None = None
    # SerpData bywa chwilowo niedostępne (503 „DataProxy service is unavailable")
    # – jedno zapytanie na zadanie, więc warto ponowić, zamiast wywalać research.
    for attempt in range(3):
        try:
            payload = _request(f"{SERPDATA_SEARCH}?{query}", {
                "Authorization": f"Bearer {token}",
                "Accept": "application/json",
                # Bez własnego User-Agenta SerpData odrzuca żądanie z 403
                # (domyślne „Python-urllib" nie przechodzi przez ich WAF).
                "User-Agent": USER_AGENT,
            }, timeout=SERPDATA_TIMEOUT_S)
            break
        except Exception as err:  # noqa: BLE001
            last_error = err
            if attempt < 2:
                time.sleep(3 * (attempt + 1))
    if payload is None:
        raise ResearchError(f"serpdata: {last_error}")

    results = ((payload.get("data") or {}).get("results")) or payload.get("results") or {}
    competitors = []
    seen_hosts = set()
    for row in results.get("organic_results") or []:
        url = row.get("url") or ""
        host = (row.get("domain") or urllib.parse.urlparse(url).netloc).removeprefix("www.")
        if not url or not host or own_domain.removeprefix("www.") in host or host in seen_hosts:
            continue
        seen_hosts.add(host)
        competitors.append({
            "position": row.get("pos") or row.get("global_pos") or len(competitors) + 1,
            "url": url,
            "title": row.get("title"),
            "description": row.get("description"),
        })
        if len(competitors) >= limit:
            break

    snippets = results.get("snippets") or {}
    return {
        "keyword": keyword,
        "competitors": competitors,
        "ai_overview": _ai_overview(snippets.get("ai_overview")),
        "people_also_ask": _paa(snippets.get("people_also_ask")),
        "related_searches": _related(snippets.get("related_searches")),
    }


def _ai_overview(block) -> dict | None:
    """AI Overview: sama treść i cytowane źródła – reszta struktury jest zmienna."""
    if not isinstance(block, dict):
        return None
    text = block.get("text") or block.get("content") or ""
    sources = []
    for item in block.get("sources") or block.get("references") or []:
        if isinstance(item, dict) and item.get("url"):
            sources.append({"url": item.get("url"), "title": item.get("title")})
    if not text and not sources:
        return None
    return {"text": str(text)[:2000], "sources": sources[:10]}


def _paa(block) -> list[str]:
    questions = block.get("questions") if isinstance(block, dict) else block
    out = []
    for item in questions or []:
        text = item.get("text") or item.get("question") if isinstance(item, dict) else item
        if text:
            out.append(str(text))
    return out[:15]


def _related(block) -> list[str]:
    queries = block.get("queries") if isinstance(block, dict) else block
    out = []
    for item in queries or []:
        text = item.get("query") or item.get("text") if isinstance(item, dict) else item
        if text:
            out.append(str(text))
    return out[:15]


def senuto_positions(domain: str, url: str, country_id: int = 200) -> list[dict]:
    """Pozycje z polskiej bazy Senuto przefiltrowane do jednego URL-a.

    Best-effort: wygasły token (JWT ~31 dni) albo brak danych nie może zatrzymać
    całego zadania – research ma wtedy o jedno źródło mniej.
    """
    token = os.environ.get("SENUTO_API_KEY", "").strip()
    if not token:
        return []
    path = urllib.parse.urlparse(url).path.rstrip("/")
    rows = []
    try:
        for page in range(1, 21):
            body = json.dumps({
                "domain": domain, "fetch_mode": "topLevelDomain",
                "country_id": country_id, "limit": 100, "page": page,
            }).encode()
            payload = _request(SENUTO_POSITIONS, _senuto_headers(token), data=body)
            batch = ((payload.get("data") or {}).get("data")) or payload.get("data") or []
            if not isinstance(batch, list) or not batch:
                break
            for row in batch:
                row_url = str(row.get("url") or "")
                if path and path in row_url:
                    rows.append({
                        "keyword": row.get("keyword"),
                        "position": row.get("position"),
                        "searches": row.get("searches"),
                    })
            if len(batch) < 100:
                break
    except Exception:  # noqa: BLE001 – patrz docstring
        return rows
    return sorted(rows, key=lambda r: (r.get("position") or 999))[:OWN_KEYWORDS_LIMIT]


def gsc_queries(site: str, url: str, days: int = 90) -> list[dict]:
    """Zapytania GSC dla konkretnej strony – realny popyt, nie estymacja.

    Reużywa uwierzytelnienia service accounta z collectora (`GSC_SERVICE_ACCOUNT_JSON`).
    """
    import sys
    from pathlib import Path

    sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "dashboard" / "collector"))
    try:
        from sources.gsc import _access_token  # noqa: PLC0415
    except Exception:  # noqa: BLE001
        return []
    try:
        token = _access_token(os.environ.get("GSC_SERVICE_ACCOUNT_JSON", "").strip())
    except Exception:  # noqa: BLE001
        return []
    end = date.today() - timedelta(days=2)  # GSC ma opóźnienie
    body = json.dumps({
        "startDate": (end - timedelta(days=days)).isoformat(),
        "endDate": end.isoformat(),
        "dimensions": ["query"],
        "dimensionFilterGroups": [{"filters": [{"dimension": "page", "operator": "equals", "expression": url}]}],
        "rowLimit": 50,
    }).encode()
    try:
        payload = _request(
            f"https://searchconsole.googleapis.com/webmasters/v3/sites/{urllib.parse.quote(site, safe='')}/searchAnalytics/query",
            {"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            data=body,
        )
    except Exception:  # noqa: BLE001
        return []
    return [{
        "query": (row.get("keys") or [""])[0],
        "clicks": row.get("clicks"),
        "impressions": row.get("impressions"),
        "position": round(row.get("position", 0), 1),
    } for row in payload.get("rows") or []]
