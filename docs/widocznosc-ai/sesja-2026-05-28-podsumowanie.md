# widocznosc.ai - podsumowanie sesji 2026-05-28

## Stan na koniec dnia

Ostatni wypchniety commit na `origin/main`:

- `651df22 fix(widocznosc): usun anne z projektu`

Wazne: lokalny working tree nadal zawiera duzo zmian niezwiązanych bezposrednio z ostatnimi pushami. Przy kolejnej sesji najlepiej startowac od aktualnego `origin/main` albo robic selektywne patche z konkretnych plikow, zeby nie zabrac przypadkiem zmian z contentu, assetow i lokalnych eksportow.

## Wypchniete dzisiaj zmiany

- Przygaszony light mode: mniej meczace tlo, spokojniejsze powierzchnie, lepsze hairline i nav w light mode.
- Blog: dopracowany hero, filtry, karty i paginacja; naprawione polecane tagi.
- Artykuly: ujednolicone anchory linkow do narzedzi.
- Narzedzia: przebudowany box w hero na bardziej symetryczny uklad jak w `o-nas`; copy zmienione na `4 testy, ktore pokazuja jak AI widzi Twoja marke`.
- `o-nas`: poprawiony oddech w sekcji `Czego nie robimy w audycie AI`, ujednolicone metadane sekcji `A/02 ICEA + GEO`.
- Usunieta Anna Jelonek-Wrzesinska z projektu:
  - usunieta z kolekcji autorow,
  - usunieta z `AuthorsStrip` i `/o-nas`,
  - strona `/autor/anna-jelonek/` nie jest juz generowana,
  - licznik ekspertow na `/o-nas` zmieniony z `5` na `4`,
  - jej 8 wpisow przepisane na Tomasza Czechowskiego, Piotra Wicenciaka i Michala Ziacha.

## Przepiecie wpisow po usunieciu Anny

- Tomasz Czechowski:
  - `geo/topical-authority`
  - `ai-w-biznesie/ai-act-rodo`
  - `geo/geo-dla-lokalnego-biznesu`

- Piotr Wicenciak:
  - `ai-w-biznesie/ai-w-hr`
  - `modele-llm/claude-vs-gemini`
  - `ai-w-biznesie/etyka-ai-w-firmie`

- Michal Ziach:
  - `modele-llm/perplexity`
  - `modele-llm/copilot`

## Weryfikacja

- Build przechodzil po zmianach.
- Po usunieciu Anny build wygenerowal `74 page(s)`, czyli strona autora Anny zniknela z generowania.
- Przed ostatnim pushem sprawdzone, ze w czystym patchu nie ma odwolania do `Anna`, `anna-jelonek`, `Jelonek`, `Wrzesi`.

## Uwagi na kolejna sesje

- Nie opierac sie bezposrednio na lokalnym `git status`, bo sa tam liczne starsze/unrelated zmiany.
- Jesli potrzebny push, najlepiej:
  - zrobic diff tylko wybranych plikow,
  - nalozyc go na czysty worktree z `origin/main`,
  - zbudowac albo przynajmniej zweryfikowac zakres,
  - commitowac tylko pliki z zadania.
- Do sprawdzenia wizualnego po deployu: `/narzedzia`, `/o-nas`, `/blog`, strony autorow i artykuly przepiete z Anny.
