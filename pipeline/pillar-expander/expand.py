#!/usr/bin/env python3
"""
Pillar Page Expander – BusManiak.pl
====================================
Two-pass expansion of modele/_index.md pillar pages using GPT-5.4.

Pass 1: GPT-5.4 audits the pillar page and identifies:
  - Factual errors / hallucinations
  - Missing H2 sections (compared to benchmark structure)
  - Thin H2/H3 sections lacking concrete data
  Provides concrete data/numbers for every gap found.

Pass 2: GPT-5.4 rewrites the full article:
  - Applies all error fixes
  - Fills all gaps using ONLY data from Pass 1
  - May add new H2 sections if identified as missing
  - Preserves all existing content (image, youtube, faq, lead, internal links)

Usage:
  python expand.py <path-to-_index.md>           # single file
  python expand.py --batch modele/               # all _index.md in section
  python expand.py --batch modele/ --top 15      # top 15 by volume
"""

import os
import sys
import json
import time
import argparse
import re
from pathlib import Path
import urllib.request
import urllib.error

# ─── Config ──────────────────────────────────────────────────────────────────

OPENAI_KEY_FILE = Path("/mnt/c/projekty/keys/openai.txt")
OPENAI_KEY = OPENAI_KEY_FILE.read_text().strip()
OPENAI_URL = "https://api.openai.com/v1/chat/completions"
MODEL      = "gpt-5.4"

CONTENT_ROOT = Path(__file__).parent.parent.parent / "portals/busmaniak.pl/content"
MODELE_ROOT  = CONTENT_ROOT / "modele"

# ─── Prompts ─────────────────────────────────────────────────────────────────

PASS1_SYSTEM = """Jesteś ekspertem motoryzacyjnym i redaktorem portalu BusManiak.pl (busy dostawcze, kampery, vanlife, przepisy, wynajem). Audytujesz strony-filary modeli pojazdów.

Twoje zadanie: przeczytaj podaną stronę-filar (pillar page) modelu i zwróć JSON z dwoma tablicami: "errors" i "gaps".

BENCHMARK – dobrze rozbudowana strona-filar MUSI zawierać te sekcje H2:
1. Historia i generacje (z H3 per generacja, lata produkcji, kluczowe zmiany)
2. Dane techniczne i wymiary (tabela wariantów L/H, pojemności, DMC, ładowność)
3. Silniki (tabela lub H3 per silnik: moc, moment, norma Euro, spalanie)
4. Wersje nadwoziowe (lista z opisem: furgon, kombi, podwozie, kampery itp.)
5. Typowe usterki (H3 per silnik/układ: konkretne usterki, koszty napraw w PLN)
6. Porównanie z konkurencją (tabela: min. 2 rywale, kluczowe cechy)
7. Ceny (tabela: ceny używanych wg rocznika + cena nowego)

BŁĘDY (errors) – szukaj:
- Błędne dane techniczne (DMC, ładowność, wymiary, lata produkcji, nazwy silników)
- Pomylone generacje / mylne oznaczenia (np. W906 zamiast W907)
- Nieistniejące wersje lub silniki
- Halucynacje: zmyślone statystyki, nieistniejące badania, fałszywe fakty
- Wycieki promptu / meta-tekst AI: [TODO], "oto artykuł", "warto podkreślić"
- Niespójność: różne wartości tego samego parametru w różnych sekcjach

LUKI (gaps) – szukaj:
- Brakujące sekcje H2 z listy benchmark (jeśli nie ma jej w artykule)
- Sekcja H2/H3 istnieje, ale ma tylko 1-3 zdania ogólników bez liczb
- Brak tabeli z danymi technicznymi mimo że sekcja o tym traktuje
- Brak konkretnych kosztów napraw w sekcji usterek
- Brak tabeli cen używanych

WAŻNE – dla każdej luki w polu "data" podaj KONKRETNE fakty, liczby, parametry, które redaktor może wkleić bez własnego researchu. Ogólniki ("warto dodać dane") są bezużyteczne.

FORMAT – wyłącznie JSON:
{
  "errors": [
    {
      "type": "fact_error|hallucination|inconsistency|prompt_leak",
      "location": "## Nazwa sekcji H2 / ### H3",
      "original": "cytat z artykułu (max 100 znaków)",
      "issue": "opis problemu",
      "fix": "poprawna wartość lub USUŃ"
    }
  ],
  "gaps": [
    {
      "type": "missing_section|thin_content|missing_table|missing_specs|missing_prices|missing_competitors",
      "location": "## Nazwa nowej sekcji H2 lub istniejącej sekcji do rozbudowy",
      "topic": "czego dokładnie brakuje",
      "data": "KONKRETNE dane: liczby, tabele, parametry, koszty – wszystko co potrzebne do napisania sekcji",
      "priority": "high|medium"
    }
  ]
}

Jeśli artykuł nie ma błędów ani luk: {"errors":[],"gaps":[]}
Zgłaszaj tylko realne luki – nie wymuszaj uzupełnień tam gdzie treść jest wystarczająca."""

