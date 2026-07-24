# Content Watcher — plan MVP dla widocznosc.ai

## Cel

Jedna zakładka pokazująca wszystkie artykuły wiedzy, ich świeżość i wyniki,
wyjaśniająca priorytet reoptymalizacji oraz obsługująca kolejkę prac wykonywanych
przez n8n.

Pierwszy zakres obejmuje 49 wpisów z kolekcji
`portals/widocznosc.ai/src/content/blog`. Newsy są poza MVP, ponieważ mają inny
cykl życia i nie powinny korzystać z tego samego modelu reoptymalizacji.

## Stan danych na 2026-07-24

- 49 artykułów blogowych; wszystkie mają `date`, żaden nie ma jeszcze `updated`.
- Każdy artykuł można jednoznacznie mapować na URL `/{pillar}/{slug}/`.
- Matrix pokrywa indeksacją wszystkie 49 URL-i.
- GSC ma dane porównawcze dla 25 artykułów.
- GA4 ma obecnie dane landing page dla 3 artykułów.
- Senuto nie zwraca jeszcze dopasowanych URL-i dla tych artykułów.
- Treści mają średnio około 2059 słów (zakres 1485–3254).

Brak metryki nie może obniżać wyniku. Powinien być oznaczony jako „brak danych”,
a scoring ma przeskalować dostępne składowe.

## Model artykułu

### Metadane źródłowe

- `id`: stabilny identyfikator, np. hash domeny i ścieżki
- `domain`
- `url`
- `content_path`
- `title`
- `pillar`
- `author`
- `tags`
- `published_at` z frontmatter `date`
- `updated_at` z frontmatter `updated`
- `effective_updated_at`: `updated_at ?? published_at`
- `word_count`

### Metryki

- indeksacja: status, coverage state, data ostatniego crawla
- GSC 30 dni: kliknięcia, wyświetlenia, CTR, średnia pozycja
- GSC zmiana: obecne 90 dni vs poprzednie 90 dni; później również rok do roku
- Senuto: najlepsza fraza, najlepsza pozycja, liczba fraz, TOP 10
- GA4 28 dni: sesje organiczne i engagement rate
- proces: ostatnia reoptymalizacja, status zadania, PR, błąd, cooldown

## Kwalifikacja i scoring

Automatyczny kandydat musi:

1. być zaindeksowany,
2. mieć co najmniej 60 dni od publikacji lub aktualizacji,
3. nie mieć aktywnego zadania,
4. nie być w okresie ochronnym 60 dni po ostatniej reoptymalizacji,
5. mieć sygnał popytu lub spadku; ręczne dodanie może ominąć punkt 5.

Proponowany wynik 0–100:

| Składowa | Punkty | Przykład |
| --- | ---: | --- |
| Utrata ruchu | 0–35 | spadek kliknięć i pozycji GSC |
| Potencjał | 0–25 | dużo wyświetleń, pozycje 4–20, niski CTR |
| Świeżość | 0–20 | czas od publikacji/aktualizacji |
| Zaangażowanie | 0–10 | niski engagement przy wystarczającej liczbie sesji |
| Pokrycie fraz | 0–10 | utrata fraz lub pozycje 11–30 w Senuto |

Każdy wynik musi mieć widoczne uzasadnienie, np.:

> 78/100: −21 kliknięć, pozycja spadła o 3,2; artykuł nieaktualizowany od 146 dni.

Na młodej domenie scoring może działać od razu, ale automat nie powinien
uruchamiać prac bez minimalnej ilości danych. Dlatego MVP zaczyna od ręcznego
zatwierdzania kandydatów.

## Statusy procesu

```text
kandydat → w kolejce → wysłano → n8n pracuje → PR do akceptacji
    │                                      ├→ opublikowano → monitoring → zakończono
    │                                      └→ błąd → ponów / anuluj
    └→ pominięto (powód + opcjonalna data ponownej oceny)
```

