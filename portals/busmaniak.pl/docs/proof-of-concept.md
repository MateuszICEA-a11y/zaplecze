# BusManiak.pl – Proof of Concept

Data: 2026-03-23
Autor: Claude Code (operator) + MW (koordynator)

---

## 1. Dlaczego ta nisza

**Busy i vany** – segment pojazdów użytkowych, dostawczych, osobowych 7–9 os., camper vanów, zabudów i przeróbek kamperowych.

Nisza wybrana z następujących powodów:
- Wysoki łączny wolumen wyszukiwań (~500K+/msc w Google PL)
- Brak dedykowanego polskiego portalu pokrywającego całość tematu
- Silny komercyjny intent (zabudowy, wynajem, porównania = wysoka wartość linku)
- Rosnący trend vanlife i kamperowania w Polsce
- Segment pokrywa szeroki zakres marek i modeli (37+ modeli z wolumenem > 500/msc)

## 2. Źródła danych

### Senuto MCP
- 3 batche po 100 keywordów (łącznie 39,851 wyników w bazie)
- Seeds: "samochód dostawczy", "bus 9 osobowy", "busy osobowe", "bus dostawczy", "samochody dostawcze do 3.5t", "kamper", "vanlife", "zabudowa busa", "przeróbka busa", "bus kamper", "dopuszczalna masa całkowita"
- Dane: wolumen wyszukiwań, CPC, trend

### DataForSEO API
- Endpointy: related_keywords (depth 2), keyword_suggestions, keyword_ideas, search_intent
- 200+ unikalnych keywordów z wolumenem i klasyfikacją intencji
- Indywidualne sprawdzenie 31 modeli vanów/busów z wolumenem
- Klasyfikacja search intent na 50 top keywordach

## 3. Kluczowe odkrycia z researchu

### Top keywords w niszy (Google PL, miesięcznie)

| Keyword | Wolumen | Źródło |
|---------|---------|--------|
| Renault Trafic | 40,500 | Senuto |
| Toyota Proace | 40,500 | Senuto |
| Citroën Berlingo | 40,500 | DataForSEO |
| Fiat Ducato | 33,100 | Senuto |
| Ford Ranger | 33,100 | Senuto |
| Kamper | 33,100 | Senuto |
| Kontrolki w samochodzie | 33,100 | Senuto |
| Opel Vivaro | 27,100 | Senuto |
| Winieta Czechy | 27,100 | Senuto |
| Ford Transit / Transit Custom | 22,200 | Senuto |
| Iveco Daily | 22,200 | Senuto |
| Citroën Jumpy | 22,200 | Senuto |
| Citroën Jumper | 22,200 | Senuto |
| VW California | 22,200 | DataForSEO |
| Peugeot Partner | 22,200 | DataForSEO |
| Renault Kangoo | 22,200 | DataForSEO |
| Winieta Austria | 22,200 | Senuto |
| Mercedes Sprinter | 18,100 | Senuto |
| Mercedes Vito | 18,100 | Senuto |
| Opel Combo | 18,100 | DataForSEO |
| Toyota Proace City | 18,100 | DataForSEO |
| Check engine | 18,100 | Senuto |
| Peugeot Boxer | 14,800 | Senuto |
| Dacia Dokker | 14,800 | DataForSEO |
| Fiat Scudo | 14,800 | DataForSEO |
| Wynajęcie kampera | 12,100 | Senuto |
| VW Transporter T5 | 12,100 | Senuto |
| Ford Transit Connect | 12,100 | DataForSEO |
| Prawo jazdy kat. B | 12,100 | Senuto |
| Wynajem kampera | 9,900 | Senuto |
| Hyundai Staria | 9,900 | DataForSEO |
| Peugeot Expert | 9,900 | Senuto |
| Fiat Fiorino | 9,900 | DataForSEO |
| Immobilizer | 9,900 | Senuto |

### Zaskoczenia

1. **Renault Trafic, Toyota Proace i Citroën Berlingo (po 40.5K)** – większy wolumen niż Fiat Ducato (33K). Gdybyśmy budowali serwis wokół "typowych" modeli (Ducato, Sprinter, Daily), stracilibyśmy biggest keywords.

2. **Winiety (Czechy 27K, Austria 22K, Słowacja 9.9K, Węgry 6.6K)** – ogromny wolumen na frazy związane z podróżowaniem busem. Wymusiło to utworzenie osobnego klastra "Przepisy".

3. **37 modeli z wolumenem > 500/msc** – rynek busów/vanów jest znacznie szerszy niż początkowe 3 modele (Ducato, Sprinter, Daily). Obejmuje: duże busy (12 modeli), średnie vany (11), małe vany (14), osobowe MPV (5), pickupy (2), elektryczne (4).

4. **Frazy porównawcze ("X vs Y") mają niski wolumen** (<100), ale frazy opisowe (spalanie, ładowność, wymiary per model) mają 100–400/msc każda. Porównania agregują ruch z long taila.

### Klasyfikacja intencji (DataForSEO search_intent)

| Intencja | Przykłady | Strategia |
|----------|-----------|-----------|
| Informational | modele, dane techniczne, spalanie, kontrolki, vanlife | Artykuły poradnikowe, pillar pages |
| Commercial | kampery, zabudowy, wynajem, porównania | Artykuły z CTA, porównania tabelaryczne |
| Transactional | kupno/sprzedaż (OLX, OtoMoto) | POMIJAMY – nie nasz traffic |
| Navigational | marki, serwisy ogłoszeniowe | POMIJAMY |

