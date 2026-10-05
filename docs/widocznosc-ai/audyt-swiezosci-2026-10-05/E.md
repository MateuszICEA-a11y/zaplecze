# Audyt świeżości widocznosc.ai – część E (blog: ai-w-biznesie, rag, prompty, agenci-ai + kod: dane modeli, boty AI, narzędzia)

Data audytu: 2026-10-05. Punkt odniesienia: `docs/widocznosc-ai/stan-modeli-2026-10-05.md` (dalej: baseline). Audyt poprzedni: 2026-09-25, raport `docs/widocznosc-ai/audyt-swiezosci-2026-09-25/E.md` (dalej: audyt-09-25).
Ścieżki plików względem `portals/widocznosc.ai/`. Nic nie edytowano – tylko raport.

Priorytety: **P1** – błąd lub nieaktualne twierdzenie (w tym kod odwołujący się do modelu wycofywanego w ciągu ~14 dni), **P2** – brak ważnej nowości, **P3** – drobne.

Podsumowanie: **P1 – 1**, **P2 – 6**, **P3 – 3** (razem 10).

## Status poprawek z audytu 09-25

Dobra wiadomość: zdecydowana większość poprawek z audytu 09-25 została wdrożona i jest zgodna z nowym baseline'em.

**Wdrożone i wciąż aktualne:** P1-1 (brand-check.ts – dodano `fallbackModels` jako mitygację wygaszenia Sonar API, patrz P2-3 niżej), P1-3 (Google-Extended/grounding w Gemini), P1-4 (Perplexity-User), P1-5 (on-demand boty w AI Bots Check), P1-6 (Microsoft Copilot – „modele OpenAI i Anthropic” zamiast „rodzina GPT-5”), P1-7 (bezpieczenstwo-danych-llm.md:168 – GPT-6 Astra / Claude Fable 5.1), P1-8 (SearchGPT → „wyszukiwanie w ChatGPT”), P1-9 (trzy boty Anthropic w listach), P2-1 (OAI-AdsBot dodany, 14 botów), P2-2 (legacy aliasy `anthropic-ai`/`Claude-Web` wyłączone z dopasowania), P2-3 (ChatGPT-User/OAI-AdsBot opisane), P2-4 (przełącznik Search Console), P2-6 (daty w notatkach źródeł zmienione z 17 na 25 września – patrz jednak P2-1 niżej, bo 10 dni później są już nieaktualne ponownie), P2-7 (tabela w prompty/przewodnik.md zaktualizowana do GPT-6/Opus 5.5 – patrz P2-2 niżej), P3-1 (UA GPTBot/OAI-SearchBot na 1.4 w sondzie), P3-2, P3-3, P3-5 (liczba „86,7%” usunięta, zastąpiona opisem jakościowym).

**Nie wdrożone (carried forward):** fragmenty P3-8 (patrz P3-1 i P3-2 niżej) i P3-7 (patrz P3-3 niżej). P2-5 (modele API w Brand Check) częściowo nieaktualne inaczej niż opisano we wrześniu – patrz P1-1, P2-3, P2-4, P2-5 niżej.

Ogólna obserwacja: te 10 dni (28–29.09: Sonnet 5.5, GPT-6.1 Sol, odwołana GPT-6.1 Astra) są najszybszym tempem zmian z obu audytów, a mimo to większość treści na widocznosc.ai jest dziś w dobrym stanie – poza jednym naprawdę pilnym problemem w kodzie (P1-1).

---

## P1 – błędy i nieaktualne twierdzenia

