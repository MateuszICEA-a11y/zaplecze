"""Jednorazowe dociągnięcie prawdziwych tytułów wpisów konkurencji.

Collector bierze 30 tytułów na hosta dziennie – przy ~3500 zaległych adresach
to kilka miesięcy. Ten skrypt robi całość w jednym przebiegu (GH Actions,
workflow competitor-titles.yml) z tymi samymi regułami: tempo wg robots.txt
(widoczni.com: Crawl-delay 10 s), czytanie tylko do </head>.

    python dashboard/collector/competitor_titles.py --dry-run 20
    python dashboard/collector/competitor_titles.py --max-minutes 330
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

from sources import competitor_kind  # noqa: E402
from sources.competitors import DATA_DIR, drop_generic_titles, fetch_titles, needs_title  # noqa: E402


def log(message: str) -> None:
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}", flush=True)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--domain", default="grupa-icea.pl")
    parser.add_argument("--dry-run", type=int, metavar="N", help="N losowych adresów na hosta, bez zapisu")
    parser.add_argument("--max-minutes", type=float, default=330)
    parser.add_argument("--kinds", action="store_true", help="tylko klasyfikacja typu stron (LLM), bez pobierania")
    args = parser.parse_args()

    path = DATA_DIR / args.domain / "competitors.json"
    data = json.loads(path.read_text(encoding="utf-8"))

    if args.kinds:
        log(f"tytuły wspólne dla wielu stron odrzucone: {drop_generic_titles(data['items'])}")
        stats = competitor_kind.classify(data["items"], os.environ["OPENROUTER_API_KEY"], log=log)
        path.write_text(json.dumps(data, ensure_ascii=False, indent=0) + "\n", encoding="utf-8")
        log(json.dumps(stats, ensure_ascii=False))
        return 0
    now = datetime.now(timezone.utc)
    todo = [item for item in data["items"] if needs_title(item, now)]

    if args.dry_run:
        rng = random.Random(7)
        sample = []
        for host in sorted({item["host"] for item in todo}):
            rows = [dict(item) for item in todo if item["host"] == host]
            sample += rng.sample(rows, min(args.dry_run, len(rows)))
        stats = fetch_titles(sample, None, log=log)
        for item in sample:
            print(f"{item['host']:<17} {item['slug_title'][:45]:<45} → {item.get('title') or '!! ' + str(item.get('title_error'))}")
        print(json.dumps(stats, ensure_ascii=False))
        return 0

    log(f"do pobrania: {len(todo)} adresów")
    stats = fetch_titles(todo, None, deadline=time.monotonic() + args.max_minutes * 60, log=log)
    log(json.dumps(stats, ensure_ascii=False))
    log(f"tytuły wspólne dla wielu stron odrzucone: {drop_generic_titles(data['items'])}")
    path.write_text(json.dumps(data, ensure_ascii=False, indent=0) + "\n", encoding="utf-8")
    missing = sum(1 for item in data["items"] if not item.get("title"))
    log(f"zapisano; bez tytułu: {missing}/{len(data['items'])}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
