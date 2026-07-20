"""Senuto Visibility Analysis – statystyki domeny (top3/top10/top50, widoczność).

Endpoint jak w senuto-mcp: GET /api/visibility_analysis/reports/dashboard/getDomainStatistics.
Auth: Bearer JWT (SENUTO_API_KEY, rotacja ~31 dni – 401/403 raportowane jako token_expired).
"""
import urllib.error
import urllib.parse

from . import SourceError
from ._http import classify_http_error, request_json

ENDPOINT = "https://api.senuto.com/api/visibility_analysis/reports/dashboard/getDomainStatistics"
POSITIONS_ENDPOINT = "https://api.senuto.com/api/visibility_analysis/reports/positions/getData"
KEYWORDS_LIMIT = 200  # ile fraz trzymamy w details.json


def _fetch_keywords(cfg: dict, token: str) -> list[dict]:
    """Lista rankujących fraz (positions/getData) – best-effort, pusta lista przy błędzie."""
    import json as _json
    body = _json.dumps({
        "domain": cfg.get("domain"),
        "fetch_mode": cfg.get("fetch_mode", "topLevelDomain"),
        "country_id": int(cfg.get("country_id", 1)),
        "limit": KEYWORDS_LIMIT,
    }).encode()
    resp = request_json(POSITIONS_ENDPOINT, data=body, headers={
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    })
    if not resp.get("success"):
        return []
    rows = []
    for row in resp.get("data") or []:
        stats = row.get("statistics") or {}
        pos = stats.get("position") or {}
        rows.append({
            "keyword": row.get("keyword"),
            "position": pos.get("current"),
            "previous": pos.get("previous"),
            "diff": pos.get("diff"),
            "searches": (stats.get("searches") or {}).get("current"),
            "url": (stats.get("url") or {}).get("current"),
            "cpc": (stats.get("cpc") or {}).get("current"),
            "difficulty": (stats.get("difficulty") or {}).get("current"),
            "snippets": (stats.get("snippets") or {}).get("current") or [],
        })
    # Najpierw najlepsze pozycje, w ramach pozycji – większy wolumen.
    rows.sort(key=lambda r: (r["position"] if isinstance(r["position"], int) else 999,
                             -(r["searches"] or 0)))
    return rows


def fetch(cfg: dict, env: dict) -> dict:
    token = env.get("SENUTO_API_KEY", "").strip()
    if not token:
        raise SourceError("not_configured", "senuto: brak SENUTO_API_KEY w env")

    params = urllib.parse.urlencode({
        "domain": cfg.get("domain"),
        # Jedyne akceptowane wartości: topLevelDomain | subdomain
        # (inne = HTTP 418 invalid_data, mylnie wyglądające na WAF)
        "fetch_mode": cfg.get("fetch_mode", "topLevelDomain"),
        "country_id": str(cfg.get("country_id", "1")),
    })
    try:
        resp = request_json(f"{ENDPOINT}?{params}",
                            headers={"Authorization": f"Bearer {token}"})
    except urllib.error.HTTPError as err:
        # Gotcha Senuto: wygasły JWT objawia się jako 404/302 na danych, nie 401.
        if err.code in (302, 404):
            raise SourceError("token_expired",
                              "senuto: HTTP 404 – JWT prawdopodobnie wygasł (rotacja ~31 dni), "
                              "odśwież SENUTO_API_KEY") from err
        raise classify_http_error(err, "senuto") from err
    except Exception as err:  # noqa: BLE001
        raise classify_http_error(err, "senuto") from err

    if not resp.get("success"):
        raise SourceError("error", "senuto: odpowiedź API bez success=true")

    stats = (resp.get("data") or {}).get("statistics") or {}

    def recent(key):
        value = (stats.get(key) or {}).get("recent_value")
        return round(value, 2) if isinstance(value, float) else value

    summary = {
        "top3": recent("top3"),
        "top10": recent("top10"),
        "top50": recent("top50"),
        "visibility": recent("visibility"),
        "domain_rank": recent("domain_rank"),
    }

    try:
        keywords = _fetch_keywords(cfg, token)
    except Exception:  # noqa: BLE001 – lista fraz jest dodatkiem, nie wywala podsumowania
        keywords = []

    return {"summary": summary, "details": {"keywords": keywords}}
