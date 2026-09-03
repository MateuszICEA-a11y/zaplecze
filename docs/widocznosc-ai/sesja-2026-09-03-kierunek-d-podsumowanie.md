# Sesja 2026-09-03 (wieczór) – kierunek D „Instrument” dla widocznosc.ai

## Punkt wyjścia

Inspiracja: browser-use.com (ciemne płótno, antykwa w nagłówkach, monospace
w chromie, jeden akcent, przełącznik `human / machine` pokazujący stronę jako
markdown). Decyzja usera: skopiować system w całości, zmienić akcent, ilustracje
własne. Kierunek zaakceptowany wstępnie – „ogólnie kierunek mi się podoba”.

## Co powstało

- `portals/widocznosc.ai/DESIGN.md` – system w konwencji voltagent/awesome-design-md,
  tokeny zdjęte z DOM-u wzorca, akcent `#5768ff`.
- `src/styles/kierunek-d.css` + `src/layouts/KierunekD.astro` – system ograniczony
  klasą `.kd`; Theme.css i produkcja nietknięte.
- `src/pages/podglad/kierunek-d/{index,blog,wpis,oferta,narzedzia,kontakt}.astro`
  – sześć podstron, treść 1:1 z produkcji (Hero, HowItWorks, Audits, ProofData,
  Industries, FAQ, /pozycjonowanie-ai/); magazyn i wpis z realnej kolekcji `blog`.
- `src/components/HalftoneSentence.astro` – ilustracja generowana z cząstek:
  znak + wordmark widocznosc.ai (biel) → wstęga cząstek płynąca w pętli →
  logotyp iCEA (akcent). SVG jako maski alfa w `public/logos/brand/`.
- Przełącznik `człowiek / maszyna` z markdownem per strona i „Kopiuj stronę”.

Podgląd: **https://kierunek-d.widocznosc-ai.pages.dev/podglad/kierunek-d/**
(deploy wranglerem na gałąź `kierunek-d`, produkcja i `main` nietknięte).
Git: gałąź `redesign/kierunek-d`, 6 commitów od `670a1e3c` do `732455fa`, **bez pusha**.

## Co poszło źle i zostało naprawione

1. **Geist Sans bez latin-ext** – paczka @fontsource ma tylko subset `latin`;
   tekst ciągły został na Interze, mono na Geist Mono (ma latin-ext).
2. **Theme.css bił nagłówki** – selektor `h3:not([class*='text-']):not([class*='display-'])`
   (0,2,1) wygrywał z `.kd h3`; wszystkie nagłówki leciały w Mona Sans display.
   Naprawa: klasy `kd-text-*` na każdym nagłówku, (0,3,1) dla markdownu.
3. **Rozmiary komponentów z głowy** – user: „poszedłeś na łatwiznę”. Zdjęte
   z DOM-u wzorca: promień 0, karta #121216/28 px, przycisk 44 px 15/500,
   mono 11 z trackingiem 0.66, sekcje 128 px, kontener 1024 px.
4. **Halftone** – trzy iteracje: rozkład (sześcian → twarde przypięcie końców),
   parowanie cząstek (podpróbkowanie co k-ty wycinało pasy z logotypu → zawijanie
   modulo), czytelność wordmarku (700 + obrys, lockup 31% szerokości).

## Na jutro

- Ocena usera wszystkich sześciu podstron; ewentualne korekty.
- Decyzja: push gałęzi / scalanie z `redesign/widocznosc-dayos` (kierunek A) / co dalej.
- **Przed wdrożeniem przełącznika człowiek/maszyna na produkcję domknąć blokadę
  botów AI w Cloudflare** – strona z „zobacz, co widzi maszyna”, która maszynom
  oddaje 403, to gotowy materiał na złośliwy screenshot.
- Zrzuty głęboko w długich stronach (wpis ~16k px) wychodzą czarne w headless
  WSL – weryfikacja wypustek tylko przez wyliczone style; user powinien obejrzeć
  środek wpisu w normalnej przeglądarce.
