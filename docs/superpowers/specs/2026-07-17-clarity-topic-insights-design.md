# Spec: wpis „Topic Insights w Microsoft Clarity" (blog widocznosc.ai)

**Data:** 2026-07-17
**Autor pracy:** sesja Claude + Mateusz (ICEA)
**Cel:** evergreen guide w `/blog/geo/` omawiający nową funkcję Microsoft Clarity – Topic Insights – w formie praktycznego walkthrough z uczciwym komentarzem ICEA o ograniczeniach.

## Kontekst źródłowy (zweryfikowany)

- Ogłoszenie: <https://clarity.microsoft.com/blog/topic-insights-announcement/>, autor Ihab Rizk, **9 lipca 2026**.
- Topic Insights rozszerza funkcję **Citations** (GA 13 maja 2026) – z „widoczności" w konkretne rekomendacje.
- 4 wymiary per temat: **Visibility** (częstość cytowań domeny / udział autorytetu), **Influence** (ile Twój content wnosi do odpowiedzi), **Competition** (kto cytowany obok Ciebie, luki), **Opportunities** (priorytetyzowane działania).
- Metoda: reprezentatywne prompty → ocena odpowiedzi AI → pomiar wkładu każdego źródła → agregacja na poziomie tematu.
- Beta: **GPT-5.3** + grounding **Web IQ**; limit **10 raportów/tydzień/projekt**; „directional only".
- **Web IQ** (zapowiedź BUILD, czerwiec 2026) = zestaw AI-native grounding APIs; zwraca *pasaże / structured evidence objects*, nie dokumenty. Wyszukiwarka „dla agentów AI".
- **Kluczowy insight ICEA:** Topic Insights ocenia odpowiedzi GPT-5.3 groundowanego przez Web IQ → to proxy „świata Microsoftu", nie pomiar 1:1 tego, co zwraca realny ChatGPT/Gemini/Google AIO/Perplexity.

## Decyzje

- **Plik:** `portals/widocznosc.ai/src/content/blog/geo/microsoft-clarity-topic-insights.md`
- **Filar:** `geo` · **intent:** `HOWTO` · **level:** `L2` · **readTime:** ~13 min
- **Autor:** Mateusz Wiśniewski (Ekspert SEO/AI Search)
- **Ekspert w callout:** Tomasz Czechowski (Head of SEO) – reguła ekspert ≠ autor
- **Screeny:** dostarczy user później; w tekście czyste sloty (HTML-komentarz + gotowy alt + docelowa ścieżka pliku), które nie łamią buildu.
- **Hero:** wygenerowany w stylu ICEA (kie.ai); fallback = dopracowany screen.

## Struktura (H2)

1. Intro (bez nagłówka) – hook.
2. Czym jest Topic Insights (vs Citations) – 4 wymiary.
3. Zanim zaczniesz – prerequisites (projekt + weryfikacja + Citations). *(obraz przed tą sekcją)*
4. Krok po kroku: uruchomienie raportu (temat + prompty + konkurencja). [SCREEN 1–2]
5. Jak czytać 4 wymiary. [SCREEN 3–5]
6. Grounding queries – co AI naprawdę odpytuje. [SCREEN 6, opc.]
7. callout-expert (Tomasz Czechowski).
8. Gdzie ma limity (szczery komentarz ICEA) → interlink do `narzedzia-monitoring-wzmianek`.
9. Jak wpiąć w workflow GEO → interlinki do `audyt-widocznosci-marki`, `share-of-voice`, `topical-authority`.
10. Podsumowanie + CTA.

FAQ (frontmatter, 4 pytania): różnica vs Citations / czy naprawdę za darmo / czy mierzy ChatGPT i Google / limit raportów.

## Zasady redakcyjne

En-dash tylko; dwukropek przed listą; brak bold+dwukropek w listach; FAQ w frontmatterze; fakty zweryfikowane; humanizacja Sonnet na końcu; interlinki wewnątrz klastra geo.

## Sloty na obrazy (do dostarczenia przez usera)

1. Wejście do AI Visibility / dashboard Topic Insights
2. Definiowanie tematu + promptów + konkurencji
3. Raport: Visibility + Influence (scorecard)
4. Competition – domeny cytowane obok Ciebie
5. Opportunities – luki i rekomendacje
6. (opc.) Grounding queries
