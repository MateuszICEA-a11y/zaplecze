"""Collector dashboardu analitycznego.

Iteruje domeny z domains.yaml × źródła, zapisuje dzienny snapshot (1 linia JSONL
per domena per dzień) do dashboard/data/<domena>/snapshots.jsonl oraz salda kont
do dashboard/data/_global/snapshots.jsonl.

Jedno padnięte źródło nie blokuje pozostałych – status ląduje w snapshotcie
("ok" | "error" | "token_expired" | "not_configured"), a proces kończy się
kodem 0, żeby cron nie padał na wygasłym tokenie Senuto.

Idempotencja: re-run tego samego dnia nadpisuje ostatnią linię zamiast dublować.
"""
import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import yaml

from sources import DOMAIN_SOURCES, GLOBAL_SOURCES, SourceError

DASHBOARD_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = DASHBOARD_DIR / "data"
CONFIG_PATH = DASHBOARD_DIR / "domains.yaml"
REQUEST_GAP_S = 0.3  # rate-limit między wywołaniami API (konwencja z pipeline/)


def load_local_env() -> None:
    """Dociąga zmienne z .env (repo root + collector) bez nadpisywania env procesu."""
    for env_path in (DASHBOARD_DIR.parent / ".env", DASHBOARD_DIR / "collector" / ".env"):
        if not env_path.is_file():
            continue
        for line in env_path.read_text().splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def run_sources(registry: dict, enabled_cfg: dict, extra_cfg: dict) -> tuple[dict, dict]:
    """Uruchamia źródła z rejestru wg konfiguracji.

    Zwraca (sources, details): sources = sekcja snapshotu (podsumowania, szczupły
    JSONL), details = sekcja details.json (listy: frazy, domeny linkujące itd.).
    Źródło zwracające {"summary": ..., "details": ...} jest rozdzielane; płaski
    dict trafia w całości do snapshotu (kompatybilność wstecz).
    """
    results = {}
    details = {}
    for name, fetch in registry.items():
        cfg = dict(enabled_cfg.get(name) or {})
        if not cfg.pop("enabled", False):
            continue
        cfg.update(extra_cfg)
        try:
            data = fetch(cfg, os.environ)
            if isinstance(data, dict) and "summary" in data:
                if data.get("details") is not None:
                    details[name] = data["details"]
                data = data["summary"]
            results[name] = {"status": "ok", "data": data}
            print(f"  [{name}] ok")
        except SourceError as err:
            results[name] = {"status": err.kind, "error": err.message}
            print(f"  [{name}] {err.kind}: {err.message}", file=sys.stderr)
        except Exception as err:  # noqa: BLE001 – twarda siatka bezpieczeństwa per źródło
            results[name] = {"status": "error", "error": f"{name}: {err}"}
            print(f"  [{name}] error: {err}", file=sys.stderr)
        time.sleep(REQUEST_GAP_S)
    return results, details


def write_snapshot(target_dir: Path, snapshot: dict) -> None:
    """Append do snapshots.jsonl; linia z tą samą datą jest nadpisywana.

    Per źródło: błąd z późniejszego przebiegu tego samego dnia nie nadpisuje
    wcześniejszego wyniku ok (np. Clarity 429 po wyczerpaniu limitu 10 req/dzień
    przez dodatkowe przebiegi push-triggered nie kasuje danych z crona 6:30).
    """
    target_dir.mkdir(parents=True, exist_ok=True)
    path = target_dir / "snapshots.jsonl"
    lines = path.read_text().splitlines() if path.is_file() else []
    if lines:
        try:
            last = json.loads(lines[-1])
            if last.get("date") == snapshot["date"]:
                lines = lines[:-1]
                for source, previous in (last.get("sources") or {}).items():
                    current = snapshot["sources"].get(source)
                    if (previous.get("status") == "ok"
                            and (current is None or current.get("status") != "ok")):
                        snapshot["sources"][source] = previous
        except json.JSONDecodeError:
            pass
    lines.append(json.dumps(snapshot, ensure_ascii=False))
    path.write_text("\n".join(lines) + "\n")


def write_details(target_dir: Path, stamp: dict, details: dict) -> None:
    """details.json: najświeższe listy (frazy, domeny, leady) – nadpisywane w całości.

    Źródło, które dziś padło, zachowuje wczorajsze listy (merge po kluczu źródła),
    żeby chwilowy błąd API nie czyścił tabel na dashboardzie.
    """
    target_dir.mkdir(parents=True, exist_ok=True)
    path = target_dir / "details.json"
    previous = {}
    if path.is_file():
        try:
            previous = json.loads(path.read_text()).get("sources") or {}
        except json.JSONDecodeError:
            pass
    merged = {**previous, **details}
    if not merged:
        return
    path.write_text(json.dumps({**stamp, "sources": merged}, ensure_ascii=False, indent=1) + "\n")


def main() -> int:
    load_local_env()
    config = yaml.safe_load(CONFIG_PATH.read_text())
    now = datetime.now(timezone.utc)
    stamp = {"date": now.strftime("%Y-%m-%d"),
             "collected_at": now.strftime("%Y-%m-%dT%H:%M:%SZ")}

    for domain in config.get("domains") or []:
        domain_id = domain["id"]
        print(f"[{domain_id}]")
        sources, details = run_sources(DOMAIN_SOURCES, domain, {"domain": domain_id})
        write_snapshot(DATA_DIR / domain_id, {**stamp, "sources": sources})
        write_details(DATA_DIR / domain_id, stamp, details)

    global_cfg = config.get("global") or {}
    if global_cfg:
        print("[_global]")
        sources, _ = run_sources(GLOBAL_SOURCES, global_cfg, {})
        write_snapshot(DATA_DIR / "_global", {**stamp, "sources": sources})

    return 0


if __name__ == "__main__":
    sys.exit(main())
