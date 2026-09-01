"""Wpisuje do frontmattera `lastmod` = data ostatniego commitu dotykającego plik.

Cloudflare Pages klonuje repo płytko, więc `enableGitInfo` w Hugo widzi tam
tylko jeden commit i nadaje wszystkim stronom datę builda. Daty muszą więc
trafić do samych plików – wtedy build jest odporny na głębokość klonu.

Uruchamiać z katalogu repo. Idempotentny: przy braku zmian w treści nic nie
nadpisuje (data commitu pliku się nie zmienia).

Commity samego przejazdu (temat zawiera „lastmod”) są pomijane – inaczej
każdy kolejny przejazd uznawałby poprzedni za „ostatnią zmianę” wszystkich
stron. Commit z wynikiem skryptu musi więc mieć „lastmod” w temacie.

Bezpiecznik: zwykły przejazd dotyka pojedynczych stron. Gdy zmian byłoby więcej
niż MAX_WRITES, skrypt nic nie zapisuje i wypisuje listę – świadomy masowy
przejazd (np. po korekcie setek wpisów) uruchamia się z `--force`.
`--dry-run` tylko pokazuje, co by się zmieniło.
"""
import subprocess
import sys
from pathlib import Path

CONTENT = Path("portals/busmaniak.pl/content")
MAX_WRITES = 25


SKIP_SUBJECT = "lastmod"


def git_date(path: Path) -> str | None:
    out = subprocess.run(
        ["git", "log", "--format=%cs%x09%s", "--", str(path)],
        capture_output=True, text=True, check=True,
    ).stdout
    for line in out.splitlines():
        date, _, subject = line.partition("\t")
        if SKIP_SUBJECT not in subject.lower():
            return date
    return None


def stamp(path: Path, write: bool = True) -> str:
    date = git_date(path)
    if not date:
        return "skip-nogit"

    text = path.read_text(encoding="utf-8")
    if not text.startswith("---\n"):
        return "skip-nofm"
    end = text.find("\n---\n", 4)
    if end == -1:
        # Strony bez treści (np. szukaj.md) kończą się na zamykającym `---`.
        end = len(text) - 4 if text.endswith("\n---") else -1
    if end == -1:
        return "skip-nofm"

    head, body = text[4:end], text[end:]
    lines = head.split("\n")
    for i, line in enumerate(lines):
        if line.startswith("lastmod:"):
            if line.strip() == f"lastmod: {date}":
                return "unchanged"
            lines[i] = f"lastmod: {date}"
            break
    else:
        # Tuż po `date:`, żeby oba pola stały obok siebie; gdy `date:` nie ma –
        # na końcu frontmattera.
        pos = next((i for i, l in enumerate(lines) if l.startswith("date:")), len(lines) - 1)
        lines.insert(pos + 1, f"lastmod: {date}")

    if write:
        path.write_text("---\n" + "\n".join(lines) + body, encoding="utf-8")
    return "written"


def main() -> int:
    if not CONTENT.is_dir():
        print(f"brak {CONTENT} – uruchom z katalogu repo", file=sys.stderr)
        return 1
    force = "--force" in sys.argv
    dry_run = "--dry-run" in sys.argv

    paths = sorted(CONTENT.rglob("*.md"))
    planned = [p for p in paths if stamp(p, write=False) == "written"]

    if dry_run or (len(planned) > MAX_WRITES and not force):
        for p in planned:
            print(f"  {p}")
        if dry_run:
            print(f"dry-run: do zmiany {len(planned)}")
            return 0
        print(
            f"STOP: {len(planned)} plików do zmiany (próg {MAX_WRITES}). "
            "Sprawdź listę – jeśli to zamierzone, uruchom z --force.",
            file=sys.stderr,
        )
        return 2

    tally: dict[str, int] = {}
    for path in paths:
        result = stamp(path)
        tally[result] = tally.get(result, 0) + 1
    for key in sorted(tally):
        print(f"{key}: {tally[key]}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
