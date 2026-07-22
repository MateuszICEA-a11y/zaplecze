"""Microsoft Clarity – Data Export API (project-live-insights).

Auth: Bearer CLARITY_API_TOKEN (panel Clarity → Settings → Data Export → Generate token).
API zwraca metryki z ostatnich 1-3 dni (numOfDays); limit 10 wywołań dziennie na projekt.
Summary: sesje/użytkownicy/boty/engagement; details: strony, referrery, urządzenia
(po 1 wywołaniu bazowym + po 1 na wymiar = 4 z 10 dziennego limitu).
"""
import urllib.parse

from . import SourceError
from ._http import classify_http_error, request_json

ENDPOINT = "https://www.clarity.ms/export-data/api/v1/project-live-insights"
NUM_OF_DAYS = "3"
# Wymiary do details – każde wywołanie zużywa 1 z 10 dziennych requestów.
# „Referrer” nie jest wymiarem Data Export API (to nazwa metryki w docs).
# Źródło wejścia jest zwracane przez wspierany wymiar „Source”.
DIMENSIONS = [("URL", "url"), ("Source", "referrer"), ("Device", "device")]
TOP_ROWS = 50


def _call(token: str, params: dict) -> list:
    query = urllib.parse.urlencode({"numOfDays": NUM_OF_DAYS, **params})
    try:
        resp = request_json(f"{ENDPOINT}?{query}",
                            headers={"Authorization": f"Bearer {token}"})
    except Exception as err:  # noqa: BLE001
        raise classify_http_error(err, "clarity") from err
    if not isinstance(resp, list):
        raise SourceError("error", "clarity: nieoczekiwany format odpowiedzi")
    return resp


def _metric(payload: list, name: str) -> list[dict]:
    for entry in payload:
        if entry.get("metricName") == name:
            return entry.get("information") or []
    return []


def _to_int(value) -> int | None:
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return None


# Klucze metryk w wierszach details – wszystko poza nimi to wartość wymiaru.
_METRIC_KEYS = {
    "totalsessioncount", "totalbotsessioncount", "distinctusercount",
    "pagespersessionpercentage", "subtotal", "sessionswithmetricpercentage",
    "sessionscount", "totaltime", "activetime",
}


def _dim_value(row: dict, dimension: str):
    """Wartość wymiaru z wiersza details – API nie trzyma się wielkości liter
    nazwy wymiaru (np. `URL` w zapytaniu, `Url` w odpowiedzi), więc dopasowanie
    jest case-insensitive z fallbackiem na pierwszy tekstowy klucz spoza metryk."""
    for key, value in row.items():
        if key.lower() == dimension.lower():
            return value
    for key, value in row.items():
        if key.lower() not in _METRIC_KEYS and isinstance(value, str) and value:
            return value
    return None


def fetch(cfg: dict, env: dict) -> dict:
    # Token Clarity jest per projekt (= per domena); domena może wskazać własny
    # sekret przez `token_env` w domains.yaml.
    token_env = cfg.get("token_env", "CLARITY_API_TOKEN")
    token = env.get(token_env, "").strip()
    if not token:
        raise SourceError("not_configured", f"clarity: brak {token_env} w env")

    base = _call(token, {})
    traffic = (_metric(base, "Traffic") or [{}])[0]
    engagement = (_metric(base, "EngagementTime") or [{}])[0]
    scroll = (_metric(base, "ScrollDepth") or [{}])[0]

    summary = {
        "window_days": int(NUM_OF_DAYS),
        "sessions": _to_int(traffic.get("totalSessionCount")),
        "bot_sessions": _to_int(traffic.get("totalBotSessionCount")),
        "users": _to_int(traffic.get("distinctUserCount")),
        "pages_per_session": traffic.get("pagesPerSessionPercentage"),
        "engagement_total_s": _to_int(engagement.get("totalTime")),
        "engagement_active_s": _to_int(engagement.get("activeTime")),
        "scroll_depth_avg": scroll.get("averageScrollDepth"),
    }

    details = {
        "dead_clicks": (_metric(base, "DeadClickCount") or [{}])[0].get("subTotal"),
        "rage_clicks": (_metric(base, "RageClickCount") or [{}])[0].get("subTotal"),
        "quickback_clicks": (_metric(base, "QuickbackClick") or [{}])[0].get("subTotal"),
        "script_errors": (_metric(base, "ScriptErrorCount") or [{}])[0].get("subTotal"),
    }
    for dimension, output_key in DIMENSIONS:
        try:
            payload = _call(token, {"dimension1": dimension})
            rows = _metric(payload, "Traffic")
            rows.sort(key=lambda r: -(_to_int(r.get("totalSessionCount")) or 0))
            details[output_key] = [{
                # Pusty Source oznacza ruch bez referrera (direct), nie błąd.
                # Dla pozostałych wymiarów zachowujemy jawny opis zamiast „?”.
                "name": _dim_value(row, dimension) or (
                    "Wejście bezpośrednie" if dimension == "Source" else "Nieznana wartość"
                ),
                "sessions": _to_int(row.get("totalSessionCount")),
                "users": _to_int(row.get("distinctUserCount")),
            } for row in rows[:TOP_ROWS]]
        except SourceError:
            details[output_key] = []

    return {"summary": summary, "details": details}