PASS2_SYSTEM = """Jesteś Redaktorem Naczelnym portalu BusManiak.pl (busy dostawcze, kampery, vanlife, przepisy, wynajem). Rozbudowujesz strony-filary modeli pojazdów.

TWOJE ZADANIE:
1. Zastosuj WSZYSTKIE poprawki z listy błędów (errors)
2. Uzupełnij artykuł o brakujące treści na podstawie listy luk (gaps)
   – pisz nowe sekcje/akapity korzystając WYŁĄCZNIE z danych w polu "data"
3. Dla luk typu "missing_section": dodaj nową sekcję H2 we właściwym miejscu
4. Wypoleruj styl całego tekstu

ŹRÓDŁA WIEDZY:
- Korzystaj WYŁĄCZNIE z danych dostarczonych przez audytora (pola "fix" i "data")
- NIE dodawaj faktów których nie ma ani w artykule ani w listach errors/gaps
- Wyjątek: shortcody, formatowanie, naturalne łączniki stylistyczne

GDZIE WSTAWIAĆ NOWE SEKCJE H2:
- "missing_section: Typowe usterki" → po sekcji Silniki, przed Porównaniem
- "missing_section: Porównanie z konkurencją" → przed Cenami lub na końcu
- "missing_section: Ceny" → jako ostatnia sekcja
- Jeśli location wskazuje istniejącą sekcję → rozbuduj ją w miejscu

STYL – EKSPERCKI BLOG MOTORYZACYJNY:
ZAKAZANE: "Ten wspaniały pojazd zachwyca niezrównaną przestronnością..."
ZAKAZANE: "Warto podkreślić, że nie sposób nie wspomnieć..."
ZAKAZANE: "W przedmiocie eksploatacji jednostki napędowej..."
DOBRZE: "Ducato L3H3 mieści 4 europalety – zmieścisz je bez kombinowania."
DOBRZE: "Wymiana łańcucha rozrządu co 200 tys. km to nie sugestia – przeskoczony = wygięte zawory i rachunek 6000 zł."

FORMATOWANIE:
- Tabele z wyrównanymi kolumnami Markdown
- Listy z myślnikiem (-) lub pogrubieniem (**Model** – opis)
- Zakresy liczbowe: **200–500 zł** (pogrubiony cały zakres, półpauza –)
- Akapity max 3-4 zdania, zróżnicowana długość
- Po każdym H2 → krótki akapit wprowadzający przed pierwszym H3

SHORTCODY (używaj kontekstowo, max 1-2 per artykuł):
- {{% info title="Tytuł" icon="info" %}} ... {{% /info %}}
- {{% expert name="Marek Kowalczyk" %}} ... {{% /expert %}}
- {{% youtube %}} – ZACHOWAJ dokładnie w miejscu gdzie jest w oryginale

KRYTYCZNE – FRONTMATTER:
- ZACHOWAJ CAŁY oryginalny frontmatter (--- ... ---) bez żadnych zmian
- NIE usuwaj, NIE modyfikuj: title, date, author, image, lead, faq, youtube, sources
- NIE przenoś FAQ z frontmatter do body
- NIE dodawaj ## FAQ w treści

REGUŁY TREŚCI:
- Body po frontmatter MUSI zaczynać się od ## H2 (nie akapit wstępny)
- Zachowaj wszystkie istniejące linki wewnętrzne ([tekst](/ścieżka/))
- Link Wikipedia: max 1 w body, tylko do pojęcia technicznego (NIE nazwa modelu)
- Frazy kluczowe odmieniane naturalnie (nie suche mianowniki)
- Półpauza (–), nie pauza (—)
- Polskie znaki: sprawdź cały tekst

Zwróć WYŁĄCZNIE kompletny artykuł Markdown (bez komentarzy, bez wyjaśnień). Artykuł MUSI zaczynać się od --- (frontmatter)."""

