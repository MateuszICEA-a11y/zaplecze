# Projekt zmiany modelu BWP

**Data:** 2026-02-19 **Status:** brainstorm

---

## 1\. Cel projektu

Przebudowa sieci zapleczowej BWP w taki sposób, aby:

1. Wyeliminować aktywne filtry Google wynikające z niskiej jakości domen wielotematycznych.  
2. Zbudować sieć zgodną ze standardami jakości, która będzie rosła organicznie w wynikach wyszukiwania.  
3. Umożliwić utrzymanie BWP jako stałego elementu oferty usług baseline \- bez generowania zarzutu „śmieciowe linki" w portfelu klienta.

---

## 2\. Problem do rozwiązania

Obecna sieć BWP boryka się z następującymi defektami:

- **Wielotematyczność domen** \- serwisy piszą o wszystkim, co skutkuje zerowym autorytetem tematycznym (siteFocus ≈ brak).  
- **Content AI bez kontroli jakości** \- brak weryfikacji encji, brak struktury semantycznej.  
- **Filtry algorytmiczne Google** \- konsekwencja powyższych. Linki z takich domen tracą wartość lub działają negatywnie.  
- **Brak profilu autora** \- domeny nie symulują redakcji ani ekspertów, co pogłębia brak E-E-A-T.  
- **Brak dystrybucji contentu** \- serwisy nie generują sygnałów społecznościowych, które zwiększają wiarygodność.

**Relacja ze starą siecią:** nowa sieć BWP jest budowana jako osobny byt. Stara sieć pozostaje bez zmian \- opublikowane linki zgodne z umowami nie są ruszane. Żadnej migracji, żadnego wygaszania starych domen.

---

## 3\. Zakres projektu

### 3.1 W zakresie

- Projektowanie architektury nowych serwisów tematycznych (nisze).  
- Opracowanie standardów produkcji contentu (klastry, encje, siteFocus).  
- **Budowa zautomatyzowanego pipeline'u produkcji contentu** (AI generuje → automatyczna weryfikacja → draft w WordPress → Human in the loop (opcjonalnie) → publikacja).  
- Wdrożenie profili autorskich na serwisach.  
- Automatyzacja publikacji i dystrybucji treści w social media.  
- Integracja z istniejącym systemem wewnętrznym (monitoring fraz → arkusz zamówień → realizacja linków).

### 3.2 Poza zakresem

- Zakup domen.

---

## 4\. Filary jakościowe \- standard sieci BWP 2.0

### Filar 1: Tematyczność domen (Nisze)

**Zasada:** Każda domena działa wyłącznie w jednej niszy tematycznej. Nie wychodzi poza nią nigdy.

- Przed założeniem domeny: określić niszę, słowa kluczowe, listę tematów dozwolonych i zakazanych.  
- KPI: **siteFocus ≥ 0.80** i **siteRadius ≤ 0.25**   
- Kontrola kwartalna: jeśli wskaźniki przekraczają progi \- wstrzymanie publikacji i audyt.

**Twarda reguła typów domen:**

- **Typ A \- Poradnikowy:** wyłącznie artykuły how-to, evergreen guides, FAQ.   
- **Typ B \- Rankingowy:** wyłącznie rankingi, porównania, "Top X". NIGDY poradniki.  
- Mieszanie typów na jednej domenie jest zakazane.

**Przykładowe nisze do zagospodarowania:**

- Dom i ogród  
- Zdrowie i fitness  
- Finanse osobiste  
- Motoryzacja  
- Prawo i podatki  
- Moda

---

### Filar 2: Content w klastrach tematycznych

**Zasada:** Każda nisza budowana jest przez klastry, a nie losowe artykuły.

Struktura klastra:

\[Pillar Page\] \- artykuł główny (2000–4000 słów, szeroki temat niszy)

    ├── \[Cluster 1\] \- artykuł szczegółowy (800–1500 słów)

    ├── \[Cluster 2\] \- artykuł szczegółowy

    ├── \[Cluster 3\] \- artykuł szczegółowy

    └── \[Cluster N\] \- ...

