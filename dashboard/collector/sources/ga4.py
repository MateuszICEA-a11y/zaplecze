"""Google Analytics 4 – Data API (runReport).

Auth: ten sam service account co GSC (GSC_SERVICE_ACCOUNT_JSON), scope
analytics.readonly. Wymaga: (1) dodania e-maila service accounta jako
przeglądającego w GA4, (2) property_id albo measurement_id w domains.yaml
(measurement_id → property_id rozwiązywane przez Admin API).

Summary (dzienne, do snapshotów/wykresów): sesje, użytkownicy (nowi/powracający),
odsłony, sesje organiczne, engagement rate, śr. czas zaangażowania, strony/sesję.
Details: kanały (dzień), źródła, top strony, landing pages z zaangażowaniem (28 dni),
trend miesięczny łącznie i per kanał (25 miesięcy – dla porównań r/r).
"""
import json
from datetime import datetime, timedelta, timezone

from . import SourceError
from ._http import classify_http_error, request_json

API = "https://analyticsdata.googleapis.com/v1beta/properties"
ADMIN_API = "https://analyticsadmin.googleapis.com/v1beta"
SCOPE = "https://www.googleapis.com/auth/analytics.readonly"
TOP_ROWS = 50
LANDING_WINDOW_DAYS = 28
MONTHLY_MONTHS = 25  # ~2 lata + bieżący, wystarcza na r/r i sezonowość


def _access_token(sa_json: str) -> str:
    from google.auth.transport.requests import Request
    from google.oauth2 import service_account

    info = json.loads(sa_json)
    creds = service_account.Credentials.from_service_account_info(info, scopes=[SCOPE])
    creds.refresh(Request())
    return creds.token


def _resolve_property(token: str, measurement_id: str) -> str:
    """measurement_id (G-XXXX) → property_id przez Admin API (accountSummaries
    + dataStreams). Wymaga dostępu service accounta do usługi GA4."""
    headers = {"Authorization": f"Bearer {token}"}
    try:
        summaries = request_json(f"{ADMIN_API}/accountSummaries?pageSize=200", headers=headers)
        for account in summaries.get("accountSummaries") or []:
            for prop in account.get("propertySummaries") or []:
                pid = (prop.get("property") or "").split("/")[-1]
                streams = request_json(f"{ADMIN_API}/properties/{pid}/dataStreams", headers=headers)
                for stream in streams.get("dataStreams") or []:
                    if (stream.get("webStreamData") or {}).get("measurementId") == measurement_id:
                        return pid
    except Exception as err:  # noqa: BLE001
        raise classify_http_error(err, "ga4") from err
    raise SourceError("not_configured",
                      f"ga4: service account nie widzi usługi ze strumieniem {measurement_id} "
                      "– dodaj go jako przeglądającego w GA4 (Zarządzanie dostępem do usługi)")


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


