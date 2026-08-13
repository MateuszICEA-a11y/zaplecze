"""Token Senuto z dashboardu zamiast sekretu repo.

JWT Senuto żyje ~31 dni i jest wklejany ręcznie na stronie /system/ dashboardu
(Worker trzyma go w KV). Collector pobiera go stąd GET-em /api/senuto-token
podpisanym HMAC jak callbacki Content Watchera i nadpisuje SENUTO_API_KEY
w env procesu – GitHub Secret zostaje tylko fallbackiem.

Lustro: pipeline/content-refresher/research.py::ensure_senuto_token.
"""
import hashlib
import hmac
import json
import os
import sys
import time
import urllib.request

DEFAULT_DASHBOARD_URL = "https://zaplecze-dashboard.m-wisniewski.workers.dev"


def resolve_senuto_token() -> None:
    """Best-effort: brak sekretu albo błąd sieci = zostaje token z env."""
    secret = os.environ.get("CW_CALLBACK_SECRET", "").strip()
    base = (os.environ.get("DASHBOARD_URL", "").strip() or DEFAULT_DASHBOARD_URL).rstrip("/")
    if not secret:
        return
    timestamp = str(int(time.time()))
    signature = hmac.new(secret.encode(), f"{timestamp}.".encode(), hashlib.sha256).hexdigest()
    request = urllib.request.Request(f"{base}/api/senuto-token", headers={
        "X-CW-Timestamp": timestamp,
        "X-CW-Signature": signature,
        "User-Agent": "zaplecze-collector/1.0",
    })
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except Exception as err:  # noqa: BLE001
        print(f"[senuto-token] nie pobrano tokenu z dashboardu ({err}) – używam env", file=sys.stderr)
        return
    token = (payload.get("token") or "").strip()
    if token:
        os.environ["SENUTO_API_KEY"] = token
        expires = payload.get("expires_at") or "?"
        print(f"[senuto-token] token z dashboardu, ważny do {expires}")
