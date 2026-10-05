# Audyt świeżości – paczka B (modele-llm: Claude, Gemini, porównania)

Data audytu: 2026-10-05. Punkt odniesienia: `docs/widocznosc-ai/stan-modeli-2026-10-05.md` (baseline zweryfikowany 2026-10-05) + dodatkowa weryfikacja WebFetch/WebSearch z tej sesji. Kontekst poprzedniego audytu: `docs/widocznosc-ai/audyt-swiezosci-2026-09-25/B.md` (2026-09-25).
Katalog: `portals/widocznosc.ai/src/content/blog/modele-llm/`.

**Status wdrożenia poprawek z 2026-09-25:** większość zgłoszeń z poprzedniego audytu (Opus 5.5, Claude Marketplace, Search Console „Search generative AI control”, Nano Banana, GPT-6 Sol/Luna, GPT-6 Astra w ChatGPT) została wdrożona we wszystkich pięciu plikach – `updated: 2026-09-25` w frontmatterze się zgadza z treścią. Pozostały jednak otwarte NIEZWERYFIKOWANE wątki (np. wersja UA botów OpenAI, status Claude Marketplace) – poza zakresem tego audytu, bez zmian.

**Najważniejsze zmiany rynkowe z okna 2026-09-25 → 2026-10-05, które uderzają w tę paczkę:**
- **Claude Sonnet 5.5** (premiera 28 września 2026, ta sama cena 2/10 USD, okno 1M/128K) zastąpił Sonnet 5 jako domyślny model środkowego tieru. Potwierdzone z pierwszej ręki (WebFetch `platform.claude.com/docs/en/models/overview`, 2026-10-05): aktualna tabela modeli wymienia już tylko Fable 5.1, Opus 5.5, **Sonnet 5.5** i Haiku 4.5 – **Sonnet 5 jest już wymieniony wśród modeli legacy**, nie tylko „niedomyślny", jak sugerował baseline z 25.09.
- **Claude Haiku 4.5** – wycofanie zapowiedziane „nie wcześniej niż 15 października 2026" – **10 dni od daty audytu**. Potwierdzone z pierwszej ręki na tej samej stronie.
- **GPT-6.1 Sol** (premiera 29 września 2026 na OpenAI DevDay) – ulepszona wersja GPT-6 Sol, zbliżona do GPT-6 Astra w kodowaniu agentowym i computer use, w tej samej cenie (2/10 USD), ale z niższym cache ($0,10 wobec $0,20 w GPT-6 Sol). Potwierdzone przez wiele źródeł wtórnych wzajemnie się potwierdzających (deweloperska dokumentacja OpenAI niedostępna w tej sesji).
- **GPT-6.1 Astra** – zapowiedziana premiera (październik) **odwołana** po testach bezpieczeństwa (źródło wtórne, wielokrotnie potwierdzone: WSJ/Reuters).
- Nowy wariant **ChatGPT Pro za 500 USD/mies.** z trybem „Ultrafast" (8× szybszy Codex, 25× limity Plus), od 29.09.2026 (źródło wtórne).
- Żadna z czekających zmian po stronie Gemini (brak Gemini 3.5 Pro, wyłączenie Gemini 2.5 16–20.10) nie dotyka bezpośrednio tej paczki – te pięć plików nie wspomina modeli Gemini 2.5 ani nie zapowiada Gemini 3.5 Pro.

Priorytety: **P1** – błąd, nieaktualne „najnowszy/aktualny", cena; **P2** – brak ważnej nowości; **P3** – drobne.

---

## 1. claude.md

