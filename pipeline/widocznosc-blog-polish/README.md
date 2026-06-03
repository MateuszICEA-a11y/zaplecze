# widocznosc-blog-polish

Wygładzanie polszczyzny + fact-check wpisów bloga widocznosc.ai. Szczegóły flow: `SKILL.md`.

## Smoother (pojedynczy plik)

```bash
OPENROUTER_API_KEY="sk-or-..." \
python3 pipeline/widocznosc-blog-polish/scripts/smoother.py \
  portals/widocznosc.ai/src/content/blog/prompty/przewodnik.md --dry-run
```

Wyjście: JSON `{file, status, detail}`. `status`:
- `smoothed` – wygładzono (bez `--dry-run` plik nadpisany),
- `unchanged` – model nie wprowadził zmian,
- `rejected` – diff-guard wykrył zmianę faktu/tokenu (oryginał nietknięty), powód w `detail`,
- `error` – błąd wywołania modelu (oryginał nietknięty; kod wyjścia `2`).

## Gwarancje (diff-guard)

Frontmatter, kod, linki, shortcode'y, nagłówki, callouty `<aside>`, tabele, obrazy (z alt-tekstem)
i pozostałe tagi HTML są zamrażane (placeholder) – model ich nie widzi (proza wewnątrz calloutów
i komórek tabel nie jest więc wygładzana).
Liczby i nazwy modeli w prozie są porównywane przed/po; każda zmiana → `rejected`.

## Testy

```bash
python3 -m pytest pipeline/widocznosc-blog-polish/tests/ -v
```
