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
# Search Analytics API zwraca do 25 tys. wierszy na żądanie. Dla tabel panelu
# pobieramy 1000 najważniejszych fraz/stron; paginacja i filtr działają lokalnie.
DETAILS_ROW_LIMIT = 1000
# Okna list fraz/stron (przełącznik okresu na froncie). GSC trzyma ~16 miesięcy,
# więc dłuższych zakresów (18/24 mies. jak w Bingu) nie da się zaoferować.
DETAILS_WINDOWS = [("7d", 7), ("30d", 30), ("3m", 90), ("6m", 180),
                   ("12m", 365), ("16m", 480)]
COMPARE_WINDOW_DAYS = 90   # okno porównań qoq/yoy (plansza „Co spadło")
COMPARE_ROW_LIMIT = 250
COMPARE_KEEP_ROWS = 300    # ile złączonych wierszy per lista trzymamy w details
HISTORY_DAYS = 14          # dzienna historia fraz (sparkline w rozwijanym wierszu)
HISTORY_QUERIES = 300      # ile fraz trzymamy w query_history (top po wyświetleniach)


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


def _join_compare(cur_rows: list[dict], prev_rows: list[dict]) -> list[dict]:
    """Złączenie okna bieżącego i poprzedniego po kluczu (fraza/URL).

    Trzyma metryki obu okien; delty liczy widok. Wiersze sortowane malejąco po
    max(impressions) z obu okien i przycięte do COMPARE_KEEP_ROWS.
    """
    prev_by_key = {r["key"]: r for r in prev_rows}
    joined = []
    seen = set()
    for cur in cur_rows:
        prev = prev_by_key.get(cur["key"], {})
        seen.add(cur["key"])
        joined.append({
            "key": cur["key"],
            "clicks": cur["clicks"], "prev_clicks": prev.get("clicks", 0),
            "impressions": cur["impressions"], "prev_impressions": prev.get("impressions", 0),
            "position": cur["position"], "prev_position": prev.get("position"),
        })
    for prev in prev_rows:
        if prev["key"] in seen:
            continue
        joined.append({
            "key": prev["key"],
            "clicks": 0, "prev_clicks": prev["clicks"],
            "impressions": 0, "prev_impressions": prev["impressions"],
            "position": None, "prev_position": prev["position"],
        })
    joined.sort(key=lambda r: max(r["impressions"], r["prev_impressions"]), reverse=True)
    return joined[:COMPARE_KEEP_ROWS]


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

    # Listy do details.json: top frazy i strony per okno (przełącznik okresu na
    # froncie; dzienne listy na małym serwisie są zbyt rzadkie, żeby coś pokazać).
    details: dict = {"windows": {}}
    for win_key, days in DETAILS_WINDOWS:
        start = (datetime.now(timezone.utc)
                 - timedelta(days=DATA_LAG_DAYS + days - 1)).strftime("%Y-%m-%d")
        block: dict = {"start": start, "end": day}
        for dimension, key in (("query", "queries"), ("page", "pages")):
            try:
                resp = query({
                    "startDate": start,
                    "endDate": day,
                    "dimensions": [dimension],
                    "rowLimit": DETAILS_ROW_LIMIT,
                })
                block[key] = _rows_to_details(resp.get("rows") or [])
            except SourceError:
                block[key] = []
        details["windows"][win_key] = block

    # Kompatybilność wstecz: stare pola = okno 30 dni (frontend sprzed przełącznika).
    legacy = details["windows"].get("30d") or {}
    details["window"] = {"start": legacy.get("start"), "end": legacy.get("end")}
    details["queries"] = legacy.get("queries") or []
    details["pages"] = legacy.get("pages") or []

    # Dzienna historia fraz (ostatnie HISTORY_DAYS dni) – sparkline w rozwijanym
    # wierszu tabeli „Frazy w Google". Jedno zapytanie query×date; dni bez frazy
    # uzupełnia frontend zerami.
    try:
        hist_start = (datetime.now(timezone.utc)
                      - timedelta(days=DATA_LAG_DAYS + HISTORY_DAYS - 1)).strftime("%Y-%m-%d")
        resp = query({
            "startDate": hist_start,
            "endDate": day,
            "dimensions": ["query", "date"],
            "rowLimit": QUERY_ROW_LIMIT,
        })
        series: dict[str, list] = {}
        totals: dict[str, int] = {}
        for row in resp.get("rows") or []:
            keys = row.get("keys") or []
            if len(keys) < 2:
                continue
            q_key, q_date = keys[0], keys[1]
            impressions = row.get("impressions", 0)
            series.setdefault(q_key, []).append([q_date, impressions])
            totals[q_key] = totals.get(q_key, 0) + impressions
        top = sorted(totals, key=lambda k: -totals[k])[:HISTORY_QUERIES]
        details["query_history"] = {
            "window": {"start": hist_start, "end": day},
            "series": {k: sorted(series[k]) for k in top},
        }
    except SourceError:
        pass  # historia jest dodatkiem – tabela działa bez sparkline'ów

    # Porównania okres-do-okresu (plansza „Co spadło"): ostatnie 3 mies. vs
    # poprzednie 3 mies. (qoq) i vs ten sam okres rok temu (yoy).
    end = datetime.now(timezone.utc) - timedelta(days=DATA_LAG_DAYS)
    cur_start = end - timedelta(days=COMPARE_WINDOW_DAYS - 1)
    windows = {
        "cur": (cur_start, end),
        "qoq": (cur_start - timedelta(days=COMPARE_WINDOW_DAYS), cur_start - timedelta(days=1)),
        "yoy": (cur_start - timedelta(days=365), end - timedelta(days=365)),
    }

    def compare_rows(start: datetime, stop: datetime, dimension: str) -> list[dict]:
        resp = query({
            "startDate": start.strftime("%Y-%m-%d"),
            "endDate": stop.strftime("%Y-%m-%d"),
            "dimensions": [dimension],
            "rowLimit": COMPARE_ROW_LIMIT,
        })
        return _rows_to_details(resp.get("rows") or [])

    try:
        compare: dict = {
            "window_days": COMPARE_WINDOW_DAYS,
            "cur": {"start": windows["cur"][0].strftime("%Y-%m-%d"), "end": windows["cur"][1].strftime("%Y-%m-%d")},
        }
        for dimension, key in (("query", "queries"), ("page", "pages")):
            cur_rows = compare_rows(*windows["cur"], dimension)
            for mode in ("qoq", "yoy"):
                start, stop = windows[mode]
                block = compare.setdefault(mode, {
                    "prev": {"start": start.strftime("%Y-%m-%d"), "end": stop.strftime("%Y-%m-%d")},
                })
                block[key] = _join_compare(cur_rows, compare_rows(start, stop, dimension))
        details["compare"] = compare
    except SourceError:
        pass  # porównania są opcjonalne – frontend chowa planszę, gdy ich brak

    return {"summary": summary, "details": details}
