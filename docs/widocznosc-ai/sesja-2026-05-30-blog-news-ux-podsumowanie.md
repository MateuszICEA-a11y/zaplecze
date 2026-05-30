# Sesja 2026-05-30 (cz. 2) – UX wpisów: spis treści, hero-banner, układ 3-kol, polish newsów

Druga sesja tego dnia (pierwsza: web-fact-checker – osobna notatka). Temat: przebudowa stron wpisów bloga i newsów widocznosc.ai pod wzór Moz, na żywej iteracji z userem (commit → „push" → kolejna uwaga).

Stack bez zmian: Astro 6.2 + Cloudflare Pages, `portals/widocznosc.ai/`, deploy z `main`. Komponent `Article.astro` współdzielony przez blog (`[pillar]/[slug]`) i news (`news/[slug]`).

## Co weszło na produkcję (commity na main, chronologicznie)

1. **`60a32d5`** – spis treści (H2) ze scroll-spy + pasek postępu czytania + pole `updated` (data aktualizacji w byline + `dateModified` w JSON-LD). Bonus fix sticky (patrz gotcha niżej).
2. **`126c94f`** – hero overlay (tekst na obrazku) – pierwsze podejście, user uznał za „cienkie".
3. **`14c5c64`** – hero przerobiony na **banner w stylu Moz**: tekst na firmowym gradiencie (akcent→surface, osobno light/dark) + obraz wtopiony maską po prawej. Eyebrow z tagami, tytuł, deck (zajawka), dividery, meta z ikonami, autor. `heroOverlay` prop.
4. **`bf2d34d`** – **układ 3-kolumnowy** (spis z LEWEJ jak Moz | treść | autor/CTA/udostępnij), wszystko wyrównane do szerokości banera (1360). Łagodniejsze wtopienie obrazu w light. **Dual-theme Shiki** (github-light/dark sterowany `[data-theme]`) – kod czytelny i kolorowy na obu motywach (wcześniej sztywny github-dark inline).
5. **`eb1271b`** – fix lądowania kotwicy spisu: `scroll-margin-top:100px` na H2/H3 + próg scroll-spy 140→112 (nagłówek ląduje pod navbarem, aktywna sekcja się zgadza).
6. **`1ebda10`** – polish newsów: banner jak na blogu, źródło jako link (potem zmienione, p. 9), byline/karta autora tylko „Redakcja", etykieta „Pogłębione…”→„Więcej w bazie wiedzy".
7. **`2cb9a24`** – **pipeline newsów** (`pipeline/news-generator-widocznosc/`): prompt wymusza indywidualne nagłówki H2 sekcji „fakty"/„wnioski" (koniec szablonu „Co się wydarzyło?"); scorer dostał czynnik `source_diversity` (kara za wydawcę użytego ostatnio → rotacja źródeł z feeds.yaml); `main.py` zapisuje `source_name` w published.json. Testy 30/30.
8. **`9871dd6`** – przykład: przeredagowane nagłówki w `gdy-firmy-przesadzaja-z-ai` (→ „Aaron Levie ostrzega przed »psychozą AI«…", „Czego ta fala zwolnień uczy marki…").
9. **`c6f96d0`** (3 commity) – source newsa jako **sam pełny URL** (nieklikalny, mono); **share na mobile** (pasek pod treścią, bo sidebar ukryty <1024px; copy przepięty na klasę `.js-copy-link`); **koniec autocytowania** – ekspert ≠ autor wpisu w **7 wpisach** (skan: 7/46 self-cite; podmieniony avatar+alt+podpis na inną osobę ICEA dobraną tematycznie).

## Gotchas / wiedza (zapisane też w pamięci)

- **Sticky sidebar** wymagał `overflow-x: clip` (nie `hidden`) na html/body **oraz** `align-self: stretch` na `.article-sidebar` – inaczej `position:sticky` nie działa. → [[reference-widocznosc-sticky-gotcha]]
- **Shiki**: przy `defaultColor:false` `pre.astro-code` dostaje tylko zmienne `--shiki-light/dark` (+`-bg`), bez sztywnego `color`/`background` → nasze tło terminala zostaje, kolory tekstu wybiera selektor `[data-theme]`.
- **Reguła ekspert ≠ autor** w callout-expert. → [[feedback-ekspert-nie-autor]]

## Otwarte / do ewentualnego dokończenia

- Przycisk „do góry" na mobile **działa** (zweryfikowane), ale na krótkich newsach chowa się przy widocznej stopce (anti-overlap). User może chcieć poluzować tę regułę dla newsów.
- Drugi istniejący news (`internet-coraz-bardziej-pod-maszyny`) ma jeszcze szablonowe nagłówki – nieprzeredagowany (nowe z cronu będą różnicowane automatycznie).
- Pipeline D1/D2 (nagłówki + rotacja źródeł) działa od następnego uruchomienia cronu – brak weryfikacji na żywym runie.
- Spec projektu: `docs/superpowers/specs/2026-05-30-blog-toc-progress-hero-design.md` (opisuje wczesny wariant overlay, nie finalny banner) – niezacommitowany.
