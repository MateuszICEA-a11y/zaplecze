# Sesja 2026-07-29 cz. 3 – audyt i przebudowa przebiegu Content Refreshera

Punkt wyjścia: po przejeździe optymalizacyjnym system nie poprawiał generycznych
nagłówków („Podsumowanie"), a nowe sekcje dokładał ZA podsumowaniem – wynik nie
nadawał się do wdrożenia w WordPressie bez ręcznego przemeblowania.

## Co zrobione (commity eba62de…fca2dbe, wypchnięte; Worker zdeployowany, migracja 0007 na zdalnej D1)

1. **Egzekwowanie nagłówków** (`eba62de`) – `brief.structure` idzie do rewrite
   jako jawna lista zadań (`structure_tasks`), prompt (rewrite 1.3.0) ma twarde
   reguły przepisywania generycznych H2, niezrealizowane zalecenia wracają jako
   `headings_missed` w payloadzie kroku i wyświetlają się w karcie wytycznych.
2. **Pozycjonowanie nowych sekcji** (`918e6ae`, `1c76bab`, `24ede6c`) – rewrite
   zwraca `after_slot` (kotwicę), `sections.renumber()` wstawia nową sekcję tuż
   za kotwicą, dalsze sekcje jadą w dół jako `operation=move` (`moved_from`,
   migracja 0007). Wiersz nowej sekcji to zawsze `insert` z pustym „przed";
   hash konfliktu z NADPISYWANEJ treści celu (wolny cel → hash None →
   „nadal wolny"). Edytor: etykieta „przesunięta z sekcji N", nagłówek węzła
   pokazuje nowego lokatora slotu. „Źródła" celowo zostają na końcu.
3. **Fakty z Jina w briefie** (`4d66fb7`) – Worker dokłada skrót analizy
   konkurencji (`rivalsSummary` z `serp_snapshots`) do client_payload
   dispatchu; workflow podaje przez env `RIVALS_JSON` (nie argument CLI –
   cudzysłowy), brief 1.2.0 ma sekcję „Zweryfikowane konkrety".
4. **Kosmetyka** (`29b9e3c`) – `content_truncated` w payloadach
   brief/sources/internal_links (limit 24k znaków) + ostrzeżenie w edytorze;
   luki fraz porównywane po normalizacji fleksyjnej (`normalize_phrase` –
   „agencje seo" ≠ luka wobec „agencja seo"); cytat eksperta po 1. akapicie.
5. **Ekstrakcja konkurencji przez Jina** (`de81fc9`, `fca2dbe`) –
   `extract.jina_extract()` (port proseWords/markdownHeadings z cw-rivals.js,
   ten sam remove-selector), fallback trafilatura, robots.txt nadal
   sprawdzany. Sekret `JINA_API_KEY` dodany do repo GH (konto
   MateuszICEA-a11y). **Gotcha:** Cloudflare przed r.jina.ai odrzuca UA
   `Python-urllib` kodem 403 mimo dobrego klucza – wymagany własny User-Agent.
6. **Spójność i czytelność** (`b7bc4bf`) – RIVALS_LIMIT 3→5 (=
   COMPETITOR_LIMIT, edytor i pipeline patrzą na ten sam zestaw stron);
   tabela luk fraz zwinięta do 15 wierszy z „pokaż wszystkie (N)".

## Weryfikacja

- 60 testów Pythona + 83 testy Workera zielone; build Astro czysty
  (19 błędów `astro check` istniało przed sesją).
- Przejazd e2e na fixtures (blad-403): generyczne H2 przepisane,
  `headings_missed=[]`, nowa sekcja w slocie 5 PRZED podsumowaniem,
  `moves {6:5}`, „Źródła" na końcu.
- Żywy test `jina_extract` na wpisie o błędzie 403: 1797 słów, 15 nagłówków,
  quality `ok`.

## Następny krok (umówiony na jutro): zapis draftów do WordPressa

Największa dziura procesu: zaakceptowane sekcje trzeba ręcznie przeklejać do
CMS-a, a po renumeracji dochodzi przestawianie slotów (move'y) – błędogenne.
Plan: przycisk „Wdróż zatwierdzone" w edytorze → Worker → WP REST (update pól
ACF przez **Application Password**), `detect_conflicts()` przed zapisem,
zapis jako draft/rewizja do przejrzenia w CMS-ie (nie od razu na żywo).
Infrastruktura gotowa: hashe per sekcja, flaga `accepted`, opcjonalne sekrety
`WP_APP_USER`/`WP_APP_PASSWORD` w workflow. **Czeka na Application Password
od Mateusza** (konto techniczne na grupa-icea.pl).

W zapasie: zwinięcie pozostałych tabel researchu, automatyczna analiza
konkurencji przy kolejkowaniu zadania (żeby fakty Jina zawsze były w briefie),
scalenie dwóch ścieżek SERP-gap (edytor liczy swoje, pipeline swoje).
