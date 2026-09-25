# Audyt świeżości – paczka B (modele-llm: Claude, Gemini, porównania)

Data audytu: 2026-09-25. Punkt odniesienia: `docs/widocznosc-ai/stan-modeli-2026-09-25.md` + weryfikacja WebFetch/WebSearch z 2026-09-25.
Katalog: `portals/widocznosc.ai/src/content/blog/modele-llm/`. Wszystkie pliki mają `updated: 2026-09-17` – po wdrożeniu poprawek podbić datę.

Priorytety: **P1** – błąd, nieaktualne „najnowszy/aktualny”, cena; **P2** – brak ważnej nowości; **P3** – drobne.

Najważniejsze zmiany od 17.09, które uderzają w tę paczkę:
- **Claude Opus 5.5** (22.09) – $4/$20, 1M kontekstu (także w czacie na planach płatnych), Anthropic poleca go „na start dla większości zadań”; **Opus 5 trafił do legacy**.
- **GPT-6 Sol** ($2/$10, cache $0,20) i **GPT-6 Luna** ($0,10/$0,50, cache $0,01) w API od 22.09, 1,05M kontekstu; działają w ChatGPT Work i Codex.
- **GPT-6 Astra działa w ChatGPT** (jako GPT-6 Pro dla planów Pro, Business i Enterprise oraz w ChatGPT Work i Codex) już od początku września – teza „tylko API” była błędna również 17.09.
- Imagen wyłączony 2026-08-17 (zastąpiony przez modele Gemini Image „Nano Banana”).
- Gemini 3.8 Flash TTS / Live Avatar / Omni Flash GA; przełącznik „Search generative AI control” w Search Console (globalnie od 31.08).

---

## 1. claude.md

### B-01 · P1 · claude.md:124
- **Cytat:** „We wrześniu 2026 roku aktualne modele to Claude Haiku 4.5, Sonnet 5 i Opus 5 […] wobec 5/25 USD dla Opus 5”
- **Problem:** Opus 5 jest od 22.09 modelem legacy; aktualny Opus to Opus 5.5 w cenie $4/$20.
- **Poprawka:** „We wrześniu 2026 roku aktualne modele to Claude Haiku 4.5, Sonnet 5 i Opus 5.5 (premiera 22 września 2026), a do najbardziej wymagającego rozumowania i długich zadań agentowych Anthropic oferuje ponadto Claude Fable 5.1 (w API 10 USD za milion tokenów wejściowych i 50 USD za wyjściowe, wobec 4/20 USD dla Opus 5.5 i 2/10 USD dla Sonnet 5). […] Przykładowo Opus 5, Opus 4.8 i Sonnet 4.6 mają już status legacy […]”
- **Źródło:** https://platform.claude.com/docs/en/about-claude/models/overview

### B-02 · P1 · claude.md:65 (frontmatter `sources`)
- **Cytat:** „Aktualne modele Fable 5.1 (10/50 USD), Opus 5 (5/25 USD, polecany na start dla większości zadań) […] lista modeli legacy (m.in. Fable 5, Opus 4.8 i Sonnet 4.6)”
- **Problem:** Strona dokumentacji wskazuje teraz Opus 5.5 ($4/$20) jako model „na start”; Opus 5 jest w legacy.
- **Poprawka (note):** „Anthropic, dokumentacja API. Aktualne modele Fable 5.1 (10/50 USD), Opus 5.5 (4/20 USD, polecany na start dla większości zadań), Sonnet 5 (2/10 USD) i Haiku 4.5 (1/5 USD) oraz lista modeli legacy (m.in. Fable 5, Opus 5, Opus 4.8 i Sonnet 4.6).”
- **Źródło:** https://platform.claude.com/docs/en/about-claude/models/overview

### B-03 · P1 · claude.md:144
- **Cytat:** „w modelach Fable 5.1, Opus 5 i Sonnet 5 także w interfejsie czatu na planach płatnych”
- **Problem:** Lista modeli z 1M w czacie pomija aktualny Opus 5.5, a wymienia legacy Opus 5.
- **Poprawka:** „w modelach Fable 5.1, Opus 5.5 i Sonnet 5 także w interfejsie czatu na planach płatnych”
- **Źródło:** https://support.claude.com/en/articles/8606394-how-large-is-the-context-window-on-paid-claude-plans

### B-04 · P3 · claude.md:59 (frontmatter `sources`)
- **Cytat:** „Okno 1 mln tokenów w czacie dla Fable 5.1, Opus 5 i Sonnet 5”
- **Problem:** Strona pomocy wymienia już też Opus 5.5.
- **Poprawka (note):** „Claude Help Center. Okno 1 mln tokenów w czacie dla Fable 5.1, Opus 5.5, Opus 5 i Sonnet 5 na planach płatnych oraz rozmiary okna w Claude Code i Cowork.”
- **Źródło:** jw.