| # | Linia | Cytat | Problem | Proponowana poprawka | Prio | Źródło |
|---|---|---|---|---|---|---|
| B-01 | 127 | „We wrześniu 2026 roku aktualne modele to Claude Haiku 4.5, Sonnet 5 i Opus 5.5 (premiera 22 września 2026) […] wobec 4/20 USD dla Opus 5.5 i 2/10 USD dla Sonnet 5" | Sonnet 5 nie jest już aktualny – 28.09.2026 Anthropic wydał Sonnet 5.5 (ta sama cena, 1M/128K), który go zastąpił jako domyślny model środkowego tieru; Sonnet 5 jest już w tabeli modeli legacy. | „Na październik 2026 roku aktualne modele to Claude Haiku 4.5, Sonnet 5.5 (premiera 28 września 2026, zastąpił Sonnet 5 jako domyślny model środkowego tieru) i Opus 5.5 (premiera 22 września 2026) […] wobec 4/20 USD dla Opus 5.5 i 2/10 USD dla Sonnet 5.5." | P1 | https://platform.claude.com/docs/en/about-claude/models/overview (WebFetch 2026-10-05) |
| B-02 | 127 | „Przykładowo Opus 5, Opus 4.8 i Sonnet 4.6 mają już status legacy" | Lista przykładów legacy jest niekompletna – Sonnet 5 jest teraz również legacy. | „Przykładowo Opus 5, Sonnet 5, Opus 4.8 i Sonnet 4.6 mają już status legacy" | P2 | jw. |
| B-03 | 149 | „w modelach Fable 5.1, Opus 5.5 i Sonnet 5 także w interfejsie czatu na planach płatnych" | Lista okna 1M w czacie wskazuje nieaktualny Sonnet 5 i pomija Sonnet 5.5. | „w modelach Fable 5.1, Opus 5.5 i Sonnet 5.5 także w interfejsie czatu na planach płatnych" | P1 | https://platform.claude.com/docs/en/about-claude/models/overview; potwierdzenie na stronie Claude Help Center – do sprawdzenia |
| B-04 | 65 (frontmatter `sources`, nota „Models overview") | „Aktualne modele Fable 5.1 (10/50 USD), Opus 5.5 (4/20 USD, polecany na start dla większości zadań), Sonnet 5 (2/10 USD) i Haiku 4.5 (1/5 USD) oraz lista modeli legacy (m.in. Fable 5, Opus 5, Opus 4.8 i Sonnet 4.6)." | Nota pomija Sonnet 5.5 i nie wymienia Sonnet 5 jako legacy. | „Aktualne modele Fable 5.1 (10/50 USD), Opus 5.5 (4/20 USD, polecany na start dla większości zadań), Sonnet 5.5 (2/10 USD, premiera 28 września 2026) i Haiku 4.5 (1/5 USD) oraz lista modeli legacy (m.in. Fable 5, Opus 5, Sonnet 5, Opus 4.8 i Sonnet 4.6)." | P2 | jw. |
| B-05 | 59 (frontmatter `sources`, nota Claude Help Center) | „Okno 1 mln tokenów w czacie dla Fable 5.1, Opus 5.5, Opus 5 i Sonnet 5 na planach płatnych […]" | Nota nie była aktualizowana pod premierę Sonnet 5.5 (28.09); czy strona pomocy już wymienia Sonnet 5.5 w czacie – nie sprawdzone z pierwszej ręki w tej sesji. | Sprawdzić `support.claude.com` i dopisać Sonnet 5.5, jeśli strona już go wymienia. | P3 | NIEZWERYFIKOWANE – https://support.claude.com/en/articles/8606394-how-large-is-the-context-window-on-paid-claude-plans (nie sprawdzone w tej sesji) |
| B-06 | brak (sekcja „Rodzina modeli", po l. 127/149) | Artykuł wielokrotnie wymienia Claude Haiku 4.5 jako jeden z „aktualnych" modeli bez żadnej wzmianki o zbliżającym się wycofaniu. | Dodać zdanie: „Anthropic zapowiedział wycofanie Claude Haiku 4.5 nie wcześniej niż 15 października 2026 roku – warto to uwzględnić przy planowaniu nowych integracji." | **P2 – pilne** (termin za 10 dni od daty audytu) | https://platform.claude.com/docs/en/about-claude/models/overview (kolumna „Retirement": „Not sooner than October 15, 2026") |
| B-07 | 178 (tabela planów) | „Free \| Sonnet 5 (z limitami)" | Niejasne, czy plan Free na claude.ai domyślnie korzysta już z Sonnet 5.5 czy wciąż z Sonnet 5 – sprzeczne sygnały w źródłach wtórnych, strona cennika nie precyzuje domyślnego modelu per plan. | Nie zmieniać bez jednoznacznego potwierdzenia na `claude.com/pricing` lub w Help Center; zostawić jako NIEZWERYFIKOWANE. | P3 | https://claude.com/pricing (WebFetch 2026-10-05, niejednoznaczne); (źródło wtórne, rozbieżne) apidog.com/blog/how-to-use-claude-sonnet-5-5-for-free, findskill.ai/blog/claude-switched-everyone-to-sonnet-5 |

---

## 2. claude-vs-gemini.md

| # | Linia | Cytat | Problem | Proponowana poprawka | Prio | Źródło |
|---|---|---|---|---|---|---|
| B-08 | 65 | „\| Kryterium \| Claude (Sonnet 5 / Opus 5.5) \| Gemini (3.1 Pro) \|" | Nagłówek tabeli wskazuje Sonnet 5, który od 28.09.2026 jest już modelem legacy. | „\| Kryterium \| Claude (Sonnet 5.5 / Opus 5.5) \| Gemini (3.1 Pro) \|" | P1 | https://platform.claude.com/docs/en/about-claude/models/overview |
| B-09 | 70 | „Okno kontekstowe \| 1M tokenów (Fable, Sonnet i Opus, także w czacie) \| 1M tokenów" | „Sonnet" powinien odnosić się do aktualnego Sonnet 5.5. | „1M tokenów (Fable 5.1, Sonnet 5.5 i Opus 5.5, także w czacie)" | P3 | jw. |
| B-10 | 72 | „$2/$10 (Sonnet 5), $4/$20 (Opus 5.5)" | Cena bez zmian, ale nazwa modelu nieaktualna. | „$2/$10 (Sonnet 5.5), $4/$20 (Opus 5.5)" | P1 | jw. |
| B-11 | 112 | „Następcy – Sonnet 5 (czerwiec 2026), Opus 5 (lipiec 2026) i Opus 5.5 (22 września 2026), a także Fable 5.1 – zastąpili te modele; aktualne są dziś Sonnet 5, Opus 5.5 i Fable 5.1, a Opus 5, Opus 4.8 i Sonnet 4.6 mają status legacy." | Brak Sonnet 5.5 (28.09.2026); Sonnet 5 jest już legacy, nie aktualny. | „Następcy – Sonnet 5 (czerwiec 2026), Opus 5 (lipiec 2026), Opus 5.5 (22 września 2026) i Sonnet 5.5 (28 września 2026) […]; aktualne są dziś Sonnet 5.5, Opus 5.5 i Fable 5.1, a Sonnet 5, Opus 5, Opus 4.8 i Sonnet 4.6 mają status legacy." | P1 | jw. |
| B-12 | 122 | „Claude Sonnet 5, Claude Opus 5.5 i Claude Fable 5.1 obsługują 1 milion tokenów zarówno w interfejsie czatu na planach płatnych, jak i przez API oraz w Claude Code." | Powinien być Sonnet 5.5; potwierdzenie okna 1M w samym czacie dla Sonnet 5.5 – NIEZWERYFIKOWANE w tej sesji. | „Claude Sonnet 5.5, Claude Opus 5.5 i Claude Fable 5.1 obsługują 1 milion tokenów przez API i platformy partnerskie (dostępność tego okna w samym interfejsie czatu dla Sonnet 5.5 – do potwierdzenia)." | P2 | https://platform.claude.com/docs/en/about-claude/models/overview; NIEZWERYFIKOWANE dla czatu |
| B-13 | 168 | „**Claude Sonnet 5** – $2 za milion tokenów wejściowych / $10 za milion tokenów wyjściowych" | Powinien to być Sonnet 5.5 (aktualny model w tej cenie). | „**Claude Sonnet 5.5** – $2 za milion tokenów wejściowych / $10 za milion tokenów wyjściowych" | P1 | jw. |
| B-14 | 69 | „Najnowszy szybki model \| Claude Haiku 4.5" | Poprawne, ale brak wzmianki o zbliżającym się wycofaniu (15.10.2026, za 10 dni). | „Najnowszy szybki model \| Claude Haiku 4.5 (wycofanie zapowiedziane nie wcześniej niż 15.10.2026)" | **P2 – pilne** | jw. |
| B-15 | 21, 24, 48 (frontmatter `sources`) | Noty Anthropic pomijają Sonnet 5.5 (np. „Aktualne modele: Fable 5.1 (10/50 USD), Opus 5.5 (4/20 USD), Sonnet 5 (2/10 USD), Haiku 4.5 (1/5 USD)[…]") | Noty źródłowe nie odzwierciedlają premiery Sonnet 5.5. | Dopisać Sonnet 5.5 (2/10 USD, premiera 28.09.2026) i przenieść Sonnet 5 do legacy w opisach note. | P3 | jw. |

---

## 3. claude-vs-chatgpt-programowanie.md

| # | Linia | Cytat | Problem | Proponowana poprawka | Prio | Źródło |
|---|---|---|---|---|---|---|
| B-16 | 71 | „Od tego czasu obie firmy wydały nowe modele – rodzinę GPT-5.6 (lipiec 2026), GPT-6 Astra (3 września 2026) oraz GPT-6 Sol i Luna (22 września 2026), a także Claude Sonnet 5 (czerwiec 2026), Opus 5 (lipiec 2026), Fable 5.1 i Opus 5.5 (22 września 2026) […]" | Brak dwóch wydarzeń kluczowych dla artykułu o programowaniu: GPT-6.1 Sol (29.09.2026, zbliżony do Astry w kodzie) i Claude Sonnet 5.5 (28.09.2026, zastąpił Sonnet 5). | Dopisać: „[…] GPT-6 Sol i Luna (22 września 2026) oraz GPT-6.1 Sol (29 września 2026, zbliżony do poziomu Astry w kodowaniu agentowym, w cenie Sol), a także Claude Sonnet 5 (czerwiec 2026), Opus 5 (lipiec 2026), Fable 5.1, Opus 5.5 (22 września 2026) i Sonnet 5.5 (28 września 2026, zastąpił Sonnet 5) […]" | P1 | https://platform.claude.com/docs/en/about-claude/models/overview; (źródło wtórne, wielokrotnie potwierdzone) eesel.ai/blog/gpt-6-1-sol-pricing, digg.com/tech/mz36yngf |
| B-17 | 136 | „Najmocniejszym modelem OpenAI jest od 3 września 2026 GPT-6 Astra […] 22 września 2026 OpenAI dodało tańsze GPT-6 Sol (2/10 USD) i GPT-6 Luna (0,10/0,50 USD) […] Po stronie Anthropic domyślnie polecanym modelem jest Claude Opus 5.5 […]" | Dla artykułu o programowaniu to kluczowy brak – GPT-6.1 Sol jest opisywany przez OpenAI jako zbliżony do Astry w kodowaniu agentowym i computer use, za ok. 1/5 ceny Astry; brak też Sonnet 5.5 jako nowego modelu środkowego tieru. | „[…] 22 września 2026 OpenAI dodało tańsze GPT-6 Sol i GPT-6 Luna […]. Tydzień później, 29 września 2026 roku, OpenAI wydało GPT-6.1 Sol – ulepszoną wersję w tej samej cenie (2/10 USD, cache 0,10 USD), zbliżoną do GPT-6 Astra w kodowaniu agentowym. Po stronie Anthropic domyślnie polecanym modelem jest Claude Opus 5.5 (4/20 USD), a model środkowego tieru to od 28 września 2026 Claude Sonnet 5.5 (2/10 USD), który zastąpił Sonnet 5." | P1 | jw. |
| B-18 | 117 | „\| **Cena API – balans (in/out)** \| $2/$10 za 1M tokenów (Sonnet 5) \| $2/$10 za 1M tokenów (GPT-6 Sol) \|" | Nazwy modeli po obu stronach nieaktualne; ceny bazowe bez zmian, ale GPT-6.1 Sol ma niższy cache. | „\| **Cena API – balans (in/out)** \| $2/$10 za 1M tokenów (Sonnet 5.5) \| $2/$10 za 1M tokenów (GPT-6.1 Sol, cache $0,10) \|" | P1 | jw. |
| B-19 | 121 | „\| **Okno kontekstowe** \| 1 000 000 tokenów (Fable 5.1, Opus 5.5, Sonnet 5) \| 1 050 000 tokenów (GPT-6 Astra, Sol, Luna i GPT-5.6) \|" | Pomija Sonnet 5.5 i GPT-6.1 Sol. | „\| **Okno kontekstowe** \| 1 000 000 tokenów (Fable 5.1, Opus 5.5, Sonnet 5.5) \| 1 050 000 tokenów (GPT-6 Astra, Sol, 6.1 Sol, Luna i GPT-5.6) \|" | P2 | jw. |
| B-20 | 126 | „\| **Prompt caching (odczyt)** \| $0,20/1M tokenów (Sonnet 5) \| $0,20/1M tokenów (GPT-6 Sol) \|" | Nazwa modelu Anthropic nieaktualna; podstawienie starej liczby cache GPT-6 Sol pod GPT-6.1 Sol byłoby błędem – GPT-6.1 Sol ma cache $0,10, nie $0,20. | „\| **Prompt caching (odczyt)** \| $0,20/1M tokenów (Sonnet 5.5) \| $0,20/1M tokenów (GPT-6 Sol) / $0,10/1M tokenów (GPT-6.1 Sol) \|" | P1 | jw.; (źródło wtórne) eesel.ai/blog/gpt-6-1-sol-pricing |
| B-21 | 128 | „W klasie zbalansowanej Sonnet 5 i GPT-6 Sol kosztują dokładnie tyle samo ($2/$10)." | Nazwy modeli nieaktualne; warto dodać różnicę w cache. | „W klasie zbalansowanej Sonnet 5.5 i GPT-6.1 Sol kosztują dokładnie tyle samo ($2/$10), choć GPT-6.1 Sol ma niższy cache ($0,10 wobec $0,20 w starszym GPT-6 Sol)." | P2 | jw. |
| B-22 | 171–173 | „Regularna praca […] Claude Sonnet 5 lub GPT-6 Sol"; „Intensywna praca z agentami […] Claude Opus 5.5 lub GPT-6 Sol […]" | Rekomendacje wskazują już nieaktualne nazwy modeli środkowego tieru. | Zamienić „Claude Sonnet 5 lub GPT-6 Sol" na „Claude Sonnet 5.5 lub GPT-6.1 Sol" w obu miejscach. | P2 | jw. |
| B-23 | 175 | „Subskrypcja ChatGPT Pro (od $100/mies.) obejmuje dostęp do Codex, modeli GPT-5.6 i GPT-6 […], bez opłat za token." | Brak wzmianki o nowym wariancie Pro za 500 USD/mies. z trybem „Ultrafast" (8× szybszy Codex) – istotne dla artykułu o programowaniu z Codexem. | „Subskrypcja ChatGPT Pro (od $100/mies., od 29 września 2026 także wariant za $500/mies. z trybem „Ultrafast" – 8× szybszy Codex i 25× limity Plus) obejmuje dostęp do Codex, modeli GPT-5.6 i GPT-6 […], bez opłat za token." | P2 | (źródło wtórne, wielokrotnie potwierdzone 2026-09-29/30 – baseline sekcja 2) |
| B-24 | 48 (frontmatter `sources`, nota „Models overview") | „Aktualne modele Fable 5.1 (10/50 USD), Opus 5.5 (4/20 USD, domyślnie polecany), Sonnet 5 i Haiku 4.5 z oknami kontekstowymi […]" | Nota pomija Sonnet 5.5. | „Aktualne modele Fable 5.1 (10/50 USD), Opus 5.5 (4/20 USD, domyślnie polecany) i Sonnet 5.5 (2/10 USD, premiera 28 września 2026) z oknami kontekstowymi; Sonnet 5, Fable 5, Opus 5, Opus 4.8 i Sonnet 4.6 jako legacy." | P2 | https://platform.claude.com/docs/en/about-claude/models/overview |
| B-25 | brak (sekcja „Ceny API i koszt w agentowych sesjach", ok. l. 171) | Artykuł wspomina Claude Haiku 4.5 jako „lekkie użycie" bez wzmianki o zbliżającym się wycofaniu. | Dodać w nawiasie: „(Haiku 4.5 – wycofanie zapowiedziane nie wcześniej niż 15.10.2026)". | P3 | https://platform.claude.com/docs/en/about-claude/models/overview |

---

## 4. chatgpt-vs-gemini.md

| # | Linia | Cytat | Problem | Proponowana poprawka | Prio | Źródło |
|---|---|---|---|---|---|---|
| B-26 | 71 | „22 września 2026 roku doszły GPT-6 Sol i GPT-6 Luna, dostępne w ChatGPT Work i Codex […]; w zwykłym czacie domyślnie nadal działają modele GPT-5.6." | Brak GPT-6.1 Sol (29.09.2026 na DevDay) – ulepszona wersja GPT-6 Sol zbliżona do GPT-6 Astra w zadaniach agentowych, w tej samej cenie, niższy cache; brak też wzmianki o nowym planie Pro 500 USD i odwołaniu premiery GPT-6.1 Astra. | Dodać zdanie: „Tydzień później, 29 września 2026 roku na konferencji DevDay, OpenAI wydało ulepszone GPT-6.1 Sol (2/10 USD, zbliżone do poziomu GPT-6 Astra w zadaniach agentowych) oraz wprowadziło nowy plan Pro za 500 USD/mies. z trybem Ultrafast; zapowiedziana na październik premiera GPT-6.1 Astra została odwołana po testach bezpieczeństwa." | P2 | (źródło wtórne, wielokrotnie potwierdzone 2026-09-29/30) eesel.ai/blog/gpt-6-1-sol-pricing, digg.com/tech/mz36yngf; baseline sekcja 2 |
| B-27 | 150–151 (tabela) | „\| **Najmocniejszy / najnowszy model w API** \| GPT-6 Astra; najnowsze GPT-6 Sol i Luna (22.09.2026) \| Gemini 3.1 Pro (preview); najnowszy Flash – Gemini 3.8 Flash \|" | Brak GPT-6.1 Sol (29.09.2026), najnowszego i tańszego w cache modelu OpenAI. | „\| **Najmocniejszy / najnowszy model w API** \| GPT-6 Astra; GPT-6.1 Sol (29.09.2026, zbliżony do Astry, 2/10 USD); GPT-6 Luna \| Gemini 3.1 Pro (preview); najnowszy Flash – Gemini 3.8 Flash \|" | P1 | jw. |
| B-28 | 149 (tabela) | „\| **Plan zaawansowany** \| Pro – 100–200 USD/mies. \| AI Ultra – od 99,99 USD/mies. \|" | Od 29.09.2026 istnieje też wariant Pro za 500 USD/mies. z trybem „Ultrafast". | „\| **Plan zaawansowany** \| Pro – 100–200 USD/mies. (od 29.09.2026 też wariant 500 USD z trybem Ultrafast) \| AI Ultra – od 99,99 USD/mies. \|" | P2 | jw. |

---

## 5. gemini.md

Nic nowego do zgłoszenia w oknie 2026-09-25 → 2026-10-05. Plik nie wspomina modeli Gemini 2.5 (których dotyczy zbliżające się pełne wyłączenie 16–20.10.2026) ani Gemini 3.5 Pro – nie ma więc ryzyka nieaktualności z tych dwóch wątków. Wszystkie poprawki z poprzedniego audytu (B-39 do B-44 z 2026-09-25) są wdrożone i wciąż aktualne. Plik nie wymaga działań w tym audycie.

---

## Czego nie oznaczono (sprawdzone, zgodne z baseline)

- Claude Opus 5.5 jako domyślnie polecany model i jego cena (4/20 USD) – potwierdzone z pierwszej ręki, bez zmian.
- Stawki cache Opus 5.5 (5%) i Fable 5.1 (2,5%) w `claude-vs-chatgpt-programowanie.md:128` – potwierdzone z pierwszej ręki, poprawne.
- Gemini 3.1 Pro (preview) jako najmocniejszy model Google i Gemini 3.8 Flash jako najnowszy Flash – bez zmian od 25.09.
- Ceny Gemini (3.8 Flash, 3.1 Pro, plany Free/AI Plus/AI Pro/AI Ultra) – bez zmian od 25.09.
- Historyczne benchmarki (SWE-bench Opus 4.8 88,6%, HumanEval Claude 3.5 Sonnet/GPT-4o, MRCR v2 Opus 4.6) – poprawnie datowane, poza zakresem audytu.
- Claude Sonnet 4.5/Opus 4.5 wspominane tylko w kontekście historycznych benchmarków – nie wymagają poprawki (nie dotyczy ich deprecjacja/retirement z baseline, bo artykuły nie przedstawiają ich jako „aktualne").
- GPT-6.1 Astra jako wydany model – żaden z pięciu plików nie twierdzi, że Astra 6.1 już istnieje, więc błąd „odwołanej premiery" nie występuje w tej paczce (w przeciwieństwie do ryzyka w innych artykułach poza zakresem).
- Wersja UA botów OpenAI (1.3 vs 1.4) i status Claude Marketplace – NIEZWERYFIKOWANE w baseline, nie dotyczy tej paczki (żaden z plików nie wspomina botów OpenAI ani Marketplace w sposób wymagający korekty).

## Podsumowanie

| Priorytet | Liczba |
|---|---|
| P1 | 11 (B-01, 03, 08, 10, 11, 13, 17, 18, 20, 27 + B-16†) |
| P2 | 12 (B-02, 04, 06, 12, 14, 19, 21, 22, 23, 24, 26, 28) |
| P3 | 5 (B-05, 07, 09, 15, 25) |
| Razem | 28 |

† B-16 i B-17 to dwa osobne zgłoszenia P1 w `claude-vs-chatgpt-programowanie.md` (ten sam temat – GPT-6.1 Sol/Sonnet 5.5 – w dwóch różnych miejscach artykułu).

**Sprawy pilne (termin w ciągu ok. 14 dni od daty audytu, wspomniane w tej paczce):**
- **Claude Haiku 4.5** – wycofanie zapowiedziane nie wcześniej niż **15.10.2026** (10 dni). Model jest wymieniany jako „aktualny" w `claude.md`, `claude-vs-gemini.md` i `claude-vs-chatgpt-programowanie.md` bez tej informacji (B-06, B-14, B-25).
- Żaden z pięciu plików nie wspomina OpenAI o1/o3-mini/o4-mini (wycofanie 23.10.2026) ani Gemini 2.5 (wyłączenie 16–20.10.2026) jako aktualnych modeli – te dwie czerwone flagi z baseline nie dotyczą tej konkretnej paczki.
