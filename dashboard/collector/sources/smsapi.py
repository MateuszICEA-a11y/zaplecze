"""SMSAPI – saldo punktów konta (GET /profile) + przelicznik na SMS-y.

Koszt jednostkowy SMS-a pobierany na żywo przez sms.do z test=1 (dry-run,
nic nie wysyła i nie zdejmuje punktów) – ta sama wiadomość co OTP na
widocznosc.ai (nadawca z cfg). Fallback: cost_fallback z domains.yaml.
"""
from . import SourceError
from ._http import classify_http_error, request_json

PROFILE_ENDPOINT = "https://api.smsapi.pl/profile"
SMS_ENDPOINT = "https://api.smsapi.pl/sms.do"
# Numer tylko do wyceny dry-run (test=1) – nic nie zostaje wysłane.
PRICE_PROBE_NUMBER = "48500100100"


def _unit_cost(token: str, cfg: dict) -> float | None:
    """Koszt 1 SMS-a wg API (test=1); None gdy wycena się nie uda."""
    import urllib.parse

    payload = urllib.parse.urlencode({
        "to": PRICE_PROBE_NUMBER,
        "message": "Twoj kod weryfikacyjny: 000000",
        "from": cfg.get("sender", "ICEA"),
        "format": "json",
        "test": "1",
        "encoding": "utf-8",
    }).encode()
    try:
        resp = request_json(SMS_ENDPOINT, data=payload,
                            headers={"Authorization": f"Bearer {token}"})
        sent = resp.get("list") or []
        points = sent[0].get("points") if sent else None
        return float(points) if points is not None else None
    except Exception:  # noqa: BLE001 – wycena jest best-effort
        return None


def fetch(cfg: dict, env: dict) -> dict:
    token = env.get("SMSAPI_TOKEN", "").strip()
    if not token:
        raise SourceError("not_configured", "smsapi: brak SMSAPI_TOKEN w env")

    try:
        resp = request_json(PROFILE_ENDPOINT, headers={"Authorization": f"Bearer {token}"})
    except Exception as err:  # noqa: BLE001
        raise classify_http_error(err, "smsapi") from err

    points = resp.get("points")
    if points is None:
        raise SourceError("error", "smsapi: odpowiedź bez pola points")

    cost = _unit_cost(token, cfg) or cfg.get("cost_fallback")
    result = {"points": points}
    if cost:
        result["sms_cost"] = round(float(cost), 4)
        result["sms_remaining"] = int(points / float(cost))
    return result