### B-05 · P1 · claude.md:195
- **Cytat:** „najtańszym rozwiązaniem do masowego przetwarzania dużych wolumenów danych pozostaje Gemini Flash”
- **Problem:** Od 22.09 GPT-6 Luna kosztuje $0,10/$0,50, czyli mniej niż Gemini 3.8 Flash ($0,75/$3,75) i 3.1 Flash-Lite ($0,25/$1,50). Teza „najtańsze” jest nieprawdziwa.
- **Poprawka:** „**Koszt modelu Opus** – do masowego przetwarzania dużych wolumenów danych tańsze są lekkie modele konkurencji, np. Gemini Flash-Lite czy GPT-6 Luna”
- **Źródła:** https://developers.openai.com/api/docs/pricing, https://ai.google.dev/gemini-api/docs/pricing

### B-06 · P2 · claude.md:111–124 (sekcja „Rodzina modeli”)
- **Problem:** Brak informacji o premierze Opus 5.5 (22.09) i jego wyróżnikach: cena niższa niż Opus 5, adaptive thinking zawsze włączony, domyślny poziom effort medium.
- **Poprawka (zdanie po akapicie z l. 124):** „Claude Opus 5.5, wydany 22 września 2026 roku, zastąpił Opus 5 jako domyślnie polecany model – jest tańszy (4/20 USD zamiast 5/25 USD), ma okno 1 mln tokenów i 128 tys. tokenów wyjścia, a tryb adaptacyjnego myślenia jest w nim zawsze włączony.”
- **Źródło:** https://platform.claude.com/docs/en/about-claude/models/overview

### B-07 · P2 · claude.md:150–152 (sekcja MCP) lub 167–177 (plany)
- **Problem:** Brak Claude Marketplace (start 23.09): jeden katalog z ponad 2000 wtyczek i konektorów (m.in. Google, Microsoft, Notion, Salesforce), produktów opartych na Claude i partnerów wdrożeniowych.
- **Poprawka (na końcu sekcji MCP):** „Od 23 września 2026 roku konektory, wtyczki i gotowe produkty oparte na Claude są zebrane w Claude Marketplace – to ponad 2000 integracji, m.in. z narzędziami Google, Microsoft, Notion i Salesforce.”
- **Źródło:** https://claude.com/blog/claude-marketplace

### B-08 · P3 · claude.md:124
- **Problem:** Anthropic zapowiedział Sonnet 5.5 i Haiku 5.5 „w najbliższych tygodniach”. Zdanie o cyklu życia modeli można uzupełnić.
- **Poprawka (opcjonalnie):** „Anthropic zapowiedział już kolejne modele – Sonnet 5.5 i Haiku 5.5 – na najbliższe tygodnie.”
- **Źródło:** baseline, sekcja 1 (zweryfikowane wcześniej; oficjalnego URL nie ustaliłem – **niezweryfikowane** samodzielnie)

### B-09 · P3 · claude.md:197–203 (sekcja o widoczności marki)
- **Problem:** Sekcja o tym, jak Claude pobiera treści, nie wymienia botów Anthropic. To praktyczna informacja dla czytelnika, który chce sprawdzić dostęp w robots.txt.
- **Poprawka:** „Treści ze stron pobierają trzy boty Anthropic: ClaudeBot (dane, które mogą trafić do trenowania), Claude-SearchBot (indeks wyszukiwania w Claude) i Claude-User (pobieranie strony na prośbę użytkownika). Wszystkie respektują robots.txt, więc zablokowanie Claude-SearchBot może ograniczyć obecność witryny w odpowiedziach Claude'a.”
- **Źródło:** https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler

---

## 2. claude-vs-gemini.md

### B-10 · P1 · claude-vs-gemini.md:65
- **Cytat:** „| Kryterium | Claude (Sonnet 5 / Opus 5) | Gemini (3.1 Pro) |”
- **Problem:** Nagłówek tabeli „aktualnej na wrzesień 2026” wskazuje model legacy.
- **Poprawka:** „| Kryterium | Claude (Sonnet 5 / Opus 5.5) | Gemini (3.1 Pro) |”
- **Źródło:** https://platform.claude.com/docs/en/about-claude/models/overview

### B-11 · P1 · claude-vs-gemini.md:72
- **Cytat:** „$2/$10 (Sonnet 5), $5/$25 (Opus 5)”
- **Poprawka:** „$2/$10 (Sonnet 5), $4/$20 (Opus 5.5)”
- **Źródło:** https://platform.claude.com/docs/en/about-claude/pricing

### B-12 · P1 · claude-vs-gemini.md:112
- **Cytat:** „Następcy – Opus 5 (lipiec 2026) i Sonnet 5 (czerwiec 2026), a także Fable 5.1 – mają już status aktualnych modeli, a Opus 4.8 i Sonnet 4.6 są modelami legacy.”
- **Problem:** Opus 5 nie jest już aktualny.
- **Poprawka:** „Następcy – Sonnet 5 (czerwiec 2026), Opus 5 (lipiec 2026) i Opus 5.5 (22 września 2026), a także Fable 5.1 – zastąpili te modele; aktualne są dziś Sonnet 5, Opus 5.5 i Fable 5.1, a Opus 5, Opus 4.8 i Sonnet 4.6 mają status legacy.”
- **Źródło:** https://platform.claude.com/docs/en/about-claude/models/overview

