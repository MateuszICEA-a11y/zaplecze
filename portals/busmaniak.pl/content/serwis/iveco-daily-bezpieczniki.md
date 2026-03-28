---
title: "Bezpieczniki Iveco Daily – schemat, lokalizacja, wymiana"
date: 2026-03-28
description: "Schemat bezpieczników Iveco Daily V i VI – lokalizacja skrzynek (deska, komora silnika, akumulator), tabele amperaży i instrukcja wymiany."
draft: false
author: "marek-kowalczyk"
h1: "Bezpieczniki Iveco Daily – kompletny schemat i lokalizacja"
parent_model: "iveco-daily"
type: "post"
volume: 500
main_keyword: "iveco daily bezpieczniki"
image: "/images/iveco-daily-bezpieczniki-hero.jpg"
image_alt: "Skrzynka bezpieczników w komorze silnika Iveco Daily"
lead: "Iveco Daily ma rozbudowaną instalację elektryczną z trzema skrzynkami bezpieczników – pod deską rozdzielczą, w komorze silnika i przy akumulatorze. Ta ostatnia lokalizacja odróżnia Daily od większości busów dostawczych i bywa zaskoczeniem nawet dla mechaników przyzwyczajonych do Ducato czy Sprintera. Poniżej znajdziesz schematy dla generacji V i VI."
faq:
  - question: "Gdzie jest bezpiecznik od zapalniczki w Iveco Daily?"
    answer: "W Daily V bezpiecznik gniazda 12V to F18 (15A) w skrzynce pod deską rozdzielczą. W Daily VI lokalizacja jest podobna, ale numer zmienił się na F22. Sprawdź schemat na pokrywie skrzynki."
  - question: "Ile bezpieczników ma Iveco Daily VI?"
    answer: "Daily VI ma ponad 80 bezpieczników rozłożonych między trzy skrzynki. Skrzynka pod deską zawiera ok. 40 mini i standard, komora silnika ok. 25 maxi, a skrzynka przy akumulatorze ok. 15 bezpieczników wysokoprądowych."
  - question: "Czy mogę użyć bezpiecznika o wyższym amperażu?"
    answer: "Nie – grozi to pożarem instalacji elektrycznej. Bezpiecznik chroni wiązkę przewodów, nie odbiornik. Wyższy amperaż oznacza, że przewody mogą się przegrzać zanim bezpiecznik zadziała."
  - question: "Dlaczego Daily nie odpala po wymianie bezpiecznika?"
    answer: "Prawdopodobnie wymieniłeś bezpiecznik, ale nie usunąłeś przyczyny zwarcia. Sterownik silnika (ECU) mógł przejść w tryb awaryjny. Odłącz akumulator na 10 minut, podłącz ponownie i spróbuj uruchomić."
---

## Lokalizacja skrzynek bezpieczników

[Iveco Daily](/modele/iveco-daily/) ma trzy odrębne skrzynki bezpieczników. Każda chroni inne systemy – warto wiedzieć, gdzie szukać, zanim zaczniesz losowo sprawdzać.

1. **Pod deską rozdzielczą (strona kierowcy)** – główna skrzynka z bezpiecznikami mini i standard (5–30A). Obsługuje systemy komfortu, oświetlenie wnętrza, zegary, radio i gniazda 12V. Dostęp po odkręceniu dwóch śrub osłony dolnej
2. **Komora silnika (prawa strona)** – bezpieczniki maxi i midi (25–60A) chroniące obwody wysokoprądowe: wentylator, klimatyzacja, ABS/EBS, świece żarowe. Pokrywa na zatrzaskach
3. **Przy akumulatorze (pod fotelem pasażera lub w skrytce)** – bezpieczniki główne: rozrusznik, alternator, zasilanie BSI. W Daily V akumulator jest pod fotelem kierowcy, w Daily VI – pod fotelem pasażera lub w schowku bocznym