def _to_float(value) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def fetch(cfg: dict, env: dict) -> dict:
    sa_json = env.get("GSC_SERVICE_ACCOUNT_JSON", "").strip()
    if not sa_json:
        raise SourceError("not_configured", "ga4: brak GSC_SERVICE_ACCOUNT_JSON w env")
    property_id = str(cfg.get("property_id") or "").strip()
    measurement_id = str(cfg.get("measurement_id") or "").strip()
    if not property_id and not measurement_id:
        raise SourceError("not_configured",
                          "ga4: brak property_id lub measurement_id w domains.yaml")

    try:
        token = _access_token(sa_json)
    except Exception as err:  # noqa: BLE001
        raise SourceError("token_expired", f"ga4: autoryzacja service account nie powiodła się ({err})") from err

    if not property_id:
        property_id = _resolve_property(token, measurement_id)

    today = datetime.now(timezone.utc).date()
    day = (today - timedelta(days=1)).strftime("%Y-%m-%d")
    day_range = [{"startDate": day, "endDate": day}]

    # --- Summary: metryki całościowe za wczoraj (w tym zaangażowanie). ---
    totals = _run_report(token, property_id, {
        "dateRanges": day_range,
        "metrics": [{"name": m} for m in (
            "sessions", "activeUsers", "newUsers", "screenPageViews",
            "engagementRate", "userEngagementDuration", "engagedSessions")],
    })
    t = ([_to_float(m.get("value")) for m in (totals.get("rows") or [{}])[0].get("metricValues") or []]
         + [0.0] * 7)[:7]
    sessions, users, new_users, pageviews, eng_rate, eng_duration, engaged = t

    # --- Kanały za wczoraj (details + sesje organiczne do summary). ---
    channels_resp = _run_report(token, property_id, {
        "dateRanges": day_range,
        "dimensions": [{"name": "sessionDefaultChannelGroup"}],
        "metrics": [{"name": "sessions"}, {"name": "activeUsers"}, {"name": "screenPageViews"}],
        "limit": TOP_ROWS,
    })
    channels = [{"channel": c, "sessions": _to_int(s), "users": _to_int(u), "pageviews": _to_int(p)}
                for c, s, u, p in _rows(channels_resp)]
    channels.sort(key=lambda r: -r["sessions"])
    organic = next((c["sessions"] for c in channels if c["channel"] == "Organic Search"), 0)

    summary = {
        "data_date": day,
        "sessions": _to_int(sessions),
        "active_users": _to_int(users),
        "new_users": _to_int(new_users),
        "returning_users": max(0, _to_int(users) - _to_int(new_users)),
        "pageviews": _to_int(pageviews),
        "organic_sessions": organic,
        "engagement_rate": round(eng_rate * 100, 2),
        "avg_engagement_s": round(eng_duration / sessions, 1) if sessions else 0,
        "engaged_sessions": _to_int(engaged),
        "engaged_per_user": round(engaged / users, 2) if users else 0,
        "pages_per_session": round(pageviews / sessions, 2) if sessions else 0,
    }

    # --- Details: źródła i top strony za wczoraj. ---
    sources_resp = _run_report(token, property_id, {
        "dateRanges": day_range,
        "dimensions": [{"name": "sessionSource"}],
        "metrics": [{"name": "sessions"}, {"name": "activeUsers"}],
        "limit": TOP_ROWS,
        "orderBys": [{"metric": {"metricName": "sessions"}, "desc": True}],
    })
    sources = [{"source": s, "sessions": _to_int(se), "users": _to_int(u)}
               for s, se, u in _rows(sources_resp)]

    pages_resp = _run_report(token, property_id, {
        "dateRanges": day_range,
        "dimensions": [{"name": "pagePath"}],
        "metrics": [{"name": "screenPageViews"}, {"name": "activeUsers"}],
        "limit": TOP_ROWS,
        "orderBys": [{"metric": {"metricName": "screenPageViews"}, "desc": True}],
    })
    pages = [{"path": p, "pageviews": _to_int(v), "users": _to_int(u)}
             for p, v, u in _rows(pages_resp)]

    # --- Landing pages z zaangażowaniem (okno 28 dni – dzienne są zbyt rzadkie). ---
    landing_start = (today - timedelta(days=LANDING_WINDOW_DAYS)).strftime("%Y-%m-%d")
    landing_resp = _run_report(token, property_id, {
        "dateRanges": [{"startDate": landing_start, "endDate": day}],
        "dimensions": [{"name": "landingPage"}],
        "metrics": [{"name": m} for m in (
            "sessions", "engagementRate", "userEngagementDuration", "screenPageViews")],
        "limit": 1000,  # szeroko – Matrix łączy sesje/zaangażowanie z całą sitemapą
        "orderBys": [{"metric": {"metricName": "sessions"}, "desc": True}],
    })
    landing = []
    for path, se, er, dur, pv in _rows(landing_resp):
        se_i = _to_int(se)
        landing.append({
            "path": path,
            "sessions": se_i,
            "engagement_rate": round(_to_float(er) * 100, 2),
            "avg_engagement_s": round(_to_float(dur) / se_i, 1) if se_i else 0,
            "pages_per_session": round(_to_int(pv) / se_i, 2) if se_i else 0,
        })

    # --- Trend miesięczny (łącznie + per kanał) – 25 miesięcy do r/r i sezonowości. ---
    month_start = (today.replace(day=1) - timedelta(days=31 * (MONTHLY_MONTHS - 1))).replace(day=1)
    month_range = [{"startDate": month_start.strftime("%Y-%m-%d"), "endDate": day}]
    monthly_resp = _run_report(token, property_id, {
        "dateRanges": month_range,
        "dimensions": [{"name": "yearMonth"}],
        "metrics": [{"name": "sessions"}, {"name": "activeUsers"}, {"name": "newUsers"}],
        "limit": 100,
        "orderBys": [{"dimension": {"dimensionName": "yearMonth"}}],
    })
    monthly = [{"month": m, "sessions": _to_int(s), "users": _to_int(u), "new_users": _to_int(n)}
               for m, s, u, n in _rows(monthly_resp)]

    channels_monthly_resp = _run_report(token, property_id, {
        "dateRanges": month_range,
        "dimensions": [{"name": "yearMonth"}, {"name": "sessionDefaultChannelGroup"}],
        "metrics": [{"name": "sessions"}],
        "limit": 1000,
        "orderBys": [{"dimension": {"dimensionName": "yearMonth"}}],
    })
    channels_monthly = [{"month": m, "channel": c, "sessions": _to_int(s)}
                        for m, c, s in _rows(channels_monthly_resp, dim_count=2)]

    return {"summary": summary,
            "details": {
                "channels": channels,
                "sources": sources,
                "pages": pages,
                "landing_pages": {"window": {"start": landing_start, "end": day}, "rows": landing},
                "monthly": monthly,
                "channels_monthly": channels_monthly,
            }}
