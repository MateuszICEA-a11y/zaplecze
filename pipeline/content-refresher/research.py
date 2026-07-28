"""Research: frazy własne, SERP i frazy konkurencji.

Źródła:
- Ahrefs API v3 – frazy per URL (`site-explorer/organic-keywords`) i SERP
  (`serp-overview`). Gotcha potwierdzona 2026-07-28: URL bez końcowego ukośnika
  zwraca pustą listę, bo Ahrefs trzyma adres w formie kanonicznej.
- Senuto – pozycje w polskiej bazie 2.0 (`country_id` 200; „1" to legacy 1.0).

Każde wywołanie zwraca też koszt w jednostkach, żeby budżet zadania był liczony
na podstawie realnego zużycia, nie szacunku.
"""
import json
import os
import urllib.parse
import urllib.request
from datetime import date, timedelta

from config import COMPETITOR_KEYWORDS_LIMIT, COMPETITOR_LIMIT, OWN_KEYWORDS_LIMIT

AHREFS_BASE = "https://api.ahrefs.com/v3"
SENUTO_POSITIONS = "https://api.senuto.com/api/visibility_analysis/reports/positions/getData"


class ResearchError(RuntimeError):
    pass


def canonical(url: str) -> str:
    """Ahrefs oczekuje adresu z końcowym ukośnikiem (poza plikami z rozszerzeniem)."""
    url = (url or "").strip()
    if not url or url.endswith("/"):
        return url
    tail = url.rsplit("/", 1)[-1]
    return url if "." in tail and "?" not in url else f"{url}/"


def _request(url: str, headers: dict, data: bytes | None = None, timeout: int = 60) -> dict:
    request = urllib.request.Request(url, data=data, method="POST" if data else "GET")
    for key, value in headers.items():
        request.add_header(key, value)
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


def _ahrefs(path: str, params: dict) -> tuple[dict, int]:
    token = os.environ.get("AHREFS_API_KEY", "").strip()
    if not token:
        raise ResearchError("brak AHREFS_API_KEY")
    query = urllib.parse.urlencode({k: v for k, v in params.items() if v not in (None, "")})
    try:
        payload = _request(f"{AHREFS_BASE}/{path}?{query}",
                           {"Authorization": f"Bearer {token}", "Accept": "application/json"})
    except Exception as err:  # noqa: BLE001
        raise ResearchError(f"ahrefs {path}: {err}") from err
    units = 0
    costs = payload.get("apiUsageCosts") if isinstance(payload, dict) else None
    if isinstance(costs, dict):
        units = int(costs.get("units-cost-total-actual") or costs.get("units-cost-total") or 0)
    return payload, units


def own_keywords(url: str, country: str = "pl", limit: int = OWN_KEYWORDS_LIMIT) -> tuple[list[dict], int]:
    """Frazy, na które URL już rankuje – punkt wyjścia dla wytycznych."""
    payload, units = _ahrefs("site-explorer/organic-keywords", {
        "target": canonical(url),
        "mode": "exact",
        "country": country,
        "date": date.today().isoformat(),
        "select": "keyword,best_position,volume,keyword_difficulty,sum_traffic",
        "order_by": "volume:desc",
        "limit": limit,
    })
    return payload.get("keywords") or [], units


def serp_competitors(keyword: str, own_domain: str, country: str = "pl",
                     limit: int = COMPETITOR_LIMIT) -> tuple[list[dict], int]:
    """Najlepiej rankujące adresy dla frazy, z pominięciem własnej domeny."""
    payload, units = _ahrefs("serp-overview/serp-overview", {
        "keyword": keyword,
        "country": country,
        "date": date.today().isoformat(),
        "select": "position,url,title,domain_rating,traffic",
        "top_positions": 10,
    })
    rows = payload.get("positions") or payload.get("serp_overview") or []
    out = []
    # Odpowiedź zawiera bloki SERP (wiersze bez adresu) i powtórzenia tego
    # samego adresu na kilku pozycjach – bierzemy jeden URL na domenę.
    seen_hosts = set()
    for row in sorted(rows, key=lambda r: (r.get("position") or 99)):
        url = row.get("url") or ""
        if not url or own_domain in url:
            continue
        host = urllib.parse.urlparse(url).netloc.removeprefix("www.")
        if host in seen_hosts:
            continue
        seen_hosts.add(host)
        out.append({
            "position": row.get("position"),
            "url": url,
            "title": row.get("title"),
            "domain_rating": row.get("domain_rating"),
            "traffic": row.get("traffic"),
        })
        if len(out) >= limit:
            break
    return out, units


def competitor_keywords(url: str, country: str = "pl",
                        limit: int = COMPETITOR_KEYWORDS_LIMIT) -> tuple[list[dict], int]:
    payload, units = _ahrefs("site-explorer/organic-keywords", {
        "target": canonical(url),
        "mode": "exact",
        "country": country,
        "date": date.today().isoformat(),
        "select": "keyword,best_position,volume,keyword_difficulty",
        "order_by": "volume:desc",
        "limit": limit,
    })
    return payload.get("keywords") or [], units


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
            payload = _request(SENUTO_POSITIONS, {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            }, data=body)
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