## 4. Dlaczego taka struktura (10 klasterów)

### Klaster: Modele (25–30 art.)
**Powód:** Największy łączny wolumen (~250K+). Każdy model to osobna strona z danymi technicznymi, wersjami, cenami. Podzielony na segmenty: duże busy, średnie vany, małe vany, osobowe, pickupy, elektryczne.
**Nie można pominąć:** Renault Trafic (40K), Toyota Proace (40K), Citroën Berlingo (40K) – top 3 keywords w całej niszy.

### Klaster: Kampery (14 art.)
**Powód:** "Kamper" = 33K wolumenu. Rosnący trend, silny commercial intent. VW California (22K) – jeden model ma większy wolumen niż wiele całych klasterów.

### Klaster: Przeróbki (11 art.)
**Powód:** Unikalny content – poradniki DIY budowy kampera. Lojalna grupa docelowa (builderzy). Frazy: "budowanie kampera" (880), "bus przerobiony na kamper" (720), "kampery samoróbki" (590).

### Klaster: Zabudowy (10 art.)
**Powód:** Silny commercial intent (zabudowa busa 1.9K). Pokrywa zabudowy warsztatowe, kamperowe, izotermiczne, serwisowe. Duży long tail (40+ fraz z wolumenem).

### Klaster: Porównania (10 art.)
**Powód:** UNIKALNA WARTOŚĆ serwisu. Nie ma w polskim internecie szczegółowych porównań busów. Frazy "X vs Y" mają mały wolumen, ale frazy opisowe (spalanie, wymiary, ładowność per model) agregują się do 5K+/msc.

### Klaster: Serwis (15 art.)
**Powód:** Ogromne wolumeny na frazy diagnostyczne: "kontrolki" (33K), "check engine" (18K), "immobilizer" (9.9K). Content informacyjny, długi czas na stronie.

### Klaster: Wynajem (10 art.)
**Powód:** "Wynajęcie kampera" (12K), "wynajem kampera" (9.9K), "wypożyczalnia kamperów" (5.4K). Wysoki commercial/transactional intent.

### Klaster: Przepisy (12 art.)
**Powód:** ODKRYCIE Z RESEARCHU. Winiety (Czechy 27K, Austria 22K, Słowacja 9.9K) + prawo jazdy (12K) + DMC (720). Łącznie ~80K wolumenu. Idealny pod traffic informacyjny.

### Klaster: Narzędzia (4 strony)
**Powód:** UNIKALNA WARTOŚĆ – interaktywne kalkulatory. Kalkulator DMC, kalkulator paliwa, porównywarka busów, kalkulator zabudowy. Sticky traffic (użytkownicy wracają).

### Klaster: Vanlife (5 art.)
**Powód:** Rosnący trend "vanlife" (1.3K, trend wzrostowy). Uzupełnienie o lifestyle/podróże.

## 5. Dlaczego NIE inne struktury

### Odrzucone podejście: "3 marki"
Budowa serwisu wokół Ducato + Sprinter + Daily pomija 34 inne modele z wolumenem i traci ~200K/msc potencjalnego ruchu.

### Odrzucone podejście: "Tylko kampery"
Zbyt wąska nisza. "Kamper" to 33K, ale cały segment busów/vanów to 500K+. Kampery to 1 klaster, nie cały serwis.

### Odrzucone podejście: "Ogólna motoryzacja"
Za szerokie – konkurencja z Auto Świat, Moto.pl. Nisza "busy i vany" jest wystarczająco wąska żeby zbudować autorytet, a wystarczająco szeroka na 100+ artykułów.

## 6. Unikalna wartość serwisu

| Element | Opis | Powód |
|---------|------|-------|
| Porównywarka busów | Interaktywne porównanie 2–3 modeli obok siebie | Nie istnieje w polskim internecie |
| Kalkulator DMC | Czy mieścisz się w 3.5t? | Praktyczne narzędzie, frazy 720/msc |
| Kalkulator paliwa | Koszt trasy busem | Agreguje frazy "spalanie" per model |
| Tabele porównawcze | Wymiary, ładowność, silniki w tabelach | Brak takiego zasobu w PL |

## 7. Cel: 100 artykułów na start

| Klaster | Artykuły | Top keyword | Łączny est. wolumen |
|---------|----------|-------------|---------------------|
| Modele | 25–30 | Renault Trafic (40K) | ~250K |
| Serwis | 15 | Kontrolki (33K) | ~90K |
| Przepisy | 12 | Winieta Czechy (27K) | ~80K |
| Kampery | 14 | Kamper (33K) | ~35K |
| Wynajem | 10 | Wynajęcie kampera (12K) | ~40K |
| Porównania | 10 | Long tail aggregate | ~10K |
| Zabudowy | 10 | Zabudowa busa (1.9K) | ~5K |
| Przeróbki | 11 | Bus kamper (1K) | ~5K |
| Vanlife | 5 | Vanlife (1.3K) | ~5K |
| Narzędzia | 4 | Porównywarka aut (2.9K) | ~5K |
| **SUMA** | **~116** | | **~525K** |

Priorytetyzacja: najpierw artykuły z wolumenem > 5K, potem reszta.