### P1-1. Brand Check odpytuje Claude Haiku 4.5 – wycofanie za ~10 dni
- **Plik:linia:** `functions/api/tools/brand-check.ts:116`
- **Cytat:** `{ id: 'claude', label: 'Claude', model: 'anthropic/claude-haiku-4.5', useOpenRouterSearch: true }`
- **Problem:** Anthropic planuje wycofanie Claude Haiku 4.5 „nie wcześniej niż 15 października 2026” – to 10 dni od daty audytu. Narzędzie wysyłane do klientów mailem (raport Brand Check) przestanie działać dla kolumny „Claude” w dniu wycofania, chyba że OpenRouter w międzyczasie przełączy alias na następcę (Haiku 5.5 zapowiedziany „w najbliższych tygodniach”, ale **nie wydany** na 2026-10-05 – nie ma jeszcze czym zastąpić Haiku 4.5 1:1). Brak `fallbackModels` dla tego providera (w przeciwieństwie do Perplexity, patrz P2-3), więc po wycofaniu kolumna Claude w raporcie prawdopodobnie zwróci błąd bez żadnej sieci bezpieczeństwa.
- **Proponowana poprawka:** Przed 15 października 2026 zmienić model na `anthropic/claude-sonnet-5-5` (ten sam koszt $2/$10 jak Sonnet 5, teraz model domyślny środkowego tieru Anthropic) albo dodać `fallbackModels: ['anthropic/claude-sonnet-5']` jako sieć bezpieczeństwa, jeśli Haiku 4.5 ma zostać do samego końca. Monitorować zapowiedź Haiku 5.5 – gdy się pojawi, to on będzie najbliższym odpowiednikiem cenowym.
- **Prio:** P1
- **Źródło:** `docs/widocznosc-ai/stan-modeli-2026-10-05.md` §1, §12 (zweryfikowane WebFetch na platform.claude.com, docs/en/about-claude/model-deprecations)

---

## P2 – brak ważnych nowości

### P2-1. Notatki źródeł „stan na 25 września 2026” – nieaktualne po premierach Sonnet 5.5 i GPT-6.1 Sol
- **Plik:linia:** `src/content/blog/ai-w-biznesie/bezpieczenstwo-danych-llm.md:63,66`; `src/content/blog/rag/embeddingi.md:39`; `src/content/blog/prompty/przewodnik.md:45`; `src/content/blog/agenci-ai/anatomia-agenta.md:48,51`
- **Cytat:** „OpenAI, dokumentacja API, stan na 25 września 2026. Aktualne modele API: GPT-6 Astra, GPT-6 Sol i GPT-6 Luna…”; „Anthropic, dokumentacja, stan na 25 września 2026. Aktualne modele Claude Fable 5.1, Opus 5.5, Sonnet 5 i Haiku 4.5.”
- **Problem:** Te notatki poprawiono w ramach audytu 09-25 (wcześniej było „17 września”), ale rynek przyspieszył jeszcze bardziej: 28.09 Anthropic wydał Sonnet 5.5 (zastępuje Sonnet 5 jako domyślny model środkowego tieru), a 29.09 OpenAI wydał GPT-6.1 Sol (ulepszona wersja GPT-6 Sol, zbliżona do Astry w kodowaniu agentowym). Żadna z pięciu notatek tego nie odnotowuje.
- **Proponowana poprawka:** Zaktualizować obie notatki do „stan na 5 października 2026”: OpenAI – „Aktualne modele API: GPT-6 Astra, GPT-6.1 Sol, GPT-6 Sol i GPT-6 Luna; w ChatGPT domyślnie GPT-5.6 Luna (Free, Go) i GPT-5.6 Sol (Plus, Pro).”; Anthropic – „Aktualne modele Claude Fable 5.1, Opus 5.5, Sonnet 5.5 (domyślny model środkowego tieru) i Haiku 4.5.” Rozważyć usunięcie konkretnej daty z treści widocznej dla czytelnika na rzecz ogólnego sformułowania, bo w tym tempie zmian nota dezaktualizuje się przy każdym audycie.
- **Prio:** P2
- **Źródło:** `docs/widocznosc-ai/stan-modeli-2026-10-05.md` §1, §2

### P2-2. Tabela modeli w przewodniku po promptach bez Sonnet 5.5 i GPT-6.1 Sol
- **Plik:linia:** `src/content/blog/prompty/przewodnik.md:303-304`
- **Cytat:** „| GPT-5.6 / GPT-6 (Sol, Luna, Astra) | Instrukcje złożone, formatowanie |…”; „| Claude (Fable 5.1, Opus 5.5, Sonnet 5) | Długie dokumenty, wnioskowanie |…”
- **Problem:** Tabelę zaktualizowano w audycie 09-25 (dodano GPT-6 i Opus 5.5), ale od tego czasu Anthropic wydał Sonnet 5.5 (28.09, zastępuje Sonnet 5 jako model domyślny) i OpenAI – GPT-6.1 Sol (29.09, zbliżony do Astry).
- **Proponowana poprawka:** „| GPT-5.6 / GPT-6 (Sol, Luna, Astra, 6.1 Sol) | Instrukcje złożone, formatowanie |…”; „| Claude (Fable 5.1, Opus 5.5, Sonnet 5.5) | Długie dokumenty, wnioskowanie |…”.
- **Prio:** P2
- **Źródło:** `docs/widocznosc-ai/stan-modeli-2026-10-05.md` §1, §2

