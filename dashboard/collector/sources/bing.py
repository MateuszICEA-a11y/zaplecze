"""Bing Webmaster Tools – ruch z Binga (GetRankAndTrafficStats + GetQueryStats).

Auth: klucz API (BING_WEBMASTER_API_KEY, panel BWT → Settings → API access).
Wymaga zweryfikowanej witryny w Bing Webmaster Tools.
Summary: kliknięcia/wyświetlenia z ostatniego pełnego dnia; details: dzienna
historia (ostatnie ~30 dni jest też w summary przy backfillu zbędna – szeregi
buduje dzienny snapshot) i top frazy.
"""
import re
import urllib.parse
from datetime import datetime, timezone

from . import SourceError
from ._http import classify_http_error, request_json

API = "https://ssl.bing.com/webmaster/api.svc/json"
TOP_QUERIES = 200


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

    queries = []
    try:
        for row in _call("GetQueryStats", api_key, site)[:TOP_QUERIES]:
            queries.append({
                "query": row.get("Query"),
                "clicks": row.get("Clicks", 0),
                "impressions": row.get("Impressions", 0),
                "position": row.get("AvgClickPosition"),
            })
        queries.sort(key=lambda r: (-r["clicks"], -r["impressions"]))
    except SourceError:
        pass  # frazy są dodatkiem – ruch dzienny wystarczy

    summary = {
        "data_date": latest.get("date"),
        "clicks": latest.get("clicks", 0),
        "impressions": latest.get("impressions", 0),
        "queries": len(queries),
    }
    return {"summary": summary, "details": {"traffic": days, "queries": queries}}
