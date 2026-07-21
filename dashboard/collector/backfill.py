"""Jednorazowy backfill historii do snapshots.jsonl (Senuto + GSC).

Dokłada linie za brakujące daty wstecz (do BACKFILL_DAYS); istniejących
snapshotów collectora nie dotyka. Linie backfillu mają "backfilled": true.
Źródła bez historii w API (Ahrefs history = Insufficient plan, Clarity 1-3 dni,
salda kont, leady) zaczynają się od daty zbierania.

Uruchomienie: python dashboard/collector/backfill.py (env jak collector).
"""
import json
import os
import sys
import urllib.parse
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from sources._http import request_json  # noqa: E402
from sources.gsc import _access_token, DATA_LAG_DAYS  # noqa: E402

try:
    import yaml
except ImportError:  # pragma: no cover
    yaml = None

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
BACKFILL_DAYS = 365

SENUTO_HISTORY = ("https://api.senuto.com/api/visibility_analysis/reports/"
                  "domain_positions/getPositionsHistoryChartData")
GSC_API = "https://searchconsole.googleapis.com/webmasters/v3/sites"


def senuto_history(cfg: dict, token: str, date_min: str, date_max: str) -> dict[str, dict]:
    """dzień → pola summary Senuto (top3/top10/top50/visibility/domain_rank)."""
    params = urllib.parse.urlencode({
        "domain": cfg.get("domain"),
        "fetch_mode": cfg.get("fetch_mode", "topLevelDomain"),
        "country_id": str(cfg.get("country_id", "200")),
        "date_min": date_min,
        "date_max": date_max,
        "date_interval": "daily",
    })
    resp = request_json(f"{SENUTO_HISTORY}?{params}",
                        headers={"Authorization": f"Bearer {token}"})
    rows = resp.get("data") or []
    main = next((r for r in rows if r.get("main_domain")), rows[0] if rows else None)
    if not main:
        return {}
    series = main.get("data") or {}
    mapping = {"keywords_top3": "top3", "keywords_top10": "top10",
               "keywords_top50": "top50", "visibility": "visibility",
               "domain_rank": "domain_rank"}
    out: dict[str, dict] = {}
    for src_key, dst_key in mapping.items():
        for day, value in (series.get(src_key) or {}).items():
            if value is None:
                continue
            out.setdefault(day, {})[dst_key] = value
    return out


def gsc_history(cfg: dict, sa_json: str, date_min: str, date_max: str) -> dict[str, dict]:
    """dzień → pola summary GSC (clicks/impressions/ctr/position); queries brak w historii."""
    token = _access_token(sa_json)
    site = cfg.get("site") or f"sc-domain:{cfg.get('domain')}"
    endpoint = f"{GSC_API}/{urllib.parse.quote(site, safe='')}/searchAnalytics/query"
    body = json.dumps({
        "startDate": date_min,
        "endDate": date_max,
        "dimensions": ["date"],
        "rowLimit": 25000,
    }).encode()
    resp = request_json(endpoint, data=body, headers={
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    })
    out: dict[str, dict] = {}
    for row in resp.get("rows") or []:
        day = (row.get("keys") or [None])[0]
        if not day:
            continue
        ctr = row.get("ctr")
        position = row.get("position")
        out[day] = {
            "data_date": day,
            "clicks": row.get("clicks", 0),
            "impressions": row.get("impressions", 0),
            "ctr": round(ctr * 100, 2) if isinstance(ctr, (int, float)) else None,
            "position": round(position, 1) if isinstance(position, (int, float)) else None,
        }
    return out


