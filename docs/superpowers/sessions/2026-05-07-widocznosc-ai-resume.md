# Session Resume – widocznosc.ai – 2026-05-07

## Punkt wyjścia

Branch `feat/widocznosc-ai-tailcast` po sesji 2026-05-06 miał 22 strony, Tailcast pivot, handoff B Structural (orange dominant). Hero copy generyczny, oferta nieostra, brak treści PL na blogu (6 EN placeholderów Tailcast).

## Co poszło w 23 commitach (chronologicznie)

### Faza 1 – Reset oferty + Hero (3 commity)
- `40663c6` – nowy hero copy + 3-audit offering (2 free + 1 paid). Po feedbacku usera "co to w ogóle znaczy" o copy "Mierzymy widoczność".
- `6e7655f` – hero asymetryczny 2-col + orbit visual (3 koncentryczne pierścienie obracające się 80s/50s reverse) + logo wall.
- `735f9fd` – ściszony orange flood (3 silne radials → 2 subtelne), szerszy container 1440px max, sub-text white.

### Faza 2 – Audyty (2 commity)
- `cbf0c1d` – audyty 3-card grid (Brand/URL/AI bots) + premium banner Pełny audyt + nowy AI bots tester (wzór kahena.com/ai-bot-tester).
- `428b024` – kosmetyka: "wstęp na" → "dostęp do", acme.pl → twojadomena.pl.

### Faza 3 – Autorzy (4 commity)
- `11fbd8e` – lokalne avatary z `~/Downloads` (3 avif + webp), bio Mateusz/Tomek przepisane.
- `74b68c9` – poprawki bio/zajawek + nowy subtitle ("kilkanaście lat w SEO przekładamy na widoczność w AI").
- `97d8701` – glass-card layout z mocku Stitch + 3 nowe taglines (Strateg/LLM frameworki/inżynieria promptów).
- `f87d7f4` – nazwiska bez łamania (text-xl + whitespace-nowrap) + LinkedIn link per autor.

### Faza 4 – Pełna struktura homepage (2 commity)
- `7880cea` – sekcja Process (4 kroki, 3 dni delivery, stepper z numeracją).
- `fbc90e6` – 4 nowe sekcje: Differentiators / Industries / Authority / FAQ. Zamknęły strukturę 11 sekcji.

### Faza 5 – Obrazy hero (1 commit)
- `b14d7be` – OG image + 4 blog hero przez OpenAI gpt-image-1. Style prefix unified (deep obsidian + orange accents, no text, no people).

### Faza 6 – Blog content (3 commity)
- `149d6bc` – blog reset: 6 EN Tailcast skasowane + 4 PL artykuły authored po 1/autor.
- `375ce5d` – blog listing: cinematic hero + glass cards z hero images (po feedbacku "gdzie tu są obrazki wyróżniające?", mock AIVISION przesłany przez usera).
- `05de573` – Article.astro: sidebar 320px (autor + 3 testy + share) + content styling :global() dla list/tabel/calloutów/code.

### Faza 7 – Writing rules + rewrite (3 commity)
- `8e37851` – `docs/writing-rules.md` (400 linii) – adaptacja z bas3-astro-writer ze słownikiem kalk GEO/AI.
- `20c3c1e` – rewrite 4 artykułów wg writing-rules: tabele, listy, callouty, polskie odpowiedniki kalk.
- `b5c4f1b` – callouty (ciekawostka + opinia eksperta) + modern code blocks (terminal style z 3 traffic-light dots) + sticky sidebar fix (`lg:self-start`) + llms.txt disclaimer.

### Faza 8 – Pipeline review (1 commit)
- `9750ec6` – `pipeline/widocznosc-content-review.py` przez OpenRouter (Gemini 3.1 Pro). Złapał 47 kalk/błędów na 4 artykułach, naniósł korekty automatycznie. Italic dla ciekawostek. Manualne fixy gdzie Gemini wstrzyknął placeholders ("Wymaga weryfikacji", "(Zmień...)").

### Faza 9 – Infografiki (3 commity)
- `c4151ae` + `853d62a` – SVG inline diagram fan-out (Mateusz). Pierwsza wersja miała wcięcia 4+ spaces → Markdown traktował jako code block. Druga: zminifikowany SVG w jednej linii.
- `92656ac` – 4 PNG infografiki przez kie.ai gpt-image-2 (model umie polski tekst, gpt-image-1 nie umie). Klucz w `~/.config/widocznosc-ai/kie.key` (chmod 600), pipeline `widocznosc-infographics-gen.py`. Stary klucz wyciekł, oznaczony w memory jako WYCIEKŁY.

### Faza 10 – Naprawa szczegółów (1 commit)
- `ce6d591` – menu rozwala się na blog (mt-28 → mt-32 lg:mt-36), kalki w mega menu (Tracking → Stałe śledzenie, Citation-first → Wyszukiwarka oparta o cytowania, Skan → Pełny przegląd, 140/m → ~700 mln użytk./tyg.), RecentArticles z Astro Image hero, filtry kategorii w blog listingu (vanilla JS data-category).

## Stan końcowy sesji

- 11 sekcji homepage, wszystkie spójne stylistycznie
- 4 artykuły blog (po 1/autor) z hero PNG + 1 infografiką PNG każdy + dodatkowo 1 SVG dla Mateusza
- Cały content przepuszczony przez Gemini 3.1 Pro fact/kalka review
- Writing-rules.md jako referencja dla każdego nowego artykułu
- 3 pipeline skrypty (images, infographics, review)

## Co dalej (otwarte zadania)

1. 3 SVG diagramy dla Tomek/Piotr/Michał (analogicznie do Mateusza)
2. Plan 24 art na 3 mc z keyword-mapy
3. Lighthouse / a11y audit
4. Visibility Checker MVP (Plan 4)
5. Polityka prywatności + RODO + ICEA legal data
6. Schema.org Article + Person JSON-LD per blog/author
7. llms.txt + ai.txt dla widocznosc.ai (eat your own dogfood)
8. Kontakt formularz submit (CF Worker albo Resend API)

## Klucze – stan bezpieczeństwa

- ⚠️ Stary kie.ai key `b0635a47...` WYCIEKŁ – nie używać. Memory zaktualizowane.
- Nowy kie.ai key w `~/.config/widocznosc-ai/kie.key` (chmod 600) – nie w repo.
- OpenAI key wciąż w memory `reference_openai_api.md` (do GPT-5.4 + gpt-image-1).
- OpenRouter key wciąż w memory `reference_api_credentials.md` (do Gemini 3.1 Pro review).

## Lessons learned z sesji

1. **Markdown indent 4+ spaces = code block.** Inline SVG w `.md` wymaga zminifikowania (jedna linia) lub indent 0-3 spaces.
2. **gpt-image-1 OpenAI nie umie polskiego tekstu.** kie.ai gpt-image-2 umie. Krytyczne dla infografik.
3. **Gemini 3.1 Pro przez OpenRouter dobry do review polszczyzny.** Łapie kalki, halucynacje, AI fingerprints. Skip placeholders ("wymaga weryfikacji") w skrypcie.
4. **Sticky sidebar w grid wymaga `lg:self-start` na grid item.** Bez tego flex stretchy całość i sticky nie działa.
5. **Podawanie kluczy bezpiecznie** – `read -s` w terminalu user'a, plik chmod 600, NIGDY w czacie ani repo.
