---
title: 'Chunking – strategie dzielenia dokumentów'
subtitle: 'Dobierz strategię podziału dokumentów, która zwiększa precyzję retrieval i ogranicza halucynacje LLM'
description: 'Chunking w RAG: porównanie strategii fixed-size, rekurencyjnej, semantycznej i parent-context. Dane z badań, benchmarki, kod i gotowe wskazówki dla developerów.'
date: 2026-05-25
image: ../../../assets/images/blog1.png
icon: '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="9" x2="9" y2="21"/>'
author:
  name: 'Michał Ziach'
  role: 'CTO · ICEA'
  avatar: ../../../assets/images/authors/michal-ziach.avif
readTime: '10 min'
tags: ['Chunking', 'RAG', 'Dokumenty', 'Bazy wektorowe']
pillar: 'rag'
intent: 'HOWTO'
level: 'L3'
---

Wybór strategii chunkingu (podziału dokumentów na fragmenty) to decyzja, która determinuje jakość całego systemu RAG (Retrieval-Augmented Generation, czyli generowania wspomaganego wyszukiwaniem) bardziej niż wybór modelu LLM czy algorytmu wyszukiwania. **Fragment (ang. chunk) to podstawowa jednostka, którą silnik RAG indeksuje i wyszukuje – błędnie wyznaczone granice fragmentów niszczą kontekst semantyczny, zanim model w ogóle zobaczy dane.** Badanie porównawcze z arXiv (2601.14123) pokazało, że prosta segmentacja znakowa osiąga Precision@1 na poziomie 2–3%, podczas gdy metody semantyczne – ponad 24%. Różnica powstaje na etapie podziału, nie retrieval.

## Problem złotego środka – dlaczego rozmiar ma znaczenie

Każdy fragment trafia do modelu osadzającego (embedding model), który kompresuje go do wektora o stałej wymiarowości. **Za małe fragmenty – poniżej 100 tokenów – izolują fakty od kontekstu, w którym nabierają sensu.** Model LLM dostaje urywek pozbawiony informacji, kto, kiedy i wobec czego coś stwierdził.

Za duże fragmenty mają odwrotny problem. Gdy do jednego wektora trafia 2000+ tokenów o heterogenicznej treści, sygnał semantyczny się rozmywa – mówimy o zjawisku semantic dilution. Wyszukiwarka zwraca fragmenty tematycznie zbieżne z zapytaniem, ale lokalnie bezużyteczne: odpowiedź jest gdzieś w środku, otoczona niezwiązanym materiałem.

Zjawisko „klifu kontekstowego" (context cliff) opisane w pracy arXiv:2601.14123 pokazuje gwałtowny spadek wierności odpowiedzi, gdy łączna długość przekazanego kontekstu przekracza ~2500 tokenów. Modele mają trudność z selekcją istotnych zdań z przesadnie rozbudowanego okna.

Praktyczny punkt startowy dla większości projektów: 256–512 tokenów z zakładką 10–15%. Strojenie pod konkretny korpus – po uruchomieniu złotego zestawu testowego (patrz: ostatnia sekcja).

## Cztery główne strategie chunkingu

Każda strategia odpowiada innym właściwościom dokumentów i wymaganiom systemu. Poniższa tabela zestawia je pod kątem zastosowania i kosztu obliczeniowego.

| Strategia | Mechanizm podziału | Najlepsze zastosowanie | Koszt obliczeniowy |
|---|---|---|---|
| Sztywna (fixed-size) | Stała liczba tokenów / znaków | Szybkie prototypy, jednorodne dane | Bardzo niski |
| Rekurencyjna (recursive) | Hierarchia separatorów językowych | Artykuły, dokumentacja, proza | Niski |
| Semantyczna | Podobieństwo kosinusowe zdań | Dokumenty o zmiennej strukturze | Średni–wysoki |
| Nadrzędno-podrzędna (parent-context) | Małe fragmenty wyszukiwania + duże fragmenty generacji | Produkcja, dokumenty prawne i medyczne | Średni |

### Sztywna segmentacja – szybka, ale kosztowna semantycznie

Fixed-size chunking dzieli sekwencję tokenów w równych przedziałach bez oglądania się na strukturę tekstu. Dla modelu `text-embedding-3-small` typowy rozmiar to 512 tokenów; dla `all-MiniLM-L6-v2` – 256 tokenów.