### B-13 · P1 · claude-vs-gemini.md:169 i 173
- **Cytat:** „**Claude Opus 5** – $5 / $25 za milion tokenów” oraz „Wyraźnie droższe są dopiero Opus 5 i najmocniejszy Fable 5.1.”
- **Poprawka l. 169:** „- **Claude Opus 5.5** – $4 / $20 za milion tokenów”
- **Poprawka l. 173:** „Wyraźnie droższe są dopiero Opus 5.5 i najmocniejszy Fable 5.1.”
- **Źródło:** https://platform.claude.com/docs/en/about-claude/pricing

### B-14 · P1 · claude-vs-gemini.md:24 i 48 (frontmatter `sources`)
- **Cytat:** l. 24 „Aktualne modele: Fable 5.1 (10/50 USD), Opus 5 (5/25 USD) […]”; l. 48 „w tym Opus 5 (5/25 USD) i Sonnet 5 (2/10 USD)”
- **Poprawka l. 24 (note):** „Anthropic, dokumentacja API. Aktualne modele: Fable 5.1 (10/50 USD), Opus 5.5 (4/20 USD), Sonnet 5 (2/10 USD), Haiku 4.5 (1/5 USD); okno 1 mln tokenów dla Fable 5.1, Opus 5.5 i Sonnet 5; Opus 5, Opus 4.8 i Sonnet 4.6 jako legacy.”
- **Poprawka l. 48 (note):** „Anthropic, dokumentacja API. Cennik modeli Claude, w tym Opus 5.5 (4/20 USD) i Sonnet 5 (2/10 USD) za milion tokenów; pełne okno 1 mln tokenów bez dopłat za długi kontekst.”
- **Źródło:** https://platform.claude.com/docs/en/about-claude/models/overview

### B-15 · P2 · claude-vs-gemini.md:122
- **Cytat:** „Claude Sonnet 5, Claude Opus 5 i Claude Fable 5.1 obsługują 1 milion tokenów”
- **Poprawka:** „Claude Sonnet 5, Claude Opus 5.5 i Claude Fable 5.1 obsługują 1 milion tokenów”
- **Źródło:** https://support.claude.com/en/articles/8606394-how-large-is-the-context-window-on-paid-claude-plans

### B-16 · P3 · claude-vs-gemini.md:21 (frontmatter `sources`)
- **Cytat:** „Okno 1 mln tokenów w czacie dla Fable 5.1, Opus 5 i Sonnet 5”
- **Poprawka (note):** „Claude Help Center. Okno 1 mln tokenów w czacie dla Fable 5.1, Opus 5.5, Opus 5 i Sonnet 5 na planach płatnych (500 tys. dla Opus 4.8 i Sonnet 4.6) oraz 1 mln tokenów w Claude Code.”
- **Źródło:** jw.

### B-17 · P3 · claude-vs-gemini.md:75 i 149
- **Cytat:** „Integracja z Google Workspace | Brak natywnej”; „Claude nie ma takiej integracji natywnej […] musisz pobrać plik, wkleić treść lub skorzystać z zewnętrznych integracji przez protokół MCP”
- **Problem:** Claude Marketplace (23.09) udostępnia ponad 2000 konektorów, w tym Google. Integracja nie jest wbudowana w samo Gmail/Docs, ale opis „pobierz lub wklej” jest przestarzały. Czy konektory Google są dostępne na wszystkich planach – **niezweryfikowane**.
- **Poprawka l. 75:** „| Integracja z Google Workspace | Przez konektory (Claude Marketplace), bez wbudowania w Gmail/Docs | Natywna (Gmail, Docs, Drive) |”
- **Poprawka l. 149 (początek):** „Claude nie jest wbudowany w aplikacje Google. Do materiałów z Google Drive czy Gmaila podłączysz go przez konektory – od 23 września 2026 roku zebrane w Claude Marketplace – lub własny serwer MCP (Model Context Protocol […]).”
- **Źródło:** https://claude.com/blog/claude-marketplace

### B-18 · P3 · claude-vs-gemini.md:69
- **Cytat:** „Najnowszy szybki model | Claude Haiku 4.5”
- **Problem:** Zdanie jest poprawne, ale Haiku 5.5 jest zapowiedziany. Warto dopisać, żeby wiersz szybko się nie zestarzał.
- **Poprawka:** „Claude Haiku 4.5 (zapowiedziany Haiku 5.5)”
- **Źródło:** baseline, sekcja 1 (**niezweryfikowane** samodzielnie)

---

## 3. claude-vs-chatgpt-programowanie.md

### B-19 · P1 · claude-vs-chatgpt-programowanie.md:136
- **Cytat:** „Najmocniejszym modelem OpenAI jest od 3 września 2026 GPT-6 Astra […] – dostępny w API, ale nie w ChatGPT, gdzie najwyższą półkę nadal zajmuje GPT-5.6 Sol”
- **Problem:** Błąd. GPT-6 Astra napędza w ChatGPT model GPT-6 Pro (plany Pro $100/$200, Business, Enterprise) i działa w ChatGPT Work oraz Codex. Teza była błędna już 17.09.
- **Poprawka:** „Najmocniejszym modelem OpenAI jest od 3 września 2026 GPT-6 Astra (10/50 USD za 1M tokenów, okno 1,05 mln) – dostępny w API, a w ChatGPT jako GPT-6 Pro w planach Pro, Business i Enterprise oraz w ChatGPT Work i Codex. 22 września 2026 OpenAI dodało tańsze GPT-6 Sol (2/10 USD) i GPT-6 Luna (0,10/0,50 USD), również z oknem 1,05 mln.”
- **Źródła:** https://help.openai.com/en/articles/20001354-gpt-56-in-chatgpt (strona 403 – tytuł i fragment z wyszukiwarki), https://x.com/OpenAI/status/2095998532692140283, https://developers.openai.com/api/docs/pricing

