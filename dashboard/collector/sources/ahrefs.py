"""Ahrefs API v3 – linki (backlinks-stats) + Domain Rating.

Auth: Bearer AHREFS_API_KEY. Oba endpointy wymagają parametru date.
"""
import urllib.parse
from datetime import datetime, timezone

from . import SourceError
from ._http import classify_http_error, request_json

BASE = "https://api.ahrefs.com/v3/site-explorer"
REFDOMAINS_LIMIT = 200


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
    summary = {
        "backlinks": metrics.get("live"),
        "referring_domains": metrics.get("live_refdomains"),
        "domain_rating": round(domain_rating, 1) if isinstance(domain_rating, (int, float)) else None,
        "ahrefs_rank": dr.get("ahrefs_rank"),
    }

    # Lista domen linkujących do details.json – best-effort. Endpoint refdomains
    # bywa poza planem API (Insufficient plan) – wtedy fallback na DataForSEO.
    ref_list = []
    try:
        refdomains = _get("refdomains", {
            "target": target,
            "mode": cfg.get("mode", "subdomains"),
            "history": "live",
            "select": "domain,domain_rating,links_to_target,first_seen",
            "order_by": "domain_rating:desc",
            "limit": REFDOMAINS_LIMIT,
        }, token).get("refdomains") or []
        ref_list = [{
            "domain": d.get("domain"),
            "domain_rating": d.get("domain_rating"),
            "links": d.get("links_to_target"),
            "first_seen": (d.get("first_seen") or "")[:10] or None,
        } for d in refdomains]
    except SourceError:
        pass
    ref_source = "ahrefs"
    if not ref_list:
        try:
            ref_list = _dataforseo_refdomains(target, env)
            ref_source = "dataforseo"
        except Exception:  # noqa: BLE001 – fallback też jest best-effort
            ref_list = []

    return {"summary": summary,
            "details": {"ref_domains": ref_list, "ref_domains_source": ref_source}}


def _dataforseo_refdomains(target: str, env: dict) -> list[dict]:
    """Fallback: DataForSEO backlinks/referring_domains/live (te same kredencjały co backlinks)."""
    import json as _json
    from base64 import b64encode

    login = env.get("DATAFORSEO_LOGIN", "").strip()
    password = env.get("DATAFORSEO_PASSWORD", "").strip()
    if not login or not password:
        return []
    auth = b64encode(f"{login}:{password}".encode()).decode()
    payload = _json.dumps([{
        "target": target,
        "backlinks_status_type": "live",
        "limit": REFDOMAINS_LIMIT,
        "order_by": ["rank,desc"],
    }]).encode()
    resp = request_json("https://api.dataforseo.com/v3/backlinks/referring_domains/live",
                        data=payload, headers={
                            "Authorization": f"Basic {auth}",
                            "Content-Type": "application/json",
                        })
    tasks = resp.get("tasks") or []
    if not tasks or tasks[0].get("status_code", 0) >= 40000:
        return []
    result = (tasks[0].get("result") or [None])[0] or {}
    return [{
        "domain": item.get("domain"),
        "domain_rating": item.get("rank"),  # rank DataForSEO (0-1000), nie DR – skala inna
        "links": item.get("backlinks"),
        "first_seen": (item.get("first_seen") or "")[:10] or None,
    } for item in result.get("items") or []]