```python
from langchain.text_splitter import TokenTextSplitter

splitter = TokenTextSplitter(
    chunk_size=512,
    chunk_overlap=50,
    encoding_name="cl100k_base",
)
chunks = splitter.split_text(document)
```

Zakładka (overlap) 50 tokenów zmniejsza ryzyko ucięcia zdania na granicy fragmentu. Badanie arXiv:2601.14123 wykazało jednak, że nakładanie fragmentów nie przynosi mierzalnych korzyści jakościowych w generowaniu odpowiedzi – generuje za to zbędne koszty indeksowania. **Zakładka ma sens jako siatka bezpieczeństwa, nie jako strategia optymalizacji.**

### Segmentacja rekurencyjna – domyślny wybór dla prozy

Recursive character splitting stosuje hierarchiczną listę separatorów: najpierw próbuje ciąć po podwójnych znakach nowej linii (akapity), potem po pojedynczych, potem po spacjach. Tnie dopiero po wyczerpaniu grubszych opcji.

```python
from langchain.text_splitter import RecursiveCharacterTextSplitter

splitter = RecursiveCharacterTextSplitter(
    chunk_size=600,
    chunk_overlap=60,
    separators=["\n\n", "\n", ". ", " ", ""],
)
chunks = splitter.split_documents(docs)
```

To najbardziej elastyczna strategia dla tekstów narracyjnych. Gdy dokument ma nagłówki Markdown, analiza Snowflake pokazuje wzrost precyzji o 5–10% po dodaniu `"\n# "` i `"\n## "` na początku listy separatorów – fragment zaczyna się wtedy od nagłówka, co daje modelowi osadzającemu wyraźny sygnał tematyczny.

### Segmentacja semantyczna – gdy granice tematyczne są ważniejsze niż długość

Semantic chunking nie pyta "ile tokenów?", tylko "gdzie zmienia się temat?". Algorytm dzieli dokument na zdania, generuje dla każdego wektor osadzony (embedding) przez model jak `text-embedding-3-small`, a następnie oblicza podobieństwo kosinusowe między sąsiednimi zdaniami. Gdy podobieństwo spada poniżej progu przełomowego (breakpoint threshold), wyznacza granicę nowego fragmentu.

Trzy metody wyznaczania progu dają różne wyniki w zależności od domeny:

- **Percentylowa** – granica tam, gdzie różnica odległości semantycznej przekracza 95. percentyl rozkładu; stabilna dla jednorodnych dokumentów
- **Odchylenie standardowe** – próg µ + 3σ; najlepsza dla dokumentów prawnych i medycznych (wynik ważony 43.56 w benchmarku LangChain Semantic Chunking Arena)
- **Rozstęp ćwiartkowy (IQR)** – eliminuje wpływ wartości skrajnych; stabilna dla dokumentów mieszanych (e-commerce, ML, historia)

```python
from langchain_experimental.text_splitter import SemanticChunker
from langchain_openai import OpenAIEmbeddings

chunker = SemanticChunker(
    OpenAIEmbeddings(model="text-embedding-3-small"),
    breakpoint_threshold_type="interquartile",  # lub "standard_deviation"
)
chunks = chunker.create_documents([text])
```

