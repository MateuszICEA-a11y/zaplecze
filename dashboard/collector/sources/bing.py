"""Bing Webmaster Tools – ruch z Binga (GetRankAndTrafficStats + GetQueryStats).

Auth: klucz API (BING_WEBMASTER_API_KEY, panel BWT → Settings → API access).
Wymaga zweryfikowanej witryny w Bing Webmaster Tools.

GetRankAndTrafficStats zwraca dzienną historię (~16 mies.), GetQueryStats
wiersze per fraza per tydzień (pole Date) – stąd agregacja do okien czasowych
jak w BWT (7d/30d/3m/6m/12m/18m/24m). AvgClickPosition = -1 oznacza brak
danych, nie pozycję – normalizujemy do None.

Summary: kliknięcia/wyświetlenia z ostatniego pełnego dnia + liczba fraz (30d).
Details: dzienna historia ruchu + frazy per okno (queries_windows).
"""
import re
import urllib.parse
from datetime import datetime, timedelta, timezone

from . import SourceError
from ._http import classify_http_error, request_json

API = "https://ssl.bing.com/webmaster/api.svc/json"
TOP_QUERIES = 200
# Okna jak w panelu BWT; emitowane tylko te, które pokrywa dostępna historia.
QUERY_WINDOWS = [("7d", 7), ("30d", 30), ("3m", 91), ("6m", 183),
                 ("12m", 365), ("18m", 548), ("24m", 730)]


def _call(endpoint: str, api_key: str, site: str) -> list:
    query = urllib.parse.urlencode({"siteUrl": site, "apikey": api_key})
    try:
        resp = request_json(f"{API}/{endpoint}?{query}", headers={})
    except Exception as err:  # noqa: BLE001
        raise classify_http_error(err, "bing") from err
    return resp.get("d") or []


def _date(raw: str) -> str | None:
    """'/Date(1721433600000)/' → 'YYYY-MM-DD'."""
    m = re.search(r"/Date\((\d+)", raw or "")
    if not m:
        return None
    return datetime.fromtimestamp(int(m.group(1)) / 1000, tz=timezone.utc).strftime("%Y-%m-%d")


def _position(raw) -> float | None:
    """AvgClickPosition z BWT: -1 (i inne ujemne) = brak danych."""
    if isinstance(raw, (int, float)) and raw >= 0:
        return float(raw)
    return None


def _aggregate_queries(rows: list[dict]) -> list[dict]:
    """Wiersze tygodniowe → jedna pozycja per fraza (suma + pozycja ważona klikami)."""
    by_query: dict[str, dict] = {}
    for row in rows:
        agg = by_query.setdefault(row["query"], {
            "query": row["query"], "clicks": 0, "impressions": 0,
            "_pos_weight": 0.0, "_pos_sum": 0.0,
        })
        agg["clicks"] += row["clicks"]
        agg["impressions"] += row["impressions"]
        if row["position"] is not None:
            # Waga: kliknięcia (to pozycja kliknięć); fallback 1, gdy klików brak.
            weight = row["clicks"] or 1
            agg["_pos_weight"] += weight
            agg["_pos_sum"] += row["position"] * weight
    result = []
    for agg in by_query.values():
        position = round(agg["_pos_sum"] / agg["_pos_weight"], 1) if agg["_pos_weight"] else None
        result.append({"query": agg["query"], "clicks": agg["clicks"],
                       "impressions": agg["impressions"], "position": position})
    result.sort(key=lambda r: (-r["clicks"], -r["impressions"]))
    return result[:TOP_QUERIES]


def fetch(cfg: dict, env: dict) -> dict:
    api_key = env.get("BING_WEBMASTER_API_KEY", "").strip()
    if not api_key:
        raise SourceError("not_configured", "bing: brak BING_WEBMASTER_API_KEY w env")
    site = cfg.get("site") or f"https://{cfg.get('domain')}/"

    traffic = _call("GetRankAndTrafficStats", api_key, site)
    days = []
    for row in traffic:
        day = _date(row.get("Date"))
        if day:
            days.append({"date": day,
                         "clicks": row.get("Clicks", 0),
                         "impressions": row.get("Impressions", 0)})
    days.sort(key=lambda r: r["date"])
    latest = days[-1] if days else {}

    # Frazy: wiersze per fraza per tydzień – agregacja do okien czasowych.
    raw_queries: list[dict] = []
    try:
        for row in _call("GetQueryStats", api_key, site):
            if row.get("Query"):
                raw_queries.append({
                    "query": row["Query"],
                    "date": _date(row.get("Date")),
                    "clicks": row.get("Clicks", 0),
                    "impressions": row.get("Impressions", 0),
                    "position": _position(row.get("AvgClickPosition")),
                })
    except SourceError:
        pass  # frazy są dodatkiem – ruch dzienny wystarczy

    dated = [r for r in raw_queries if r["date"]]
    queries_windows: dict[str, dict] = {}
    if dated:
        end = max(r["date"] for r in dated)
        first = min(r["date"] for r in dated)
        end_dt = datetime.strptime(end, "%Y-%m-%d")
        for key, win_days in QUERY_WINDOWS:
            start_dt = end_dt - timedelta(days=win_days - 1)
            start = start_dt.strftime("%Y-%m-%d")
            in_window = [r for r in dated if r["date"] >= start]
            # Okno emitujemy, gdy historia je pokrywa (tolerancja: pierwszy
            # tydzień danych) albo to najmniejsze okno – zawsze coś pokazać.
            if not queries_windows or first <= (start_dt + timedelta(days=7)).strftime("%Y-%m-%d"):
                queries_windows[key] = {
                    "start": max(start, first),  # faktyczny zakres danych, nie nominalny
                    "end": end,
                    "queries": _aggregate_queries(in_window),
                }
    elif raw_queries:
        # BWT bez pól Date – jedno okno „całość", zakres nieznany.
        queries_windows["all"] = {"start": None, "end": None,
                                  "queries": _aggregate_queries(raw_queries)}

    default = queries_windows.get("30d") or next(iter(queries_windows.values()), {})
    summary = {
        "data_date": latest.get("date"),
        "clicks": latest.get("clicks", 0),
        "impressions": latest.get("impressions", 0),
        "queries": len(default.get("queries") or []),
    }
    details = {
        "traffic": days,
        "queries_windows": queries_windows,
        # Kompatybilność wstecz: płaska lista = okno domyślne (30d).
        "queries": default.get("queries") or [],
        "queries_window": {"start": default.get("start"), "end": default.get("end")},
    }
    return {"summary": summary, "details": details}
