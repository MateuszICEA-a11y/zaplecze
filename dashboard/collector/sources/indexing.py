"""Indeksacja top stron – GSC URL Inspection API (panel „Matrix").

Auth: service account jak GSC (scope webmasters). Pełny raport Index Coverage
nie ma API, więc sprawdzamy per URL: bierzemy top TOP_PAGES stron wg kliknięć
z ostatnich 30 dni (searchanalytics) i odpytujemy urlInspection/index:inspect.
Kwoty: 2000 inspekcji/dzień/property, 600/min – top 50 dziennie to margines.

Summary: liczba sprawdzonych / zaindeksowanych / niezaindeksowanych.
Details: per URL – werdykt, coverage state, ostatni crawl + metryki GSC 30 dni.
"""
import json
import time
import urllib.parse
from datetime import datetime, timedelta, timezone

from . import SourceError
from ._http import classify_http_error, request_json

SEARCH_API = "https://searchconsole.googleapis.com/webmasters/v3/sites"
INSPECT_API = "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect"
SCOPE = "https://www.googleapis.com/auth/webmasters"
DATA_LAG_DAYS = 3
WINDOW_DAYS = 30
TOP_PAGES = 50


def _access_token(sa_json: str) -> str:
    from google.auth.transport.requests import Request
    from google.oauth2 import service_account

    info = json.loads(sa_json)
    creds = service_account.Credentials.from_service_account_info(info, scopes=[SCOPE])
    creds.refresh(Request())
    return creds.token


def fetch(cfg: dict, env: dict) -> dict:
    sa_json = env.get("GSC_SERVICE_ACCOUNT_JSON", "").strip()
    if not sa_json:
        raise SourceError("not_configured", "indexing: brak GSC_SERVICE_ACCOUNT_JSON w env")
    site = cfg.get("site")
    if not site:
        raise SourceError("not_configured", "indexing: brak site w domains.yaml (sekcja indexing)")

    try:
        token = _access_token(sa_json)
    except Exception as err:  # noqa: BLE001
        raise SourceError("token_expired",
                          f"indexing: autoryzacja service account nie powiodła się ({err})") from err
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    # Top strony wg kliknięć z 30 dni (te same okno co tabela GSC „30 dni").
    end = (datetime.now(timezone.utc) - timedelta(days=DATA_LAG_DAYS)).strftime("%Y-%m-%d")
    start = (datetime.now(timezone.utc)
             - timedelta(days=DATA_LAG_DAYS + WINDOW_DAYS - 1)).strftime("%Y-%m-%d")
    endpoint = f"{SEARCH_API}/{urllib.parse.quote(site, safe='')}/searchAnalytics/query"
    try:
        resp = request_json(endpoint, data=json.dumps({
            "startDate": start,
            "endDate": end,
            "dimensions": ["page"],
            "rowLimit": TOP_PAGES,
        }).encode(), headers=headers)
    except Exception as err:  # noqa: BLE001
        raise classify_http_error(err, "indexing") from err

    pages = []
    for row in resp.get("rows") or []:
        url = (row.get("keys") or [None])[0]
        if not url:
            continue
        ctr = row.get("ctr")
        position = row.get("position")
        pages.append({
            "url": url,
            "clicks": row.get("clicks", 0),
            "impressions": row.get("impressions", 0),
            "ctr": round(ctr * 100, 2) if isinstance(ctr, (int, float)) else None,
            "position": round(position, 1) if isinstance(position, (int, float)) else None,
        })

    rows = []
    indexed = 0
    for page in pages:
        try:
            result = request_json(INSPECT_API, data=json.dumps({
                "inspectionUrl": page["url"],
                "siteUrl": site,
            }).encode(), headers=headers)
        except Exception as err:  # noqa: BLE001
            raise classify_http_error(err, "indexing") from err
        status = ((result.get("inspectionResult") or {}).get("indexStatusResult") or {})
        verdict = status.get("verdict")
        is_indexed = verdict == "PASS"
        indexed += 1 if is_indexed else 0
        rows.append({
            **page,
            "indexed": is_indexed,
            "verdict": verdict,
            "coverage_state": status.get("coverageState"),
            "last_crawl": (status.get("lastCrawlTime") or "")[:10] or None,
        })
        time.sleep(0.15)  # kwoty: 600/min – zostawiamy zapas

    summary = {
        "window": {"start": start, "end": end},
        "pages_checked": len(rows),
        "indexed": indexed,
        "not_indexed": len(rows) - indexed,
    }
    return {"summary": summary, "details": {"window": {"start": start, "end": end}, "rows": rows}}