# ─── OpenAI API ──────────────────────────────────────────────────────────────

def gpt(system: str, user: str, max_tokens: int = 16000) -> str:
    payload = json.dumps({
        "model": MODEL,
        "max_completion_tokens": max_tokens,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user",   "content": user},
        ]
    }).encode()

    req = urllib.request.Request(
        OPENAI_URL,
        data=payload,
        headers={
            "Authorization": f"Bearer {OPENAI_KEY}",
            "Content-Type":  "application/json",
        }
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        data = json.loads(resp.read())

    return data["choices"][0]["message"]["content"]

# ─── Validation ──────────────────────────────────────────────────────────────

def validate(original: str, corrected: str) -> tuple[bool, str]:
    if not corrected.strip().startswith("---"):
        return False, "MISSING FRONTMATTER"

    parts = corrected.split("---", 2)
    if len(parts) < 3:
        return False, "MALFORMED FRONTMATTER"

    fm   = parts[1]
    body = parts[2]

    for field in ["title:", "author:", "date:"]:
        if field not in fm:
            return False, f"MISSING FIELD: {field}"

    orig_parts = original.split("---", 2)
    orig_fm = orig_parts[1] if len(orig_parts) >= 3 else ""

    if "faq:" in orig_fm and "faq:" not in fm:
        return False, "FAQ STRIPPED from frontmatter"

    if "lead:" in orig_fm and "lead:" not in fm:
        return False, "LEAD STRIPPED"

    if "image:" in orig_fm and "image:" not in fm:
        return False, "IMAGE STRIPPED"

    if "youtube:" in orig_fm and "youtube:" not in fm:
        return False, "YOUTUBE STRIPPED"

    if re.search(r'\n## FAQ', body):
        return False, "FAQ moved into body"

    body_stripped = body.strip()
    if not body_stripped.startswith("## "):
        return False, f"BODY NOT H2: starts with '{body_stripped[:60]}'"

    if len(corrected) < len(original) * 0.85:
        return False, f"OUTPUT TOO SHORT: {len(corrected)} vs {len(original)} chars (>15% shrink)"

    return True, "OK"


def auto_repair(original: str, corrected: str) -> str | None:
    orig_parts = original.split("---", 2)
    if len(orig_parts) < 3:
        return None

    original_fm = "---" + orig_parts[1] + "---\n\n"

    body = corrected
    faq_pos = body.find("\n## FAQ")
    if faq_pos != -1:
        body = body[:faq_pos].rstrip()

    # strip frontmatter if model accidentally added one
    if body.strip().startswith("---"):
        body_parts = body.split("---", 2)
        body = body_parts[2] if len(body_parts) >= 3 else body

    repaired = original_fm + body.strip() + "\n"
    ok, _ = validate(original, repaired)
    return repaired if ok else None

# ─── Core pipeline ───────────────────────────────────────────────────────────

def process_file(path: Path, dry_run: bool = False) -> dict:
    result = {"file": str(path), "status": "?", "errors": 0, "gaps": 0, "note": ""}

    original = path.read_text(encoding="utf-8")

    # ── Pass 1 ──
    print(f"  Pass 1 (audit)...", end=" ", flush=True)
    t0 = time.time()
    try:
        raw = gpt(PASS1_SYSTEM, f"PILLAR PAGE:\n\n{original}", max_tokens=8000)
    except Exception as e:
        result.update(status="ERROR", note=f"Pass1 API error: {e}")
        print(f"ERROR: {e}")
        return result

    # strip code fence if present
    raw = re.sub(r'^```json\s*', '', raw.strip())
    raw = re.sub(r'```\s*$', '', raw.strip())

    try:
        audit = json.loads(raw)
    except json.JSONDecodeError:
        # try extracting JSON object
        m = re.search(r'\{.*\}', raw, re.DOTALL)
        if m:
            try:
                audit = json.loads(m.group())
            except Exception:
                result.update(status="ERROR", note="Pass1 JSON parse failed")
                print("ERROR: JSON parse failed")
                return result
        else:
            result.update(status="ERROR", note="Pass1 no JSON found")
            print("ERROR: no JSON in response")
            return result

    errors = audit.get("errors", [])
    gaps   = audit.get("gaps",   [])
    t1 = time.time()
    print(f"{len(errors)} errors, {len(gaps)} gaps ({t1-t0:.0f}s)")

    result["errors"] = len(errors)
    result["gaps"]   = len(gaps)

    if not errors and not gaps:
        result["status"] = "clean"
        return result

    if dry_run:
        result["status"] = "dry_run"
        return result

    # ── Pass 2 ──
    print(f"  Pass 2 (expand)...", end=" ", flush=True)
    t2 = time.time()

    user_msg = (
        f"BŁĘDY OD AUDYTORA:\n{json.dumps(errors, ensure_ascii=False, indent=2)}\n\n"
        f"LUKI DO UZUPEŁNIENIA:\n{json.dumps(gaps, ensure_ascii=False, indent=2)}\n\n"
        f"ARTYKUŁ:\n{original}"
    )

    try:
        enriched = gpt(PASS2_SYSTEM, user_msg, max_tokens=16000)
    except Exception as e:
        result.update(status="ERROR", note=f"Pass2 API error: {e}")
        print(f"ERROR: {e}")
        return result

    t3 = time.time()
    print(f"done ({t3-t2:.0f}s)", end=" ")

    # ── Validate ──
    ok, msg = validate(original, enriched)
    if not ok:
        repaired = auto_repair(original, enriched)
        if repaired:
            ok2, msg2 = validate(original, repaired)
            if ok2:
                enriched = repaired
                ok = True
                print(f"[auto-repaired]", end=" ")

    if not ok:
        result.update(status="VALIDATION_FAILED", note=msg)
        print(f"VALIDATION FAILED: {msg}")
        return result

    path.write_text(enriched, encoding="utf-8")
    result["status"] = "expanded"
    print(f"✅ ({len(enriched)} chars, was {len(original)})")
    return result

# ─── Batch helpers ───────────────────────────────────────────────────────────

def get_volume(path: Path) -> int:
    try:
        text = path.read_text(encoding="utf-8")
        m = re.search(r'^volume:\s*(\d+)', text, re.MULTILINE)
        return int(m.group(1)) if m else 0
    except Exception:
        return 0


def collect_pillar_pages(section: Path, top: int | None = None) -> list[Path]:
    files = sorted(section.glob("*/_index.md"))
    if top:
        files = sorted(files, key=get_volume, reverse=True)[:top]
    return files

# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Expand BusManiak.pl pillar pages with GPT-5.4")
    parser.add_argument("target", help="Path to _index.md file, or section dir with --batch")
    parser.add_argument("--batch",   action="store_true", help="Process all _index.md in section")
    parser.add_argument("--top",     type=int, default=None, help="In batch mode: process top N by volume")
    parser.add_argument("--dry-run", action="store_true", help="Run Pass 1 only, don't write files")
    args = parser.parse_args()

    target = Path(args.target)

    if args.batch:
        files = collect_pillar_pages(target, top=args.top)
        print(f"Found {len(files)} pillar pages to process")
        print(f"Estimated cost: ~${len(files) * 0.25:.2f}\n")
        results = []
        for i, f in enumerate(files, 1):
            model = f.parent.name
            print(f"[{i}/{len(files)}] {model}")
            r = process_file(f, dry_run=args.dry_run)
            results.append(r)
            time.sleep(1)  # brief pause between requests

        # Summary table
        print("\n" + "─" * 65)
        print(f"{'Model':<35} {'Errors':>6} {'Gaps':>5} {'Status':<20}")
        print("─" * 65)
        for r in results:
            model = Path(r["file"]).parent.name
            print(f"{model:<35} {r['errors']:>6} {r['gaps']:>5} {r['status']:<20}")
        print("─" * 65)
        done    = sum(1 for r in results if r["status"] in ("expanded", "clean"))
        expanded = sum(1 for r in results if r["status"] == "expanded")
        clean   = sum(1 for r in results if r["status"] == "clean")
        failed  = sum(1 for r in results if r["status"] not in ("expanded", "clean", "dry_run"))
        print(f"Total: {len(results)} | Expanded: {expanded} | Clean: {clean} | Failed: {failed}")

    else:
        path = Path(args.target)
        if not path.exists():
            print(f"File not found: {path}")
            sys.exit(1)
        model = path.parent.name
        print(f"Processing: {model}")
        r = process_file(path, dry_run=args.dry_run)
        print(f"\nResult: {r['status']} | errors:{r['errors']} gaps:{r['gaps']}")
        if r["note"]:
            print(f"Note: {r['note']}")


if __name__ == "__main__":
    main()
