"""OpenRouter – kredyty konta (GET /api/v1/credits, Bearer OPENROUTER_API_KEY)."""
from . import SourceError
from ._http import classify_http_error, request_json

ENDPOINT = "https://openrouter.ai/api/v1/credits"


def fetch(cfg: dict, env: dict) -> dict:
    key = env.get("OPENROUTER_API_KEY", "").strip()
    if not key:
        raise SourceError("not_configured", "openrouter: brak OPENROUTER_API_KEY w env")

    try:
        resp = request_json(ENDPOINT, headers={"Authorization": f"Bearer {key}"})
    except Exception as err:  # noqa: BLE001
        raise classify_http_error(err, "openrouter") from err

    data = resp.get("data") or {}
    total_credits = data.get("total_credits")
    total_usage = data.get("total_usage")
    if total_credits is None:
        raise SourceError("error", "openrouter: odpowiedź bez total_credits")
    remaining = None
    if total_usage is not None:
        remaining = round(total_credits - total_usage, 4)
    return {
        "total_credits": total_credits,
        "total_usage": total_usage,
        "remaining": remaining,
    }
