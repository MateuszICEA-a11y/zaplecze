"""Alerty progowe po dziennym przebiegu collectora (Resend + webhooki).

Progi w domains.yaml (global.alerts); mail leci raz na przebieg (cron 1×/dzień),
dopóki wartość jest poniżej progu. Odbiorcy i webhooki są w global.alerts.
Nadawca jak w lead-gen widocznosc.ai (domena zweryfikowana w Resend).
"""
import json
import sys
import urllib.request

RESEND_URL = "https://api.resend.com/emails"
FROM = "Dashboard zaplecza <formularz@widocznosc.ai>"


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
