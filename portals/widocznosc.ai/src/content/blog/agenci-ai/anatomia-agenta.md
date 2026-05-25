---
title: 'Anatomia agenta AI – narzędzia, pamięć, pętla decyzyjna'
subtitle: 'Zrozum, co napędza agenta AI, zanim powierzysz mu zadanie w swojej firmie'
description: 'Jak działa agent AI od środka? Narzędzia, trójwarstwowa pamięć i pętla ReAct – architektura, którą musisz znać przed wdrożeniem.'
date: 2026-05-25
image: ../../../assets/images/blog1.png
icon: '<circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M2 12h4M18 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>'
author:
  name: 'Michał Ziach'
  role: 'CTO · ICEA'
  avatar: ../../../assets/images/authors/michal-ziach.avif
readTime: '9 min'
tags: ['Agenci AI', 'Architektura', 'Pamięć', 'Narzędzia AI']
pillar: 'agenci-ai'
intent: 'INFO'
level: 'L2'
---

Agent AI to nie chatbot z lepszym promptem. To system, który **planuje**, **wywołuje narzędzia** i **zapamiętuje wyniki** – powtarzając ten cykl tak długo, aż osiągnie cel. Żeby ocenić, czy agent nadaje się do konkretnego zadania w Twojej organizacji, musisz rozumieć trzy składniki jego architektury: narzędzia (czyli „ręce"), pamięć (czyli „kontekst operacyjny") i pętlę decyzyjną (czyli „mózg"). Zanim powierzysz agentowi dostęp do CRM-u, bazy danych lub skrzynki mailowej, sprawdź, jak każdy z tych elementów działa pod spodem. Szerszy kontekst – czym agenci AI różnią się od klasycznych automatyzacji i kiedy warto po nich sięgać – znajdziesz w [przewodniku po agentach AI](/agenci-ai/przewodnik).

## Narzędzia – jak agent działa na świecie zewnętrznym

LLM (Large Language Model, czyli duży model językowy) sam w sobie jest bezstanowy i odcięty od internetu. Żeby cokolwiek sprawdzić, zmienić lub wykonać, potrzebuje narzędzi. Mechanizm ich wywoływania nosi w literaturze anglojęzyczną nazwę *tool calling* – agent generuje specjalny token wywołania, wstrzymuje przetwarzanie i czeka na wynik z zewnętrznego systemu, po czym włącza odpowiedź do swojego kontekstu roboczego.

Narzędzia to granica między modelem a rzeczywistością. Piszesz do agenta „sprawdź, czy ta umowa jest podpisana" – agent sam w sobie tego nie wie. Musi wywołać narzędzie do wyszukiwania w bazie dokumentów, dostać wynik i dopiero wtedy odpowiedzieć.

Trzy główne kategorie narzędzi w produkcyjnych systemach agentowych:

- **Wyszukiwanie informacji** – zapytania do baz wektorowych (ang. *vector stores*), wyszukiwarki, API zewnętrznych serwisów; agent pobiera dane potrzebne do wnioskowania
- **Zapis i modyfikacja stanu** – pisanie do baz danych, wysyłanie e-maili, tworzenie ticketów w Jirze, aktualizacja CRM; to narzędzia nieodwracalne, wymagające szczególnej ostrożności
- **Wykonanie kodu** – uruchamianie skryptów Python, poleceń powłoki, transformacji danych; najsilniejsze i zarazem najbardziej ryzykowne

**Pionierski system MRKL (Modular Reasoning, Knowledge and Language) z 2022 roku pokazał, że modele o małej skali mają duże trudności z poprawną ekstrakcją argumentów do wywołań narzędzi.** Późniejszy Toolformer (Schick et al. 2023) rozwiązał ten problem przez samonadzorowane uczenie się korzystania z interfejsów programistycznych – na podstawie minimalnej liczby przykładów ludzkich. Współczesne GPT-4o czy Claude 3.5 radzą sobie z tym znacznie lepiej, ale błędy w argumentach narzędziowych wciąż są częstą przyczyną awarii agentów produkcyjnych.

Zanim wybierzesz framework agentowy, [przewodnik po modelach LLM](/modele-llm/przewodnik) pokazuje, które modele najlepiej radzą sobie z precyzją wywołań narzędziowych – to kryterium często ważniejsze niż ogólne parametry na benchmarkach.

## Pętla decyzyjna ReAct – myśl, działaj, obserwuj

Większość produkcyjnych agentów działa w paradygmacie ReAct (skrót od *Reasoning and Acting* – wnioskowanie i działanie). Zamiast zaplanować wszystko z góry, agent w każdym kroku generuje trzy elementy: myśl (wewnętrzną analizę sytuacji), działanie (wywołanie narzędzia) i obserwację (wynik z zewnętrznego systemu). Potem cykl się powtarza.

Formalnie stan agenta w kroku *t* to: poprzedni stan plus nowa myśl, nowe działanie i nowa obserwacja. Taka pętla pozwala agentowi reagować na niespodziewane wyniki – jeśli baza danych zwróci błąd, agent może spróbować innego zapytania zamiast ślepo kontynuować.

Cztery wzorce kontroli przepływu, które warto rozróżniać:

| Wzorzec | Charakterystyka | Typowe zastosowanie |
|---|---|---|
| Potok sekwencyjny | Predefiniowane kroki, bez możliwości korekty w trakcie | Powtarzalne procesy ETL, proste automatyzacje |
| Refleksja | Agent generuje odpowiedź, potem ją krytykuje i poprawia | Optymalizacja kodu, redagowanie treści |
| ReAct | Przeplatanie myślenia i wywoływania narzędzi w jednej pętli | Badania rynkowe, analiza danych w czasie rzeczywistym |
| Drzewo myśli (ToT) | Generowanie wielu alternatywnych hipotez, ocena i wybór najlepszej | Złożone planowanie, zadania wieloetapowe |

**ReAct jest dominującym wzorcem w systemach produkcyjnych, ale ma cenę – każde wywołanie narzędzia generuje opóźnienie i zużywa okno kontekstowe.** W zadaniach, gdzie historia interakcji jest długa, kontekst zapełnia się szybciej niż się wydaje. Agenty działające przez wiele godzin lub dni wymagają zewnętrznych mechanizmów kompresji historii.

Wzorzec Reflexion rozwiązuje inny problem: uczenie się na błędach. Gdy agent wykryje nieefektywną pętlę – np. wielokrotne wywołanie tego samego narzędzia z identycznym wynikiem – resetuje środowisko, generuje autorefleksję na podstawie historii niepowodzenia i zapisuje ją do pamięci roboczej. Kolejna próba korzysta już z tej lekcji jako kontekstu.

LangGraph, jeden z najbardziej dojrzałych frameworków agentowych (wersja v0.4, 2026), modeluje przepływ agenta jako [grafy skierowane](https://pl.wikipedia.org/wiki/Graf_(matematyka)) – wierzchołki to stany, krawędzie to przejścia warunkowe. Ta architektura pozwala na pełną kontrolę nad cyklami i punktami kontrolnymi (checkpoints), gdzie człowiek może zatwierdzić lub zablokować kolejny krok.

## Architektura pamięci – skąd agent wie, co już zrobił

Modele językowe są bezstanowe – między sesjami nie pamiętają nic. Każde wywołanie API zaczyna od pustego kontekstu. Produkcyjny agent musi to obejść przez zewnętrzne systemy pamięci.

Nie wystarczy RAG (Retrieval-Augmented Generation, czyli wyszukiwanie wspomagające generowanie). RAG dostarcza statyczny kontekst – pobiera fragmenty z bazy i wstrzykuje je do prompta. Pełny system pamięci agentowej idzie dalej: **aktywnie decyduje, co zapisać, jak połączyć nowe informacje ze starymi i kiedy coś zapomnieć**.

Trójwarstwowy model pamięci stosowany w systemach produkcyjnych:

- **Pamięć epizodyczna** – kronika konkretnych zdarzeń, wywołań narzędzi i interakcji z użytkownikiem w ujęciu chronologicznym; agent może cofnąć się i sprawdzić, co robił w poprzedniej sesji
- **Pamięć semantyczna** – ustrukturyzowana wiedza o świecie: fakty, reguły biznesowe, profile klientów; dla złożonego wnioskowania sama baza wektorowa nie wystarcza – potrzebne są grafy wiedzy (ang. *knowledge graphs*) zdolne do łączenia odległych encji
- **Pamięć stanu** – aktualny punkt w grafie realizacji zadania; zarządzanie nią wymaga transakcyjnych gwarancji spójności, żeby uniknąć konfliktów przy równoległych operacjach zapisu

<aside class="callout-fact">
  <div class="callout-icon">✦</div>
  <div class="callout-body">
    <div class="callout-label">Ciekawostka</div>
    <p>Eksperyment <strong>Generative Agents (Park et al. 2023)</strong> zasymulował interakcje społeczne w wirtualnym miasteczku z 25 agentami. Każdy agent ważył pamięć epizodyczną według trzech kryteriów: świeżości, ważności i trafności semantycznej. Model generował trzy kluczowe pytania na podstawie 100 ostatnich obserwacji, żeby wyodrębnić abstrakcyjne wnioski. Efekt – emergentne zachowania społeczne: dyfuzja plotek, pamięć relacyjna, wspólna koordynacja wydarzeń. <strong>Żaden z tych wzorców nie był zaprogramowany wprost – wyłonił się z architektury pamięci.</strong></p>
  </div>
</aside>

Cykl życia wpisu w pamięci to trzy procesy: **konsolidacja** (usuwanie sprzecznych lub nadmiarowych faktów), **wygaszanie** (starsze i rzadziej używane wpisy tracą wagę – modelowane funkcją wykładniczą), i **śledzenie osi czasu** (rejestrowanie, kiedy dany fakt się zmienił, żeby odróżnić poprzedni adres klienta od obecnego). Platforma Graphiti firmy Zep jest jedną z pierwszych implementacji tego trzeciego mechanizmu w środowisku open-source.

<aside class="callout-expert">
  <div class="callout-icon"><img src="/authors/michal-ziach.avif" alt="Michał Ziach" /></div>
  <div class="callout-body">
    <div class="callout-label">Opinia eksperta</div>
    <p>W projektach, które wdrażamy w ICEA, najczęstszy błąd to traktowanie bazy wektorowej jako systemu pamięci agenta. Baza wektorowa to świetne narzędzie do wyszukiwania – ale nie zarządza cyklem życia wspomnień, nie łączy sprzecznych faktów i nie śledzi zmian w czasie. <strong>Agent oparty wyłącznie na RAG będzie działał dobrze w pierwszym tygodniu, a po miesiącu zacznie odpowiadać na podstawie przestarzałych danych, bo nie ma mechanizmu wygaszania nieaktualnych wpisów.</strong></p>
    <div class="callout-author">Michał Ziach · CTO, ICEA</div>
  </div>
</aside>

Jeśli budujesz system oparty na dokumentach firmowych, [przewodnik po RAG](/rag/przewodnik) wyjaśnia, jak zaprojektować warstwę pobierania danych, żeby agent dostawał trafne fragmenty zamiast szumu.

## Bezpieczeństwo pętli wykonawczej

Agent z dostępem do narzędzi zapisujących to potencjalny wektor ataku. Najgroźniejszy scenariusz nosi nazwę pośredniego wstrzykiwania promptów (ang. *indirect prompt injection*) – złośliwe instrukcje ukryte w danych przetwarzanych przez agenta. Agent czyta dokument PDF, tabelę z CRM-u lub historię repozytorium git i natrafia na tekst, który przejmuje kontrolę nad jego procesem wnioskowania.

Skutki mogą być poważne: exfiltracja danych, modyfikacja konfiguracji systemu, a w przypadku agentów z dostępem do kodu – wykonanie dowolnych komend na serwerze.

Trzy warstwy ochrony, które w 2026 roku uznaje się za obowiązkowe:

- **Izolacja środowiska wykonawczego** – agent myśli w oddzielnym procesie od agenta działającego; narzędzia uruchamiane są w efemerycznych, jednorazowych maszynach wirtualnych bez dostępu do surowych kluczy API
- **Allowlista połączeń wychodzących** – domyślne blokowanie ruchu wychodzącego, jedynie whitelista zatwierdzonych domen; uniemożliwia exfiltrację danych przez zapytania DNS
- **Ochrona plików konfiguracyjnych** – pliki definiujące zachowanie agenta nie mogą być modyfikowane przez agenta nawet w jego własnym obszarze roboczym

**Najniebezpieczniejszy wariant to agent działający bezpośrednio na maszynie produkcyjnej z pełnym dostępem do sieci – taki scenariusz zostawia sam proces agenta narażonym na przejęcie.**

Firma Ramp we wdrożeniu agenta finansowego „Inspect" rozwiązuje ten problem przez efemeryczne maszyny wirtualne na platformie Modal – środowisko myślenia jest całkowicie oddzielone od środowiska działania. To wzorzec wart powielania w każdym systemie agentowym z dostępem do danych produkcyjnych.

## Frameworki – czego używać w 2026 roku

Wybór frameworku to decyzja architektoniczna, nie techniczna. Każde narzędzie optymalizuje pod inny typ problemów.

Rynek frameworków agentowych w 2026 roku konsoliduje się wokół pięciu głównych opcji:

| Framework | Model orkiestracji | Mocna strona | Kiedy używać |
|---|---|---|---|
| LangGraph | Grafy stanów, przepływy warunkowe | Pełna kontrola nad cyklami, wbudowane punkty kontrolne | Złożona logika warunkowa, człowiek w pętli |
| CrewAI | Podejście rolkowe, agenci z zadaniami i tłem | Szybkie prototypowanie, czytelna abstrakcja biznesowa | Wielorolkowe zespoły automatyzujące procesy |
| AutoGen | Sieci konwersacyjne, komunikacja przez komunikaty | Izolacja i automatyczne uruchamianie kodu w Dockerze | Eksploracja badawcza, automatyczne programowanie |
| LlamaIndex | Przepływy zorientowane na dane, RAG-first | Najlepsze metody wyszukiwania hybrydowego | Analiza dużych wolumenów dokumentów |
| Semantic Kernel | Lekki SDK, spójność enterprise | Integracja z Azure, obsługa C#, Java i Python | Rozwiązania korporacyjne w ekosystemie Microsoft |

**LangGraph dominuje w systemach produkcyjnych wymagających audytowalności** – każdy krok jest rejestrowany, można wycofać się do dowolnego punktu kontrolnego i zbadać, co agent zdecydował i dlaczego. Dla systemów finansowych czy prawnych to często wymóg regulacyjny.

CrewAI ma znacznie wyższe zużycie tokenów, bo generuje rozbudowane konteksty fabularne dla każdego agenta. W środowisku z ograniczonym budżetem na API może to być zaskoczenie przy pierwszym rachunku.

Decyzja o architekturze agentowej zawsze zaczyna się od zrozumienia, jaką intencję użytkownika agent ma obsługiwać. [Przewodnik po promptach](/prompty/przewodnik) wyjaśnia, jak projektować instrukcje systemowe, które kierują agentem precyzyjnie – bez zbędnych nawrotów pętli.

## Kiedy agent naprawdę ma sens

Agenci nie nadają się do wszystkich zadań. Mają trzy twarde ograniczenia, które w 2026 roku nadal pozostają otwarte.

Pierwsze – wąskie gardło okna kontekstowego. Długa historia wywołań narzędzi zapełnia kontekst szybciej niż długi dokument. Agenty działające w trybie ciągłym przez wiele godzin wymagają aktywnego zarządzania kompresją historii.

Drugie – podatność na błędy logiczne przy długim planowaniu. ChemCrow (Bran et al. 2023) – agent do syntezy chemicznej integrujący 13 wyspecjalizowanych narzędzi – ujawnił tzw. paradoks ewaluacyjny: automatyczna ocena oparta na LLM wykazała równoważność wyników z surowym GPT-4, ale eksperci-chemicy ocenili ChemCrow drastycznie lepiej pod kątem poprawności merytorycznej. **Model nie ma wystarczającej wiedzy domenowej, żeby poprawnie oceniać jakość własnych wysoce specjalistycznych wyników.**

Trzecie – ryzyko operacyjne przy narzędziach nieodwracalnych. Agent, który wysyła e-maile lub modyfikuje bazę danych, powinien mieć wbudowany mechanizm zatwierdzania przez człowieka dla działań o wysokim ryzyku. To nie jest kwestia wygody – to kwestia bezpieczeństwa operacyjnego.

Agent ma sens, gdy zadanie jest wieloetapowe, wymaga pobierania danych z wielu źródeł i adaptacji do wyników pośrednich. Dla prostego zadania jedno-krokowego – lepszy, szybszy i tańszy będzie zwykły pipeline z modelem i predefiniowanymi narzędziami.

Jeśli chcesz sprawdzić, jak Twoja obecna infrastruktura treści wypada pod kątem gotowości na systemy agentowe i RAG, [URL check](/narzedzia/url-check) analizuje strukturę strony pod kątem 8 czynników cytowalności w 30 sekund.