Status `opublikowano` powstaje dopiero po merge PR. Wtedy proces ustawia
frontmatter `updated`, zapisuje bazowe metryki i rozpoczyna monitoring efektu po
7, 28 i 90 dniach.

## Content Watcher — Napkin Sketch

**Context:** Widok łączy katalog treści, sygnały Matrixa oraz kolejkę automatycznej
reoptymalizacji. Wizualnie korzysta z obecnego układu dashboardu.

**Screens:** 3 główne stany oraz wariant mobilny.

### Screen 1: Lista i kolejka — desktop

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ widocznosc.ai  Przegląd ... Matrix  [Content Watcher]                       │
├──────────────────────────────────────────────────────────────────────────────┤
│ Content Watcher                                      dane: 24.07.2026 06:30 │
│ Katalog treści, priorytety reoptymalizacji i status automatyzacji.           │
│                                                                              │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐             │
│ │ 49          │ │ 12          │ │ 3           │ │ 1           │             │
│ │ artykułów   │ │ kandydatów  │ │ w kolejce   │ │ w toku      │             │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘             │
│                                                                              │
│ [Szukaj tytułu lub URL________] [Filar ▼] [Status ▼] [Wiek ▼]               │
│ [Wszystkie] [Kandydaci 12] [Kolejka 3] [W toku 1] [Zakończone]              │
│ sortowanie: [Priorytet ▼]                         [ Automatyzacja: OFF ]      │
│                                                                              │
│ ┌────┬──────────────────────┬─────────────┬─────────────┬────────┬─────────┐ │
│ │Prio│ Treść                │ Daty        │ Sygnały     │ Status │ Akcja   │ │
│ ├────┼──────────────────────┼─────────────┼─────────────┼────────┼─────────┤ │
│ │ 78 │ RAG — przewodnik     │ publ. 24.05 │ GSC −21 klik│kandydat│[Dodaj]  │ │
│ │    │ /rag/przewodnik/     │ akt. —      │ poz. +3,2   │        │         │ │
│ │ 64 │ Perplexity           │ publ. 07.05 │ 920 wyśw.   │kolejka │[Szczeg.]│ │
│ │    │ /modele-llm/...      │ akt. —      │ CTR 0,8%    │        │         │ │
│ │ 51 │ llms.txt             │ publ. 05.05 │ brak spadku │pominięty│[Przywr.]│ │
│ └────┴──────────────────────┴─────────────┴─────────────┴────────┴─────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Key interactions:** wyszukiwanie, filtry, sortowanie, ręczne dodanie do kolejki,
otwarcie szczegółów oraz globalny przełącznik automatyzacji. Przełącznik pozostaje
wyłączony w MVP i pokazuje wymagania przed aktywacją.

**State variations:** brak danych źródłowych pokazuje `—`, a nie zero; nieaktualne
dane mają datę; awaria jednego źródła nie blokuje całej tabeli.