### B-20 · P1 · claude-vs-chatgpt-programowanie.md:136
- **Cytat:** „Po stronie Anthropic domyślnie polecanym modelem jest Claude Opus 5 (5/25 USD, okno 1 mln)”
- **Poprawka:** „Po stronie Anthropic domyślnie polecanym modelem jest Claude Opus 5.5 (4/20 USD, okno 1 mln, premiera 22 września 2026)”
- **Źródło:** https://platform.claude.com/docs/en/about-claude/models/overview

### B-21 · P1 · claude-vs-chatgpt-programowanie.md:117–121 (tabela, „modele aktualne we wrześniu 2026”)
- **Cytaty i problemy:**
  - l. 117 „$2/$12 za 1M tokenów (GPT-5.6 Terra)”: cena wciąż obowiązuje, ale nowszy GPT-6 Sol kosztuje $2/$10.
  - l. 118 „$5/$25 za 1M tokenów (Opus 5) | $4/$20 za 1M tokenów (GPT-5.6 Sol, cena promocyjna)”: Opus 5 to legacy.
  - l. 120 „$0,20/$1,20 za 1M tokenów (GPT-5.6 Luna)”: GPT-6 Luna kosztuje $0,10/$0,50.
  - l. 121 „1 000 000 tokenów (Fable 5.1, Opus 5, Sonnet 5) | 1 050 000 tokenów (GPT-6 Astra, GPT-5.6)”
- **Poprawki:**
  - l. 117: „| **Cena API – balans (in/out)** | $2/$10 za 1M tokenów (Sonnet 5) | $2/$10 za 1M tokenów (GPT-6 Sol) |”
  - l. 118: „| **Cena API – flagship (in/out)** | $4/$20 za 1M tokenów (Opus 5.5) | $4/$20 za 1M tokenów (GPT-5.6 Sol, cena promocyjna co najmniej do 21.11.2026) |”
  - l. 120: „| **Cena API – ekonomiczny** | $1/$5 za 1M tokenów (Haiku 4.5) | $0,10/$0,50 za 1M tokenów (GPT-6 Luna) |”
  - l. 121: „| **Okno kontekstowe** | 1 000 000 tokenów (Fable 5.1, Opus 5.5, Sonnet 5) | 1 050 000 tokenów (GPT-6 Astra, Sol, Luna i GPT-5.6) |”
- **Uwaga redakcyjna:** Po premierze GPT-6 Sol podział OpenAI na „balans” i „flagship” się zaciera: GPT-6 Sol jest nowszy i tańszy od GPT-5.6 Sol. Można rozważyć wiersze „balans: Sonnet 5 vs GPT-6 Sol” i „flagship: Opus 5.5 vs GPT-6 Sol / GPT-5.6 Sol”.
- **Źródła:** https://developers.openai.com/api/docs/pricing, https://platform.claude.com/docs/en/about-claude/models/overview

### B-22 · P1 · claude-vs-chatgpt-programowanie.md:128
- **Cytat:** „We flagowcach relacja się odwraca – GPT-5.6 Sol w cenie promocyjnej ($4/$20) jest tańszy od Claude Opus 5 ($5/$25).”
- **Problem:** Opus 5.5 kosztuje $4/$20, tyle samo co GPT-5.6 Sol. Najtańszy jest nowy GPT-6 Sol ($2/$10). Do tego l. 128 „W klasie zbalansowanej Sonnet 5 i GPT-5.6 Terra…” wymaga uzgodnienia z B-21.
- **Poprawka:** „W klasie zbalansowanej Sonnet 5 i GPT-6 Sol kosztują dokładnie tyle samo ($2/$10). U obu dostawców odczyt z cache kosztuje zwykle 10% ceny wejścia (w Claude Opus 5.5 – 5%) […]. We flagowcach cenniki się wyrównały – Claude Opus 5.5 i GPT-5.6 Sol w cenie promocyjnej kosztują po $4/$20, a nowszy GPT-6 Sol ($2/$10) jest jeszcze tańszy. Na samej górze oferty GPT-6 Astra i Claude Fable 5.1 kosztują po $10/$50.”
- **Źródła:** jw.

### B-23 · P1 · claude-vs-chatgpt-programowanie.md:171–173
- **Cytat:** „np. Claude Haiku 4.5 lub GPT-5.6 Luna”; „Claude Sonnet 5 lub GPT-5.6 Terra”; „flagowce Claude Opus 5 lub GPT-5.6 Sol”
- **Problem:** Rekomendacje wskazują modele już nie najnowsze (Opus 5 w legacy).
- **Poprawka:**
  - „- **Lekkie użycie** (skrypty, eksperymenty) – wystarczą tańsze modele, np. Claude Haiku 4.5 lub GPT-6 Luna”
  - „- **Regularna praca** (daily coding assistant) – modele zbalansowane: Claude Sonnet 5 lub GPT-6 Sol”
  - „- **Intensywna praca z agentami** (Claude Code / Codex, cały dzień roboczy) – Claude Opus 5.5 lub GPT-6 Sol, często korzystniej w ramach subskrypcji niż w rozliczeniu za tokeny; po najdroższe Claude Fable 5.1 i GPT-6 Astra ($10/$50) warto sięgać tylko przy zadaniach, z którymi te modele sobie nie radzą”
