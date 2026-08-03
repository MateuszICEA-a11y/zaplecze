# Sesja 2026-08-03 – BusManiak.pl: naprawa publikacji + przebudowa news-generatora (+ fixy edytora CW)

## 1. Edytor Content Watchera (dashboard zaplecza)

- **Azure 400 w kroku „Wytyczne"**: provider Azure odrzuca `openrouter:web_search` łączony z `response_format` („Web Search cannot be used with JSON mode"). Fix: przy włączonym wyszukiwaniu nie dokładamy `response_format` – JSON pilnują prompty + `_extract_json` (`5d4d320`).
- **Hamskie wplatanie fraz** (wpis o fotowoltaice): user wybrał writer `gpt-5.6-terra`, ale rewrite napisał `gemini-3-flash-preview` – **cicha degradacja** w `call_json`: odpowiedź ucięta na `max_tokens=8000` → JSON się nie parsował → fallback na najtańszy model. Fix (`efe4aa9`, `e205d79`): `finish_reason=length` ⇒ ponowienie na tym samym modelu z podwojonym limitem; rewrite dostaje 24k; użycie fallbacku jawnie w `fallback_from`; reguły redakcyjne: frazy z danych to surowe zapytania (nigdy dosłownie), zakaz pogrubiania fraz.
- Wpis o fotowoltaice do ponownego przejazdu (force) – tym razem napisze go faktycznie wybrany model.

## 2. BusManiak.pl – deploy leżał od 8 maja

- Commity newsów schodziły codziennie, ale **każdy build CF Pages padał**: `.nvmrc`=„22" (→ Node 22.22.0) vs `.tool-versions`=„nodejs 22.12.0" (asdf: „No preset version installed for npm", exit 126). Oba pliki wniósł merge widocznosc.ai (4eade2f, 8 maja).
- Fix: oba przypięte do `22.22.0` (`79cac56`). Po deployu weszła 3-miesięczna zaległość newsów.
- Szczegóły: [[cf-pages-nvmrc-tool-versions]].

## 3. Czystka i uszczelnienie newsów

- Usunięte **12 wpisów** (`92e5d4b`): 9 off-topic (wietnamskie ulice „Vo Van Kiet"/„Van Cao"/„Nam Hai Van", mieszkania Ho Chi Minh, kontrola cen i pieprz z Wietnamu, van Dijk, van Assche, van Heukelom) + 3 duplikaty (2× Dębica, 2× Szczecin, „cz. 2" zabudowy). Graniczny „«Na sygnale» odc. 909 Kamper" zostawiony.
- Przyczyny: gołe `van` w zapytaniu Google News + sędzia LLM bez opcji odmowy (musiał wybrać 1 z 5).
- Uszczelnienie (`96c9ad7`): feed bez `van`, `blocked_title_patterns` w config.yaml (wietnam/hanoi/ho chi minh/da nang/sajgon/vnd), sędzia z wetem `chosen=0` + lista 10 ostatnich publikacji przeciw powtórkom, stawka 5→8.

## 4. Przebudowa news-generatora (jakość)

- **Treść** (`c8aa908`): generator pisał z samego tytułu + zajawki RSS. Teraz: `googlenewsdecoder` (batchexecute) → prawdziwy URL → treść przez Jina Reader (`source_fetcher.py`, klucz opcjonalny) → reguła „pisz tylko z faktów źródła". Writer: **`x-ai/grok-4.5` przez OpenRouter** (`llm.writer_model`; prefiks dostawcy → OpenRouter, gołe `gpt-*` → OpenAI). Sędzia + wizja zostały na gpt-5.4. Sekrety w workflow: OPENROUTER_API_KEY, JINA_API_KEY (opcjonalny).
- **Obrazki** (`b45433a`): hybryda – najpierw prawdziwe zdjęcie z Wikimedia Commons/Openverse (`stock_photo.py`, licencje CC0/PD/BY/BY-SA, walidacja tą samą bramką wizyjną, atrybucja w `image_credit` renderowana na hero – nowy element w shared/theme), fallback kie.ai z promptem z tytułu+leadu („Grafika ilustracyjna: AI"). Kategoria `incident` (wypadki/pożary) celowo bez cudzych prawdziwych zdjęć. Walidator zluzowany do „ilustracyjności" – koniec 3 spalonych generacji dziennie.
- Żywe testy: dekoder + Jina na dzisiejszym newsie (fakty: Włochy, DK79, jezioro Ventina – w opublikowanym wpisie ich nie było), bazy zdjęć („Ford Transit Custom 2024" → 5 zdjęć CC0/CC-BY). Testy: news-generator 43/43, content-refresher 68/68.

## 5. Zalegający cache Cloudflare (gotcha)

- 3 usunięte URL-e dalej serwowały 200 z wewnętrznego cache Pages (`s-maxage=604800`, rosnący `age`, nagłówki z `_headers` dla pages.dev). **Purge Everything ani Custom Purge tego nie ruszają**; APO niewykupione, Smart Shield wyłączony, workers routes puste.
- Obejście: 301 w `static/_redirects` (`11a2b11`) – ścieżka znów w manifeście builda, kopie nadpisane (zweryfikowane: 3× 301 → /news/). Szczegóły: [[cf-pages-osierocony-cache]].

## Artefakty sesji

- Raport HTML (tylko BusManiak): `docs/raport-busmaniak-2026-08-03.html` (+ kopia w Downloads).
- Pamięć: [[cf-pages-nvmrc-tool-versions]], [[busmaniak-news-uszczelnienie]], [[cf-pages-osierocony-cache]].

## Jutro / otwarte

- **Zweryfikować pierwszy news z crona 7:00** na nowych zasadach (fakty, grok-4.5, obrazek z bazy/AI z podpisem).
- Ponowny przejazd wpisu „pozycjonowanie branży fotowoltaicznej" w edytorze CW (force).
- Gotcha do ewentualnej poprawki: guard „already published today" w main.py news-generatora stoi PO generacji – ręczny dispatch w dniu z publikacją pali tokeny.
- Równolegle działała druga sesja (edytor CW: `c83b712`, `afa9ddc`, `d453723`, `e9fd2ab`) – zmiany z obu sesji zrebase'owane i wypchnięte.