### P2-3. Brand Check: Perplexity odpytywany przez `sonar-pro`, który Agent API odrzuca bez odpowiednika
- **Plik:linia:** `functions/api/tools/brand-check.ts:106-107, 118-124`
- **Cytat:** `{ id: 'perplexity', label: 'Perplexity', model: 'perplexity/sonar-pro', fallbackModels: ['perplexity/sonar'], useOpenRouterSearch: false }` (komentarz w kodzie: „Perplexity wygasza Sonar API 27.09.2026; sonar-pro może przestać być routowalny, a sonar przechodzi na Agent API i ma działać dalej.”)
- **Problem:** Dobra wiadomość – kod od audytu 09-25 dostał mitygację (`fallbackModels`, przekazywane do OpenRouter jako `models: [sonar-pro, sonar]`), więc raport dla klienta prawdopodobnie nie pada całkowicie. Zła wiadomość – zgodnie z weryfikacją w sieci (2026-10-05) Perplexity Agent API **odrzuca `sonar-pro` i `sonar-reasoning-pro` bez żadnego odpowiednika** od 27.09.2026 (nie ma presetu 1:1, w przeciwieństwie do zwykłego `sonar`, który migrował bezproblemowo). Oznacza to, że każde zapytanie o markę w kolumnie Perplexity dziś: (1) traci czas i request na próbę `sonar-pro`, która zawsze się nie powiedzie, (2) dopiero potem dostaje odpowiedź z tańszego, mniej dociekliwego `sonar`, (3) w odpowiedzi/raporcie e-mail widoczne jest pole `model: 'perplexity/sonar-pro'` (ustawione statycznie z konfiguracji providera, nie z realnej odpowiedzi OpenRouter), czyli użytkownik widzi nazwę modelu, który w praktyce nigdy nie odpowiada.
- **Proponowana poprawka:** Ustawić `model: 'perplexity/sonar'` jako główny (bez fallbacku na nieistniejący odpowiednik `sonar-pro`) – to eliminuje zagwarantowany nieudany pierwszy strzał do OpenRouter i poprawia realne opóźnienie odpowiedzi. Jeśli zależy na głębszym researchu klasy „Pro”, sprawdzić aktualne presety Agent API (np. odpowiednik `sonar-reasoning`) i dopiero taki ewentualnie dodać.
- **Prio:** P2
- **Źródło:** WebSearch 2026-10-05 (llmgateway.io/blog/perplexity-sonar-api-retirement; truefoundry.com/docs/change-announcements/perplexity-agent-api-migration – źródła wtórne, wzajemnie potwierdzające się); `docs/widocznosc-ai/stan-modeli-2026-10-05.md` §5 (Sonar API wycofane zgodnie z planem 2026-09-27)

### P2-4. Brand Check: model ChatGPT w raporcie (`gpt-5-mini`) ma już ustaloną datę wycofania
- **Plik:linia:** `functions/api/tools/brand-check.ts:115`
- **Cytat:** `{ id: 'chatgpt', label: 'ChatGPT', model: 'openai/gpt-5-mini', useOpenRouterSearch: true }`
- **Problem:** Carried forward z audytu 09-25 (P2-5), wciąż niezmienione. Zweryfikowano dodatkowo: `gpt-5-mini-2025-08-07` ma ustalone wyłączenie na **11 grudnia 2026** (niecałe 10 tygodni od audytu – jeszcze nie „pilne” w oknie 14 dni, ale coraz bliżej). Model nie odpowiada też temu, co realnie widzi darmowy użytkownik ChatGPT (GPT-5.6 Luna) ani temu, co serwis już stosuje w Fan-out Check (`gpt-5.6-luna`).
- **Proponowana poprawka:** Zmienić na `openai/gpt-5.6-luna` (zgodność z domyślnym darmowym ChatGPT i z resztą serwisu) przed grudniową datą wycofania.
- **Prio:** P2
- **Źródło:** `docs/widocznosc-ai/stan-modeli-2026-09-25.md`/`-10-05.md` §2; WebSearch 2026-10-05 (community.openai.com, developers.openai.com/docs/deprecations – shutdown gpt-5-mini-2025-08-07 11.12.2026)

