# Sesja 2026-06-02 – widocznosc.ai: naprawa deployu + news o Gemini 3.5 Flash + przegląd kalk

## Zgłoszenie
„Nie opublikował się dziś news" na widocznosc.ai.

## Diagnoza (root cause)
Workflow GH Actions `widocznosc-news.yml` (cron 6:00 UTC) wykonał się i raportował **success** (10:47 UTC), ale news nie wszedł na produkcję. Łańcuch awarii:

1. Pipeline wybrał temat (GM/motoryzacja – off-topic), napisał wpis, ale **3× nie wygenerował hero** (2× timeout kie.ai, 1× odrzut vision za cyfry rzymskie „II").
2. `image_generator.generate_hero_image` na porażkę **zwraca `None`, nie rzuca wyjątku** (sygnatura `-> Path | None`, linie 269/272).
3. `pipeline/news-generator-widocznosc/main.py` obsługiwał fallback **tylko przez `try/except`** i ignorował wartość zwracaną → fallback (`blog-geo-przewodnik.webp`) nigdy się nie odpalił.
4. Frontmatter wpisu wskazał na **nigdy nie powstały** `news-2026-06-02-...webp`. Kolekcja `news` w `content.config.ts` używa `image: image()` → Astro **wywaliło build** → **cały deploy Cloudflare zamrożony od rana** (nie tylko news, każdy push, m.in. `3782fb8`).

Potwierdzenie: commit bota `d7fb833` (2 pliki, bez webp) był na `main`; żywy listing `/news/` stał na MiniMax M3 (2026-06-01); lokalny build padał na brakującym obrazku.

## Co zrobione (commity 3782fb8..235d9b2 na `main`)
- **`7e195de`** `fix(news-widocznosc)`: `main.py` – fallback reaguje teraz także na `None` (nie tylko wyjątek). Zapobiega nawrotom przy timeoutach kie.ai.
- **`6abf924`** `content(widocznosc)`: usunięty off-topic GM-news, w jego miejsce ręcznie napisany **news o Gemini 3.5 Flash** (źródło: oficjalny blog Google + model card DeepMind; fakty zweryfikowane WebSearch – premiera I/O 2026 19.05, bije 3.1 Pro na Terminal-Bench 2.1/MCP Atlas/CharXiv, ~4× szybszy, 1M/65k tokenów, $1,50/$9 za 1M, AI Mode w Search). `published.json` zaktualizowany (GM→Gemini).
- **`9291ca5`** `fix(news-widocznosc)`: korekty kalk w 4 poprzednich newsach (psychoza AI, wolumen→liczba, konsumpcja→przetwarzanie, dedykowany→przeznaczony, GW jako moc, „waży więcej"→„liczy się bardziej", usunięte AI-fingerprinty). **Fakty nietknięte.**
- **`235d9b2`** `content(widocznosc)`: prawdziwy hero dla wpisu o Gemini (kie.ai nano-banana-2 + walidacja vision, 30KB webp), zamiast fallbacku.

## Weryfikacja
- Lokalny `npm run build` zielony (82 strony) z usuniętym GM i nowym wpisem na fallbacku.
- Po pushu poller potwierdził: `/news/gemini-3-5-flash-agentowy-model-google/` live, GM zniknął.
- Po podmianie hero poller potwierdził obrazek live: `/_astro/news-2026-06-02-gemini-3-5-flash-...sd9HFFN7_TWgJM.webp` (HTTP 200).

## Narzędzie recenzujące – wnioski (ważne na przyszłość)
- `pipeline/widocznosc-content-review.py` (OpenRouter, domyślnie `google/gemini-3.1-pro-preview`) bez **`:online`** jest ślepy na świeże fakty (chciał cofnąć Gemini 3.5→1.5, I/O 2026→2024, 65k→8k). `:online` (web search OpenRouter) naprawia to, ale nadal bywa nadgorliwy – flagował realną wojnę amerykańsko-irańską 2026 i realne ~45 mld USD zysku SoftBanku z OpenAI (oba potwierdzone w sieci → zostawione).
- `writing-rules.md` to reguły **bloga**, nie newsów – recenzent błędnie żąda tabel, `<aside>` zamiast `> **Nasz komentarz:**`, usunięcia „W skrócie", zmian frontmatter (`lead`→`description`, usuń `sourceName`/`sourceUrl`). To rozwala build newsa – odrzucone.
- **Błąd procesu:** pierwsze `--apply` na ślepo powstawiało błędy faktów + notatki strukturalne jako tekst (plik trzeba było przywracać). Wniosek: dry-run + ręczna ocena, fakty osobno w sieci.

## Klucze / infra
- Lokalny `KIE_API_KEY` w `.env` i `api-credentials.md` (`b063…731e`) jest **martwy** (Unauthorized) – ważny tylko w sekrecie GH Actions. Aktualny klucz kie.ai do generacji hero podał user w sesji.
- `OPENROUTER_API_KEY` w `api-credentials.md` nieaktualny – aktualny podał user.
- `OPENAI_API_KEY` obecny w środowisku (walidacja vision działa lokalnie).

## Odłożone / otwarte
- Przejście kalk (`:online` dry-run + web-fact-check) po **wpisach bloga** (~46) – do zrobienia w osobnych paczkach, na życzenie.
- Zmiany Codex w worktree (`docs/dokumentacja-busmaniak-proces.html`, usunięty `infographic-rag-przewodnik-uni.png`) – nietknięte, do osobnej obsługi.
