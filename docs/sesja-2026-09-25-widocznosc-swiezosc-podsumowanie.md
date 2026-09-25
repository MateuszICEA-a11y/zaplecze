# Sesja 2026-09-25 – widocznosc.ai: weryfikacja newsów i przebieg świeżości treści

## Zrobione (wszystko na `main`, wdrożone na produkcję)

1. **Trzy newsy z 22–25.09 zweryfikowane i poprawione** – Claude Opus 5.5, GPT-6 Sol i Luna, przegląd premier 15–25.09. Sprawdzone uwagi zewnętrznej recenzji: część była błędna (m.in. „Agents' Last Exam” to prawdziwy benchmark, Fable 5.1 to model Anthropic, DeepSeek wycofał przekierowanie V4 Pro na V4.1-Flash). Dodane brakujące obrazki newsów (pierwszy commit był bez nich).
2. **Wzorzec stanu rynku** – `docs/widocznosc-ai/stan-modeli-2026-09-25.md` (oficjalne źródła, z sekcją „Czerwone flagi dla audytu” i uzupełnieniami po audycie).
3. **Audyt świeżości całej witryny** – `docs/widocznosc-ai/audyt-swiezosci-2026-09-25/A–F.md`: 88 × P1, 53 × P2, 70 × P3.
4. **Poprawki P1 i P2 wdrożone** – 38 artykułów blogowych (`updated: 2026-09-25`), 13 newsów (korekty + notki „Aktualizacja (25.09.2026)”), `src/data/*`, podstrony `pozycjonowanie-ai`, FAQ strony głównej. Główne tematy: Opus 5.5 zamiast Opus 5, GPT-6 Sol/Luna, Astra w ChatGPT jako GPT-6 Pro, Grok 4.7 i SpaceXAI, raport AI i przełącznik AI w Search Console, Claude z wyszukiwaniem, `utm_source=chatgpt.com`, boty.
5. **Narzędzia**
   - Dostęp botów AI: 14 botów (nowy OAI-AdsBot), status robots.txt per bot, ostrzeżenie dla ChatGPT-User i Perplexity-User (WAF zamiast robots.txt), liczba botów liczona z listy.
   - Brand Check: `perplexity/sonar` jako zapasowy model dla `perplexity/sonar-pro` (parametr `models` w OpenRouter), w raporcie model, który faktycznie odpowiedział.
6. **Nowa infografika** `infographic-geo-boty-ai-przewodnik.png` (przez agy staffer; Claude-User, Google-GeminiNotebook, kolumna „Pozostałe”).
7. **Cotygodniowy audyt w chmurze** – routine `trig_011YQxdD8cAaCfenmqssoQeN`, poniedziałki 5:00 UTC (7:00 / po 25.10 6:00 czasu PL), Sonnet 5, tylko raport na gałęzi `audyt-swiezosci/<data>`: https://claude.ai/code/routines/trig_011YQxdD8cAaCfenmqssoQeN

## Otwarte

- [ ] **Sonar API – wyłączenie 27.09.2026** (oficjalnie: docs.perplexity.ai/docs/agent-api/migrate-from-sonar/overview; mapowanie sonar→`fast`, sonar-pro→`low`, sonar-reasoning-pro→`medium`, sonar-deep-research→`high`). OpenRouter nie ogłosił, co zrobi z `perplexity/sonar*`. 27–28.09 uruchomić Brand Check i sprawdzić kolumnę Perplexity. Decyzja do podjęcia: bezpośrednie wywołanie Agent API (preset `low`) – wymaga `PERPLEXITY_API_KEY` w Cloudflare Pages.
- [ ] **Polityka prywatności** – szkic `docs/widocznosc-ai/polityka-prywatnosci-szkic-2026-09-25.md` do przeglądu prawnego (OpenAI, OpenRouter, Anthropic, Google, Perplexity, Resend, Cloudflare).
- [ ] **28.09** – sprawdzić pierwszy przebieg routine (czy chmura ma dostęp do prywatnego repo `MateuszICEA-a11y/zaplecze`).
- [ ] Ręcznie: czy nowe zapisy do ChatGPT Pro 200 USD są wstrzymane (chatgpt.com/pricing) – z treści usunięte jako niepotwierdzone.
- [ ] News o funduszu 200 mln USD (26.08) – źródło z 22.07, decyzja redakcyjna.
- [ ] ~70 poprawek P3 z raportów A–F (niewdrożone).
- [ ] Opcjonalnie: odświeżenie modeli w Brand Check (`gpt-5-mini`, `gemini-3-flash-preview`) – zmienia wyniki narzędzia, osobna decyzja.

## Wnioski na przyszłość

- Newsy traktujemy jako zapis stanu z dnia publikacji: poprawiamy tylko błędy, a zmiany po fakcie opisujemy notką „Aktualizacja (DD.MM.RRRR)”.
- Subagentom zlecającym grafikę nie pisać „zachowaj dokładnie styl” – agy odtwarzał oryginał piksel po pikselu przez 22 min. Wystarczy „nowa grafika w podobnym klimacie”.
- Push z sesji: token nieaktywnego konta `gh` `MateuszICEA-a11y` (szczegóły w pamięci Claude Code); przed pushem fetch + rebase, bo na main commitują też cron newsów i równoległe sesje.