- Minimum 1 pillar page na niszę przed publikacją jakiegokolwiek artykułu satelitarnego.  
- Linkowanie wewnętrzne: każdy artykuł satelitarny linkuje do pillar page; pillar page linkuje do satelitów.  
- Harmonogram: minimum 2 artykuły / tydzień / serwis (1 satelitarny \+ co 4 tygodnie 1 pillar lub rozbudowa istniejącego).

**Narzędzia planowania klastrów:**

- Automatyzacja (do zaplanowania)

---

### Filar 3: Pokrycie encji i semantyka

**Zasada:** Artykuł musi pokrywać kluczowe encje tematu \- osoby, miejsca, koncepcje, produkty \- i budować między nimi połączenia semantyczne.

Proces produkcji artykułu (zautomatyzowany pipeline):

1. System pobiera temat z puli zatwierdzonych klastrów.  
2. Automatyczna identyfikacja encji tematu (NLP API).  
3. Generowanie artykułu przez AI z jawną instrukcją uwzględnienia encji.  
4. Automatyczna weryfikacja pokrycia encji po wygenerowaniu.  
5. Automatyczne sprawdzenie duplikatów.  
6. Draft trafia do WordPress \- junior robi końcowy QA i klika "publish" (opcjonalnie, docelowo pełna automatyzacja.  
7. Dodanie sekcji FAQ opartej na pytaniach z People Also Ask.  
8. Linkowanie zewnętrzne do autorytatywnych źródeł (Wikipedia, gov, edu) min. 1–2 na artykuł.

**KPI:** wynik pokrycia encji ≥ 70% (mierzony narzędziem NLP).

**Różnicowanie głosu AI:** Każda domena ma przypisany inny model AI (GPT / Claude / Gemini) \+ unikalny system prompt (ton, styl, persona autora). Proces do zaprojektowania.  
---

### Filar 4: E-E-A-T \- Autorstwo i wiarygodność

**Rozwiązanie \- model hybrydowy:**

- **70% fikcyjni autorzy** z rozbudowanymi profilami (domeny non-YMYL)  
- **30% realni** jako redaktorzy/eksperci (domeny YMYL: finanse, prawo, zdrowie)

**Profil fikcyjnego autora (obowiązkowo):**

| Element profilu | Szczegóły |
| :---- | :---- |
| Imię i nazwisko | Polskie, wiarygodne (unikać generycznych typu "Jan Kowalski") |
| Zdjęcie | Avatar generowany AI (Midjourney) \- unikalny na każdą domenę |
| Bio | 150–250 słów: wykształcenie, doświadczenie, specjalizacja w niszy |
| Strona autora | Podstrona `/autor/[imie-nazwisko]` z listą artykułów |
| Schema markup | `@type: Person` z `sameAs` wskazującym na Gravatar \+ opcjonalnie Medium/Quora |
| Gravatar | Profil powiązany z emailem autora na stronie |
| Konsekwencja | Dany autor pisze TYLKO w swojej subniszy \- nie przeskakuje między tematami |

**Alternatywy dla social proof (zamiast LinkedIn):**

- Profil na Medium z 2–3 artykułami w niszy  
- Profil na Quora z odpowiedziami w niszy  
- Gravatar z pełnym profilem

**Realni (dla YMYL):**

- Pozyskanie: Useme, LinkedIn cold outreach, grupy copywriterów  
- Rola: recenzja/weryfikacja artykułów \+ podpisanie się jako autor  
- Wycena: do uzgodnienia

**Aspekt wizualny serwisu:**

- Profesjonalny szablon (nie domyślny WordPress).  
- Logo i schemat kolorystyczny spójny z niszą.  
- Zdjęcia: Unsplash/Pexels z odpowiednim alt-textem, lub AI-generated.  
- Czytelna typografia, brak reklam zaśmiecających layout.  
- Core Web Vitals: LCP \< 2.5s, CLS \< 0.1, INP \< 200ms.

---

### Filar 5: Automatyzacja dystrybucji w social media

**Cel:** Generowanie sygnałów społecznościowych (ruch, zaangażowanie) które wzmacniają wiarygodność domen.

**Kanały (priorytet):**

1. **Facebook** \- kanał nr 1 (najłatwiejszy do automatyzacji, największy zasięg w PL)  
2. **LinkedIn Pulse** \- kanał nr 2, wyłącznie dla nisz B2B/finansowych/prawnych  
3. Instagram \- opcjonalnie, niski priorytet (trudny do automatyzacji, wymaga materiałów wizualnych)

**Automatyzacja przez n8n/Python (wdrożenie przez juniora pod nadzorem managera):**

\[RSS Feed serwisu / Webhook po publikacji\]

    → \[Trigger\]

    → \[Transform \- generuj post copy z AI\]

    → \[Facebook Graph API / LinkedIn API\]

    → \[Publikacja posta\]

    → \[Log do arkusza Google Sheets\]

Harmonogram automatyzacji:

- Publikacja artykułu → automatyczny post na FB w ciągu 1h.  
- Opcjonalnie: harmonogram recyrkulacji starszych artykułów co 7–14 dni.

**Uwaga:** Jeden profil social media na jedną domenę. Nie łączyć kont między domenami.

**Dobra praktyka (nie obowiązek):** Warming kont social media \- 2–4 tygodnie aktywności (polubienia, komentarze, udostępnienia cudzych treści) przed uruchomieniem automatycznej publikacji. Junior realizuje jeśli pozwala na to czas.

---

## 5\. Infrastruktura \- do zaprojektowania

---

## 6\. Integracja z systemem wewnętrznym

Istniejący flow linkowania klientów **nie zmienia się:**

Monitoring fraz → Arkusz zamówień (URL \+ anchor \+ strategia) → System wewnętrzny → Realizacja linków

**Rozszerzenia dla nowej sieci BWP:**

- **Matching tematyczny:** System automatycznie dopasowuje frazę/URL klienta do domeny BWP o pasującej niszy (tematyka domeny już jest w systemie).  
- **Flaga dojrzałości:** Domeny, które nie spełniają reguły 90 dni \+ 12 artykułów, są oznaczone jako "niedojrzałe" i system nie przypisuje im linków.  
- **Alert braku dopasowania:** Jeśli nisza klienta nie pasuje do żadnej domeny → sygnał do managera BWP: "brak domeny dla niszy X" → decyzja czy tworzyć nową.

---

## 7\. KPI i definicja sukcesu

| Metryka | Cel (6 miesięcy) |
| :---- | :---- |
| Liczba serwisów tematycznych w sieci | ≥ 10 |
| siteFocus każdego serwisu | ≥ 0.80 |
| Artykuły indeksowane w Google | ≥ 80% opublikowanych |
| Ruch organiczny (łącznie sieć) | Wzrost MoM ≥ 15% |
| Domeny z ruchem i rankingami w Google | ≥ 60% domen w sieci |
| Domeny z filtrem Google w nowej sieci | 0 |

**Metryka sukcesu domeny:** Domena łapie ranking i ruch z Google \= domena ma wartość, link przenosi equity. Nie mierzymy osobno korelacji link → pozycja klienta.

---

## 8\. Ryzyka

| Ryzyko | Prawdopodobieństwo | Wpływ | Mitygacja |
| :---- | :---- | :---- | :---- |
| Algorytm Google zmienia kryteria jakości | Średnie | Wysoki | Monitoring Google Search Central, wczesne wykrywanie filtrów, elastyczny standard |
| Pipeline automatyzacji generuje content niskiej jakości | Średnie | Wysoki | Dwustopniowa weryfikacja (auto \+ QA juniora), losowy audyt managera |
| Fikcyjni autorzy zidentyfikowani przez Google | Niskie | Wysoki | Profile spójne, unikalne avatary, Schema Person, brak cross-domain, brak fake LinkedIn |
| Wzorzec stylistyczny AI rozpoznany między domenami | Średnie | Średni | Różne modele AI \+ unikalne system prompty per domena |
| Meta API zmienia zasady dostępu | Niskie | Średni | Alternatywa: Buffer, lub ręczna publikacja |
| Aged domains mają ukrytą historię filtru | Średnie | Wysoki | Nowe rejestracje jako standard, aged tylko po pełnym audycie |

---

## 9\. Decyzje otwarte

1. **Lista konkretnych nisz**  
2. **Budżet domenowy**  
3. **Narzędzie do pipeline'u: n8n vs Python**  
4. **Narzędzie do weryfikacji encji**  
5. **Szczegóły pipeline'u automatyzacji**   
6. **Podbijanie DR pod klientów / pozyskiwanie linków**