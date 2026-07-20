"""Leady i użycia narzędzi widocznosc.ai – eksport z KV przez /api/admin/leads-export.

Auth: Bearer LEADS_EXPORT_TOKEN (ten sam sekret w Cloudflare Pages widocznosc.ai
i w GH Actions). KV trzyma wpisy 90 dni, więc collector utrzymuje kumulacyjne
archiwum w data/<domena>/leads.jsonl (dedupe po id) – dashboard nie traci
starszych leadów po wygaśnięciu TTL.
"""
import json
from pathlib import Path

from . import SourceError
from ._http import classify_http_error, request_json

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
DETAILS_CAP = 1000  # ile najnowszych wpisów per typ trafia do details.json


def _load_archive(path: Path) -> dict[str, dict]:
    records = {}
    if path.is_file():
        for line in path.read_text().splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                rec = json.loads(line)
            except json.JSONDecodeError:
                continue
            if rec.get("id"):
                records[rec["id"]] = rec
    return records


def fetch(cfg: dict, env: dict) -> dict:
    token = env.get("LEADS_EXPORT_TOKEN", "").strip()
    if not token:
        raise SourceError("not_configured", "leads: brak LEADS_EXPORT_TOKEN w env")

    endpoint = cfg.get("endpoint") or f"https://{cfg.get('domain')}/api/admin/leads-export"
    try:
        resp = request_json(endpoint, headers={"Authorization": f"Bearer {token}"})
    except Exception as err:  # noqa: BLE001
        raise classify_http_error(err, "leads") from err

    archive_path = DATA_DIR / cfg.get("domain", "_unknown") / "leads.jsonl"
    records = _load_archive(archive_path)
    for rec in (resp.get("leads") or []) + (resp.get("usage") or []):
        if rec.get("id"):
            records[rec["id"]] = rec

    ordered = sorted(records.values(), key=lambda r: r.get("ts") or "")
    archive_path.parent.mkdir(parents=True, exist_ok=True)
    archive_path.write_text(
        "\n".join(json.dumps(r, ensure_ascii=False) for r in ordered) + ("\n" if ordered else ""))

    leads = [r for r in ordered if r.get("kind") == "lead"]
    usage = [r for r in ordered if r.get("kind") == "usage"]
    return {
        "summary": {"leads_total": len(leads), "usage_total": len(usage)},
        "details": {"leads": leads[-DETAILS_CAP:], "usage": usage[-DETAILS_CAP:]},
    }
