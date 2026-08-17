# Sesja 2026-08-17 cz. 3 – Content Watcher: styl i fleksja + infografiki

Dwa nowe etapy końcowe w edytorze wpisu (po zakończonej optymalizacji).
Dwa commity, oba lokalne – **nic nie jest wypchnięte i nic nie wdrożone**.

## 1. Etap „popraw styl i fleksję" (commit `3222ef5`)

Przejazd redaktorski promptem, który działa już w newsach
(`pipeline/news-generator-widocznosc/smoother_bridge.py`), tu w wersji
z człowiekiem w pętli.

- `dashboard/app/cw-style.js`, `POST /api/cw/jobs/:id/style`,
  `PATCH /api/cw/jobs/:id/style/:slot`.
- Model `google/gemini-3.7-flash:online` (`CW_STYLE_MODEL` nadpisuje).
  `:online` daje web search – bez tego punkt „zweryfikuj fakty" jest ślepy na
  premiery z ostatnich tygodni.
- **Jedno wywołanie na cały wpis.** Prompt wymaga spójności terminologii
  („jeden termin dla jednego pojęcia w całym tekście"); przejazd sekcja po sekcji
  tę regułę wyłącza.
- Wejście składa Worker: propozycje pipeline'u (nieodrzucone) + sekcje z CMS-a,
  łącznie z blokiem FAQ. Treść nie przychodzi z przeglądarki.
- Wpis dłuższy niż 50 000 znaków promptu jest **odrzucany**, nie przycinany.
- Wynik = propozycja per sekcja (`job_style`, migracja 0009): uwagi językowe,
  diff słowny liczony w przeglądarce, decyzja ✓/✕. Akceptacja pisze do
  `job_sections.text_after` – dalej wszystko (podgląd, „kopiuj treść", szkic
  i wdrożenie w WP) działa bez zmian.
- Sekcja, której pipeline nie ruszał, dostaje przy akceptacji własny wiersz
  z hashem treści dla bramki konfliktu; cofnięcie ten wiersz kasuje.
- `styleGuard` wiesza ostrzeżenia (zmieniona liczba, zniknięty link, zmieniona
  struktura HTML, skok objętości) – nie blokuje, kieruje wzrok.
- Raport przejazdu: osobno weryfikacja faktów (status + notka, niepewne
  z `[DO WERYFIKACJI]`) i propozycje uzupełnień, których model sam nie wstawia.

## 2. Infografika do sekcji (commit `96de063`)

- `dashboard/app/cw-infographic.js`,
  `/api/cw/jobs/:id/infographic/:slot` (GET + POST z krokiem).
- Cztery kroki osobnymi żądaniami, bo kie.ai oddaje obraz po 30–180 s:
  `brief` (opis od modelu, edytowalny) → `generate` (createTask) → GET
  (odpytywanie co 8 s) → `insert` (biblioteka mediów + `<figure>`).
- Styl grafiki to stała marki (paleta ICEA, 16:9, reguły pisowni polskich znaków
  – lustro `pipeline/grupa-icea-article-images.py`). Model dobiera wyłącznie
  treść ilustracji.
- Adres z kie.ai jest tymczasowy, więc plik musi wejść do `wp/v2/media`.
  Odmowa WP wraca z kodem REST – konto bez `upload_files` odbije się tutaj.
- „Usuń z sekcji" zdejmuje blok z treści; plik w bibliotece zostaje.
- Stan zlecenia w `job_images` (migracja 0010).

## Do zrobienia przed wdrożeniem

1. **Migracje na zdalnej bazie – obowiązkowo przed pushem.** `readJob` czyta
   `job_style` i `job_images`, więc bez tabel edytor przestanie odczytywać
   zadania:
   ```
   cd dashboard/app
   npx wrangler d1 execute zaplecze-content-watcher --file=migrations/0009-style-pass.sql --remote
   npx wrangler d1 execute zaplecze-content-watcher --file=migrations/0010-infographics.sql --remote
   ```
2. Sekret Workera `KIE_API_KEY` (klucz kie.ai – ten sam, którego używa
   `pipeline/grupa-icea-article-images.py`).
3. Sprawdzić, czy konto z `WP_APP_USER` ma prawo `upload_files` – inaczej krok
   „wstaw do sekcji" zwróci `rest_cannot_create`.

## Luki świadome

- Lead wpisu (pole `content` w WP, sekcja „0" w dokumencie) nie wchodzi do
  przejazdu stylistycznego – `wp-apply` pisze wyłącznie pola ACF.
- Nowy przejazd stylu wyciera poprzednie propozycje, więc cofnięcie zatwierdzonej
  korekty działa tylko do następnego przejazdu.
- Etap stylu i infografiki żyją w Workerze, nie w pipelinie w GitHub Actions –
  `pipeline/content-refresher/` nie ma ich odpowiednika (jak przy ekspercie,
  który tam jeszcze jest, ale w edytorze robi go Worker).

## Weryfikacja

`pnpm test` – 170/170 (nowe: `cw-style.test.js` 17, `cw-infographic.test.js` 22,
`cw-api.test.js` +11 na trasach stylu). `pnpm build` przechodzi. Ścieżek
przez przeglądarkę nie klikaliśmy – wymagają migracji i sekretu kie.ai.