def merge(domain_id: str, per_source: dict[str, dict[str, dict]]) -> tuple[int, str, str]:
    """Dopisz linie backfillu za daty bez snapshotu; zwróć (ile, od, do)."""
    path = DATA_DIR / domain_id / "snapshots.jsonl"
    path.parent.mkdir(parents=True, exist_ok=True)
    existing: dict[str, dict] = {}
    if path.exists():
        for line in path.read_text().splitlines():
            if line.strip():
                snap = json.loads(line)
                existing[snap["date"]] = snap

    all_days = sorted({d for series in per_source.values() for d in series})
    added = 0
    for day in all_days:
        if day in existing:
            # Prawdziwy snapshot collectora ma pierwszeństwo; do linii backfillu
            # można dokładać brakujące źródła (np. GSC w drugim przebiegu).
            snap = existing[day]
            if not snap.get("backfilled"):
                continue
            for source, series in per_source.items():
                if day in series and source not in snap["sources"]:
                    snap["sources"][source] = {"status": "ok", "data": series[day]}
                    added += 1
            continue
        sources = {}
        for source, series in per_source.items():
            if day in series:
                sources[source] = {"status": "ok", "data": series[day]}
        if not sources:
            continue
        existing[day] = {
            "date": day,
            "collected_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "backfilled": True,
            "sources": sources,
        }
        added += 1

    ordered = [existing[d] for d in sorted(existing)]
    path.write_text("\n".join(json.dumps(s, ensure_ascii=False) for s in ordered) + "\n")
    return added, (all_days[0] if all_days else "-"), (all_days[-1] if all_days else "-")


def main() -> None:
    config = yaml.safe_load((ROOT / "domains.yaml").read_text())
    env = os.environ
    today = datetime.now(timezone.utc).date()
    date_min = (today - timedelta(days=BACKFILL_DAYS)).isoformat()

    for domain_cfg in config.get("domains") or []:
        domain_id = domain_cfg["id"]
        per_source: dict[str, dict[str, dict]] = {}

        sen_cfg = domain_cfg.get("senuto") or {}
        if sen_cfg.get("enabled") and env.get("SENUTO_API_KEY"):
            cfg = {"domain": domain_id, **sen_cfg}
            try:
                per_source["senuto"] = senuto_history(
                    cfg, env["SENUTO_API_KEY"].strip(), date_min, today.isoformat())
                print(f"{domain_id} senuto: {len(per_source['senuto'])} dni historii")
            except Exception as err:  # noqa: BLE001
                print(f"{domain_id} senuto: BŁĄD {err}")

        gsc_cfg = domain_cfg.get("gsc") or {}
        if gsc_cfg.get("enabled") and env.get("GSC_SERVICE_ACCOUNT_JSON"):
            cfg = {"domain": domain_id, **gsc_cfg}
            gsc_max = (today - timedelta(days=DATA_LAG_DAYS)).isoformat()
            try:
                per_source["gsc"] = gsc_history(
                    cfg, env["GSC_SERVICE_ACCOUNT_JSON"].strip(), date_min, gsc_max)
                print(f"{domain_id} gsc: {len(per_source['gsc'])} dni historii")
            except Exception as err:  # noqa: BLE001
                print(f"{domain_id} gsc: BŁĄD {err}")
                # 403 to zwykle zły identyfikator property (sc-domain vs prefiks URL)
                # – wypisz, co service account faktycznie widzi.
                try:
                    sa_email = json.loads(env["GSC_SERVICE_ACCOUNT_JSON"]).get("client_email")
                    print(f"  service account: {sa_email}")
                    token = _access_token(env["GSC_SERVICE_ACCOUNT_JSON"].strip())
                    sites = request_json(GSC_API, headers={"Authorization": f"Bearer {token}"})
                    listing = [(s.get("siteUrl"), s.get("permissionLevel"))
                               for s in sites.get("siteEntry") or []]
                    print(f"  properties widoczne dla service accounta: {listing}")
                except Exception as diag_err:  # noqa: BLE001
                    print(f"  (diagnostyka listy properties nie powiodła się: {diag_err})")

        if per_source:
            added, d_from, d_to = merge(domain_id, per_source)
            print(f"{domain_id}: dopisano {added} dni ({d_from} → {d_to})")
        else:
            print(f"{domain_id}: brak danych do backfillu")


if __name__ == "__main__":
    main()
