"""Ahrefs API v3 – linki (backlinks-stats) + Domain Rating.

Auth: Bearer AHREFS_API_KEY. Oba endpointy wymagają parametru date.
"""
import urllib.parse
from datetime import datetime, timezone

from . import SourceError
from ._http import classify_http_error, request_json

BASE = "https://api.ahrefs.com/v3/site-explorer"


def _get(path: str, params: dict, token: str) -> dict:
    query = urllib.parse.urlencode(params)
    try:
        return request_json(f"{BASE}/{path}?{query}", headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
        })
    except Exception as err:  # noqa: BLE001
        raise classify_http_error(err, "ahrefs") from err


def fetch(cfg: dict, env: dict) -> dict:
    token = env.get("AHREFS_API_KEY", "").strip()
    if not token:
        raise SourceError("not_configured", "ahrefs: brak AHREFS_API_KEY w env")

    target = cfg.get("target") or cfg.get("domain")
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    base_params = {"target": target, "mode": cfg.get("mode", "subdomains"), "date": today}

    stats = _get("backlinks-stats", base_params, token)
    rating = _get("domain-rating", base_params, token)

    metrics = stats.get("metrics") or {}
    dr = rating.get("domain_rating") or {}
    if not metrics:
        raise SourceError("error", "ahrefs: odpowiedź bez metrics")

    domain_rating = dr.get("domain_rating")
    return {
        "backlinks": metrics.get("live"),
        "referring_domains": metrics.get("live_refdomains"),
        "domain_rating": round(domain_rating, 1) if isinstance(domain_rating, (int, float)) else None,
        "ahrefs_rank": dr.get("ahrefs_rank"),
    }