- **Źródła:** jw.

### B-24 · P1 · claude-vs-chatgpt-programowanie.md:36 i 48 (frontmatter `sources`)
- **Cytat:** l. 36 „Ceny Opus 5 (5/25 USD), Sonnet 5 […]”; l. 48 „Opus 5 (domyślnie polecany)”
- **Poprawka l. 36 (note):** „Anthropic, dokumentacja API. Ceny Opus 5.5 (4/20 USD), Sonnet 5 (2/10 USD) i Haiku 4.5 (1/5 USD) oraz stawka odczytu z cache (10% ceny wejścia, 5% w Opus 5.5).”
- **Poprawka l. 48 (note):** „Anthropic, dokumentacja API. Aktualne modele Fable 5.1 (10/50 USD), Opus 5.5 (4/20 USD, domyślnie polecany), Sonnet 5 i Haiku 4.5 z oknami kontekstowymi; Fable 5, Opus 5, Opus 4.8 i Sonnet 4.6 jako legacy.”
- **Źródło:** https://platform.claude.com/docs/en/about-claude/models/overview

### B-25 · P2 · claude-vs-chatgpt-programowanie.md:71
- **Cytat:** „Od tego czasu obie firmy wydały nowe modele – rodzinę GPT-5.6 (lipiec 2026) i GPT-6 Astra (w API od 3 września 2026) oraz Claude Sonnet 5 (czerwiec 2026), Opus 5 (lipiec 2026) i Fable 5.1”
- **Problem:** Brak GPT-6 Sol/Luna i Opus 5.5 (oba 22.09).
- **Poprawka:** „Od tego czasu obie firmy wydały nowe modele – rodzinę GPT-5.6 (lipiec 2026), GPT-6 Astra (3 września 2026) oraz GPT-6 Sol i Luna (22 września 2026), a także Claude Sonnet 5 (czerwiec 2026), Opus 5 (lipiec 2026), Fable 5.1 i Opus 5.5 (22 września 2026) – ale Anthropic w zapowiedzi Opus 5 nie podał wyniku SWE-bench Verified […]”
- **Uwaga:** Serwisy trzecie przypisują Opus 5.5 wynik SWE-bench Pro 89,9% z karty systemowej (źródło wtórne, **niezweryfikowane** u Anthropic). Nie wstawiać bez sprawdzenia karty systemowej.
- **Źródła:** https://developers.openai.com/api/docs/models, https://platform.claude.com/docs/en/about-claude/models/overview; wtórne: https://llm-stats.com/blog/research/claude-opus-5-5-launch

### B-26 · P2 · claude-vs-chatgpt-programowanie.md:175
- **Cytat:** „Subskrypcja ChatGPT Pro […] obejmuje dostęp do Codex i modeli GPT-5.6 bez dodatkowych opłat za token.”
- **Problem:** Pro obejmuje dziś także GPT-6 Pro (Astra) oraz GPT-6 Sol/Luna w Codex i ChatGPT Work.
- **Poprawka:** „Subskrypcja ChatGPT Pro (od $100/mies.; nowe zapisy na wariant za $200 wstrzymano 10 września 2026) obejmuje dostęp do Codex, modeli GPT-5.6 i GPT-6 (w tym GPT-6 Pro opartego na Astrze) w ramach limitów planu, bez opłat za token.”
- **Źródła:** https://help.openai.com/en/articles/20001354-gpt-56-in-chatgpt (fragment z wyszukiwarki), https://openai.com/index/introducing-gpt-6-sol-and-luna/ (fragment z wyszukiwarki), https://fortune.com/2026/09/11/openai-astra-chatgpt-pro-pause/ (wtórne – data wstrzymania). Czy wstrzymanie zapisów na Pro $200 nadal obowiązuje 25.09 – **niezweryfikowane** (help.openai.com zwraca 403).

### B-27 · P3 · claude-vs-chatgpt-programowanie.md:126 i 165–167
- **Cytat:** „$0,20/1M tokenów (GPT-5.6 Terra)”; „cached input GPT-5.6 Terra kosztuje $0,20/1M tokenów, a GPT-5.6 Sol – $0,40/1M”
- **Problem:** Dane są poprawne, ale po zmianie tabeli (B-21) porównanie powinno dotyczyć GPT-6 Sol (cache $0,20).
- **Poprawka l. 126:** „| **Prompt caching (odczyt)** | $0,20/1M tokenów (Sonnet 5) | $0,20/1M tokenów (GPT-6 Sol) |”
- **Poprawka l. 167:** „Dla OpenAI cached input GPT-6 Sol kosztuje $0,20/1M tokenów, a GPT-5.6 Sol – $0,40/1M tokenów (w obu przypadkach 10% ceny standardowej).”
- **Źródło:** https://developers.openai.com/api/docs/pricing

