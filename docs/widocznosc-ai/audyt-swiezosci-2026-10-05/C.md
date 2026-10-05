# Audyt świeżości – paczka C (grok, copilot, deepseek, perplexity, jev)

Data audytu: 2026-10-05. Baseline: `docs/widocznosc-ai/stan-modeli-2026-10-05.md`. Poprzedni audyt tej paczki: `docs/widocznosc-ai/audyt-swiezosci-2026-09-25/C.md` (2026-09-25). Pliki: `portals/widocznosc.ai/src/content/blog/modele-llm/`. Żaden plik serwisu nie był edytowany.

Priorytety: **P1** – błąd / nieaktualne twierdzenie; **P2** – brak ważnej nowości; **P3** – drobne.

## Status poprzednich poprawek (audyt 2026-09-25)

Dobra wiadomość: **26 z 27 poprzednich zgłoszeń zostało wdrożonych** (grok.md: G1–G8, G10, G11; copilot.md: C1–C4; deepseek.md: D1–D5; perplexity.md: X1–X5; jev.md: J1). Sprawdzone punkt po punkcie w treści plików – cytaty, daty i ceny z poprawek z 2026-09-25 są obecne w aktualnych wersjach plików.

Niewdrożone/częściowo otwarte:
- **grok.md, G9** (SuperGrok – progi Lite/Plus/Heavy) – wciąż nie wdrożone; wciąż tylko „ok. 30 USD miesięcznie”, bez wzmianki o dodatkowych progach. Pozostaje NIEZWERYFIKOWANE (nie udało się potwierdzić w źródle pierwotnym grok.com również w tej sesji). Patrz G1 niżej.
- **jev.md, J2** (zastrzeżenie, że ewaluacja TypeSafe nie obejmuje modeli po Claude Opus 5.5/GPT-6 Sol/Luna) – nie wdrożone. Patrz J1 niżej – zastrzeżenie jest dziś jeszcze bardziej uzasadnione (od 22–29.09 i 28.09 rynek dodał kolejne cztery nowe modele: GPT-6.1 Sol, Claude Sonnet 5.5, Claude Opus 5.5 już uwzględniony, Grok 4.7 już uwzględniony).

## Nowe nieaktualności z okna 2026-09-25 → 2026-10-05

Rynek w tym okresie wydał Claude Sonnet 5.5 (28.09), GPT-6.1 Sol (29.09), rozszerzył modele w Microsoft 365 Copilot Cowork/Studio (30.09) i sfinalizował wycofanie Perplexity Sonar API (27.09). Z tych zmian w badanej paczce realnie dotyczy to **copilot.md** (nowe modele Microsoft) i **perplexity.md** (domknięcie wycofania Sonar API, wymaga zmiany czasu z przyszłego na dokonany). grok.md, deepseek.md i jev.md nie wymagają poprawek P1 w tym oknie – xAI nie zmieniło niczego istotnego od 21.09, a artykuły o DeepSeeku i Jev nie zawierają twierdzeń sprzecznych z nowym baseline'em (poza drobnym P3 w deepseek.md, patrz D1).

Podsumowanie: **P1 – 0**, **P2 – 3**, **P3 – 2** (razem 5).

| Plik | P1 | P2 | P3 |
|---|---|---|---|
| grok.md | 0 | 0 | 1 |
| copilot.md | 0 | 1 | 0 |
| deepseek.md | 0 | 0 | 1 |
| perplexity.md | 0 | 1 | 0 |
| jev.md | 0 | 1 | 0 |

---

## grok.md

