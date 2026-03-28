---
title: "Czujnik położenia wału korbowego – objawy awarii w busie"
date: 2026-03-28
description: "Czujnik położenia wału korbowego (CKP) w busie – objawy uszkodzenia, diagnostyka, kody P0335/P0336, koszt wymiany w Ducato, Sprinterze i Transicie."
draft: false
author: "marek-kowalczyk"
h1: "Czujnik położenia wału korbowego – mały element, duży problem"
type: "post"
volume: 6600
image: "/images/czujnik-polozenia-walu-hero.jpg"
image_alt: "Czujnik położenia wału korbowego CKP zamontowany przy kole zamachowym"
main_keyword: "czujnik położenia wału korbowego"
lead: "Czujnik położenia wału korbowego (CKP) to niewielki element wielkości kciuka, bez którego silnik busa nie uruchomi się lub zgaśnie w najmniej oczekiwanym momencie. Monitoruje obroty i pozycję wału, dostarczając sterownikowi dane kluczowe dla synchronizacji wtrysku paliwa. Awaria tego czujnika jest jedną z częstszych przyczyn nagłego unieruchomienia busa na trasie, a diagnostyka wymaga znajomości kodów P0335 i P0336."
faq:
  - question: "Jakie są objawy uszkodzonego czujnika położenia wału?"
    answer: "Najczęstsze objawy to nagłe gaśnięcie silnika (zwłaszcza na gorąco), problemy z rozruchem, szarpanie podczas jazdy, zapalona kontrolka check engine z kodem P0335 lub P0336 oraz przejście silnika w tryb awaryjny z ograniczeniem obrotów do ok. 3000–3500 obr/min."
  - question: "Ile kosztuje wymiana czujnika CKP w busie?"
    answer: "Sam czujnik kosztuje 50–300 zł w zależności od modelu busa i producenta części. Robocizna to 100–400 zł, zależnie od dostępności czujnika w komorze silnika. Łączny koszt wymiany wynosi więc 150–700 zł."
  - question: "Czy uszkodzony czujnik wału może uszkodzić silnik?"
    answer: "Bezpośrednio nie – czujnik jest elementem pomiarowym, nie wykonawczym. Jednak jazda z wadliwym czujnikiem powoduje nieprawidłowy wtrysk paliwa, co obciąża filtr DPF i może prowadzić do jego przedwczesnego zapchania."
  - question: "Gdzie znajduje się czujnik położenia wału w Fiacie Ducato 2.3?"
    answer: "W Ducato z silnikiem 2.3 MultiJet czujnik CKP jest zamontowany w dolnej części bloku silnika, po stronie rozrządu, tuż nad krawędzią miski olejowej. Dostęp wymaga podniesienia pojazdu na podnośniku."
---

## Czym jest czujnik CKP i jak działa

Czujnik położenia wału korbowego (CKP – Crankshaft Position Sensor) to czujnik elektromagnetyczny zamontowany w pobliżu koła zamachowego lub tarczy zębatej na wale korbowym. Jego zadanie jest proste, ale krytyczne – informuje sterownik silnika (ECU) o dwóch rzeczach: aktualnej pozycji wału korbowego i prędkości jego obrotów.

Na podstawie tych danych sterownik oblicza moment wtrysku paliwa, a w silnikach benzynowych także moment zapłonu. Bez sygnału z czujnika CKP sterownik nie wie, w jakiej fazie cyklu pracy znajduje się silnik – i albo go nie uruchomi, albo wyłączy.

### Czujnik indukcyjny (VR – Variable Reluctance)

Starszy typ, stosowany w busach produkowanych przed 2010 rokiem i wielu modelach do dziś. Składa się z cewki nawiniętej na rdzeń ferromagnetyczny z magnesem trwałym. Gdy ząb koła zamachowego przesuwa się obok czujnika, zmienia się pole magnetyczne i w cewce indukuje się napięcie zmienne.

Cechy czujnika indukcyjnego:

- **Złącze 2-pinowe** (czasem 3-pinowe z ekranem)
- **Nie wymaga zasilania zewnętrznego** – generuje sygnał sam
- **Amplituda sygnału zależy od obrotów** – przy rozruchu sygnał jest słaby, co czasem utrudnia start
- **Niska awaryjność** – brak elementów elektronicznych oznacza, że psuje się głównie mechanicznie (pęknięcie cewki, korozja)
- **Typowa rezystancja** – 600–1200 Ohm (w Ducato 2.3 JTD ok. 900 Ohm)

### Czujnik Halla (efekt Halla)

Nowszy typ, coraz powszechniejszy w busach od 2010 roku. Wykorzystuje efekt Halla – półprzewodnik umieszczony w polu magnetycznym generuje napięcie proporcjonalne do natężenia pola. Gdy ząb tarczy przechodzi obok, pole magnetyczne zmienia się i czujnik wysyła sygnał prostokątny.