### Screen 2: Szczegóły artykułu i decyzja

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ < Content Watcher                       RAG — przewodnik wdrożeniowy         │
├───────────────────────────────────────────────┬──────────────────────────────┤
│ Wyniki                                       │ Priorytet 78/100              │
│ GSC:  142 → 121 kliknięć   pozycja +3,2      │ ███████████████░░░░          │
│ GA4:  83 sesje             engagement 41%     │                              │
│ Senuto: pozycja 14         8 fraz             │ Utrata ruchu       31/35     │
│ Indeksacja: OK             crawl 22.07         │ Potencjał          18/25     │
│                                               │ Świeżość           20/20     │
│ Historia treści                               │ Zaangażowanie        5/10     │
│ Publikacja: 24.05.2026                        │ Frazy                4/10     │
│ Aktualizacja: —                               │                              │
│ Ostatnia reoptymalizacja: —                   │ Powody                       │
│                                               │ • utrata 21 kliknięć         │
│ Cel automatyzacji                             │ • pozycje 11–20              │
│ [Odzyskaj utracony ruch i popraw CTR_______] │ • brak aktualizacji          │
│ [Uwagi dla procesu n8n_____________________]  │                              │
│                                               │ [ Dodaj do kolejki ]          │
│                                               │ ( Pomiń do 01.10.2026 )       │
└───────────────────────────────────────────────┴──────────────────────────────┘
```

**Key interactions:** przegląd uzasadnienia, zmiana celu i instrukcji, dodanie do
kolejki, pominięcie z datą ponownej oceny.

**State variations:** aktywne zadanie zastępuje akcje osią czasu, linkiem do PR,
przyciskiem ponowienia i czytelnym komunikatem błędu.

### Screen 3: Zadanie w toku / PR

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Zadanie CW-20260724-004                              [PR #184 ↗]             │
├──────────────────────────────────────────────────────────────────────────────┤
│ ✓ wysłano do n8n       14:05                                                │
│ ✓ analiza SERP         14:07                                                │
│ ✓ przygotowano draft   14:18                                                │
│ ● oczekuje na review   14:20                                                │
│ ○ publikacja                                                                │
│ ○ pomiar 7 / 28 / 90 dni                                                    │
│                                                                              │
│ Zmieniono: 6 sekcji · +740 słów · 4 nowe źródła · title i description       │
│ [ Otwórz PR ]  ( Ponów proces )  ( Anuluj )                                 │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Key interactions:** przejście do PR, ponowienie bez duplikowania zadania,
anulowanie przed publikacją.

**State variations:** błąd zawiera etap, bezpieczny komunikat i `retry`; callback
o tym samym `job_id` jest idempotentny.

### Mobile (320–430 px)

```text
┌──────────────────────────────┐
│ Content Watcher        ☰     │
│ 49 treści · 12 kandydatów    │
├──────────────────────────────┤
│ [Szukaj________________]     │
│ [Kandydaci] [Kolejka] [Filtr]│
├──────────────────────────────┤
│ 78  RAG — przewodnik         │
│     publ. 24.05 · akt. —     │
│     GSC −21 · pozycja +3,2   │
│     kandydat                 │
│     [ Dodaj do kolejki ]     │
├──────────────────────────────┤
│ 64  Perplexity               │
│     publ. 07.05 · akt. —     │
│     920 wyśw. · CTR 0,8%     │
│     w kolejce                │
│     [ Szczegóły ]            │
└──────────────────────────────┘
```

Tabela przechodzi w karty. Najważniejsze są priorytet, powód, status i akcja;
pełne metryki pozostają w szczegółach.

## Flow Summary

```text
[Dzienny collector]
       │
       ├─ katalog treści + metryki + scoring
       ▼
[Content Watcher: kandydaci]
       │ ręczne zatwierdzenie (MVP)
       ▼
[Worker: utwórz job + idempotency key]
       │ POST podpisany sekretem
       ▼
[n8n: analiza → reoptymalizacja → testy → branch/PR]
       │ callbacki statusu
       ▼
[Content Watcher: PR do review]
       │ merge
       ▼
[updated w frontmatter + zapis baseline]
       │
       └─ pomiar efektu po 7 / 28 / 90 dniach