### P2-5. Brand Check: model Gemini (`gemini-3-flash-preview`) to przedserie podgląd z grudnia 2025
- **Plik:linia:** `functions/api/tools/brand-check.ts:117`
- **Cytat:** `{ id: 'gemini', label: 'Gemini', model: 'google/gemini-3-flash-preview', useOpenRouterSearch: true }`
- **Problem:** Carried forward z audytu 09-25 (P2-5), wciąż niezmienione. `gemini-3-flash-preview` to podgląd z 17.12.2025, sprzed serii 3.1–3.8. AI Mode w Google działa domyślnie na Gemini 3.5 Flash (od I/O 2026), a najnowszy Flash to już Gemini 3.8 Flash – żadnej z tych nazw narzędzie nie odpytuje.
- **Proponowana poprawka:** Zmienić na `google/gemini-3.5-flash` (odpowiednik domyślnego modelu AI Mode) lub `google/gemini-3.8-flash`, jeśli dostępny na OpenRouter.
- **Prio:** P2
- **Źródło:** `docs/widocznosc-ai/stan-modeli-2026-10-05.md` §3; WebSearch 2026-10-05

### P2-6. Podstrona Microsoft Copilot: brak GPT-6.1 Sol i Claude Sonnet 5.5 w Cowork/Studio
- **Plik:linia:** `src/data/aiModelsContent.ts:438, 448`
- **Cytat:** „w&nbsp;Microsoft 365 Copilot są to m.in. GPT-5.6 i&nbsp;GPT-6 Sol od OpenAI oraz Claude Opus 5.5 od Anthropic”; „Microsoft 365 Copilot od 2026 roku łączy modele OpenAI (m.in. GPT-5.6, GPT-6 Sol) i&nbsp;Anthropic (Claude Opus 5.5).”
- **Problem:** Zgodnie z M365 Message Center (źródło wtórne) od 30.09.2026 Microsoft 365 Copilot zaczął wdrażać w Copilot Cowork i Copilot Studio **GPT-6.1 Sol i Claude Sonnet 5.5** – jako dodatek do istniejących modeli, nie zamiennik. Treść (poprawiona w audycie 09-25 pod kątem P1-6) nie wymienia tej nowości, bo powstała przed 30.09.
- **Proponowana poprawka:** „…w&nbsp;Microsoft 365 Copilot są to m.in. GPT-5.6, GPT-6 Sol i GPT-6.1 Sol od OpenAI oraz Claude Opus 5.5 i Claude Sonnet 5.5 od Anthropic (w Copilot Cowork i Copilot Studio).” Analogicznie w zdaniu o routerze modeli.
- **Prio:** P2
- **Źródło:** `docs/widocznosc-ai/stan-modeli-2026-10-05.md` §4 (mc.merill.net/message/MC1483844 – źródło wtórne)

---

## P3 – drobne

### P3-1. „Współczesne GPT-5.6 czy Claude Opus 5” – Opus 5 zastąpiony przez Opus 5.5 dwa tygodnie temu
- **Plik:linia:** `src/content/blog/agenci-ai/anatomia-agenta.md:67`
- **Cytat:** „Współczesne GPT-5.6 czy Claude Opus 5 radzą sobie z tym znacznie lepiej, ale błędy w argumentach narzędziowych wciąż pozostają częstą przyczyną awarii agentów produkcyjnych.”
- **Problem:** Carried forward z audytu 09-25 (P3-8), nie wdrożone. Opus 5.5 zastąpił Opus 5 już 22.09.2026, czyli ponad dwa tygodnie przed tym audytem.
- **Proponowana poprawka:** „Współczesne modele, takie jak GPT-6 czy Claude Opus 5.5, radzą sobie z tym znacznie lepiej…”
- **Prio:** P3
- **Źródło:** `docs/widocznosc-ai/stan-modeli-2026-10-05.md` §1

### P3-2. „Zewnętrzny model bazowy (OpenAI GPT-5.6, Anthropic Claude, Google Gemini)”
- **Plik:linia:** `src/content/blog/ai-w-biznesie/build-vs-buy.md:130`
- **Cytat:** „Zewnętrzny model bazowy (OpenAI GPT-5.6, Anthropic Claude, Google Gemini) dostarcza rozumienie języka…”
- **Problem:** Carried forward z audytu 09-25 (P3-8), nie wdrożone. Nie błąd (GPT-5.6 nadal działa w ChatGPT), ale w API aktualna generacja to już GPT-6 (Astra/Sol/Luna/6.1 Sol).
- **Proponowana poprawka:** „Zewnętrzny model bazowy (OpenAI GPT-6, Anthropic Claude, Google Gemini) dostarcza rozumienie języka…”
- **Prio:** P3
- **Źródło:** `docs/widocznosc-ai/stan-modeli-2026-10-05.md` §1, §2

