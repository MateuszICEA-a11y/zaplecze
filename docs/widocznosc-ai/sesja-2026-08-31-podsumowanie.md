# Sesja 31.08.2026 – wpis „Jak działa ChatGPT” + rozbudowa huba /pozycjonowanie-ai/

Wszystko wypchnięte na `main`, Cloudflare Pages przebudował stronę.

## Commity

| Hash | Zakres |
|---|---|
| `4ffdc4d9` | jak-dziala-chatgpt: wersja po poprawkach redakcyjnych Mateusza |
| `98596da2` | jak-dziala-chatgpt: „model generujący obrazy” zamiast „obrazowego” |
| `622c3589` | anchory do /pozycjonowanie-ai/ przestały obiecywać przewodnik |
| `6ca4e042` | hub: spis treści, przebieg wdrożenia, FAQ + FAQPage |
| `da4b12cd` | hub: sekcja efektów na anonimowym case + odpowiedź o cenę |
| `447e72f2` | hub: korekta redakcyjna (terminologia RAG, fleksja nazw) |

## 1. Wpis „Jak działa ChatGPT”

Podmieniony na wersję po korekcie Mateusza (31 linii → 42). Kierunek zmian:
doprecyzowany lead („w swoim podstawowym trybie, bez użycia narzędzi”),
konsekwentne „okno kontekstowe”, „zbiór danych treningowych” zamiast „korpusu
tekstu”, polska nazwa trybu „Myśl” (Thinking), „wnioskowanie” zamiast
„inferencji”, RAG rozwinięty do „generowania wspomaganego wyszukiwaniem”.

Osobno: „osobny model obrazowy (GPT Image)” → „osobny model generujący obrazy”.
Wariant „model wizyjny” odrzucony – w branży oznacza model *rozumiejący* obraz,
a GPT Image działa odwrotnie.

## 2. Diagnoza huba /pozycjonowanie-ai/

Punkt wyjścia: hub miał **1 582 słowa** i był chudszy od każdej ze swoich
pięciu podstron (2 660 słów) oraz od wpisów blogowych (3 743–4 833). Cztery
sekcje merytoryczne, brak spisu treści, brak FAQ, schema bez `FAQPage`.
Odwrotność wzorca pillar: liść mocniejszy niż hub.

Zderzenie z analizą SERP z 17.08 (`docs/analiza-klaster-pozycjonowanie-ai-2026-08-17.md`):

- zwycięski wzorzec w SERP-ie to **hub usługowy + osobny poradnik blogowy**, nie hub przerobiony na poradnik,
- sembility.com trzyma #1 na „pozycjonowanie ai” hubem obejmującym 6 LLM-ów (nasz ma 5),
- AI Overview na 10/10 fraz klastra → treść musi być wycinalna jako cytat,
- CPC frazy 36,78 zł, PAA pyta o cenę → intencja komercyjna, nie poradnikowa.

**Decyzja: rozbudować hub jako stronę usługową, nie robić z niego przewodnika.**
Rolę przewodnika pełni `/geo/przewodnik/` (3 743 słowa).

## 3. Anchory (`622c3589`)

Dwa wpisy linkowały do strony usługowej słowem „przewodnik”:

- `modele-llm/jak-dziala-chatgpt.md` – teraz „w ramach pozycjonowania pod LLM”, plus dołożony odnośnik do `/geo/przewodnik/`,
- `ai-w-biznesie/od-czego-zaczac.md` – „Zakres prac i metodykę opisuje strona…”.

Pozostałych 7 anchorów było już poprawnie usługowych.

## 4. Rozbudowa huba (`6ca4e042`, `da4b12cd`)

Dodane:

- **sticky spis treści** – ten sam komponent i style co na podstronach modeli,
- **P/04 „Jak wygląda wdrożenie krok po kroku”** – 5 etapów z ramami czasowymi (audyt → dostęp botów i encja → treści → wzmianki → monitoring) plus trzy karty rozdzielające czas efektu: RAG = dni, dane treningowe = miesiące, pierwszy wiarygodny pomiar = 4–6 tygodni,
- **P/05 „Efekty”** – anonimowy case (BusManiak.pl bez nazwy domeny, na życzenie klienta): 2 296 cytowań AI, 213 cytowanych podstron, ~480 pobrań dziennie przez ChatGPT-User, rozkład na 6 platform, atrybucja Ahrefs Brand Radar + Cloudflare Analytics (18–19.08.2026),
- **P/07 FAQ** – 7 pytań (3 z PAA) + `FAQPage` w JSON-LD.

Ceny: **nie publikujemy cennika**, wycena indywidualna po rozmowie – tak brzmi
odpowiedź w FAQ.

Efekt: **1 582 → 2 674 słowa**, schema `WebPage + BreadcrumbList + Service + FAQPage`.

## 5. Korekta redakcyjna (`447e72f2`)

27 zmian w dwóch plikach, po przejeździe Mateusza:

- ujednolicona terminologia: „wyszukiwanie na żywo” → „generowanie wspomagane wyszukiwaniem (RAG)”, „wiedza z treningu” → „dane treningowe”, „losowe” → „niedeterministyczne”, „wzmianki” → „wzmianki marki”,
- odmiana nazw własnych: Claude'zie, Copilocie, Binga/Bingu,
- ChatGPT-User opisany jako crawler, nie agent,
- w FAQ o SEO doszedł wtręt o `semantic completeness` i `query fan out` w Google AI Mode,
- `aiModels.ts`: shortDesc ChatGPT/Gemini/Copilot (Copilot + zdanie o Bing Webmaster Tools) – zmiana propaguje się też na podstrony modeli i stopkę.

Gotcha: odpowiedzi FAQ renderowały się jako czysty tekst, więc kursywa nie
działała – przełączone na `set:html`. `faqPageNode` robi `stripHtml`, więc do
JSON-LD trafia wersja bez tagów.

## Zostało otwarte

- **DeepSeek jako 6. model** – wymaga wpisu w `aiModels.ts` i pełnej treści podstrony w `aiModelsContent.ts` (podstrony mają po ~2 600 słów). Domyka lukę wobec sembility.
- Hero huba nadal chwali się wyłącznie liczbami o agencji (500+ projektów, 15+ lat, #1 SEMKRK) – po dodaniu sekcji Efektów warto rozważyć podmianę jednej kafli na wynik klienta.

## Gotche z sesji

- Zrzuty dla Mateusza idą do `/mnt/c/Users/sibil/Downloads`, nie do `~/Downloads` w WSL.
- `pkill -f "astro preview"` w Bash zabija też własną powłokę (exit 144) – używać `fuser -k <port>/tcp`.
- Push potrafi odbić się o commit automatu newsów; `git -c rebase.autoStash=true rebase origin/main` przepuszcza rebase mimo pre-existing zmian innej sesji w worktree.