{{% info title="Lokalizacja" icon="engineering" %}}
W Daily VI z zawieszeniem pneumatycznym skrzynka przy akumulatorze zawiera też bezpiecznik kompresora pneumatyki (40A). Jeśli zawieszenie "siada" po postoju, a kompresor nie pracuje – sprawdź ten bezpiecznik jako pierwszy.
{{% /info %}}

## Schemat bezpieczników Daily V (2006–2014)

### Skrzynka pod deską rozdzielczą

| Nr | Funkcja | Amperaż |
| :--- | :--- | :--- |
| F01 | Światła pozycyjne (lewe) | 5A |
| F02 | Światła pozycyjne (prawe) | 5A |
| F03 | Światła mijania (lewe) | 10A |
| F04 | Światła mijania (prawe) | 10A |
| F07 | Światła drogowe | 15A |
| F09 | Radio, system audio | 15A |
| F11 | Tablica przyrządów (zegary) | 7,5A |
| F14 | Centralny zamek | 15A |
| F16 | Wycieraczki przednie | 25A |
| F18 | Gniazdo 12V / zapalniczka | 15A |
| F20 | Elektrycznie sterowane szyby (kierowca) | 20A |
| F21 | Elektrycznie sterowane szyby (pasażer) | 20A |
| F24 | Światła cofania | 10A |
| F26 | Oświetlenie wnętrza | 7,5A |
| F28 | Tachograf (jeśli zainstalowany) | 10A |
| F30 | Sterownik klimatyzacji | 10A |
| F33 | Ogrzewanie postojowe (opcja) | 20A |

### Skrzynka w komorze silnika

| Nr | Funkcja | Amperaż |
| :--- | :--- | :--- |
| MF01 | Wentylator chłodnicy | 40A |
| MF02 | Sterownik silnika (ECU) | 30A |
| MF03 | Pompa paliwa | 20A |
| MF04 | Świece żarowe | 60A |
| MF06 | Moduł ABS | 30A |
| MF07 | Sprężarka klimatyzacji | 25A |
| MF09 | Wspomaganie kierownicy | 40A |
| MF11 | Moduł AdBlue (Daily V Euro 5+) | 15A |
| MF13 | System EBS (jeśli występuje) | 30A |

### Skrzynka przy akumulatorze

| Nr | Funkcja | Amperaż |
| :--- | :--- | :--- |
| BF01 | Rozrusznik | 80A |
| BF02 | Alternator (zasilanie główne) | 60A |
| BF03 | Zasilanie BSI (moduł centralny) | 50A |
| BF04 | Ogrzewanie przedniej szyby (opcja) | 40A |
| BF05 | Zasilanie skrzynki w komorze silnika | 60A |

{{% expert name="Kowalczyk" %}}W Daily V z silnikiem F1C (3.0 HPI) bezpiecznik MF04 od świec żarowych to 60A – jeden z największych w całej instalacji. Jeśli się przepali, sprawdź rezystancję każdej świecy osobno. Uszkodzona świeca ma rezystancję poniżej 0,5 ohma – to zwarcie, które przepala bezpiecznik. Wymiana jednej świecy kosztuje ok. 80 zł, bezpiecznik 60A – ok. 15 zł. Nie wymieniaj bezpiecznika bez sprawdzenia świec.{{% /expert %}}

## Schemat bezpieczników Daily VI (2014+)

Szósta generacja rozbudowała instalację o systemy bezpieczeństwa (AEBS, LDWS) i AdBlue Euro 6. Skrzynki pozostały w tych samych lokalizacjach, ale przybyło gniazd.

### Kluczowe zmiany względem Daily V

- **Bezpiecznik AdBlue** – przeniesiony do skrzynki pod deską (z komory silnika), wyższy amperaż (20A zamiast 15A)
- **AEBS (autonomiczne hamowanie)** – osobny bezpiecznik 10A pod deską
- **LDWS (asystent pasa)** – kamera przednia, bezpiecznik 5A pod deską
- **Wyświetlacz TFT** – osobny obwód 10A (w Daily V dzielił gniazdo z zegarami)
- **Ogrzewanie AdBlue** – nowy bezpiecznik 15A w komorze silnika (zapobiega krystalizacji płynu zimą)