### P3-3. Nazwa trybu „Pro Search” w Perplexity – wciąż niezweryfikowana
- **Plik:linia:** `src/data/aiModelsContent.ts:386, 405`
- **Cytat:** „Tryb Pro Search i&nbsp;pogłębiona analiza”; „audyt widoczności w&nbsp;trybie Pro Search” (heroSubtitle nie zawiera już tej frazy – poprawione od audytu 09-25 tylko częściowo)
- **Problem:** Carried forward z audytu 09-25 (P3-7), nie wdrożone. Baseline nie obejmuje nazw trybów w aplikacji Perplexity; nazwa „Pro Search” pozostaje **NIEZWERYFIKOWANA** (centrum pomocy Perplexity niedostępne w poprzednich sesjach weryfikacyjnych).
- **Proponowana poprawka:** „Tryb Pro i&nbsp;pogłębiona analiza” – do potwierdzenia po sprawdzeniu aktualnej nazwy w aplikacji Perplexity.
- **Prio:** P3
- **Źródło:** audyt-09-25 (NIEZWERYFIKOWANE, bez zmiany stanu wiedzy w tym audycie)

---

## Sprawdzone bez uwag

- `src/data/aiModels.ts`, `src/data/homepageFaq.ts` – zgodne z baseline, poprawki z audytu 09-25 (bing-copilot „modele OpenAI i Anthropic”, „wyszukiwanie w ChatGPT” zamiast „SearchGPT”) nadal aktualne.
- `functions/_lib/ai-bots.ts` – 14 botów, w tym OAI-AdsBot, pole `robotsTxt` (`honored`/`may-ignore`/`undeclared`), legacy tokeny (`anthropic-ai`, `Claude-Web`) prawidłowo wyłączone z dopasowania. Zgodne z baseline – brak nowych botów ani zmian polityk w oknie 2026-09-25→10-05.
- `functions/_lib/ai-bots-probe.ts` – UA sondy `GPTBot/1.4`, `OAI-SearchBot/1.4` (poprawione od audytu 09-25); baseline ostrzega o niepotwierdzonej rozbieżności 1.3 vs 1.4 w źródłach wtórnych, ale rekomenduje nie zgłaszać bez weryfikacji z pierwszej ręki – nie zgłaszam.
- `functions/_lib/reports/ai-bots-check.ts`, `functions/api/tools/ai-bots-check.ts` – logika zgodna z aktualną listą botów i ich `robotsTxt`/`critical`; action items poprawnie rozróżniają boty krytyczne, „may-ignore” i tokeny legacy.
- `functions/api/tools/fanout.ts` – domyślny model `gpt-5.6-luna` zgodny z domyślnym modelem darmowego ChatGPT (bez zmian od audytu 09-25).
- `functions/_lib/url-check.ts` – `ANALYSIS_MODEL = 'google/gemini-3.1-flash-lite'` (linia 548) – bez wpisu o wycofaniu w baseline, nie dotyczy go seria Gemini 2.5 wygaszana w połowie października.
- `src/data/aiModelsContent.ts` – sekcje chatgpt/claude/gemini/perplexity: wszystkie poprawki z audytu 09-25 (Google-Extended/grounding, Perplexity-User, trzy boty Anthropic, przełącznik Search Console, usunięcie „86,7%”, usunięcie liczby stron indeksu Brave) nadal zgodne z baseline. Jedyna nieaktualność – M365 Copilot (P2-6) i nazwa trybu Perplexity (P3-3).
- Blog ai-w-biznesie (ai-act-rodo, ai-w-hr, ai-w-marketingu, ai-w-obsludze-klienta, ai-w-sprzedazy, roi-z-ai, etyka-ai-w-firmie, jak-rozmawiac-z-zarzadem, od-czego-zaczac, przewodnik) – treści regulacyjne (RODO, AI Act, KRiBSI) bez twierdzeń o modelach/botach AI wymagających korekty; brak nowych nieaktualności w oknie audytu.
- Blog rag (chunking-strategie, przewodnik, reranking) – brak twierdzeń o konkretnych wersjach modeli AI wymagających korekty (Qwen3-Reranker-4B, Qwen3-Embedding-8B, MTEB – poprawnie datowane jak w audycie 09-25).
- Blog agenci-ai/przewodnik.md – brak nowych nieaktualności.
