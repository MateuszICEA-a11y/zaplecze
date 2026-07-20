"""DataForSEO Backlinks – summary (backlinki, referring domains, rank).

Auth: Basic (DATAFORSEO_LOGIN + DATAFORSEO_PASSWORD), wzorzec jak
pipeline/news-generator-widocznosc/collector.py.
"""
import json
from base64 import b64encode

from . import SourceError
from ._http import classify_http_error, request_json

ENDPOINT = "https://api.dataforseo.com/v3/backlinks/summary/live"


def fetch(cfg: dict, env: dict) -> dict:
    login = env.get("DATAFORSEO_LOGIN", "").strip()
    password = env.get("DATAFORSEO_PASSWORD", "").strip()
    if not login or not password:
        raise SourceError("not_configured", "backlinks: brak DATAFORSEO_LOGIN/DATAFORSEO_PASSWORD w env")

    auth = b64encode(f"{login}:{password}".encode()).decode()
    payload = json.dumps([{
        "target": cfg.get("target"),
        "backlinks_status_type": "live",
        "internal_list_limit": 1,
    }]).encode("utf-8")

    try:
        resp = request_json(ENDPOINT, data=payload, headers={
            "Authorization": f"Basic {auth}",
            "Content-Type": "application/json",
        })
    except Exception as err:  # noqa: BLE001
        raise classify_http_error(err, "backlinks") from err

    tasks = resp.get("tasks") or []
    if not tasks or tasks[0].get("status_code", 0) >= 40000:
        message = tasks[0].get("status_message", "brak wyniku") if tasks else "brak taska"
        raise SourceError("error", f"backlinks: {message}")

    # result=null przy status 20000 = domena jeszcze nieobecna w indeksie backlinków
    # (młode domeny) – raportujemy zera zamiast błędu, żeby wykres startował od baseline.
    result = (tasks[0].get("result") or [None])[0]
    if result is None:
        return {"backlinks": 0, "referring_domains": 0, "referring_ips": 0,
                "broken_backlinks": 0, "rank": 0, "indexed": False}
    return {
        "backlinks": result.get("backlinks"),
        "referring_domains": result.get("referring_domains"),
        "referring_ips": result.get("referring_ips"),
        "broken_backlinks": result.get("broken_backlinks"),
        "rank": result.get("rank"),
        "indexed": True,
    }
