"""Alerty progowe po dziennym przebiegu collectora (Resend + webhooki).

Progi w domains.yaml (global.alerts); mail leci raz na przebieg (cron 1×/dzień),
dopóki wartość jest poniżej progu. Odbiorcy i webhooki są w global.alerts.
Nadawca jak w lead-gen widocznosc.ai (domena zweryfikowana w Resend).
"""
import base64
import json
import sys
import time
import urllib.request

RESEND_URL = "https://api.resend.com/emails"
FROM = "Dashboard zaplecza <formularz@widocznosc.ai>"
SERPDATA_BALANCE = "https://api.serpdata.io/v1/api-key/balance"
# Bez własnego User-Agenta WAF SerpData odbija żądanie z 403.
USER_AGENT = "ICEA-DashboardCollector/1.0"


def _value(sources: dict, source: str, field: str):
    entry = sources.get(source) or {}
    if entry.get("status") != "ok":
        return None
    return (entry.get("data") or {}).get(field)


def _strings(value) -> list[str]:
    if isinstance(value, str):
        return [value.strip()] if value.strip() else []
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    return []


def _post_json(url: str, payload: dict, headers: dict | None = None) -> None:
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json", **(headers or {})},
    )
    with urllib.request.urlopen(req, timeout=20) as resp:
        resp.read()


def senuto_days_left(token: str, now: float | None = None) -> int | None:
    """Ile dni zostało do wygaśnięcia JWT Senuto (`exp`), bez weryfikacji podpisu.

    Ta sama arytmetyka co w Workerze (app/cw-usage.js) – token żyje ~31 dni,
    a rotacja jest ręczna, więc trzeba o niej przypomnieć przed terminem.
    """
    parts = str(token or "").split(".")
    if len(parts) != 3:
        return None
    try:
        payload_raw = parts[1]
        payload_raw += "=" * (-len(payload_raw) % 4)
        payload = json.loads(base64.urlsafe_b64decode(payload_raw))
        exp = payload.get("exp")
        if not isinstance(exp, (int, float)):
            return None
    except Exception:  # noqa: BLE001 – zepsuty token traktujemy jak brak daty
        return None
    return int((exp - (now if now is not None else time.time())) // 86_400)


def serpdata_left(api_key: str) -> float | None:
    """Pozostałe zapytania w pakiecie SerpData (`left` przychodzi jako łańcuch)."""
    req = urllib.request.Request(
        SERPDATA_BALANCE,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Accept": "application/json",
            "User-Agent": USER_AGENT,
        },
    )
    with urllib.request.urlopen(req, timeout=20) as resp:
        data = json.loads(resp.read())
    try:
        return float(data["left"])
    except (KeyError, TypeError, ValueError):
        return None


def check_credit_alerts(global_sources: dict, alerts_cfg: dict, env: dict) -> None:
    problems: list[str] = []

    sms_min = alerts_cfg.get("sms_min")
    sms_left = _value(global_sources, "smsapi", "sms_remaining")
    if isinstance(sms_min, (int, float)) and isinstance(sms_left, (int, float)) and sms_left < sms_min:
        problems.append(f"SMSAPI: zostało ≈{sms_left:.0f} SMS-ów (próg: {sms_min})")

    or_min = alerts_cfg.get("openrouter_min_usd")
    or_left = _value(global_sources, "openrouter", "remaining")
    if isinstance(or_min, (int, float)) and isinstance(or_left, (int, float)) and or_left < or_min:
        problems.append(f"OpenRouter: zostało {or_left:.2f} $ (próg: {or_min} $)")

    # Senuto i SerpData nie idą przez snapshoty collectora – termin tokenu
    # czytamy z samego JWT, a saldo pakietu prosto z API (jedno wywołanie).
    senuto_min = alerts_cfg.get("senuto_days_left_min")
    if isinstance(senuto_min, (int, float)) and env.get("SENUTO_API_KEY", "").strip():
        days = senuto_days_left(env["SENUTO_API_KEY"].strip())
        if days is None:
            print("  [alerts] Senuto: nie odczytałem terminu z tokenu", file=sys.stderr)
        elif days < 0:
            problems.append(f"Senuto: token wygasł {abs(days)} dni temu – wymagana ręczna rotacja w Senuto")
        elif days <= senuto_min:
            problems.append(
                f"Senuto: token wygasa za {days} dni – wymagana ręczna rotacja w Senuto "
                f"(próg: {senuto_min:.0f} dni)"
            )

    serp_min = alerts_cfg.get("serpdata_min_left")
    if isinstance(serp_min, (int, float)) and env.get("SERPDATA_API_KEY", "").strip():
        try:
            left = serpdata_left(env["SERPDATA_API_KEY"].strip())
        except Exception as err:  # noqa: BLE001 – saldo nie może wywalić collectora
            left = None
            print(f"  [alerts] SerpData: odczyt salda nie powiódł się: {err}", file=sys.stderr)
        if isinstance(left, (int, float)) and left <= serp_min:
            problems.append(f"SerpData: zostało {left:.0f} zapytań (próg: {serp_min:.0f})")

    if not problems:
        print("  [alerts] progi kredytów OK")
        return

    recipients = _strings(alerts_cfg.get("emails")) or _strings(alerts_cfg.get("email"))
    api_key = env.get("RESEND_API_KEY", "").strip()
    items = "".join(f"<li>{p}</li>" for p in problems)
    if recipients and api_key:
        try:
            _post_json(RESEND_URL, {
                "from": FROM,
                "to": recipients,
                "subject": f"⚠ Dashboard zaplecza: niski stan kredytów ({len(problems)})",
                "html": (f"<p>Dzienny przebieg collectora wykrył niski stan kont:</p>"
                         f"<ul>{items}</ul>"
                         f"<p>Szczegóły: <a href=\"https://zaplecze-dashboard.m-wisniewski.workers.dev/\">"
                         f"dashboard zaplecza</a> → System i limity.</p>"),
            }, {"Authorization": f"Bearer {api_key}"})
            print(f"  [alerts] Resend: wysłano alert ({len(problems)}) do {len(recipients)} odbiorców")
        except Exception as err:  # noqa: BLE001 – alert nie może wywalić collectora
            print(f"  [alerts] Resend: wysyłka nie powiodła się: {err}", file=sys.stderr)
    else:
        print("  [alerts] Resend pominięty: brak emails w konfigu lub RESEND_API_KEY w env",
              file=sys.stderr)

    webhook_urls = _strings(alerts_cfg.get("webhook_urls"))
    for env_name in _strings(alerts_cfg.get("webhook_envs")):
        url = env.get(env_name, "").strip()
        if url:
            webhook_urls.append(url)
    webhook_payload = {
        "event": "dashboard.credit_limit_near",
        "problems": problems,
        "dashboard_url": "https://zaplecze-dashboard.m-wisniewski.workers.dev/system",
    }
    for index, url in enumerate(dict.fromkeys(webhook_urls), start=1):
        try:
            _post_json(url, webhook_payload)
            print(f"  [alerts] webhook {index}: wysłano")
        except Exception as err:  # noqa: BLE001
            print(f"  [alerts] webhook {index}: wysyłka nie powiodła się: {err}", file=sys.stderr)
