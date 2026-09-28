"""Jednorazowe dociągnięcie prawdziwych tytułów i dat publikacji wpisów konkurencji.

Collector bierze 30 tytułów na hosta dziennie – przy ~3500 zaległych adresach
to kilka miesięcy. Ten skrypt robi całość w jednym przebiegu (GH Actions,
workflow competitor-titles.yml) z tymi samymi regułami: tempo wg robots.txt
(widoczni.com: Crawl-delay 10 s), czytanie do 400 KB strony.

    python dashboard/collector/competitor_titles.py --dry-run 20
    python dashboard/collector/competitor_titles.py --max-minutes 330
    python dashboard/collector/competitor_titles.py --hosts delante.pl,traffictrends.pl
      (tylko wybrani konkurenci – widoczni.com z Crawl-delay 10 s trwa ~5 h)
    SENUTO_API_KEY=… OPENROUTER_API_KEY=… python dashboard/collector/competitor_titles.py --potential
      (bez pobierania stron: ranking z Senuto teraz, nie po tygodniu, i szacunki młodych wpisów)
    OPENROUTER_API_KEY=… python dashboard/collector/competitor_titles.py --kinds
      (bez pobierania stron: odrzuca tytuły wspólne dla wielu stron i klasyfikuje typ)
"""
import argparse
import json
import os
import random
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from sources import competitor_kind, competitor_potential  # noqa: E402
from sources.competitors import DATA_DIR, drop_generic_titles, fetch_titles, needs_page  # noqa: E402


def log(message: str) -> None:
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}", flush=True)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--domain", default="grupa-icea.pl")
    parser.add_argument("--dry-run", type=int, metavar="N", help="N losowych adresów na hosta, bez zapisu")
    parser.add_argument("--max-minutes", type=float, default=330)
    parser.add_argument("--kinds", action="store_true", help="tylko klasyfikacja typu stron (LLM), bez pobierania")
    parser.add_argument("--hosts", help="tylko ci konkurenci, po przecinku")
    parser.add_argument("--potential", action="store_true", help="tylko potencjał z Senuto, bez pobierania stron")
    args = parser.parse_args()

    path = DATA_DIR / args.domain / "competitors.json"
    data = json.loads(path.read_text(encoding="utf-8"))

    if args.kinds:
        log(f"tytuły wspólne dla wielu stron odrzucone: {drop_generic_titles(data['items'])}")
        stats = competitor_kind.classify(data["items"], os.environ["OPENROUTER_API_KEY"], log=log)
        path.write_text(json.dumps(data, ensure_ascii=False, indent=0) + "\n", encoding="utf-8")
        log(json.dumps(stats, ensure_ascii=False))
        return 0
    if args.potential:
        import yaml  # tylko tu – workflow tytułów nie instaluje PyYAML

        config = yaml.safe_load((Path(__file__).resolve().parents[1] / "domains.yaml").read_text(encoding="utf-8"))
        domain = next(d for d in config["domains"] if d["id"] == args.domain)
        meta = {**(data.get("senuto") or {}), "fetched_at": None}  # wymuszenie rankingu mimo tygodniowego rytmu
        data["senuto"], stats = competitor_potential.update(
            data["items"], domain["competitors"]["sites"], meta, os.environ, datetime.now(timezone.utc), log=log)
        path.write_text(json.dumps(data, ensure_ascii=False, indent=0) + "\n", encoding="utf-8")
        log(json.dumps(stats, ensure_ascii=False))
        return 0
    now = datetime.now(timezone.utc)
    hosts = set(args.hosts.split(",")) if args.hosts else None
    todo = [item for item in data["items"] if needs_page(item, now) and (not hosts or item["host"] in hosts)]

    if args.dry_run:
        rng = random.Random(7)
        sample = []
        for host in sorted({item["host"] for item in todo}):
            rows = [dict(item) for item in todo if item["host"] == host]
            sample += rng.sample(rows, min(args.dry_run, len(rows)))
        stats = fetch_titles(sample, None, log=log)
        for item in sample:
            print(f"{item['host']:<17} {item['slug_title'][:45]:<45} → {item.get('title') or '!! ' + str(item.get('title_error'))} | {item.get('published') or '–'}")
        print(json.dumps(stats, ensure_ascii=False))
        return 0

    log(f"do pobrania: {len(todo)} adresów")
    stats = fetch_titles(todo, None, deadline=time.monotonic() + args.max_minutes * 60, log=log)
    log(json.dumps(stats, ensure_ascii=False))
    log(f"tytuły wspólne dla wielu stron odrzucone: {drop_generic_titles(data['items'])}")
    path.write_text(json.dumps(data, ensure_ascii=False, indent=0) + "\n", encoding="utf-8")
    missing = sum(1 for item in data["items"] if not item.get("title"))
    dated = sum(1 for item in data["items"] if item.get("published"))
    log(f"zapisano; bez tytułu: {missing}/{len(data['items'])}, z datą publikacji: {dated}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
