# Sesja 2026-08-14 – bezpieczeństwo narzędzi + reengineering /pozycjonowanie-ai/chatgpt/

## Kontekst
Punkt wyjścia: weryfikacja widoczności widocznosc.ai + przegląd kodu narzędzi + pomysły na przyspieszenie budowy widoczności. Potem analiza konkurenta (widoczni.com/seo-ai/pozycjonowanie-w-chatgpt/) i reengineering własnej podstrony.

## Stan widoczności (2026-08-14)
- Senuto (baza 2.0): 4 frazy w top50, zero w top10; 3 z 4 to frazy osobowe autorów; „pozycjonowanie bing" poz. 38 (wzrost z 51).
- Ahrefs: DR 29, tylko 2 domeny linkujące (grupa-icea.pl DR 68, beautyengine.pl DR 3), zerowy ruch organiczny w bazie.
- Wąskie gardło: profil linkowy, nie treść.

## Paczka 1-4: bezpieczeństwo/bugi narzędzi (WYPCHNIĘTE na main)
- `d09fd633` – ai-bots-check: rate-limit per IP (20/dzień, env `AI_BOTS_DAILY_LIMIT`, KV FANOUT_RL), SSRF-guard (reuse `normalizeUrl`), timeout 10 s + cap 512 KB na robots.txt, bez info-leaku, liczby z `AI_BOTS.length`.
- `ebe0bc12` – jednolita inicjalizacja JS pod ClientRouter: tylko `astro:page-load` (dublowane listenery submit w brand-check/ai-bots-check); url-check opakowany w `initUrlCheck()` (formularz umierał po nawigacji SPA).
- `b6f9cb2c` – brand-check: `gate.commit()` tylko gdy ≥1 model ok.
- `3e4bd07c` – usunięty `Access-Control-Allow-Origin: *` z 3 endpointów (fanout nigdy go nie miał).

## Analiza konkurenta (widoczni.com/seo-ai/pozycjonowanie-w-chatgpt/)
- W świeżym SERP-ie (SerpData) strona ofertowa NIE rankuje – widoczni są na #2-3 wpisem blogowym `/blog/tresci-seo-chatgpt/`; #1 = sembility.com. Pozycja lidera do wzięcia stroną ofertową.
- Klaster (Ahrefs PL): „pozycjonowanie w chatgpt" 251 + „pozycjonowanie chatgpt" 242 + „widoczność w chatgpt" 182 + „pozycjonowanie ai" 90 + „seo ai" 367 (KD 72) ≈ 1100/mies.
- Strona konkurenta: 8519 słów, ~65 nagłówków, framework TOFU/MOFU/BOFU, gotowy prompt + interpretacja ✅/⚠️/❌, inline „SEO AI Checker" (wynik 0-100, pełny raport za e-mail+telefon), 138 linków wewn., ekosystem (/ai-test/, /audyt-ai/, /checklista-seo-ai/, raporty branżowe widoczności marek w AI, ranking agencji).
- Ich słabość: schema tylko sitewide (Breadcrumb+LocalBusiness+Organization), BRAK FAQPage/Service.

## Reengineering /pozycjonowanie-ai/chatgpt/ (NA MAIN LOKALNIE – NIEWYPCHNIĘTE, czeka na akceptację)
- `a97a15ac` – rozbudowa do poradnik+oferta: opcjonalne sekcje deep-dive per model w `aiModelsContent.ts` (funnel TOFU/MOFU/BOFU, promptCheck z interpretacją, tabela seoVsGeo), 1100→2379 słów, FAQ 4→8 (FAQPage JSON-LD), dynamiczna numeracja P/xx, prefill `?domain=`/`?brand=` w brand-check (quick-check z hero wreszcie działa).
- `17f2aa16` – dopracowanie wizualne: realistyczne okno aplikacji ChatGPT (titlebar, chip wyszukiwania, karta rekomendacji, chipy źródeł, input bar) z animacją streamowania (IntersectionObserver + `prefers-reduced-motion`); tabela SEO vs GEO z pigułkami i wyróżnioną kolumną GEO; title „Pozycjonowanie w ChatGPT [2026] – widoczność marki w AI"; 3 linki autorytatywne (Wikipedia ChatGPT, Wikipedia GEO, docs crawlerów OpenAI, wytyczne Google AI features).
- Preview: https://chatgpt-reengineering.widocznosc-ai.pages.dev/pozycjonowanie-ai/chatgpt/ (deploy 72deb4da).
- GIF z aplikacji ChatGPT: odradzony (waga 2-5 MB vs ~3 KB animowanego mocka); jeśli user nagra realną rozmowę, przerobić na lekki WebM.

## Zaległe / następne kroki
1. **Push 2 commitów reengineeringu** po akceptacji preview.
2. Podmiana linków wewnętrznych z wpisów klastra chatgpt/geo na `/pozycjonowanie-ai/chatgpt/` z anchorami „pozycjonowanie w ChatGPT".
3. Link building (główny hamulec): raport branżowy z danych brand-check (wzór: widoczni robią to i zbierają linki), dokończenie cross-domain entity na grupa-icea.pl (JSON-LD gotowy, zalega), mosty contentowe, badge/embed wyniku brand-check.
4. Pozostałe ulepszenia narzędzi: FAQPage + per-tool OG na podstronach narzędzi, cache brand-check w KV (24 h), progresywny render, wspólny tools.css/escapeHtml.
5. Nisko wiszący owoc SERP: `/pozycjonowanie-ai/bing-copilot/` („pozycjonowanie bing" 38→top10).
