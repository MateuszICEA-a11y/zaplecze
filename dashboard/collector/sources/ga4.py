"""Google Analytics 4 – Data API (runReport), dane za wczoraj.

Auth: ten sam service account co GSC (GSC_SERVICE_ACCOUNT_JSON), scope
analytics.readonly. Wymaga: (1) dodania e-maila service accounta jako
przeglądającego w GA4 (Administracja → Zarządzanie dostępem do usługi),
(2) property_id w domains.yaml (Administracja → Szczegóły usługi).
Summary: sesje/użytkownicy/odsłony/sesje organiczne; details: kanały,
źródła sesji, top strony.
"""
import json
from datetime import datetime, timedelta, timezone

from . import SourceError
from ._http import classify_http_error, request_json

API = "https://analyticsdata.googleapis.com/v1beta/properties"
SCOPE = "https://www.googleapis.com/auth/analytics.readonly"
TOP_ROWS = 50


def _access_token(sa_json: str) -> str:
    from google.auth.transport.requests import Request
    from google.oauth2 import service_account

    info = json.loads(sa_json)
    creds = service_account.Credentials.from_service_account_info(info, scopes=[SCOPE])
    creds.refresh(Request())
    return creds.token


def _run_report(token: str, property_id: str, body: dict) -> dict:
    try:
        return request_json(f"{API}/{property_id}:runReport",
                            data=json.dumps(body).encode(),
                            headers={"Authorization": f"Bearer {token}",
                                     "Content-Type": "application/json"})
    except Exception as err:  # noqa: BLE001
        raise classify_http_error(err, "ga4") from err


def _rows(resp: dict, dim_count: int = 1) -> list[tuple]:
    out = []
    for row in resp.get("rows") or []:
        dims = [d.get("value") for d in (row.get("dimensionValues") or [])][:dim_count]
        metrics = [m.get("value") for m in (row.get("metricValues") or [])]
        out.append((*dims, *metrics))
    return out


def _to_int(value) -> int:
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return 0


def fetch(cfg: dict, env: dict) -> dict:
    sa_json = env.get("GSC_SERVICE_ACCOUNT_JSON", "").strip()
    if not sa_json:
        raise SourceError("not_configured", "ga4: brak GSC_SERVICE_ACCOUNT_JSON w env")
    property_id = str(cfg.get("property_id") or "").strip()
    if not property_id:
        raise SourceError("not_configured",
                          "ga4: brak property_id w domains.yaml (GA4 → Administracja → Szczegóły usługi)")

    try:
        token = _access_token(sa_json)
    except Exception as err:  # noqa: BLE001
        raise SourceError("token_expired", f"ga4: autoryzacja service account nie powiodła się ({err})") from err

    day = (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%Y-%m-%d")
    date_range = [{"startDate": day, "endDate": day}]

    channels_resp = _run_report(token, property_id, {
        "dateRanges": date_range,
        "dimensions": [{"name": "sessionDefaultChannelGroup"}],
        "metrics": [{"name": "sessions"}, {"name": "activeUsers"}, {"name": "screenPageViews"}],
        "limit": TOP_ROWS,
    })
    channels = [{"channel": c, "sessions": _to_int(s), "users": _to_int(u), "pageviews": _to_int(p)}
                for c, s, u, p in _rows(channels_resp)]
    channels.sort(key=lambda r: -r["sessions"])

    sources_resp = _run_report(token, property_id, {
        "dateRanges": date_range,
        "dimensions": [{"name": "sessionSource"}],
        "metrics": [{"name": "sessions"}, {"name": "activeUsers"}],
        "limit": TOP_ROWS,
        "orderBys": [{"metric": {"metricName": "sessions"}, "desc": True}],
    })
    sources = [{"source": s, "sessions": _to_int(se), "users": _to_int(u)}
               for s, se, u in _rows(sources_resp)]

    pages_resp = _run_report(token, property_id, {
        "dateRanges": date_range,
        "dimensions": [{"name": "pagePath"}],
        "metrics": [{"name": "screenPageViews"}, {"name": "activeUsers"}],
        "limit": TOP_ROWS,
        "orderBys": [{"metric": {"metricName": "screenPageViews"}, "desc": True}],
    })
    pages = [{"path": p, "pageviews": _to_int(v), "users": _to_int(u)}
             for p, v, u in _rows(pages_resp)]

    summary = {
        "data_date": day,
        "sessions": sum(c["sessions"] for c in channels),
        "active_users": sum(c["users"] for c in channels),
        "pageviews": sum(c["pageviews"] for c in channels),
        "organic_sessions": next((c["sessions"] for c in channels
                                  if c["channel"] == "Organic Search"), 0),
    }
    return {"summary": summary,
            "details": {"channels": channels, "sources": sources, "pages": pages}}