Cechy czujnika Halla:

- **Złącze 3-pinowe** (zasilanie, masa, sygnał)
- **Wymaga zasilania 5V lub 12V** – nie działa bez prądu
- **Sygnał jest niezależny od obrotów** – równie silny przy rozruchu, jak przy 4000 obr/min
- **Bardziej precyzyjny**, ale droższy i bardziej podatny na uszkodzenia elektroniczne

{{% info title="Technika" icon="engineering" %}}
Czujnik CKP współpracuje z czujnikiem położenia wałka rozrządu (CMP). Sterownik porównuje sygnały z obu czujników, żeby określić, który cylinder jest w fazie pracy. Jeśli CKP odmówi współpracy, niektóre sterowniki (np. w Ducato 2.3 MultiJet) potrafią awaryjnie uruchomić silnik na podstawie samego sygnału CMP – ale z ograniczoną mocą i obrotami.
{{% /info %}}

## Objawy uszkodzenia czujnika CKP

Awaria czujnika położenia wału daje dość charakterystyczne objawy, choć mogą się nakładać na inne usterki. Poniżej lista od najczęstszego do najrzadszego:

1. **Nagłe gaśnięcie silnika** – silnik gaśnie bez ostrzeżenia, najczęściej na gorąco. Po ostygnięciu (5–20 minut) uruchamia się normalnie. To klasyczny objaw przerywanego kontaktu w czujniku indukcyjnym – rozgrzany metal rozszerza się i przerywa połączenie.

2. **Problemy z rozruchem** – silnik kręci rozrusznikiem, ale nie odpala lub odpala po wielu próbach. Szczególnie widoczne przy zimnym rozruchu, gdy sygnał indukcyjny jest najsłabszy.

3. **Szarpanie i nierówna praca** – silnik pracuje nierówno, traci moc na chwilę i ją odzyskuje. Sterownik chwilowo traci sygnał i przerywa wtrysk, a potem wznawia.

4. **Kontrolka [check engine](/serwis/check-engine/)** – zapalona z kodami P0335 (Crankshaft Position Sensor A Circuit Malfunction) lub P0336 (Crankshaft Position Sensor A Circuit Range/Performance).

5. **Tryb awaryjny (limp mode)** – silnik ogranicza obroty do ok. 3000–3500 obr/min. Sterownik przechodzi na awaryjny algorytm wtrysku z ograniczoną wydajnością.

6. **Tachometr na zerze podczas jazdy** – przy przerwanym sygnale CKP obrotomierz na desce rozdzielczej spada do zera, mimo że silnik jeszcze pracuje. To jednoznaczny sygnał, że czujnik traci kontakt.

![Czujnik położenia wału korbowego – objawy awarii w busie](/images/czujnik-polozenia-walu-hero.jpg)

## Diagnostyka – oscyloskop, multimetr, skaner

Diagnostyka czujnika CKP nie wymaga drogiego sprzętu – w większości przypadków wystarczy multimetr i skaner OBD2.

### Krok 1 – Odczyt kodów błędów

Podłącz skaner OBD2 i sprawdź kody DTC. Kody istotne dla czujnika CKP:

- **P0335** – brak sygnału z czujnika. Może oznaczać uszkodzony czujnik, przerwany przewód, uszkodzone koło zamachowe (brakujące zęby) lub – co ważne – zerwany pasek rozrządu.
- **P0336** – nieprawidłowy zakres sygnału. Czujnik działa, ale sygnał jest zakłócony – zanieczyszczenie opiłkami metalu, zbyt duży luz między czujnikiem a kołem, uszkodzone zęby koła.
- **P0337** – niski sygnał. Typowe dla czujnika indukcyjnego z pękającą cewką.
- **P0338** – wysoki sygnał. Zwarcie w obwodzie czujnika.

### Krok 2 – Pomiar rezystancji (czujnik indukcyjny)

Odłącz złącze czujnika i zmierz rezystancję multimetrem na zakresie 2 kOhm:

- **Wartość w normie** – 600–1200 Ohm (dokładna wartość w dokumentacji danego silnika)
- **Nieskończoność (OL)** – przerwana cewka, czujnik do wymiany
- **0 Ohm lub bliskie zera** – zwarcie, czujnik do wymiany
- **Wartość w normie, ale objawy występują** – sprawdź rezystancję na gorąco (po rozgrzaniu silnika) – pęknięcia ujawniają się pod wpływem temperatury

### Krok 3 – Oscyloskop (opcjonalnie)

Oscyloskop podłączony do wyjścia czujnika pokazuje przebieg sygnału w czasie rzeczywistym. Pozwala wykryć krótkotrwałe przerwy, które multimetr przeoczy. Prawidłowy przebieg czujnika indukcyjnego to sinusoida o rosnącej amplitudzie wraz z obrotami. Brakujące impulsy wskazują na uszkodzone zęby koła zamachowego.

## Wymiana – trudność i koszt w popularnych busach

