# Sesja 2026-06-03 – budowa skilla widocznosc-blog-polish (wygładzanie PL + fact-check bloga)

## Punkt wyjścia
Pytanie usera: „wczorajszy fact check i poprawna polszczyzna newsów – mamy ten proces?". Diagnoza: proces BYŁ, ale rozjechany – fact-check przez `/web-fact-check`, polszczyzna przez `widocznosc-content-review.py` na `gemini-3.1-pro` (z 3 obejściami: `:online`, dry-run, odrzucanie uwag strukturalnych z `writing-rules.md` bloga przy newsach). User: „potrzebuję przejechać tym wszystkie opublikowane wpisy blogowe – zbudujmy skilla".

## Co zrobione (pełny cykl superpowers: brainstorming → spec → plan → subagent-driven)
- **Spec:** `docs/superpowers/specs/2026-06-03-widocznosc-blog-polish-design.md` (commit `af551c6`).
- **Plan:** `docs/superpowers/plans/2026-06-03-widocznosc-blog-polish.md`, 12 tasków TDD (commit `719929c`).
- **Implementacja** (subagent-driven, na `main`, ~20 commitów `bfc79f2`..HEAD): nowy skill `pipeline/widocznosc-blog-polish/` (SKILL.md, README.md, scripts/smoother.py, scripts/state.py, tests/ – 40 testów zielonych).

## Architektura skilla
- **smoother.py** – pełny rewrite prozy przez Gemini 3.1 Pro (OpenRouter), z placeholder-protection (frontmatter/kod/nagłówki/linki/shortcode'y/**callouty `<aside>`/tabele/obrazy(alt)/tagi HTML/znaczniki list**) + **diff-guard**: każda zmiana liczby lub nazwy modelu w prozie ALBO zgubiony token → plik `rejected`, oryginał nietknięty. Statusy: smoothed/unchanged/rejected/error (exit 2 przy error).
- **Orkiestrator (SKILL.md)** – paczki per kategoria (prompty→…→geo), Pass 1 wygładzanie + commit, Pass 2 fact-check (istniejący web-fact-checker, apply tylko przy zgodzie A+B) + osobny commit, manifest idempotencji.
- **Routing kluczy:** Gemini→`OPENROUTER_API_KEY` (OpenRouter), GPT-5.5→`OPENAI_API_KEY` (bezpośrednio OpenAI).

## Review (dwustopniowy + finalny) – wyłapane i naprawione realne błędy
- **Krytyczny:** `RULES_PATH` miał o jeden `dirname` za mało → reguły kalk nigdy by się nie ładowały. Fix: `Path(__file__).resolve().parents[3]`.
- **Krytyczny:** regex nazw modeli mostkował zdania → fałszywe odrzuty. Fix.
- **Ważny:** `NUMBER_RE` gubił sufiks jednostki (`1M→1K`, `65k→8k` przechodziły). Fix + test.
- **Finalny:** callouty/tabele/obrazy były wystawione modelowi mimo deklaracji „zamrożone" → dodana ochrona + 4 testy.

## Pilot na żywym API (geo/share-of-voice.md) – kluczowe wnioski
- ✅ Pipeline działa e2e; ✅ po fixach diff-guard PRZECHODZI; ✅ wszystkie fakty (liczby, modele, linki, tabele, kalkulacja 47/222=21%, trendy) nietknięte; ✅ polszczyzna realnie lepsza (teza usera o Gemini 3.1 Pro się potwierdza).
- Pilot wymusił 4 dodatkowe fixy: MODEL_MENTION_RE `[\w \-]{0,20}?`, normalizacja liczb (rstrip „.,"), zamrażanie znaczników list, `SMOOTHER_TIMEOUT` default 600s (180s timeoutował 19-min przewodnik).
- ⚠️ **NIEROZWIĄZANE (decyzja na jutro):** model bierze redakcyjne wolności poza zasięgiem diff-guarda: (1) dodaje zdania wprowadzające przed tabelami mimo zakazu, (2) parafrazuje angielski cytat Britney Muller „brand mentions are the new backlinks" na polski bez cudzysłowu.

## NASTĘPNY KROK (jutro – wznawiamy stąd)
User wybrał: **zacieśnić SYSTEM_PROMPT w smoother.py** (twardy zakaz zdań wprowadzających/podsumowujących + cytaty DOSŁOWNIE, też angielskie, w cudzysłowie) → **re-pilot na 1 wpisie** → dopiero potem realny przejazd 46 wpisów. Otwarta mocniejsza opcja: dodatkowo zamrozić cytaty placeholderem (ryzyko over-freeze „…" jako emfazy). Potrzebny świeży `OPENROUTER_API_KEY` (ten z dziś był w czacie – do rotacji).
