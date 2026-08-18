# Sesja 2026-08-18 – widocznosc.ai w strategii marketingowej ICEA

## Kontekst

Decyzja na poziomie zarządu (Artur Osak – szef marketingu, po konsultacji z Dawidem Fabisiem i CEO): **widocznosc.ai zostaje włączona do strategii marketingowej ICEA** jako jedno ze źródeł generowania leadów. Artur zadał pytania o technologię, brand/key visual, customer journey i analitykę; CEO dodał pytanie o rekomendację scenariusza (zmiana silnika vs dobudowa CMS) i o uniezależnienie rozwoju od dostępności Mateusza.

## Co zrobiono

1. **Odpowiedź strategiczna** – `docs/widocznosc-ai/odpowiedz-widocznosc-strategia-2026-08-18.html` (kopia w Downloads, do wklejenia w mail):
   - stan technologii (Astro 6 + Tailwind 4 + CF Pages + Pages Functions, ~40 komponentów, 4 narzędzia, formularze e2e);
   - rekomendacja: **zostajemy na Astro, WordPress = krok wstecz** (wydajność/CWV, bezpieczeństwo, AI-search ready, wersjonowanie, koszt migracji bez zysku); kierunek odwrotny (grupa-icea.pl → Astro) jako myśl długoterminowa;
   - CMS dla samodzielności marketingu: **git-based headless (Sveltia/Decap)** – 2–3 dni podstawa, +3–5 dni sekcje/formularze; Storyblok jako etap 2;
   - model rozwoju: **Jakub Jankowski doszkolony z Astro, realizacja przez R&D, Mateusz jako architekt/reviewer**;
   - key visual: warstwa wizualna sparametryzowana (design tokens), wycena przebudowy **11–16 dni dev** w 4 etapach;
   - content dotąd pod SEO/autorytet – audyt konwersyjny rekomendowany równolegle z projektem KV;
   - customer journey (2 ścieżki), analityka (GA4+GTM, Consent Mode v2, Clarity, dashboard), rozbudowa przez GTM;
   - spięcie z decyzją o dwóch domenach z 17.08.

2. **Kompletny plan marketingowy klastra „Pozycjonowanie AI"** – `docs/plan-marketingowy-klaster-pozycjonowanie-ai-2026-08-18.md` + `.html` (kopie w Downloads):
   - 9 sekcji: rynek/popyt, benchmark konkurentów (widoczni, sembility, sempire, rodin), strategia dwóch domen, rozpiska treści grupa-icea.pl (O1–O5 oferta, B1–B6 blog, S1–S3 słownik z frazami/priorytetami/terminami tygodniowymi), kierunek widocznosc.ai (W1–W5, w tym kwartalne badanie cytowań AI), dystrybucja (mosty, social, opcja Ads, PR), KPI (0/10 → 3/10 Q4 → 6/10 Q1 2027), harmonogram wrzesień–grudzień, zasoby i ryzyka;
   - „minimum P1 na wrzesień": hub + 301, podstrona ChatGPT, schema encji, różnicowanie title, odblokowanie botów AI w CF, monitoring 10 fraz w dashboardzie.

3. **Korekta językowa planu przez Mateusza** – wersja .md poprawiona ręcznie (fleksja, spolszczenia: „długi ogon", „kanibalizacja słów kluczowych"), HTML odtworzony z poprawionej wersji skryptem md→html (zachowany styl, kolory P1–P3, colspan w benchmarku).

## Wnioski / proces

- Deliverable „do wklejenia w mail" = HTML z prostym, mailowo-bezpiecznym stylem (Calibri, tabele z obramowaniem) – otwarcie w przeglądarce → Ctrl+A/C → wklejka trzyma formatowanie.
- Workflow korekty: HTML → zrzut do .md → ręczna korekta Mateusza → regeneracja HTML z .md. Obie wersje mają zostać spójne.

## Otwarte

- Odpowiedź czeka na wysyłkę/reakcję Artura i CEO (decyzje: kosztorys UX vs Uniforma, test Google Ads, CRM docelowy dla leadów).
- Realizacja planu klastra startuje wg harmonogramu od września (P1).
