"""SMSAPI – saldo punktów konta (GET /profile, Bearer SMSAPI_TOKEN)."""
from . import SourceError
from ._http import classify_http_error, request_json

ENDPOINT = "https://api.smsapi.pl/profile"


def fetch(cfg: dict, env: dict) -> dict:
    token = env.get("SMSAPI_TOKEN", "").strip()
    if not token:
        raise SourceError("not_configured", "smsapi: brak SMSAPI_TOKEN w env")

    try:
        resp = request_json(ENDPOINT, headers={"Authorization": f"Bearer {token}"})
    except Exception as err:  # noqa: BLE001
        raise classify_http_error(err, "smsapi") from err

    points = resp.get("points")
    if points is None:
        raise SourceError("error", "smsapi: odpowiedź bez pola points")
    return {"points": points}