Wszystkie poprawki z 2026-09-25 (G1–G8, G10, G11) wdrożone: Grok 4.7 jako flagowiec, marka SpaceXAI, wiedza do maja 2026, cennik dwupoziomowy ($2/$6 do 200 tys. tokenów, $4/$12 powyżej – linie 130–135, **zgodny z nowym baseline'em**, nie wymaga zmian), dystrybucja do Cursora/GitHub Copilot/Agent API Perplexity. Brak nowych zmian u xAI/SpaceXAI w oknie 2026-09-25→10-05 (baseline: „bez zmian”).

### G1 – P3 (poprawka przeniesiona z audytu 2026-09-25, G9 – wciąż niewdrożona)
- **Miejsce:** grok.md:24, 96
- **Cytat:** „SuperGrok – płatna subskrypcja (ok. 30 USD miesięcznie)”
- **Problem:** Jak w poprzednim audycie: według źródeł wtórnych SuperGrok ma dziś dodatkowe progi (Lite ok. 10 USD, Plus ok. 100 USD, Heavy ok. 300 USD) poza podstawowym planem 30 USD. Nie udało się potwierdzić tego w źródle pierwotnym (grok.com) w żadnej z dwóch sesji audytowych.
- **Poprawka:** Do ręcznej weryfikacji na grok.com przed zmianą treści; jeśli potwierdzone: „SuperGrok – płatne subskrypcje od ok. 10 USD (Lite) do 300 USD miesięcznie (Heavy); podstawowy SuperGrok kosztuje ok. 30 USD.”
- **Źródło:** NIEZWERYFIKOWANE (źródło wtórne z poprzedniego audytu: suprmind.ai/hub/grok/pricing)

---

## copilot.md

Poprawki C1–C4 z 2026-09-25 wdrożone (modele Anthropic/OpenAI w selektorze, lista GitHub Copilot, trzy poziomy licencji M365 Copilot).

### C1 – P2
- **Miejsce:** copilot.md:90 (oraz źródło w linii 51, „What is Microsoft Copilot?”)
- **Cytat:** „a od 22 września 2026 roku Microsoft wprowadza w Wordzie, Excelu, PowerPoincie, czacie, Cowork i Copilot Studio także Claude Opus 5.5 i GPT-6 Sol (dostępność zależy od licencji i regionu).”
- **Problem:** Brak najnowszej zmiany: od **30 września 2026** Microsoft 365 Copilot zaczął dodatkowo wdrażać **GPT-6.1 Sol** i **Claude Sonnet 5.5** w Copilot Cowork i Copilot Studio (rozliczanie usage-based, wymaga włączenia subprocesorów Anthropic i OpenAI przez administratora), z fazowym wdrożeniem do Word/Excel/PowerPoint/Chat w kolejnym tygodniu. To dodatek do wcześniejszych modeli (GPT-6 Sol, Claude Opus 5.5), nie ich zamiennik – oba zestawy współistnieją.
- **Poprawka:** „a od 22 września 2026 roku Microsoft wprowadza w Wordzie, Excelu, PowerPoincie, czacie, Cowork i Copilot Studio także Claude Opus 5.5 i GPT-6 Sol (dostępność zależy od licencji i regionu). Od 30 września 2026 roku w Cowork i Copilot Studio dostępne są dodatkowo GPT-6.1 Sol i Claude Sonnet 5.5, z fazowym wdrożeniem do Worda, Excela, PowerPointa i czatu w kolejnych tygodniach.”
- **Źródło (wtórne):** https://mc.merill.net/message/MC1483844 (M365 Message Center MC1483844, potwierdzone WebSearch 2026-10-05); techcommunity.microsoft.com niedostępny w tej sesji – do potwierdzenia z pierwszej ręki przy najbliższej okazji.

---

## deepseek.md

Poprawki D1–D5 z 2026-09-25 wdrożone (porównanie cenowe z GPT-6 Astra/Sol/Luna, cennik, parametry V4.1-Flash, tryb wyszukiwania w aplikacji).

### D1 – P3
- **Miejsce:** deepseek.md:144 (oraz źródło w liniach 78–80, „GPT-6 Sol”)
- **Cytat:** „a wydany 22 września 2026 roku GPT-6 Sol – 2 i 10 USD. Oznacza to, że V4.1-Flash jest w warstwie wejściowej ok. 7 razy tańszy od GPT-6 Sol […], a V4-Pro – ok. 1,5 raza tańszy od GPT-6 Sol.”
- **Problem:** Porównanie liczbowo wciąż poprawne (GPT-6.1 Sol ma tę samą cenę co GPT-6 Sol: 2/10 USD), ale od **29 września 2026** to GPT-6.1 Sol – ulepszona wersja bliższa poziomowi GPT-6 Astry – jest aktualnym modelem średniej półki OpenAI, a nie sam GPT-6 Sol. Brak tej informacji nie jest błędem liczbowym, ale czyni porównanie niekompletnym.
- **Poprawka:** „a wydany 22 września 2026 roku GPT-6 Sol – 2 i 10 USD (od 29 września 2026 roku dostępna jest też ulepszona, podobnie wyceniana wersja GPT-6.1 Sol, bliższa poziomem GPT-6 Astrze). Oznacza to, że V4.1-Flash jest w warstwie wejściowej ok. 7 razy tańszy od GPT-6 Sol/GPT-6.1 Sol […]”
- **Źródło:** stan-modeli-2026-10-05.md (sekcja 2, potwierdzone wielokrotnie w źródłach wtórnych – developers.openai.com niedostępny w tej sesji)

---

## perplexity.md

Poprawki X1–X5 z 2026-09-25 wdrożone (opis modeli bez „Sonar/Llama”, dwa boty, zapowiedź wycofania Sonar API, Fast Search/Photon, złagodzenie limitów Free).

### X1 – P2
- **Miejsce:** perplexity.md:112
- **Cytat:** „Deweloperzy korzystają z Perplexity przez API. 27 września 2026 roku firma wyłącza dotychczasowe Sonar API – zastępuje je Agent API […]”
- **Problem:** Tekst opisuje wycofanie Sonar API jako wydarzenie przyszłe („wyłącza”), choć na dzień audytu (2026-10-05) już się ono dokonało – zgodnie z planem, 27.09.2026, potwierdzone w nowym baseline'ie. Czas przyszły sugeruje czytelnikowi, że zmiana jeszcze nie nastąpiła, i nie informuje, że przejście na Agent API zakończyło się bez przesunięć (stare ID modeli Sonar nie są już routowalne).
- **Poprawka:** „Deweloperzy korzystają z Perplexity przez API. 27 września 2026 roku firma wyłączyła dotychczasowe Sonar API – zastąpiło je Agent API […] Od tego dnia modele `sonar-pro` i `sonar-reasoning-pro` nie są już routowalne w starym API.”
- **Źródło:** stan-modeli-2026-10-05.md (sekcja 5); community.perplexity.ai/t/sonar-is-moving-to-the-agent-api

---

## jev.md

Poprawka J1 (pole `updated` w frontmatterze) wdrożona.

### J1 – P2 (poprawka przeniesiona z audytu 2026-09-25, J2 – wciąż niewdrożona, dziś bardziej uzasadniona)
- **Miejsce:** jev.md:148–156 (tabela ewaluacji „Workflow Evals”)
- **Cytat:** „| Jev | 0,0004 USD | 0,4 s | 67,8% |” … „Wniosek jest bardziej wyważony niż hasła z mediów społecznościowych.”
- **Problem:** Jak w poprzednim audycie: tabela nie zawiera zastrzeżenia, że ewaluacja TypeSafe powstała przed premierą nowszych modeli. Od 2026-09-25 lista „nieuwzględnionych” modeli urosła: oprócz Claude Opus 5.5 i GPT-6 Sol/Luna (stan z 22.09) są już też **GPT-6.1 Sol** (29.09) i **Claude Sonnet 5.5** (28.09) – zastrzeżenie jest więc dziś jeszcze bardziej potrzebne niż dwa tygodnie temu.
- **Poprawka:** dopisać pod tabelą: „Ewaluacja TypeSafe powstała przed premierą Claude Opus 5.5, Claude Sonnet 5.5 oraz GPT-6 Sol/Luna i GPT-6.1 Sol (22–29 września 2026), więc nie uwzględnia żadnego z tych nowszych modeli.”
- **Źródło:** https://evals.typesafe.ai/ – zagregowane liczby i ich aktualizacja: NIEZWERYFIKOWANE (docs.typesafe.ai zablokowany w tej sesji; WebSearch nie wskazuje nowszej wersji niż jev-1.13.0 – ten numer wersji pozostaje aktualny, bez zmian)

---

## Rzeczy sprawdzone, bez uwag

- grok.md: cennik Grok 4.7/4.6/4.5/4.3 (w tym stawka dwupoziomowa $2/$6 do 200 tys. tokenów i $4/$12 powyżej), marka SpaceXAI, wiedza do maja 2026, dystrybucja do Cursora/Copilot/Perplexity – w pełni zgodne z baseline'em 2026-10-05, bez zmian od 21.09.
- copilot.md: ceny Enterprise/Business/GitHub Copilot, trzy poziomy licencji, preferowany model GPT-5.6 (od lipca 2026) – bez zmian w oknie audytu poza C1.
- deepseek.md: V4.1-Flash/V4-Pro, aliasy, wycofanie nazw 24.07.2026, brak powtórzenia odwołanego przekierowania V4-Pro→V4.1-Flash (odwołanego już 11.09.2026, poza oknem 10-dniowym) – zgodne.
- perplexity.md: Model Council, Deep Research, Spaces/Comet/Fast Search/Photon, dwa boty – zgodne, poza X1.
- jev.md: jev-1.13.0 wciąż najnowszy model (potwierdzone WebSearch, brak nowszej wersji na 2026-10-05), cennik 0,042 USD/MTok, limity – zgodne.

## Uwaga metodologiczna

Próba weryfikacji listy modeli GitHub Copilot (docs.github.com) oraz dokumentacji TypeSafe (docs.typesafe.ai) przez WebFetch nie powiodła się – obie domeny blokowane przez proxy w tej sesji. WebSearch dla GitHub Copilot zwrócił wzajemnie niespójne, prawdopodobnie nieaktualne dane (różne daty wycofań, różne wersje modeli) – uznane za niewystarczająco wiarygodne, by na ich podstawie proponować zmianę treści copilot.md (sekcja o liście modeli GitHub Copilot, C2 z poprzedniego audytu, pozostaje bez nowego zgłoszenia). Rekomendacja: zweryfikować listę modeli GitHub Copilot z pierwszej ręki przy najbliższej okazji, gdy docs.github.com będzie dostępny.
