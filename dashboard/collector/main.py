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


def indexing_skip_entry(
    domain_cfg: dict,
    domain_dir: Path,
    now: datetime,
    force_skip: bool = False,
) -> dict | None:
    """Harmonogram tygodniowy indeksacji (schedule: weekly w domains.yaml).

    URL Inspection ma kwotę 2000/d/property i pełny przejazd trwa ~1,5 h –
    codzienne odpytywanie to proszenie się o 429. Zasady:
    - pełny przejazd raz w tygodniu (poniedziałkowy cron) albo gdy ostatni
      komplet ma ≥7 dni (fallback),
    - przejazd NIEkompletny (aborted/braki/brak danych) → zbieraj od razu,
      aż się domknie.
    Zwraca wpis snapshotu do przeniesienia (skip) albo None (zbieraj).
    """
    cfg = domain_cfg.get("indexing") or {}
    if not cfg.get("enabled") or cfg.get("schedule") != "weekly":
        return None
    path = domain_dir / "snapshots.jsonl"
    if not path.is_file():
        return None
    entry: dict | None = None
    entry_date = None
    for line in path.read_text().splitlines():
        try:
            snap = json.loads(line)
        except json.JSONDecodeError:
            continue
        candidate = (snap.get("sources") or {}).get("indexing")
        if candidate and candidate.get("status") == "ok" and candidate.get("data"):
            entry, entry_date = candidate, snap.get("date")
    if not entry or not entry_date:
        return None
    data = entry.get("data") or {}
    if force_skip:
        return {**entry, "data": {**data, "as_of": entry_date}}
    complete = (not data.get("aborted")
                and data.get("pages_checked") == data.get("sitemap_urls"))
    if not complete:
        return None  # dociągnij braki niezależnie od dnia tygodnia
    age_days = (now.date() - datetime.strptime(entry_date, "%Y-%m-%d").date()).days
    if now.weekday() == 0 or age_days >= 7:
        return None  # cotygodniowy pełny przejazd
    return {**entry, "data": {**data, "as_of": entry_date}}


def source_ok_today(domain_dir: Path, source: str, today: str) -> bool:
    """Czy źródło ma już dziś udany odczyt (ostatnia linia snapshots.jsonl).

    Clarity ma limit 10 wywołań/dzień/projekt, a jeden przebieg zużywa 4 –
    trzeci run tego samego dnia (push-triggery) pali limit do zera. Udany
    dzisiejszy odczyt = kolejne przebiegi nie odpytują ponownie (write_snapshot
    i tak zachowuje wcześniejszy ok, a details merge trzyma listy).
    """
    path = domain_dir / "snapshots.jsonl"
    if not path.is_file():
        return False
    lines = path.read_text().splitlines()
    if not lines:
        return False
    try:
        last = json.loads(lines[-1])
    except json.JSONDecodeError:
        return False
    entry = (last.get("sources") or {}).get(source) or {}
    return last.get("date") == today and entry.get("status") == "ok"


ONCE_DAILY_SOURCES = ("clarity",)


def main() -> int:
    load_local_env()
    config = yaml.safe_load(CONFIG_PATH.read_text())
    now = datetime.now(timezone.utc)
    stamp = {"date": now.strftime("%Y-%m-%d"),
             "collected_at": now.strftime("%Y-%m-%dT%H:%M:%SZ")}

    for domain in config.get("domains") or []:
        domain_id = domain["id"]
        print(f"[{domain_id}]")
        skip_indexing = indexing_skip_entry(
            domain,
            DATA_DIR / domain_id,
            now,
            force_skip=os.environ.get("COLLECTOR_SKIP_INDEXING") == "1",
        )
        if skip_indexing:
            domain = {**domain, "indexing": {**domain["indexing"], "enabled": False}}
            reason = "push – bez kosztownej inspekcji URL" if os.environ.get("COLLECTOR_SKIP_INDEXING") == "1" else "weekly"
            print(f"  [indexing] skip ({reason}; dane z {skip_indexing['data'].get('as_of')})")
        for once_daily in ONCE_DAILY_SOURCES:
            if (domain.get(once_daily) or {}).get("enabled") and \
                    source_ok_today(DATA_DIR / domain_id, once_daily, stamp["date"]):
                domain = {**domain, once_daily: {**domain[once_daily], "enabled": False}}
                print(f"  [{once_daily}] skip (dzisiejszy odczyt już jest – oszczędzam limit)")
        sources, details = run_sources(DOMAIN_SOURCES, domain, {"domain": domain_id})
        if skip_indexing:
            sources["indexing"] = skip_indexing
        write_snapshot(DATA_DIR / domain_id, {**stamp, "sources": sources})
        write_details(DATA_DIR / domain_id, stamp, details)

    global_cfg = config.get("global") or {}
    if global_cfg:
        print("[_global]")
        sources, _ = run_sources(GLOBAL_SOURCES, global_cfg, {})
        write_snapshot(DATA_DIR / "_global", {**stamp, "sources": sources})

        from alerts import check_credit_alerts
        check_credit_alerts(sources, global_cfg.get("alerts") or {}, os.environ)

    return 0


if __name__ == "__main__":
    sys.exit(main())