```

## Kontrakt webhooka

Dashboard nie ujawnia URL-a n8n w przeglądarce. Worker wysyła request serwerowo.

```json
{
  "event": "content.reoptimization.requested",
  "version": 1,
  "job_id": "CW-20260724-004",
  "idempotency_key": "widocznosc.ai:/rag/przewodnik/:2026-07-24",
  "domain": "widocznosc.ai",
  "url": "https://widocznosc.ai/rag/przewodnik/",
  "content_path": "portals/widocznosc.ai/src/content/blog/rag/przewodnik.md",
  "published_at": "2026-05-24",
  "updated_at": null,
  "priority": {
    "score": 78,
    "reasons": ["clicks_down", "position_down", "stale"]
  },
  "metrics": {
    "gsc": {},
    "ga4": {},
    "senuto": {},
    "indexing": {}
  },
  "objective": "Odzyskaj utracony ruch i popraw CTR",
  "notes": "",
  "callback_url": "https://zaplecze-dashboard.m-wisniewski.workers.dev/api/content-watcher/callback"
}
```

Wymagania:

- podpis HMAC lub Bearer w obie strony,
- `job_id` i `idempotency_key` obowiązkowe,
- timeout wysyłki nie oznacza automatycznego utworzenia drugiego zadania,
- callbacki zawierają `status`, `stage`, `message`, `pr_url` i znaczniki czasu,
- n8n ma token GitHub o minimalnych uprawnieniach: branch + PR, bez pushowania
  bezpośrednio do `main`.

## Warstwa trwała

Rekomendacja: Cloudflare D1, nie statyczne pliki i nie wyłącznie KV.

Minimalne tabele:

- `content_items` — katalog i ostatni scoring,
- `content_metrics` — pomiary dzienne / baseline po reoptymalizacji,
- `reoptimization_jobs` — kolejka i bieżący status,
- `job_events` — pełna oś czasu callbacków,
- `content_suppressions` — pominięcia i cooldowny.

D1 daje atomowe przejścia statusów, filtrowanie kolejki i historię zdarzeń.
Obecny KV `DASHBOARD_IMPORTS` powinien pozostać tylko dla importów Bing.

## API Workera

- `GET /api/content-watcher/widocznosc.ai/items`
- `GET /api/content-watcher/widocznosc.ai/jobs`
- `POST /api/content-watcher/widocznosc.ai/jobs`
- `POST /api/content-watcher/widocznosc.ai/items/:id/suppress`
- `POST /api/content-watcher/callback` — osobne uwierzytelnienie n8n
- później: `POST /api/content-watcher/sync` dla collectora

Cały dashboard pozostaje za Basic Auth. Callback n8n nie korzysta z Basic Auth,
tylko z dedykowanego sekretu i musi być obsłużony przed globalną bramką.

## Etapy wdrożenia

### Etap 1 — katalog i rekomendacje

- nowa zakładka tylko dla `widocznosc.ai`,
- ekstrakcja frontmatter i statystyk treści,
- join po URL z Matrix, GSC, GA4 i Senuto,
- scoring i jego wyjaśnienie,
- filtry, lista, szczegóły; bez wywoływania n8n.

### Etap 2 — ręczna kolejka

- D1 i API Workera,
- tworzenie, pomijanie i anulowanie zadań,
- serwerowy webhook do n8n,
- callbacki i oś czasu,
- n8n tworzy branch i PR, nigdy bezpośredni commit do `main`.

### Etap 3 — monitoring efektu

- wykrycie merge/publikacji,
- automatyczne ustawienie `updated`,
- baseline i porównania po 7, 28 i 90 dniach,
- wynik: poprawa / bez zmiany / pogorszenie.

### Etap 4 — kontrolowany automat

- synchronizacja kandydatów z collectora do D1,
- maksymalnie 1–2 zadania na dobę,
- minimalny próg score i danych,
- globalny kill switch,
- limity per filar, cooldown, retry i alert o błędzie.

## Poza MVP

- `grupa-icea.pl` do czasu uzyskania dostępu do WordPress REST API,
- automatyczna publikacja bez review,
- reoptymalizacja newsów,
- zaawansowana kanibalizacja fraz,
- automatyczne usuwanie lub scalanie treści.

## Design Notes

- Zachować komponenty, kolory źródeł i gęstość obecnego Matrixa.
- Score nigdy nie może być „czarną skrzynką”; zawsze pokazujemy składowe.
- Czerwony oznacza błąd procesu, nie niski wynik treści.
- Przyciski uruchamiające n8n wymagają potwierdzenia i są odporne na podwójny klik.
- Automatyzacja ma globalny przełącznik oraz limit dzienny.
- Wszystkie akcje i callbacki zapisują aktora, czas i identyfikator zadania.
