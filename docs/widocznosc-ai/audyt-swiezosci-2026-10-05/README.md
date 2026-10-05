# Audyt świeżości treści widocznosc.ai – 2026-10-05

Tryb: tylko raport. Żaden plik serwisu nie został edytowany, żaden commit nie dotyka `portals/`.
Baseline: [`docs/widocznosc-ai/stan-modeli-2026-10-05.md`](../stan-modeli-2026-10-05.md) (budowany na `stan-modeli-2026-09-25.md`, zweryfikowany WebFetch/WebSearch 2026-10-05).
Poprzedni audyt: 2026-09-25 (`docs/widocznosc-ai/audyt-swiezosci-2026-09-25/`).

**Kontekst okna**: 10 dni między audytami to najszybsze tempo zmian na rynku modeli AI z obu audytów – Anthropic wydał **Claude Sonnet 5.5** (28.09), OpenAI na konferencji DevDay (29.09) wydało **GPT-6.1 Sol** i **odwołało premierę GPT-6.1 Astra** po nieudanych testach bezpieczeństwa, wprowadziło nowy plan **ChatGPT Pro za 500 USD** i funkcję **Dots**, a Google DeepMind ograniczenie udostępniło **Gemini 4 Argon** (fakt, którego pierwsza wersja tego baseline'u nie uwzględniła – skorygowano po ustaleniach paczki F, patrz niżej). Dobra wiadomość: audyt 2026-09-25 był skuteczny – zdecydowana większość jego poprawek (ok. 45 z ok. 55 zgłoszeń P1/P2) została realnie wdrożona w treści i jest zgodna z dzisiejszym stanem.

## Tabela: liczba zgłoszeń per paczka i priorytet

| Paczka | Zakres | P1 | P2 | P3 | Razem |
|---|---|---:|---:|---:|---:|
| A | modele-llm: przewodnik, chatgpt, chatgpt-vs-claude, co-potrafi-chatgpt, jak-dziala-chatgpt | 11 | 17 | 1 | 29 |
| B | modele-llm: claude, gemini, claude-vs-gemini, chatgpt-vs-gemini, claude-vs-chatgpt-programowanie | 11 | 12 | 5 | 28 |
| C | modele-llm: grok, copilot, deepseek, perplexity, jev | 0 | 3 | 2 | 5 |
| D | blog/geo (17 plików) | 0 | 2 | 4 | 6 |
| E | reszta bloga (ai-w-biznesie, rag, prompty, agenci-ai) + kod/dane/narzędzia | 1 | 6 | 3 | 10 |
| F | newsy z ostatnich 7 dni (6 plików) | 2 | 2 | 2 | 6 |
| **Razem** | | **25** | **42** | **17** | **84** |

Pliki pełne: [A](A.md) · [B](B.md) · [C](C.md) · [D](D.md) · [E](E.md) · [F](F.md)

## 10 najważniejszych P1

1. **[E, P1-1]** `functions/api/tools/brand-check.ts:116` – narzędzie Brand Check odpytuje na stałe `anthropic/claude-haiku-4.5`, **bez fallbacku**. Anthropic wycofuje ten model nie wcześniej niż **15 października 2026** (10 dni od audytu) – kolumna „Claude” w raportach klientów może zacząć zwracać błąd. *Sprawa pilna w kodzie – patrz niżej.*
2. **[B, B-16/B-17]** `claude-vs-chatgpt-programowanie.md` – artykuł porównujący Claude i ChatGPT do programowania nie wspomina **żadnego** z dwóch najważniejszych wrześniowych wydarzeń dla tego tematu: **GPT-6.1 Sol** (29.09, zbliżony do Astry w kodowaniu agentowym za ok. 1/5 ceny) i **Claude Sonnet 5.5** (28.09, zastąpił Sonnet 5 jako domyślny model środkowego tieru).
3. **[A, 2.1]** `chatgpt.md` – tabela planów ChatGPT nie zawiera nowego wariantu **Pro za 500 USD/mies.** z trybem „Ultrafast” (od 29.09.2026).
4. **[A, 1.2 / B, B-01]** `przewodnik.md` i `claude.md` – Claude Sonnet 5 opisywany jako aktualny/rekomendowany model środkowego tieru Anthropic; od 28.09.2026 to **Claude Sonnet 5.5** (ta sama cena 2/10 USD), a Sonnet 5 jest już w tabeli modeli legacy.
5. **[A, 3.9]** `chatgpt-vs-claude.md` – poleca Claude Haiku 4.5 jako „tańszy wariant” bez zastrzeżenia o zbliżającym się wycofaniu (15.10.2026).
6. **[B, B-08/B-10/B-13]** `claude-vs-gemini.md` – nagłówek tabeli i ceny podpisane „Sonnet 5” w trzech miejscach; powinno być Sonnet 5.5.
7. **[B, B-27]** `chatgpt-vs-gemini.md` – tabela „najnowszy model w API” nie wymienia GPT-6.1 Sol (29.09.2026).
8. **[F, #1]** `gemini-4-argon-zapowiedziany-przez-google-deepmind.md` – news fałszywie twierdzi, że w dniu publikacji nie było znanych szczegółów technicznych/cenowych/benchmarkowych Gemini 4 Argon – te dane (limit wyjścia 1 mln tokenów, program Fairwind, cena 2/10 USD, wyniki benchmarków) były publicznie dostępne już wtedy.
9. **[F, #2]** `gemini-ogranicza-darmowy-dostep-do-flash-lite.md` – zlewa płatne tiery Gemini w jedno „dla subskrybentów”, zacierając kluczowy fakt z artykułu źródłowego: najniższy płatny plan (4,99 USD) **nie** odblokowuje Gemini Pro.
10. **[A, 4.4]** `co-potrafi-chatgpt.md` – tabela porównawcza modeli wymienia „Claude (Sonnet 5 / Opus 5.5 / Fable 5.1)” zamiast Sonnet 5.5.

## Sprawy pilne w kodzie i treści (wycofanie w ciągu ~14 dni od audytu)

| Co | Gdzie | Termin | Status |
|---|---|---|---|
| **Claude Haiku 4.5** – retirement „nie wcześniej niż 15.10.2026” | `functions/api/tools/brand-check.ts:116` (hardkodowany model, **brak fallbacku**) | **10 dni** | **P1 – wymaga zmiany kodu przed 15.10** (przełączyć na `anthropic/claude-sonnet-5-5` albo dodać `fallbackModels`) |
| **Claude Haiku 4.5** – jak wyżej | Polecany bez zastrzeżeń w `chatgpt-vs-claude.md`, `claude.md`, `claude-vs-gemini.md`, `claude-vs-chatgpt-programowanie.md` | 10 dni | P1/P2 – dopisać zastrzeżenie o wycofaniu w treści |
| **Gemini 2.5 Pro/Flash/Flash-Lite** – pełne wyłączenie (Developer API) | Rynkowe (baseline §12); w audytowanym kodzie (`functions/_lib/url-check.ts`, Brand Check) **nie wykryto** odwołań do serii 2.5 – brak akcji w kodzie | **16.10.2026** (Developer API), 20.10 (Vertex AI) | Monitorować – obecnie bez wpływu na kod/treść serwisu |
| **OpenAI o1 / o3-mini / o4-mini / gpt-4-turbo** i inne – zaplanowane wycofanie | Sprawdzono paczki A, B, E – **żaden** audytowany plik nie odwołuje się do tych modeli jako aktualnych | 23.10.2026 (18 dni) | Bez akcji – nie dotyczy serwisu |
| **GPT-5-mini** (`openai/gpt-5-mini`) w Brand Check | `functions/api/tools/brand-check.ts:115` | 11.12.2026 (ok. 10 tyg. – jeszcze nie pilne) | P2 – do zmiany na `openai/gpt-5.6-luna` przy najbliższej okazji |
| **Perplexity `sonar-pro`** w Brand Check – odrzucany przez Agent API bez odpowiednika od 27.09.2026, kod ma fallback na `sonar`, ale gwarantowany nieudany pierwszy strzał | `functions/api/tools/brand-check.ts:106-107` | już dziś | P2 – zamienić model główny na `perplexity/sonar` |

## Lista rzeczy niezweryfikowanych (NIEZWERYFIKOWANE)

- Status **Claude Marketplace** (uruchomiony 2026-09-23) na dziś – brak nowych informacji w tej sesji.
- Rozbieżność wersji User-Agent botów OpenAI: **GPTBot/OAI-SearchBot 1.3 vs 1.4** – źródła wtórne niezgodne, `developers.openai.com/api/docs/bots` niedostępny (blokada egress) w sesjach budujących baseline.
- Zgodność **OAI-AdsBot** z robots.txt – niejednoznaczne w źródłach wtórnych.
- Czy darmowy plan **claude.ai (Free)** w czacie już domyślnie korzysta z Sonnet 5.5 czy wciąż z Sonnet 5 – źródła wtórne rozbieżne, strona cennika niejednoznaczna.
- Pełna lista modeli dostępnych w aplikacji **Perplexity** (plany Pro/Max) – centrum pomocy Perplexity niedostępne (403) w obu audytach.
- Nazwa trybu **„Pro Search”** w aplikacji Perplexity – niezweryfikowana w dwóch kolejnych audytach (centrum pomocy niedostępne).
- Progi cenowe **SuperGrok** w `grok.md` – niezweryfikowane (docs.x.ai zablokowany w tej sesji).
- Data pełnego wyłączenia `gemini-2.5-flash-image` na **Vertex AI** (ok. 2027-03-15) – jedno źródło wtórne, niepotwierdzone z pierwszej ręki.
- Dokładna data odcięcia wiedzy (knowledge cutoff) dla **GPT-6.1 Sol** – nie potwierdzona z pierwszej ręki (developers.openai.com zablokowany).

## Uwaga metodologiczna: dostęp sieciowy

W tej sesji proxy egress blokowało WebFetch do: `developers.openai.com`, `openai.com`, `ai.google.dev`, `deepmind.google` (częściowo – udało się dociągnąć przez WebSearch), `blog.google`, `support.google.com`, `techcommunity.microsoft.com`, `docs.perplexity.ai`, `docs.x.ai`, `docs.mistral.ai`, `api-docs.deepseek.com`, `alibabacloud.com`, `dev.meta.ai`. Ustalenia dotyczące tych dostawców oparte są na WebSearch i licznych, wzajemnie potwierdzających się źródłach wtórnych – oznaczone w raportach jako „(źródło wtórne)”. `platform.claude.com` i `support.claude.com` były dostępne – fakty o Anthropic pochodzą z pierwszej ręki. **Korekta w trakcie audytu**: pierwsza wersja baseline'u pominęła realną premierę **Gemini 4 Argon** (bo `deepmind.google` był wtedy zablokowany) – błąd wykryty i poprawiony przez paczkę F, baseline zaktualizowany. Rekomendacja: przy najbliższej możliwości zweryfikować z pierwszej ręki pozycje oznaczone NIEZWERYFIKOWANE powyżej.

## Podsumowanie wdrożenia poprzedniego audytu (2026-09-25)

Wszystkie paczki potwierdziły, że **większość** poprawek zgłoszonych 2026-09-25 została wdrożona w treści i kodzie (m.in. GPT-6 Pro/Sol/Luna, Claude Opus 5.5, Grok 4.7/SpaceXAI, Meta Muse, M365 Copilot wielomodelowy, Search Console AI control, 14 botów AI z OAI-AdsBot, Perplexity-User, Google-Extended/grounding). Pozostało kilka drobnych, nie-pilnych pozycji „carried forward” (np. „Claude Opus 5” w `anatomia-agenta.md:67`, nazwa „Pro Search” w Perplexity) – wymienione w odpowiednich paczkach (głównie E) jako P3.