### B-28 · P3 · claude-vs-chatgpt-programowanie.md:45 i 51 (frontmatter `sources`)
- **Problem:** Opisy źródeł OpenAI nie wymieniają GPT-6 Sol/Luna.
- **Poprawka l. 45 (note):** „OpenAI. Stawki GPT-6 Astra (10/1/50 USD), GPT-6 Sol (2/0,20/10 USD), GPT-6 Luna (0,10/0,01/0,50 USD) oraz GPT-5.6 Sol (4/0,40/20 USD), Terra (2/0,20/12 USD) i Luna (0,20/0,02/1,20 USD) – wejście, cache, wyjście.”
- **Poprawka l. 51 (note):** „OpenAI, dokumentacja API. GPT-6 Astra jako najmocniejszy model (10/50 USD) oraz GPT-6 Sol i Luna (od 22 września 2026); okno 1,05 mln tokenów, 128 tys. tokenów wyjścia.”
- **Źródło:** https://developers.openai.com/api/docs/pricing

### B-29 · P3 · claude-vs-chatgpt-programowanie.md:193
- **Cytat:** „jeśli używasz już GPT-5.6 w innych procesach”
- **Poprawka:** „jeśli używasz już modeli GPT-5.6 lub GPT-6 w innych procesach”

---

## 4. chatgpt-vs-gemini.md

### B-30 · P1 · chatgpt-vs-gemini.md:68
- **Cytat:** „Najmocniejszy model OpenAI – GPT-6 Astra, ogólnie dostępny od 3 września 2026 roku – działa na razie wyłącznie przez API i nie figuruje w notatkach wydań ChatGPT.”
- **Problem:** Błąd (także na 17.09). GPT-6 Astra napędza w ChatGPT model GPT-6 Pro.
- **Poprawka:** „Najmocniejszy model OpenAI – GPT-6 Astra, dostępny od 3 września 2026 roku – działa w API, a w ChatGPT napędza GPT-6 Pro w planach Pro (100 i 200 USD), Business i Enterprise. 22 września 2026 roku doszły GPT-6 Sol i GPT-6 Luna, dostępne w ChatGPT Work i Codex dla planów Plus, Pro, Business, Enterprise i Edu; w zwykłym czacie domyślnie nadal działają modele GPT-5.6.”
- **Źródła:** https://help.openai.com/en/articles/20001354-gpt-56-in-chatgpt (fragment z wyszukiwarki), https://x.com/OpenAI/status/2095998532692140283, https://openai.com/index/introducing-gpt-6-sol-and-luna/ (fragment z wyszukiwarki)

### B-31 · P1 · chatgpt-vs-gemini.md:147–148 (tabela)
- **Cytat:** „Flagowy model w aplikacji (wrzesień 2026) | GPT-5.6 Sol (plany płatne)”; „Najmocniejszy / najnowszy model w API | GPT-6 Astra (tylko API)”
- **Poprawka l. 147:** „| **Flagowy model w aplikacji (wrzesień 2026)** | GPT-5.6 Sol w czacie (Plus i wyżej); GPT-6 Pro (Astra) w planach Pro, Business i Enterprise | Gemini 3.1 Pro |”
- **Poprawka l. 148:** „| **Najmocniejszy / najnowszy model w API** | GPT-6 Astra; najnowsze GPT-6 Sol i Luna (22.09.2026) | Gemini 3.1 Pro (preview); najnowszy Flash – Gemini 3.8 Flash |”
- **Źródła:** jw. + https://developers.openai.com/api/docs/models

### B-32 · P1 · chatgpt-vs-gemini.md:42 (frontmatter `sources`)
- **Cytat:** „[…] brak GPT-6 Astra w ChatGPT.”
- **Poprawka (note):** „OpenAI Help Center. GPT-5.6 Sol w płatnych planach ChatGPT od 9 lipca 2026 i wycofanie o3 z ChatGPT 26 sierpnia 2026.” Do tego dodać nowe źródło: „GPT-5.6 and GPT-6 Pro in ChatGPT” – https://help.openai.com/en/articles/20001354-gpt-56-in-chatgpt – note: „OpenAI Help Center. GPT-6 Pro oparty na GPT-6 Astra w planach Pro, Business i Enterprise.”
- **Źródło:** jw.

### B-33 · P1 · chatgpt-vs-gemini.md:152
- **Cytat:** „Generowanie obrazów | ChatGPT Images 2.0 | Imagen (wbudowany)”
- **Problem:** Wszystkie modele Imagen wyłączono 2026-08-17. Obrazy w ekosystemie Gemini generują modele Gemini Image („Nano Banana”), także w planach aplikacji.
- **Poprawka:** „| **Generowanie obrazów** | ChatGPT Images 2.0 | Nano Banana (modele Gemini Image) |”
- **Źródła:** https://ai.google.dev/gemini-api/docs/image-generation, https://gemini.google/us/subscriptions/?hl=en

### B-34 · P2 · chatgpt-vs-gemini.md:78
- **Cytat:** „(modele GPT-5.6 Sol i GPT-6 Astra w API obsługują 1,05 mln)”
- **Poprawka:** „(modele GPT-5.6 i GPT-6 – Astra, Sol i Luna – w API obsługują 1,05 mln)”
- **Uwaga:** Limity okna w czacie (Plus 54/256 tys., Pro 128/400 tys.) pochodzą ze źródła wtórnego z sierpnia. Po wejściu GPT-6 do ChatGPT Work/Codex mogły się zmienić – **niezweryfikowane** (help.openai.com 403).
- **Źródło:** https://developers.openai.com/api/docs/models

