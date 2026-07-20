"""OpenRouter – stan konta (GET /credits, klucz główny) + zużycie klucza
projektowego (GET /key, Bearer = klucz projektu z OPENROUTER_PROJECT_KEY,
np. ten używany przez narzędzia widocznosc.ai na Cloudflare)."""
from . import SourceError
from ._http import classify_http_error, request_json

CREDITS_ENDPOINT = "https://openrouter.ai/api/v1/credits"
KEY_ENDPOINT = "https://openrouter.ai/api/v1/key"


def fetch(cfg: dict, env: dict) -> dict:
    key = env.get("OPENROUTER_API_KEY", "").strip()
    if not key:
        raise SourceError("not_configured", "openrouter: brak OPENROUTER_API_KEY w env")

    try:
        resp = request_json(CREDITS_ENDPOINT, headers={"Authorization": f"Bearer {key}"})
    except Exception as err:  # noqa: BLE001
        raise classify_http_error(err, "openrouter") from err

    data = resp.get("data") or {}
    total_credits = data.get("total_credits")
    total_usage = data.get("total_usage")
    if total_credits is None:
        raise SourceError("error", "openrouter: odpowiedź bez total_credits")
    result = {
        "total_credits": total_credits,
        "total_usage": total_usage,
        "remaining": round(total_credits - total_usage, 4) if total_usage is not None else None,
    }

    # Zużycie klucza projektowego – best-effort, brak klucza nie psuje źródła.
    project_key = env.get("OPENROUTER_PROJECT_KEY", "").strip()
    if project_key:
        try:
            key_info = (request_json(KEY_ENDPOINT,
                                     headers={"Authorization": f"Bearer {project_key}"})
                        .get("data") or {})
            result["project_usage"] = round(float(key_info.get("usage") or 0), 4)
            result["project_limit"] = key_info.get("limit")
            result["project_label"] = key_info.get("label")
        except Exception as err:  # noqa: BLE001
            result["project_error"] = f"klucz projektu: {err}"

    return result
