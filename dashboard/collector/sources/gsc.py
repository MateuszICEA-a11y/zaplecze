"""Google Search Console – kliknięcia, wyświetlenia, CTR, pozycja, liczba fraz.

Auth: service account (JSON w env GSC_SERVICE_ACCOUNT_JSON), scope webmasters.readonly.
Konto serwisowe musi być dodane jako użytkownik usługi w GSC (Pełny/Ograniczony).
Dane GSC mają ~2-3 dni opóźnienia – pobieramy pełny dzień sprzed DATA_LAG_DAYS.
"""
import json
import urllib.parse
from datetime import datetime, timedelta, timezone

from . import SourceError
from ._http import classify_http_error, request_json

API_BASE = "https://searchconsole.googleapis.com/webmasters/v3/sites"
SCOPE = "https://www.googleapis.com/auth/webmasters.readonly"
DATA_LAG_DAYS = 3
QUERY_ROW_LIMIT = 25000
DETAILS_WINDOW_DAYS = 28  # okno dla list fraz/stron w details.json
DETAILS_ROW_LIMIT = 200


def _rows_to_details(rows: list[dict]) -> list[dict]:
    out = []
    for row in rows:
        ctr = row.get("ctr")
        position = row.get("position")
        out.append({
            "key": (row.get("keys") or [""])[0],
            "clicks": row.get("clicks", 0),
            "impressions": row.get("impressions", 0),
            "ctr": round(ctr * 100, 2) if isinstance(ctr, (int, float)) else None,
            "position": round(position, 1) if isinstance(position, (int, float)) else None,
        })
    return out


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
        raise SourceError("not_configured", "gsc: brak GSC_SERVICE_ACCOUNT_JSON w env")

    try:
        token = _access_token(sa_json)
    except Exception as err:  # noqa: BLE001 – zły JSON / odrzucony grant
        raise SourceError("token_expired", f"gsc: autoryzacja service account nie powiodła się ({err})") from err

    site = cfg.get("site") or f"sc-domain:{cfg.get('domain')}"
    endpoint = f"{API_BASE}/{urllib.parse.quote(site, safe='')}/searchAnalytics/query"
    day = (datetime.now(timezone.utc) - timedelta(days=DATA_LAG_DAYS)).strftime("%Y-%m-%d")
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    def query(body: dict) -> dict:
        try:
            return request_json(endpoint, data=json.dumps(body).encode(), headers=headers)
        except Exception as err:  # noqa: BLE001
            raise classify_http_error(err, "gsc") from err

    totals = query({"startDate": day, "endDate": day})
    row = (totals.get("rows") or [{}])[0]

    by_query = query({
        "startDate": day,
        "endDate": day,
        "dimensions": ["query"],
        "rowLimit": QUERY_ROW_LIMIT,
    })
    queries_count = len(by_query.get("rows") or [])

    position = row.get("position")
    ctr = row.get("ctr")
    summary = {
        "data_date": day,  # dzień, którego dotyczą metryki (lag GSC)
        "clicks": row.get("clicks", 0),
        "impressions": row.get("impressions", 0),
        "ctr": round(ctr * 100, 2) if isinstance(ctr, (int, float)) else None,
        "position": round(position, 1) if isinstance(position, (int, float)) else None,
        "queries": queries_count,
    }

    # Listy do details.json: top frazy i strony z okna 28 dni (dzienne listy
    # na małym serwisie są zbyt rzadkie, żeby coś pokazać).
    window_start = (datetime.now(timezone.utc)
                    - timedelta(days=DATA_LAG_DAYS + DETAILS_WINDOW_DAYS)).strftime("%Y-%m-%d")
    details = {"window": {"start": window_start, "end": day}}
    for dimension, key in (("query", "queries"), ("page", "pages")):
        try:
            resp = query({
                "startDate": window_start,
                "endDate": day,
                "dimensions": [dimension],
                "rowLimit": DETAILS_ROW_LIMIT,
            })
            details[key] = _rows_to_details(resp.get("rows") or [])
        except SourceError:
            details[key] = []

    return {"summary": summary, "details": details}