### B-35 · P3 · chatgpt-vs-gemini.md:143
- **Cytat:** „Plan Free | GPT-5.6 Luna z limitami, bez generowania wideo”
- **Problem:** Free i Go mają też GPT-6 Luna w aplikacji desktopowej.
- **Poprawka:** „| **Plan Free** | GPT-5.6 Luna z limitami (GPT-6 Luna w aplikacji desktopowej), bez generowania wideo | Gemini 3.6 Flash, ograniczony dostęp do 3.1 Pro |”
- **Źródło:** https://openai.com/index/introducing-gpt-6-sol-and-luna/ (fragment z wyszukiwarki; baseline sekcja 2)

### B-36 · P3 · chatgpt-vs-gemini.md:84 i 151
- **Cytat:** „po zamknięciu aplikacji Sora (26 kwietnia 2026 roku) nie oferuje już generowania wideo”; „Brak (aplikacja Sora zamknięta w kwietniu 2026)”
- **Problem:** Treść jest poprawna, ale nieaktualna w szczegółach: 24.09 wyłączono też Videos API i Sora 2 w API.
- **Poprawka l. 151:** „| **Generowanie wideo** | Brak (aplikacja Sora zamknięta w kwietniu 2026, API Sora 2 – 24 września 2026) | […] |”
- **Źródło:** https://developers.openai.com/api/docs/deprecations

### B-37 · P3 · chatgpt-vs-gemini.md:185
- **Cytat:** „modele z rodziny Flash kosztują znacznie mniej niż flagowe odpowiedniki OpenAI”
- **Problem:** Porównanie z flagowcami jest prawdziwe, ale GPT-6 Luna ($0,10/$0,50) jest tańszy od każdego Gemini Flash, więc argument kosztowy za Gemini słabnie.
- **Poprawka:** „**Zwracasz uwagę na koszt za token w API** – modele Flash kosztują ułamek ceny flagowców OpenAI, choć w najniższej półce konkurencyjny cenowo jest też GPT-6 Luna, więc policz koszt na własnym wolumenie”
- **Źródła:** https://developers.openai.com/api/docs/pricing, https://ai.google.dev/gemini-api/docs/pricing

### B-38 · P3 · chatgpt-vs-gemini.md:100 i 177
- **Cytat:** „Integracja z Microsoft 365 Copilot […] sprawiają, że ChatGPT idealnie wpisuje się w środowiska oparte na rozwiązaniach Microsoftu”
- **Problem:** Microsoft 365 Copilot to nie ChatGPT, tylko narzędzie wielomodelowe. Działa na GPT-5.6 i GPT-6 Sol, ale też na Claude Opus 5.5 i Fable 5.1.
- **Poprawka l. 100 (zdanie):** „Modele OpenAI (GPT-5.6, GPT-6) napędzają też Microsoft 365 Copilot – choć Copilot jest dziś wielomodelowy i oferuje również modele Claude – więc środowiska oparte na Microsofcie korzystają z nich bez osobnej integracji.”
- **Źródło:** https://techcommunity.microsoft.com/blog/microsoft-copilot-blog/more-models-one-copilot/4559035 (fragmenty z wyszukiwarki – baseline sekcja 4)

---

## 5. gemini.md

### B-39 · P2 · gemini.md:25 (FAQ)
- **Cytat:** „od popularnych modeli działających zasadniczo w trybie offline (takich jak chociażby podstawowa wersja LLM Claude bez żadnych dodanych rozszerzeń i asystentów)”
- **Problem:** Tekst sugeruje, że Claude działa offline. Tymczasem wyszukiwanie w sieci jest w Claude dostępne na wszystkich planach, także darmowym, od 2025-05-27 (czerwona flaga z baseline).
- **Poprawka:** „Kategorycznie odróżnia to Gemini od modeli używanych przez API bez narzędzia wyszukiwania, które opierają się wyłącznie na danych treningowych (aplikacje konkurencji, np. Claude czy ChatGPT, też mają dziś wbudowane wyszukiwanie w sieci, ale korzystają z własnych indeksów, a nie z Google Search).”
- **Źródło:** https://claude.com/blog/web-search

### B-40 · P2 · gemini.md:205–211 (sekcja „Gemini a widoczność marki w Google AI Mode”)
- **Problem:** Brak nowego przełącznika w Search Console („Search generative AI control”, globalnie od 2026-08-31). Decyduje on, czy witryna może pojawiać się i uziemiać odpowiedzi w AI Overviews, AI Mode i generatywnych funkcjach Discover. To kluczowa nowość dla artykułu o widoczności.
- **Poprawka (akapit):** „Od 31 sierpnia 2026 roku właściciele witryn mają w Google Search Console przełącznik „Search generative AI control”. Decyduje on, czy strona może pojawiać się w AI Overviews, AI Mode i generatywnych funkcjach Discover oraz być w nich źródłem odpowiedzi. Wyłączenie nie wpływa na ranking w klasycznych wynikach, ale oznacza zero wyświetleń i ruchu z tych funkcji. Nie dotyczy też trenowania modeli, którym steruje osobny token Google-Extended.”
- **Źródła:** https://support.google.com/webmasters/answer/16908024, https://blog.google/products-and-platforms/products/search/new-controls-website-owners/

