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
    return {
        "data_date": day,  # dzień, którego dotyczą metryki (lag GSC)
        "clicks": row.get("clicks", 0),
        "impressions": row.get("impressions", 0),
        "ctr": round(ctr * 100, 2) if isinstance(ctr, (int, float)) else None,
        "position": round(position, 1) if isinstance(position, (int, float)) else None,
        "queries": queries_count,
    }