Wymiana czujnika CKP to operacja, której trudność zależy wyłącznie od jego lokalizacji. Sam czujnik to jeden śrubowy uchwyt i złącze – 5 minut pracy. Problem w tym, że producenci montują go w miejscach, do których dojście wymaga podnośnika, demontażu osłon i zawodowej cierpliwości.

| Model busa | Lokalizacja czujnika | Trudność wymiany | Koszt części | Koszt robocizny | Suma |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Fiat Ducato 2.3 MultiJet | dół bloku, strona rozrządu, nad miską olejową | średnia | 80–200 zł | 150–300 zł | 230–500 zł |
| Fiat Ducato 3.0 MultiJet | dół bloku, strona skrzyni biegów | trudna | 100–250 zł | 200–400 zł | 300–650 zł |
| Mercedes Sprinter 2.2 CDI (OM651) | przód bloku, pod kolektor dolotowy | średnia | 120–300 zł | 150–300 zł | 270–600 zł |
| Ford Transit 2.0 EcoBlue | dół bloku, strona rozrządu | łatwa–średnia | 80–200 zł | 100–250 zł | 180–450 zł |
| Renault Master 2.3 dCi | dół bloku, strona rozrządu | średnia | 80–200 zł | 150–300 zł | 230–500 zł |
| Iveco Daily 3.0 | dół bloku, strona koła zamachowego | trudna | 100–250 zł | 250–400 zł | 350–650 zł |

Przy wymianie warto jednocześnie:

- Sprawdzić stan złącza elektrycznego – korozja na pinach to częsta przyczyna nawrotów problemu.
- Wyczyścić powierzchnię montażową z opiłków metalu, które przyciąga magnes czujnika indukcyjnego.
- Sprawdzić luz między czujnikiem a kołem zamachowym – powinien wynosić 0,5–1,5 mm.

{{% expert name="Kowalczyk" %}}W Fiacie Ducato 2.3 MultiJet czujnik CKP jest zamontowany w miejscu, do którego wygodny dostęp jest tylko od dołu. Konieczny jest podnośnik lub kanał. Częsty błąd mechaników – montaż czujnika bez nowej uszczelki O-ring, co powoduje wyciek oleju na czujnik i przedwczesną awarię. Uszczelka kosztuje 5 zł, a jej brak oznacza powrót do warsztatu za kilka miesięcy.{{% /expert %}}

## Gdzie jest czujnik w popularnych busach

Lokalizacja czujnika CKP różni się między modelami, ale w każdym przypadku jest zamontowany w pobliżu koła zamachowego lub tarczy sygnałowej na przednim końcu wału korbowego.

- **Fiat Ducato 2.3 MultiJet** – dół bloku silnika, po stronie rozrządu (przód silnika), tuż nad krawędzią miski olejowej. Czujnik indukcyjny, złącze 3-pinowe (z ekranem), rezystancja ok. 900 Ohm.
- **Mercedes Sprinter OM651** – przód bloku silnika, pod kolektorem dolotowym po stronie skrzyni biegów. Czujnik Halla, złącze 3-pinowe.
- **Ford Transit 2.0 EcoBlue** – dół bloku po stronie rozrządu, dostęp od dołu pojazdu. Czujnik Halla.
- **Renault Master 2.3 dCi** – dół bloku, strona rozrządu, w okolicy pompy wody. Czujnik indukcyjny.
- **Iveco Daily 3.0** – z tyłu bloku, od strony koła zamachowego. Najtrudniejszy dostęp spośród popularnych busów – wymaga demontażu osłony koła zamachowego.

Pamiętaj, że w każdym z tych silników oprócz czujnika CKP na wale korbowym zamontowany jest również czujnik CMP na wałku rozrządu. Oba muszą „widzieć się" poprawnie, żeby sterownik zsynchronizował wtrysk. Wymiana jednego przy objawach wskazujących na oba (kody P0335 + P0340 jednocześnie) może nie rozwiązać problemu.

Jeśli diagnostyka wykazała sprawny czujnik CKP, a objawy przypominają awarię [immobilizera](/serwis/immobilizer/) (rozrusznik kręci, silnik nie odpala), sprawdź, czy sterownik nie blokuje wtrysku z innego powodu. W busach z dużym przebiegiem problemy z komunikacją CAN-bus potrafią imitować awarię czujnika wału. Kontrolka [check engine](/serwis/check-engine/) z kodem P0335 w [Fiacie Ducato](/modele/fiat-ducato/) lub [Mercedesie Sprinterze](/modele/mercedes-sprinter/) wymaga zawsze sprawdzenia zarówno czujnika, jak i stanu koła zamachowego.

*Źródła: dokumentacja techniczna Fiat Professional, motofocus.pl, [Wikipedia – Crankshaft position sensor](https://en.wikipedia.org/wiki/Crankshaft_position_sensor), ucando.pl, incar.pl*
