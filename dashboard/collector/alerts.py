"""Alerty progowe po dziennym przebiegu collectora (mail przez Resend).

Progi w domains.yaml (global.alerts); mail leci raz na przebieg (cron 1×/dzień),
dopóki wartość jest poniżej progu. Brak RESEND_API_KEY lub progów = cicho pomijamy.
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


def check_credit_alerts(global_sources: dict, alerts_cfg: dict, env: dict) -> None:
    email = (alerts_cfg or {}).get("email", "").strip()
    api_key = env.get("RESEND_API_KEY", "").strip()
    if not email or not api_key:
        if alerts_cfg:
            print("  [alerts] pominięte: brak email w konfigu lub RESEND_API_KEY w env",
                  file=sys.stderr)
        return

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

    items = "".join(f"<li>{p}</li>" for p in problems)
    body = json.dumps({
        "from": FROM,
        "to": [email],
        "subject": f"⚠ Dashboard zaplecza: niski stan kredytów ({len(problems)})",
        "html": (f"<p>Dzienny przebieg collectora wykrył niski stan kont:</p>"
                 f"<ul>{items}</ul>"
                 f"<p>Szczegóły: <a href=\"https://zaplecze-dashboard.m-wisniewski.workers.dev/\">"
                 f"dashboard zaplecza</a> → Kredyty (konto).</p>"),
    }).encode()
    req = urllib.request.Request(RESEND_URL, data=body, headers={
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    })
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            json.loads(resp.read().decode())
        print(f"  [alerts] wysłano alert ({len(problems)}) na {email}")
    except Exception as err:  # noqa: BLE001 – alert nie może wywalić collectora
        print(f"  [alerts] wysyłka nie powiodła się: {err}", file=sys.stderr)
