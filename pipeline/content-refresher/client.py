"""Komunikacja z dashboardem: raportowanie postępu przez podpisane callbacki.

Dashboard siedzi za Basic Auth, ale trasa `/api/cw/callback` jest obsługiwana
przed bramką hasła i uwierzytelniana HMAC-SHA256 z ciała żądania. Sekret:
`CW_CALLBACK_SECRET` (ten sam po obu stronach).
"""
import hashlib
import hmac
import json
import os
import time
import urllib.error
import urllib.request


class CallbackError(RuntimeError):
    pass


class DashboardClient:
    def __init__(self, base_url: str, secret: str, job_id: str,
                 run_id: str, run_attempt: int, dry_run: bool = False):
        self.base_url = (base_url or "").rstrip("/")
        self.secret = secret or ""
        self.job_id = job_id
        self.run_id = str(run_id or "local")
        self.run_attempt = int(run_attempt or 1)
        self.dry_run = dry_run or not (self.base_url and self.secret)
        self.sent: list[dict] = []

    def _sign(self, timestamp: str, body: str) -> str:
        return hmac.new(self.secret.encode(), f"{timestamp}.{body}".encode(), hashlib.sha256).hexdigest()

    def send(self, **payload) -> dict:
        """Wysyła callback. W trybie dry-run tylko zapisuje go lokalnie."""
        body = json.dumps(
            {"job_id": self.job_id, "run_id": self.run_id, "run_attempt": self.run_attempt, **payload},
            ensure_ascii=False,
        )
        self.sent.append(json.loads(body))
        if self.dry_run:
            print(f"  [callback:dry-run] {payload.get('status') or ''} "
                  f"{(payload.get('step') or {}).get('name', '')}".rstrip())
            return {"ok": True, "dry_run": True}

        timestamp = str(int(time.time()))
        request = urllib.request.Request(
            f"{self.base_url}/api/cw/callback",
            data=body.encode("utf-8"),
            method="POST",
            headers={
                "Content-Type": "application/json",
                "X-CW-Timestamp": timestamp,
                "X-CW-Signature": self._sign(timestamp, body),
                "User-Agent": "content-refresher",
            },
        )
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                return json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as err:
            detail = err.read().decode("utf-8", "replace")[:500]
            # 409 = zadanie anulowane albo przejęte przez nowszy przebieg.
            # To nie jest błąd pipeline'u, tylko sygnał „przestań pracować".
            raise CallbackError(f"callback HTTP {err.code}: {detail}") from err
        except Exception as err:  # noqa: BLE001
            raise CallbackError(f"callback: {err}") from err

    # --- skróty używane przez kroki ---

    def step_start(self, name: str) -> None:
        self.send(status="running", step={"name": name, "status": "running"})

    def step_done(self, name: str, payload=None, cost=None, model=None, prompt_version=None) -> None:
        self.send(step={
            "name": name, "status": "done", "payload": payload, "cost": cost,
            "model": model, "prompt_version": prompt_version,
        })

    def step_failed(self, name: str, error: str) -> None:
        self.send(step={"name": name, "status": "failed", "error": error[:2000]})

    def step_skipped(self, name: str, reason: str) -> None:
        self.send(step={"name": name, "status": "skipped", "error": reason[:500]})

    def finish(self, status: str, sections=None, cost=None, error=None, snapshot_hash=None) -> None:
        self.send(status=status, sections=sections, cost=cost, error=error, snapshot_hash=snapshot_hash)


def client_from_env(job_id: str, dry_run: bool = False) -> DashboardClient:
    return DashboardClient(
        base_url=os.environ.get("DASHBOARD_URL", ""),
        secret=os.environ.get("CW_CALLBACK_SECRET", ""),
        job_id=job_id,
        run_id=os.environ.get("GITHUB_RUN_ID", "local"),
        run_attempt=int(os.environ.get("GITHUB_RUN_ATTEMPT", "1") or 1),
        dry_run=dry_run,
    )
