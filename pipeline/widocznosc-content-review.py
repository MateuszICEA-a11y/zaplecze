#!/usr/bin/env python3
"""Content review – wywołuje LLM (przez OpenRouter) do weryfikacji draftu artykułu
pod kątem halucynacji, kalk językowych i poprawnej polszczyzny.

Bazuje na writing-rules.md (portals/widocznosc.ai/docs/writing-rules.md).
Domyślnie zwraca tylko propozycje poprawek (preview). Z flagą --apply
nanosi je automatycznie (ostrożnie – tylko gdy "original" pasuje dokładnie
jeden raz w treści).

Usage:
    OPENROUTER_API_KEY="sk-or-v1-..." python3 pipeline/widocznosc-content-review.py PATH/TO/ARTICLE.md
    OPENROUTER_API_KEY="sk-or-v1-..." python3 pipeline/widocznosc-content-review.py PATH/TO/ARTICLE.md --apply

Env vars:
    OPENROUTER_API_KEY  – wymagane
    REVIEW_MODEL        – domyślnie "google/gemini-3.1-pro-preview".
                          Alternatywy: "openai/gpt-5.5", "openai/gpt-5.5-pro",
                          "anthropic/claude-opus-4.7"

Output: JSON z listą issues (typ, severity, original, suggested, reason).
"""
import argparse
import json
import os
import re
import sys
import urllib.request
import urllib.error

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RULES_PATH = os.path.join(
    ROOT, "portals", "widocznosc.ai", "docs", "writing-rules.md"
)
API_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = os.environ.get("REVIEW_MODEL", "google/gemini-3.1-pro-preview")

SYSTEM_PROMPT = """Jesteś senior redaktorem polskojęzycznego portalu widocznosc.ai – tematyka: GEO, AI Search, SEO. Twoja rola to znaleźć w tekście artykułu KONKRETNE problemy językowe i merytoryczne i zaproponować poprawki.

Patrzysz na 4 kategorie błędów:

1. **kalka_jezykowa** – anglicyzmy, kalki leksykalne ("synthetic queries", "passage", "chunkable", "front-loading", "dedykowany" w sensie "wyspecjalizowany", "adresować problem"), niepoprawne polskie terminy techniczne. Konkretne polskie odpowiedniki znajdziesz w writing-rules. Sprawdź też nieoczywiste kalki kolokacji, gdzie podmiot logicznie nie wykonuje czynności.

2. **halucynacja** – nieprawdziwe lub niezweryfikowalne fakty: nieprawidłowe daty, błędne nazwiska, wymyślone nazwy badań, nieistniejące funkcje narzędzi. Wskaż KONKRETNIE co jest do weryfikacji. Nie zgaduj – jeśli czegoś nie wiesz, oznacz jako "wymaga weryfikacji" w polu reason.

3. **gramatyka** – błędy fleksji (przypadki po przyimkach, "jako" + biernik, spójnik "i" łączy człony w tym samym przypadku), zgodność rodzaju przy nieoczywistych rzeczownikach (sygnatura ż, rozpoznanie n), konstrukcje czasowe (porządkowy + miejscownik vs główny + dopełniacz), literówki typu "kompetenacja" zamiast "kompetencja".

4. **stylistyka** – AI fingerprints z blacklisty ("warto podkreślić", "w niniejszym artykule", "niekwestionowany lider", "innowacyjne rozwiązanie"), telegraficzne zlepki w prozie, brak różnicowania długości zdań/akapitów, ścianki tekstu bez burstiness.

ZASADY ODPOWIEDZI:
- Zwracasz WYŁĄCZNIE valid JSON, bez wstępu, bez wyjaśnień, bez ```json``` znaczników
- Format: {"issues": [{"type":"kalka_jezykowa","severity":"high","original":"…","suggested":"…","reason":"…"}, ...]}
- Pole "original" musi być DOKŁADNYM cytatem z tekstu (case-sensitive, łącznie ze spacjami i interpunkcją), żeby skrypt mógł zrobić find/replace. Bierz krótkie fragmenty (2–8 słów), nie całe akapity.
- "suggested" to konkretna proponowana zamiana
- "severity": high (zmiana zalecana wprost), medium (warto rozważyć), low (kosmetyka)
- "reason" to 1 zdanie – co dokładnie jest nie tak
- Jeśli artykuł nie ma znaczących problemów, zwróć pustą listę: {"issues":[]}

NIE zwracaj duplikatów – jeśli ten sam problem występuje wielokrotnie, wystarczy jedno wystąpienie.

Limit: max 25 issues per artykuł. Priorytetuj kalki językowe i halucynacje."""


def load_rules() -> str:
    if not os.path.exists(RULES_PATH):
        return ""
    with open(RULES_PATH, "r", encoding="utf-8") as f:
        return f.read()


def call_openrouter(article: str, rules: str, api_key: str) -> dict:
    user_msg = f"""# Writing rules (kontekst dla Twojej oceny)

{rules[:8000]}

# Artykuł do review

{article}

Zwróć JSON z listą issues. Tylko valid JSON, bez ```json```.
"""
    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_msg},
        ],
        "temperature": 0.2,
        "response_format": {"type": "json_object"},
    }
    req = urllib.request.Request(
        API_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://widocznosc.ai",
            "X-Title": "widocznosc.ai content review",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=180) as resp:
        body = json.loads(resp.read().decode("utf-8"))

    content = body["choices"][0]["message"].get("content")
    if not content:
        raise RuntimeError(
            f"Empty model response. Raw body: {json.dumps(body)[:500]}"
        )
    content = content.strip()
    if content.startswith("```"):
        content = re.sub(r"^```(?:json)?\s*", "", content)
        content = re.sub(r"\s*```\s*$", "", content)
    return json.loads(content)


