# Sesja 2026-07-28 – Content Watcher na WordPressie: etap A wdrożony

Kontynuacja [sesji 2026-07-27](sesja-2026-07-27-podsumowanie.md). Application
Password wciąż nie ma – i okazało się, że do etapu A nie jest potrzebne, bo
odczyt REST działa anonimowo. Uwierzytelnienie jest wpięte warunkowo i włączy
się samo, gdy sekrety powstaną.

## Co powstało

### Źródło `wordpress` w collectorze

`dashboard/collector/sources/wordpress.py` – katalog treści z REST API,
stronicowanie po 100, cały przejazd ~12 s dla 604 pozycji.

Maper treści obsługuje cztery warianty odczytu:

| Tryb | Skąd treść | Ile pozycji |
| --- | --- | --- |
| `acf` | `page_title_h2_1..30` / `page_text_1..30` | 444 |
| `no_section` | `page_content_no_section` | 1 |
| `content` | `content.rendered` (najstarsze wpisy) | 13 |
| `fields` | pola z `content_fields` w domains.yaml | 146 (Słownik) |

Świeżość liczona z hasha znormalizowanej treści (`content_changed_at`), a nie z
pola `modified`, które WordPress podbija przy każdym zapisie. Pierwszy przejazd
oznacza wszystkie wpisy jako `hash_baseline` – do czasu pierwszej realnej zmiany
przy dacie widnieje „≈”.

### Katalog na dashboardzie

`loadContentCatalog` dostał drugie źródło: `content_watcher.source: wordpress`
czyta katalog z `details.json` zamiast plików markdown. Widok
`/grupa-icea.pl/content-watcher/` działa z pełnym łączeniem po URL-u:
457/458 wpisów z indeksacją, 268 z Senuto, 219 z porównaniem okien GSC,
134 z GA4.

### Rekalibracja scoringu

Model z 49 wpisów widocznosc.ai dał na 604 pozycjach **377 kandydatów (82%)**,
czyli listę bez priorytetu. Dwie przyczyny:

1. **Świeżość jako składowa punktowa** – średnio 19,4/20 pkt, bo 512 treści ma
   ponad rok. Wiek podbijał wszystko po równo.
2. **Normalizacja do dostępnych składowych** – wpis, o którym wiemy najmniej,
   wypadał najwyżej. Treść z samą indeksacją dostawała 35/35 = 100 pkt.

Po zmianie (decyzja Mateusza): wiek wyłącznie bramkuje wejście do kolejki
(`min_age_days`) i rozstrzyga remisy, mianownik jest stały (utrata 45 +
potencjał 35 + Senuto 12 + zaangażowanie 8), a treść bez pomiaru z GSC dostaje
status „brak pomiaru” zamiast wyniku z resztek składowych.

Efekt: **70 kandydatów z 604** (grupa-icea.pl, progi 365 dni / 55 pkt) i
**4 z 49** (widocznosc.ai, 60 dni / 18 pkt). Na górze listy wpisy z realną
utratą kliknięć i potencjałem w TOP 11–30, np. „Błąd 403 – jak naprawić?”
(89 pkt, −27 kliknięć, 824 wyświetlenia, pozycja 26,6).

## Ustalenia i sprostowania do wczorajszych wymagań

- Szablon ma **30 sekcji H2**, nie 8 (rekord w użyciu: 29). Ryzyko „pipeline
  będzie chciał dziewiątej sekcji” jest bezprzedmiotowe.
- **Słownik nie wystawia `content` w REST** – ani lead, ani nic. Cała treść leży
  w `dictionary_text_hero` + `dictionary_text`. Stąd `content_fields` w
  konfiguracji zamiast twardego mapowania.
- REST **wymaga końcowego ukośnika**: `/wp/v2/posts/`, inaczej 301.
- Zakres CPT: blog (458) + Słownik (146). Pozostałe – `casestudy`, `industries`,
  `seonewsy`, `zos`, `opinions` – czekają na decyzję.

## Commity

- `4cbcb18` źródło `wordpress` dla Content Watchera
- `d118a72` rekalibracja scoringu + Słownik w katalogu

Niepushnięte – czekają na akceptację.

## Następny krok

Etap 2 z planu: D1 na stan kolejki, API w Workerze, ręczna akceptacja, webhook
do n8n. Zapis draftów do WordPressa dopiero po utworzeniu Application Password
(`WP_APP_USER` + `WP_APP_PASSWORD` są już wpięte w workflow collectora).