### B-41 · P2 · gemini.md:195
- **Cytat:** „Obecnie najnowsze modele tej linii to Gemini 3.8 Live oraz Gemini 3.8 Live Extended Thinking.”
- **Problem:** Zdanie jest poprawne, ale brakuje świeżych modeli audio/wideo: Gemini 3.8 Flash TTS i Flash-Lite TTS (22.09), Live Avatar (24.09) i Omni Flash (`gemini-omni-1.1-flash`, GA 27.08).
- **Poprawka (zdanie po cytacie):** „We wrześniu 2026 roku Google dodał też modele syntezy mowy Gemini 3.8 Flash TTS i Flash-Lite TTS oraz Live Avatar do rozmów z animowanym awatarem, a pod koniec sierpnia udostępnił ogólnie multimodalny Gemini Omni Flash.”
- **Źródło:** https://ai.google.dev/gemini-api/docs/changelog (daty wg baseline; dokładna nazwa handlowa Live Avatar – **niezweryfikowane**)

### B-42 · P3 · gemini.md:191
- **Cytat:** „Veo jest dostępna w planach AI Ultra oraz z poziomu API”
- **Problem:** Według strony planów generowanie wideo jest już w AI Plus, AI Pro ma ograniczony dostęp próbny do Veo 3.1 Lite, a AI Ultra – pełny dostęp do Veo 3.1. Opis jest też niespójny z chatgpt-vs-gemini.md:151 („od planu AI Plus”).
- **Poprawka:** „Generowanie wideo jest dostępne od planu AI Plus (w AI Pro – ograniczony dostęp próbny do Veo 3.1 Lite, w AI Ultra – pełny dostęp do Veo 3.1) oraz z poziomu API.”
- **Źródło:** https://gemini.google/us/subscriptions/?hl=en

### B-43 · P3 · gemini.md:72
- **Cytat:** „**Modele bazowe** – seria Gemini Flash, Pro i Ultra”
- **Problem:** Ultra nie jest dziś modelem, tylko nazwą planu (sam artykuł wyjaśnia to w tabeli w l. 95).
- **Poprawka:** „**Modele bazowe** – seria Gemini Flash-Lite, Flash i Pro (nazwa Ultra oznaczała flagowca pierwszej generacji, dziś – najwyższy plan), trenowane przez Google DeepMind […]”
- **Źródło:** https://deepmind.google/models/gemini/

### B-44 · P3 · gemini.md:99
- **Cytat:** „To właśnie on [Flash Lite] zasila większość automatyzacji w środowisku Workspace.”
- **Problem:** Nie ma oficjalnego potwierdzenia, który model napędza automatyzacje Workspace – **niezweryfikowane**.
- **Poprawka:** usunąć zdanie albo zastąpić: „Dobrze sprawdza się w automatyzacjach o dużym wolumenie, takich jak klasyfikacja czy ekstrakcja danych.”
- **Źródło:** brak oficjalnego

---

## Czego nie oznaczono (sprawdzone, zgodne z baseline)
- Gemini 3.1 Pro jako najmocniejszy model Google (preview) i 3.8 Flash jako najnowszy Flash – poprawne we wszystkich plikach.
- Ceny Gemini (3.8 Flash $0,75/$3,75 do końca 2026, 3.1 Pro $2/$12 i $4/$18, 3.1 Flash-Lite $0,25/$1,50) – poprawne.
- Plan Free Gemini = 3.6 Flash, ograniczony 3.1 Pro – potwierdzone na stronie planów.
- Plan Free Claude (Sonnet 5, web search) – zgodny ze stroną cennika (Free: Sonnet i Haiku).
- Ceny GPT-5.6 w API (Sol $4/$20 promocyjnie do co najmniej 21.11.2026, Terra $2/$12, Luna $0,20/$1,20) – zgodne z bieżącym cennikiem OpenAI. Uwaga: baseline podaje ceny premierowe 5.6 ($5/$30 itd.), bieżący cennik pokazuje ceny niższe – artykuł ma aktualne.
- Wstrzymanie zapisów na ChatGPT Pro $200 (od 10.09) – potwierdzone w mediach; czy trwa nadal – niezweryfikowane (patrz B-26).
- Historyczne benchmarki (Opus 4.8 88,6%, Opus 4.6 MRCR 76%, Claude 3.5 OSWorld) są datowane poprawnie.
- W tej paczce nie ma treści o Perplexity, Grok ani botach OpenAI, więc Sonar API, Grok 4.7 i OAI-AdsBot jej nie dotyczą.

## Podsumowanie
| Priorytet | Liczba |
|---|---|
| P1 | 19 (B-01, 02, 03, 05, 10, 11, 12, 13, 14, 19, 20, 21, 22, 23, 24, 30, 31, 32, 33) |
| P2 | 9 (B-06, 07, 15, 25, 26, 34, 39, 40, 41) |
| P3 | 16 (B-04, 08, 09, 16, 17, 18, 27, 28, 29, 35, 36, 37, 38, 42, 43, 44) |
| Razem | 44 |