Wbudowane osadzenia (embeddingi) – reprezentacje wektorowe tekstu – to tutaj klucz. Zrozumienie, czym są [osadzenia słów](https://pl.wikipedia.org/wiki/Osadzanie_s%C5%82%C3%B3w), pomaga dobrać model: im lepiej model rozróżnia niuanse domeny, tym trafniejsze granice tematyczne. Dla polskojęzycznych korpusów warto przetestować modele wielojęzyczne (`multilingual-e5-large`) zamiast domyślnych anglojęzycznych.

### Strategia nadrzędno-podrzędna – kompromis dla produkcji

Parent-context chunking rozwiązuje sprzeczność między retrieval a generacją. W bazie wektorowej indeksowane są małe fragmenty podrzędne (child chunks, np. 128–256 tokenów) dla precyzyjnego dopasowania semantycznego. Po znalezieniu trafienia system pobiera powiązany fragment nadrzędny (parent chunk, np. 1024–2000 tokenów), który trafia do kontekstu LLM – razem z szerokim kontekstem strukturalnym.

Wyniki badań Stanford University (2025) potwierdzają przewagę tej metody:

| Metoda | Precyzja | Pełność | F1 |
|---|---|---|---|
| Sztywna (512 tokenów) | 0.65 | 0.58 | 0.61 |
| Semantyczna | 0.78 | 0.72 | 0.75 |
| Hierarchiczna | 0.82 | 0.79 | 0.80 |
| Parent-Context | 0.88 | 0.85 | 0.86 |

**Wzrost miary F1 z 0.61 do 0.86 – 25 punktów procentowych – to różnica między prototypem a systemem produkcyjnym.** Koszt to złożoność implementacji: konieczność utrzymania mapowania identyfikatorów fragment podrzędny → fragment nadrzędny oraz dwupoziomowego magazynu danych.

<aside class="callout-fact">
  <div class="callout-icon">✦</div>
  <div class="callout-body">
    <div class="callout-label">Dane z badań</div>
    <p>Badanie arXiv:2603.06976 porównało metody na długich dokumentach. Grupowanie akapitów (Paragraph Group Chunking) osiągnęło nDCG@5 ≈ 0.459 i Hit@5 ≈ 59%. Prosta segmentacja znakowa (Fixed Character Chunking) – nDCG@5 poniżej 0.244 i Precision@1 rzędu 2–3%. <strong>Ta sama baza wiedzy, inny podział – wynik różni się niemal 10-krotnie.</strong></p>
  </div>
</aside>

## Metadane i wzbogacanie fragmentów

Rozmiar fragmentu to jedno. Drugie to to, co do niego dołączasz. Wyszukiwanie wzbogacone o metadane (metadata-enriched retrieval) osiąga precyzję 82.5% wobec 73.3% dla wyszukiwania czysto tekstowego (badania IEEE).

Kluczowe pola metadanych warte dołączenia do każdego fragmentu:

- **`source_url`** – identyfikacja dokumentu źródłowego; pozwala filtrować po domenie lub typie dokumentu
- **`section_title`** – tytuł sekcji nadrzędnej; model osadzający dostaje dodatkowy sygnał tematyczny
- **`chunk_index`** – pozycja fragmentu w dokumencie; przydatna przy rerankowaniu i analizie pozycji odpowiedzi
- **`doc_type`** – typ dokumentu (umowa, artykuł, FAQ, instrukcja); umożliwia routing do wyspecjalizowanych indeksów

```python
def build_chunk_metadata(doc, chunk_text, chunk_idx, section_title=""):
    return {
        "text": chunk_text,
        "source_url": doc.metadata.get("source", ""),
        "section_title": section_title,
        "chunk_index": chunk_idx,
        "doc_type": doc.metadata.get("type", "unknown"),
        "char_count": len(chunk_text),
    }
```

Snowflake pokazał, że samo dodanie nagłówków Markdown jako pola metadanych podnosi precyzję o 5–10% względem podziału bez kontekstu sekcji. Dla systemów SQL wdrożenie zarządzanych metadanych podniosło dokładność generowania zapytań o 38%.

## Dokumenty o złożonej strukturze – PDF i tabele

Standardowe metody niszczą dwuwymiarową strukturę tabel, spłaszczając wiersze i kolumny do strumienia tekstu. LLM nie ma szans odtworzyć relacji semantycznych z takiego wejścia.

Dla dokumentów silnie ustrukturyzowanych wizualnie – raporty finansowe, dokumentacja techniczna, umowy – najlepiej sprawdza się segmentacja na poziomie stron (page-level chunking). W testach porównawczych NVIDIA metoda ta osiągnęła celność 0.648 przy najniższej wariancji wyników.

Trzy zasady, których łamanie najdrożej kosztuje:

- **Nie rozdzielaj procedur** – lista kroków lub instrukcja muszą trafić do jednego fragmentu; rozbita lista to halucynacje w kroku 3 lub 4
- **Ciągłość wielostronicowa** – tabela lub lista przechodząca między stronami PDF musi być scalona przez parser przed chunkowaniem
- **Czyść powtarzalne elementy** – nagłówki stron, stopki, numery stron generują szum wektorowy; usuń je w fazie parsowania

Jak to wygląda w pipelinie? Mechanizm retrieval w systemach RAG, który decyduje, co ostatecznie trafia do LLM, jest bezpośrednio zależny od jakości fragmentów – o tym, jak LLM-y następnie selekcjonują fragmenty do cytowania, piszemy w artykule o [cytowaniu źródeł przez LLM](/geo/jak-llm-cytuja-zrodla).

## Architektura potoku i diagnostyka błędów

Wydajny potok ingestion składa się z trzech monitorowalnych modułów:

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Konektory   │ ──> │   Parsery    │ ──> │ Segmentatory │
│  (S3, GDrive)│     │ (PDF→tekst)  │     │  (chunkers)  │
└──────────────┘     └──────────────┘     └──────────────┘
```

**Konektory** pobierają dane z systemów źródłowych i zachowują stabilne identyfikatory obiektów (zapobiega data drift przy reingestii). **Parsery** tłumaczą pliki binarne (PDF, DOCX) na ustrukturyzowane elementy logiczne. **Segmentatory** grupują elementy w ostateczne fragmenty wejściowe.

Dwa sygnały diagnostyczne wskazujące na zbyt agresywne dzielenie:

- **Skalowanie niszczy precyzję** – system działa poprawnie na 5 GB, ale precyzja gwałtownie spada po rozbudowie do 50 GB; granice fragmentów rozbijają powiązane pojęcia, generując szum przy dużej skali
- **Reranker drastycznie poprawia retriever** – gdy model rerankujący (reranker) mocno koryguje wyniki wyszukiwania wektorowego, retriever zwraca fragmenty tematycznie zbieżne, ale lokalnie puste; to symptom fragmentów za małych lub źle wyznaczonych granic

Szczegółowo mechanizm rerankowania jako drugi stopień filtrowania opisujemy w artykule o [rerankingu w RAG](/rag/reranking).

<aside class="callout-expert">
  <div class="callout-icon"><img src="/authors/michal-ziach.avif" alt="Michał Ziach" /></div>
  <div class="callout-body">
    <div class="callout-label">Opinia eksperta</div>
    <p>W projektach RAG, które wdrażaliśmy w ICEA, najczęstszy błąd to kopiowanie parametrów z tutoriali – chunk_size=1000, overlap=200 – bez jakiegokolwiek strojenia pod własny korpus. To wartości wzięte z powietrza. Zawsze buduję złoty zbiór testowy: minimum 30 par pytanie → oczekiwana odpowiedź z konkretnego dokumentu. Potem przechodzę przez siatkę parametrów: 256/512/1024 tokenów × 0/10/20% zakładki × trzy strategie. <strong>Bez tej siatki nie ma szans ocenić, która strategia faktycznie działa na Twoich danych – różnica między najgorszym a najlepszym ustawieniem to regularnie 3–5× wyższa precyzja retrieval.</strong></p>
    <div class="callout-author">Michał Ziach · CTO, ICEA</div>
  </div>
</aside>

## Złoty zbiór testowy i ewaluacja

Każda zmiana parametrów segmentacji bez pomiaru to zgadywanie. Złoty zbiór testowy (golden set) to zestaw par pytanie → dokument źródłowy → oczekiwany szablon odpowiedzi. Minimum 30–50 par reprezentatywnych dla realnych zapytań.

Trzy osie pomiaru z LlamaIndex Response Evaluation:

- **Wierność (faithfulness)** – czy odpowiedź opiera się wyłącznie na dostarczonym kontekście, czy model halucynuje
- **Relewancja (relevancy)** – czy odpowiedź jest zgodna z intencją pytania
- **Czas odpowiedzi** – rośnie liniowo z rozmiarem fragmentu; ważne przy SLA

Procedura strojenia:

```python
# Siatka parametrów do przetestowania
param_grid = {
    "chunk_size": [256, 512, 1024],
    "chunk_overlap": [0, 0.1, 0.2],  # jako ułamek chunk_size
    "strategy": ["fixed", "recursive", "semantic"],
}

# Dla każdej kombinacji: ingestuj → zapytaj golden_set → zmierz metryki
# Wybierz konfigurację z najwyższym harmonic mean(faithfulness, relevancy)
```

Po wyborze konfiguracji uruchamiaj testy regresyjne po każdej zmianie w potoku – parsery, modele osadzające, schemat metadanych. Każda z tych zmian może przesunąć granice fragmentów wystarczająco, żeby zmienić wyniki retrieval.

Jeśli budujesz system RAG od podstaw, [przewodnik po RAG](/rag/przewodnik) opisuje pełną architekturę – od ingestion przez retrieval po generację – razem z checklistą gotowości produkcyjnej. Jakość embeddingów, które są podstawą wyszukiwania semantycznego, omawia artykuł o [embeddingach w RAG](/rag/embeddingi).

Jak Twój content wypada pod kątem podzielności semantycznej? [URL check](/narzedzia/url-check) analizuje stronę pod kątem struktury i ekstrahowalności fragmentów w 30 sekund.