![Bezpieczniki Iveco Daily – schemat i lokalizacja](/images/iveco-daily-bezpieczniki-hero.jpg)

### Skrzynka pod deską – Daily VI (wybrane pozycje)

| Nr | Funkcja | Amperaż |
| :--- | :--- | :--- |
| F01–F04 | Oświetlenie zewnętrzne | 5–15A |
| F10 | Radio / system multimedialny | 15A |
| F12 | Tablica przyrządów TFT | 10A |
| F15 | Centralny zamek | 15A |
| F18 | Wycieraczki | 25A |
| F22 | Gniazdo 12V / zapalniczka | 15A |
| F25 | Gniazdo USB | 5A |
| F28 | Tachograf cyfrowy | 10A |
| F31 | System AEBS | 10A |
| F32 | Kamera LDWS | 5A |
| F35 | Moduł AdBlue | 20A |
| F38 | Ogrzewanie postojowe Webasto | 20A |

## Najczęstsze awarie elektryczne w Daily

Instalacja elektryczna Daily jest rozbudowana – proporcjonalnie do tego rośnie liczba potencjalnych problemów:

- **Korozja złączy przy akumulatorze** – Daily V z akumulatorem pod fotelem jest narażone na wilgoć z podłogi. Oksydacja na zaciskach powoduje trudności z rozruchem i losowe zapalanie kontrolek
- **Awaria modułu BSI** – centralny komputer sterujący. Objawy: brak reakcji na kluczyk, losowe wyłączanie obwodów, "martwe" zegary. Naprawa = wymiana + programowanie (2 000–5 000 zł)
- **Bezpiecznik tachografu (F28)** – przepala się przy podłączeniu nieoryginalnego GPS-a lub rejestratora jazdy do gniazda tachografu
- **Przepalanie MF04 (świece żarowe)** – regularne w silnikach F1C z przebiegiem powyżej 200 tys. km

{{% info title="Profilaktyka" icon="engineering" %}}
W Daily V raz w roku oczyść zaciski akumulatora i posmaruj je wazeliną techniczną. Korozja na zaciskach to przyczyna ponad 30% problemów elektrycznych zgłaszanych na forach mechaników Iveco.
{{% /info %}}

## Wymiana bezpiecznika – instrukcja

1. Wyłącz zapłon i odłącz wszystkie odbiorniki (radio, nawigacja, ładowarki)
2. Zlokalizuj odpowiednią skrzynkę – sprawdź schemat na pokrywie
3. Zdejmij pokrywę: pod deską odkręć śruby, w komorze podważ zatrzaski
4. Wyciągnij bezpiecznik plastikowym chwytakiem (wewnątrz pokrywy). Kolory: czerwony = 10A, niebieski = 15A, żółty = 20A, zielony = 30A
5. Sprawdź drucik – przerwany lub poczerniały = spalony
6. Wstaw nowy o identycznym amperażu
7. Włącz zapłon i sprawdź obwód. Natychmiastowe przepalenie = zwarcie w obwodzie

Ogólne informacje o bezpiecznikach w dostawczakach znajdziesz w artykule [bezpieczniki w busach](/serwis/bezpieczniki-busy/). Porównanie z platformą Sevel (Ducato/Boxer/Jumper) opisujemy w materiale o [bezpiecznikach Fiata Ducato](/serwis/bezpieczniki-fiat-ducato/). Problemy z elektroniką mogą też zapalić [kontrolkę check engine](/serwis/check-engine/).

Źródła:
- Instrukcja obsługi Iveco Daily (lampki kontrolne, schemat): tirmet.pl
- Schematy bezpieczników Daily: autobezpieczniki.pl, selected.pl
- Bezpiecznik (Wikipedia): https://pl.wikipedia.org/wiki/Bezpiecznik
