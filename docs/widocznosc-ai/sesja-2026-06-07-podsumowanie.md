# Sesja 2026-06-07 – wygładzanie newsów widocznosc.ai (Gemini 3.1 Pro)

## Cel
Pytanie startowe: czy ostatnie newsy przeszły przez wygładzanie Gemini 3.1 Pro?
Odpowiedź: NIE – skill `widocznosc-blog-polish` celowo omijał newsy (działał tylko na
`src/content/blog/`). Decyzja: (1) wygładzić istniejące newsy jednorazowo, (2) wpiąć
wygładzanie na stałe w auto-pipeline newsów.

## Proces
Pełny cykl superpowers: brainstorming → spec → writing-plans → subagent-driven-development
(implementer + 2-stopniowy review per task) → finishing-a-development-branch.
- Spec: `docs/superpowers/specs/2026-06-07-widocznosc-news-polish-integration-design.md`
- Plan: `docs/superpowers/plans/2026-06-07-widocznosc-news-polish-integration.md`
- Branch `feat/news-polish` → merge do `main` → push.

## Decyzje projektowe (brainstorm)
1. Podejście: pełny rewrite Gemini 3.1 Pro **+ ochrona głosu redakcji**.
2. Integracja: **in-process w `main.py`** (między `postprocess()` a zapisem).
3. Fail-safe: **publikuj oryginał + loguj** (news nigdy nie pada przez wygładzanie).
4. Zakres części 1: ostatnie 6 newsów (29.05–03.06).
5. `lead:` we frontmatterze: bez zmian (smoother nie wysyła frontmattera).
6. Ochrona głosu: protect `BLOCKQUOTE` globalnie w smootherze (cytat = dosłowny, poprawne też dla bloga).
7. Reguły promptu dla newsa: tylko proza (`news_rules()` – słownik kalk + blacklista AI + fleksja), bez reguł strukturalnych bloga.

## Co zrobione (kod – na origin/main, d3fbc01)
- `418f65a` – protect `BLOCKQUOTE` w `smoother.py` (zamraża `> **Nasz komentarz:**`) + 2 testy. Suite blog-polish: 43 passed.
- `5c1adf7` – most `pipeline/news-generator-widocznosc/smoother_bridge.py`: `smooth_news()` (fail-safe, nigdy nie rzuca) + `news_rules()` (proza z writing-rules) + 4 testy.
- `e2c5cf2` – wpięcie `smooth_news` w `main.py` (krok 10b, przed zapisem). Suite news: 34 passed.
- `8e1087a` – `OPENROUTER_API_KEY` w `.github/workflows/widocznosc-news.yml`.
- Sekret `OPENROUTER_API_KEY` w GitHub Actions: **JEST** (potwierdzone przez usera) → cron wygładza automatycznie.

## Przejazdy treści
- **Część 1**: 6 newsów (29.05–03.06) → 6/6 smoothed. Commit `3a5a2dc` + raport `40d26a7`. Na origin/main.
- **Część 2 (luka)**: 4 newsy z crona (04–07.06: amazon-proteus, claude-pisze-kod, google-zewnetrzna-moc, spor-centrum-danych) powstały przed wdrożeniem → wygładzone ręcznie, 4/4 smoothed. Commit `b373ed7` na main – **NIEPUSHNIĘTY** (czeka na push usera).
- Raport: `portals/widocznosc.ai/podstrony-review/news-polish-2026-06-07.md`.

## Weryfikacja jakościowa (wszystkie 10 newsów)
Bezpieczne: fakty (diff-guard), głos redakcji `> **Nasz komentarz:**` (nowy protect BLOCKQUOTE),
frontmatter, liczba akapitów 1:1 (model nie dopisał zdań).
**Obserwacja zaakceptowana przez usera**: model systematycznie podwaja/potraja pogrubienia
(śródtekstowe + przebudowa etykiet list) – restyling ponad samo wygładzanie. User: akceptuję.
Jeśli kiedyś przeszkadzają → dołożyć newsom regułę „NIE dodawaj pogrubień" w `news_rules()`
(bez wpływu na blog).

## Gotcha (merge)
Lokalny `main` rozjechał się z `origin/main` (cron dopisał 11 commitów: auto-newsy + fb-poster).
Czysty rozdział plików (moje 6 newsów i niezwiązane zmiany w drzewie nietknięte na origin) →
merge `origin/main` do brancha bez konfliktu, potem `main` ff do brancha, push (`0f809f1..d3fbc01`).
Rebase odpadł (brudne drzewo z cudzej sesji Codex blokuje).

## Stan końcowy / TODO
- `main` lokalny: ahead 1 (`b373ed7`) – **user musi pushnąć**, żeby 4 newsy z crona trafiły na produkcję.
- Klucz OpenRouter w gitignored `pipeline/.env` (user świadomie nie rotuje – klucz ma limit).
- Od następnego crona każdy nowy news wychodzi wygładzony.
