# Sesja 2026-09-16 cz.2 – Fan-out Explorer 1.3.x, redakcja strony narzędzia i wpisu

Ciąg dalszy [sesji porannej](sesja-2026-09-16-fanout-explorer-podsumowanie.md). Wszystko wypchnięte na `main` (CF Pages), 22 commity od `15e6eb9d` do `91fc94ec`.

## Bookmarklet (`portals/widocznosc.ai/tools-src/fanout-explorer.js`)
- **1.3.0** (`15e6eb9d`) – tryb „na żywo” czuwa od startu (wcześniej gasł na zapisanym czacie i nowy prompt łapał z opóźnieniem), przełącznik zielony/czerwony zapamiętywany w `localStorage wai-fanout:live`, uchwyt szerokości (`wai-fanout:w`, min 340 px), zwijanie do paska w rogu, retry 429 na osobnym timerze.
- **1.3.1** (`a36a5ecf`) – teksty panelu zgodne z działaniem: usunięte „na wyłączność” i „kliknij wiersz”, kolumna „udział” → „skala”, odmiana liczebników, kliknięcie zwiniętego paska rozwija panel, legenda uzupełniona (site: ×N, skala, przyciski domen, dokładny opis wyłączonego trybu).
- **1.3.2** (`f8a9448b`) – korekta językowa autora (39 tekstów) z pliku eksportu `Downloads/fanout-explorer-teksty-1.3.1.md`.

## Strona `/narzedzia/fanout-explorer/`
- H1 i title: „Fan-out Explorer – zobacz, czego ChatGPT szuka w sieci, zanim Ci odpowie”; wstęp zaczyna od kontekstu (czym jest fan-out), potem narzędzie.
- Tabela kolumn bez „typ” i „dni” + akapit, kiedy się pojawiają (starsze czaty); schema featureList i FAQ zgodne z obecnym formatem.
- Usunięty punkt „Nic się nie dzieje?”; nowy opis „Kopiuj zapytania”; FAQ o prywatności i 429 przeredagowane (bez makaronizmów), „Thinking” zamiast „Myślenie”, „Twoje rozmowy”, „Kod napisaliśmy z myślą o polskich promptach”.

## Wpis `/geo/fanout-explorer-chatgpt/`
- Tytuł: „Czego ChatGPT szuka w sieci, zanim Ci odpowie – Fan-out Explorer na polskich zapytaniach”.
- Korekta językowa autora; „opisy realizacji” zamiast „studiów przypadków”; „bookmarklet” zamiast „skryptu zakładkowego”; łagodniejsza teza o Reddicie („dla części polskich zapytań… forum Bankiera”).
- Zdanie o forach: Quora to serwis globalny z polską wersją od 2019 (pl.quora.com), bookmarklet liczy cały reddit.com; dopisane zastrzeżenie o dopasowaniu po adresie.
- Punkt o źródłach wyników ChatGPT: Bing, wyniki Google (SerpApi/Bright Data wg The Information i Peec AI) i własny indeks OpenAI (Labrador); krok 7 procesu rozbity na strony pominięte vs nieobecne (GSC, BWT, OAI-SearchBot).
- Linki do obcych narzędzi z `rel="nofollow"` (HTML w markdownie, bo rehype-external-links ustawia globalnie tylko noopener/noreferrer).
- Nowe zrzuty z 1.3.2 (`b4d963b2`): hero, panel, nowy zrzut zakładki Domeny, instalacja; podpisy `img-caption` pod zrzutami w treści.

## Nowość w szablonie bloga (`91fc94ec`)
- Opcjonalne pola frontmattera `sources[]` (`title`, `url`, `note`) i `sourcesIntro`, renderowane przez `src/components/ArticleSources.astro` pod FAQ (nad ramką autora), linki nofollow. Pierwszy wpis z sekcją Źródła: fanout-explorer-chatgpt.

## Ustalenia i gotche
- Podgląd lokalny (`astro dev`) wymaga odłożenia nieśledzonego `co-google-przemilcza-o-ai-search.md` (brak `mateusz-wisniewski.webp`), potem przywrócić.
- Zrzuty przez Claude in Chrome: `zoom` z `save_to_disk` bez `scale` daje pełną rozdzielczość (parametr `scale` zmniejsza też zapisany plik). Kod bookmarkletu da się wstrzyknąć przez `javascript_tool` (CDP omija CSP); na stronie ChatGPT przy pozycjach paska bocznego pojawiają się różowe obramowania spoza stylów strony – kadrować bez paska.
- Hero wpisu to kadr 16:9 z `object-fit: cover`, w banerze po prawej stronie z gradientem.
- Heurystyka Domen myli się np. przy zh.reddit.com i hipoteczny.pl (sklep) – opisane zastrzeżeniem we wpisie.

## Do zrobienia
1. Legenda w panelu nadal mówi „do narzędzia analizy słów kluczowych” przy Kopiuj zapytania, a strona narzędzia ma nowy opis – ujednolicić przy następnej wersji bookmarkletu.
2. Strona narzędzia: „linie podsumowania”, „per witryna”, „ptaszek”, „flaga cytowania”, „szuka na wyłączność”, „sklepy” – odstają od poprawionych tekstów panelu; czeka na decyzję autora.
3. Narzędzie `/narzedzia/fanout/` nadal na gpt-5.4 (`FANOUT_MODEL` w CF Pages) – bez zmian od rana.
4. `pipeline/pillar-expander/expand.py` – niezacommitowana zmiana innej sesji, nie ruszać.
