# Raport przejazdu: wygładzanie 6 newsów (Gemini 3.1 Pro) – 2026-06-07

Część 1 planu `docs/superpowers/plans/2026-06-07-widocznosc-news-polish-integration.md`.
Jednorazowy przejazd `smoother.py` (z dodaną ochroną blockquote) po 6 ostatnich newsach.
Commit treści: `3a5a2dc`.

## Statusy

| News | Status | pogrubienia (przed → po) |
|------|--------|--------------------------|
| internet-coraz-bardziej-pod-maszyny (2026-05-29) | smoothed | 4 → 8 |
| gdy-firmy-przesadzaja-z-ai (2026-05-30) | smoothed | 7 → 13 |
| softbank-…-centra-danych-we-francji (2026-05-31) | smoothed | 1 → 9 |
| minimax-m3-otwarty-model-milion-tokenow (2026-06-01) | smoothed | 4 → 11 |
| gemini-3-5-flash-agentowy-model-google (2026-06-02) | smoothed | 1 → 9 |
| android-…-podszywania-sie-w-polaczeniach (2026-06-03) | smoothed | 4 → 11 |

**6/6 smoothed** – zero rejectów diff-guarda, zero błędów API.

## Weryfikacja jakościowa (przed commitem)

Bezpieczne (potwierdzone diffem):
- **Fakty** – liczby, daty, nazwy/wersje modeli: bez zmian (diff-guard przepuścił wszystkie 6).
- **Głos redakcji** – `> **Nasz komentarz:**` nietknięty we wszystkich 6 (nowy protect `BLOCKQUOTE`).
- **Frontmatter** – `lead:`, `date:`, `sourceUrl:`, `tags:` itd. nietknięte (smoother nie wysyła frontmattera do modelu).
- **Struktura akapitów** – liczba niepustych linii bez zmian (np. softbank 27→27, gemini 26→26); model nie dopisał ani nie usunął zdań.

Obserwacja (zaakceptowana przez właściciela treści):
- Model **systematycznie dodał pogrubienia** (śródtekstowe + przeredagowane etykiety list) – patrz tabela. To restyling ponad samo wygładzanie polszczyzny. Decyzja: **akceptujemy** (poprawiają skanowalność; w listach format `**Termin** – opis` zgodny z regułami).
- Efekt uboczny: `clean_model_output` usuwa wiodący whitespace, więc zniknęła pusta linia między frontmatterem a pierwszym `## H2`. Frontmatter parsuje się poprawnie (drugi `---` w linii 14 we wszystkich plikach), build Astro bez wpływu.

## Wnioski na przyszłość

- Auto-pipeline (`main.py` → `smooth_news`) wygładza każdy NOWY news automatycznie (sekret `OPENROUTER_API_KEY` w GitHub Actions już ustawiony).
- Jeśli pogrubienia w newsach okażą się niepożądane: dołożyć newsom regułę „NIE dodawaj nowych pogrubień" w `news_rules()`/prompcie (bez wpływu na blog, który pogrubień chce).