SKIP_SUGGESTED_PATTERNS = (
    "wymaga weryfikacji",
    "do weryfikacji",
    "[verify]",
    "[?]",
    "(weryfikacja",
    "wymaga sprawdzenia",
    "(zmień",
    "(do wpisania",
    "(do uzupełnienia",
    "(uzupełnij",
    "(merytoryczny nagłówek",
    "tbd",
    "todo",
)


def apply_fixes(article: str, issues: list, dry_run: bool = True) -> tuple[str, list]:
    """Zwraca (nowy_tekst, applied_log).
    Aplikuje issue tylko gdy original pasuje DOKŁADNIE jeden raz w tekście.
    """
    text = article
    applied = []
    skipped = []

    for issue in issues:
        original = issue.get("original", "")
        suggested = issue.get("suggested", "")
        if not original or original == suggested:
            continue
        # Skip placeholder / verification flags (model używa ich jako uwagi, nie poprawki)
        sl = suggested.lower()
        if any(p in sl for p in SKIP_SUGGESTED_PATTERNS):
            skipped.append({**issue, "skip_reason": "suggested = placeholder/flag"})
            continue
        count = text.count(original)
        if count == 0:
            skipped.append({**issue, "skip_reason": "original nie znaleziony"})
            continue
        if count > 1:
            skipped.append(
                {**issue, "skip_reason": f"original wielokrotnie ({count}x) – ambigous"}
            )
            continue
        if not dry_run:
            text = text.replace(original, suggested, 1)
        applied.append(issue)

    return text, {"applied": applied, "skipped": skipped}


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("path", help="Ścieżka do pliku .md")
    p.add_argument(
        "--apply",
        action="store_true",
        help="Zastosuj poprawki (domyślnie: dry-run, tylko preview)",
    )
    p.add_argument(
        "--severity",
        default="medium",
        choices=["high", "medium", "low"],
        help="Minimalny poziom severity do aplikowania (domyślnie: medium)",
    )
    args = p.parse_args()

    api_key = os.environ.get("OPENROUTER_API_KEY", "").strip()
    if not api_key:
        print("ERROR: set OPENROUTER_API_KEY env var", file=sys.stderr)
        return 1

    if not os.path.exists(args.path):
        print(f"ERROR: file not found: {args.path}", file=sys.stderr)
        return 1

    with open(args.path, "r", encoding="utf-8") as f:
        article = f.read()

    rules = load_rules()
    if not rules:
        print(f"WARN: writing-rules.md not found at {RULES_PATH}", file=sys.stderr)

    print(f"Model: {MODEL}", file=sys.stderr)
    print(f"Plik: {args.path}", file=sys.stderr)
    print(f"Reguły: {len(rules)} znaków", file=sys.stderr)
    print(f"Artykuł: {len(article)} znaków\n", file=sys.stderr)

    try:
        result = call_openrouter(article, rules, api_key)
    except urllib.error.HTTPError as e:
        err = e.read().decode("utf-8", errors="replace")
        print(f"HTTP {e.code}: {err[:500]}", file=sys.stderr)
        return 2
    except (json.JSONDecodeError, KeyError) as e:
        print(f"Failed to parse model response: {e}", file=sys.stderr)
        return 2

    severity_rank = {"high": 3, "medium": 2, "low": 1}
    min_rank = severity_rank[args.severity]
    issues = [
        i
        for i in result.get("issues", [])
        if severity_rank.get(i.get("severity", "low"), 1) >= min_rank
    ]

    by_type = {}
    for i in issues:
        by_type.setdefault(i.get("type", "?"), []).append(i)

    print(f"=== {len(issues)} issues (severity ≥ {args.severity}) ===")
    for kind, items in sorted(by_type.items()):
        print(f"\n  {kind}: {len(items)}")
        for it in items[:8]:
            sev = it.get("severity", "?")
            orig = (it.get("original", "") or "")[:80]
            sug = (it.get("suggested", "") or "")[:80]
            reason = (it.get("reason", "") or "")[:120]
            print(f"    [{sev}] {orig!r}")
            print(f"      → {sug!r}")
            print(f"      ({reason})")

    new_text, log = apply_fixes(article, issues, dry_run=not args.apply)
    print(f"\n=== Apply summary ===")
    print(f"  applied: {len(log['applied'])}")
    print(f"  skipped: {len(log['skipped'])}")
    for s in log["skipped"][:5]:
        print(f"    skip [{s.get('severity')}]: {s.get('skip_reason')} – {(s.get('original') or '')[:60]!r}")

    if args.apply and log["applied"]:
        with open(args.path, "w", encoding="utf-8") as f:
            f.write(new_text)
        print(f"\n✓ Zapisano poprawki do {args.path}")
    elif not args.apply:
        print(f"\n  (dry-run – uruchom z --apply żeby zastosować)")

    return 0


if __name__ == "__main__":
    sys.exit(main())
