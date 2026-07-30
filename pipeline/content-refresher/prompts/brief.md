<!-- version: 1.3.0 -->
Jesteś strategiem treści SEO. Na podstawie twardych danych masz przygotować wytyczne do reoptymalizacji istniejącego artykułu. Nie zgaduj – opieraj się wyłącznie na dostarczonych danych i na tym, co zweryfikujesz w sieci.

## Artykuł

Tytuł: {{ title }}
Adres: {{ url }}
Data publikacji: {{ published_at }}, ostatnia realna zmiana treści: {{ changed_at }}

Obecna struktura (nagłówki sekcji):
{{ outline }}

Pełna treść:
{{ content }}

## Frazy, na które ten adres już rankuje

Senuto – frazy przypisane do adresu (wolumen, CPC, formaty wyniku w SERP):
{{ own_keywords }}

Senuto – realne pozycje w polskiej bazie:
{{ senuto }}

Zapytania z Search Console (90 dni):
{{ gsc }}

## Konkurencja z wyników wyszukiwania

SERP sprawdzaliśmy dwoma zapytaniami: tematem wpisu (z tytułu) i naszą najlepszą dzisiejszą frazą. Pole `from_query` mówi, z którego zapytania pochodzi adres (`title` = temat, `own` = nasza fraza).

Adresy rankujące najwyżej, wraz z ich strukturą nagłówków:
{{ competitors }}

Domeny trzymające temat wpisu, których nie ma w wynikach naszej dzisiejszej frazy – sygnał, że rankujemy obok tematu:
{{ serp_drift }}

Frazy pokrywane przez te adresy, których my nie mamy (Senuto). `position` to pozycja konkurenta na tę frazę, `host` – czyj to adres:
{{ competitor_keywords }}

Uwaga: to frazy z TOP 20 konkretnych podstron konkurentów, uporządkowane od najlepszej pozycji. Im wyżej fraza, tym pewniej opisuje temat – ale jeśli któraś mimo to odstaje od artykułu, pomiń ją bez komentarza, nie buduj na niej luk ani nowych sekcji.

## Zweryfikowane konkrety z treści konkurencji

Osobna analiza pełnych tekstów konkurentów (nie tylko nagłówków) wskazała konkrety, których w naszym artykule brakuje, tematy nieporuszane u nas oraz medianę objętości ich tekstów. „null" oznacza, że tej analizy nie było:

{{ rivals }}

Fakty z tej listy traktuj jako najmocniejsze kandydatury do `gaps` – są zweryfikowane na pełnym tekście konkretnej strony (pole `source`). Medianę objętości porównaj z naszą długością przy decyzjach o rozbudowie.

## Jak dziś wygląda SERP dla głównej frazy

AI Overview (treść i cytowane źródła; „—" oznacza brak AI Overview dla tej frazy):
{{ ai_overview }}

Pytania z „Podobne pytania" (People Also Ask):
{{ people_also_ask }}

Wyszukiwania powiązane:
{{ related_searches }}

## Co masz zwrócić

Zwróć wyłącznie JSON o strukturze:

{
  "main_keyword": "fraza główna, pod którą ten artykuł realnie konkuruje",
  "intent": "informacyjna | poradnikowa | komercyjna | mieszana – z krótkim uzasadnieniem",
  "gaps": [
    {"topic": "wątek obecny u konkurencji, a nieobecny u nas", "why": "dlaczego jest istotny", "evidence": "adres konkurenta albo fraza, z której to wynika"}
  ],
  "keywords_to_cover": [
    {"keyword": "fraza", "volume": 0, "current_position": null, "where": "sekcja, w której powinna wystąpić naturalnie"}
  ],
  "structure": [
    {"action": "keep | rewrite | add", "slot": 1, "heading": "proponowany nagłówek H2", "note": "co konkretnie zmienić"}
  ],
  "factual_risks": ["twierdzenie w tekście, które jest nieaktualne lub wymaga weryfikacji"],
  "summary": "trzy zdania: co jest nie tak i co zmieniamy w pierwszej kolejności"
}

Zasady:
- Luki wskazuj tylko wtedy, gdy realnie wynikają z danych konkurencji – nie wymyślaj wątków „bo pasują".
- Pytania z PAA i frazy powiązane traktuj jako realny popyt: jeśli artykuł na nie nie odpowiada, to luka.
- Jeśli dla frazy jest AI Overview, wskaż w `structure`, które fragmenty tekstu wymagają formy nadającej się do zacytowania: krótka, samodzielna odpowiedź tuż pod nagłówkiem.
- Nie proponuj usuwania treści, która pokrywa frazy z realnymi wyświetleniami.
- `slot` odnosi się do numeru sekcji w obecnej strukturze; dla nowych sekcji podaj pierwszy wolny numer z listy: {{ free_slots }}.
- Maksymalnie {{ max_new_sections }} nowe sekcje.
- W `keywords_to_cover` podawaj tylko frazy, które da się wpleść w normalne polskie zdanie w tej sekcji, którą wskazujesz w `where`. Fraza wymagająca sztucznego zdania albo osobnego akapitu „o niczym" nie jest luką.
- Proponowane nagłówki (`heading`) mają nazywać treść sekcji. Nie zwracaj nagłówków generycznych („Podsumowanie", „Wstęp", „Wnioski") ani nagłówków będących samą frazą w mianowniku.
- Pisz po polsku, konkretnie, bez marketingowego lania wody.
