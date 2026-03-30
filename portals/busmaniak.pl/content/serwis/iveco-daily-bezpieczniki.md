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
lead: "Iveco Daily dysponuje rozbudowaną instalacją elektryczną, która opiera się na trzech głównych skrzynkach bezpieczników: pod deską rozdzielczą, w komorze silnika oraz bezpośrednio przy akumulatorze. Prawidłowa identyfikacja modułów jest kluczowa dla skutecznej diagnostyki. Poniżej prezentujemy schematy i lokalizacje dla generacji V i VI."
faq:
  - question: "Gdzie jest bezpiecznik od zapalniczki w Iveco Daily?"
    answer: "Bezpiecznik gniazda zapalniczki 12V zawsze znajduje się w skrzynce pod deską rozdzielczą. W Iveco Daily VI jest to bezpiecznik F44 o wartości 20A. W starszych generacjach oznaczenie może być inne – należy zawsze zweryfikować je ze schematem na osłonie skrzynki."
  - question: "Ile bezpieczników ma Iveco Daily VI?"
    answer: "Daily VI ma ponad 80 bezpieczników rozłożonych między trzy skrzynki. Skrzynka pod deską zawiera ok. 40 mini i standard, komora silnika ok. 25 maxi, a skrzynka przy akumulatorze ok. 15 bezpieczników wysokoprądowych."
  - question: "Czy mogę użyć bezpiecznika o wyższym amperażu?"
    answer: "Nie – grozi to pożarem instalacji elektrycznej. Bezpiecznik chroni wiązkę przewodów, nie odbiornik. Wyższy amperaż oznacza, że przewody mogą się przegrzać, zanim bezpiecznik zadziała."
  - question: "Dlaczego Daily nie odpala po wymianie bezpiecznika?"
    answer: "Prawdopodobnie wymieniłeś bezpiecznik, ale nie usunąłeś przyczyny zwarcia. Sterownik silnika (ECU) mógł przejść w tryb awaryjny. Odłącz akumulator na 10 minut, podłącz ponownie i spróbuj uruchomić."
---
## Lokalizacja skrzynek bezpieczników

Iveco Daily rozdziela swoje obwody elektryczne na trzy główne lokalizacje. Ich znajomość jest podstawą każdej diagnostyki problemów z zasilaniem.

1.  **Pod deską rozdzielczą (strona kierowcy)** – główna skrzynka z bezpiecznikami mini i standard (5–30A). Obsługuje systemy komfortu, oświetlenie wnętrza, zegary, radio i gniazda 12V. Dostęp wymaga odkręcenia dwóch śrub osłony w dolnej części deski.
2.  **Komora silnika (lewa strona, po stronie kierowcy)** – bezpieczniki maxi i midi (25–60A) chroniące obwody wysokoprądowe: wentylator, klimatyzacja, ABS/EBS, świece żarowe. Pokrywa jest mocowana na zatrzaskach.
3.  **Przy klemie akumulatora** – moduł z bezpiecznikami głównymi (wysokoprądowymi), które zabezpieczają rozrusznik, alternator i zasilanie modułu BCM. Lokalizacja akumulatora, a tym samym tej skrzynki, zależy od generacji: w Daily V standardowo znajduje się on w komorze silnika (po lewej stronie), natomiast w Daily VI przeniesiono go pod podłogę po stronie pasażera.

Dla firm karoseryjnych i osób adaptujących Daily na kampery kluczowy jest moduł rozszerzeń CVI (Expansion Module). Znajduje się on najczęściej przy prawym słupku A (po stronie pasażera) i udostępnia m.in. sygnał D+, niezbędny do podłączenia separatora akumulatorów (np. typu Cyrix) w zabudowie kempingowej. Zapewnia także zasilanie dla osprzętu takiego jak windy załadowcze.

{{% info title="Włoskie oznaczenia skrzynek" icon="engineering" %}}
Na schematach Iveco znajdziesz fabryczne skróty modułów: **CPL** (Centralina Plancia) to skrzynka pod deską rozdzielczą, **CVM** (Centralina Vano Motore) to moduł w komorze silnika, a **CBA** (Centralina Batteria) to skrzynka przy akumulatorze.
{{% /info %}}

## Schemat bezpieczników Daily V (2006–2014)

Generacja V, produkowana w latach 2006–2014, posiadała już rozbudowaną elektronikę. Poniżej znajdują się tabele z przyporządkowaniem kluczowych bezpieczników.

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

{{% expert name="Kowalczyk" %}}
W silniku 3.0 F1C (HPI/HPT) bezpiecznik świec żarowych MF04 (60A) jest jednym z kluczowych. Jego przepalenie niemal zawsze sygnalizuje zwarcie na jednej ze świec. Koszt samej części to ok. 80 zł, jednak silnik ten słynie z zapiekania się i urywania świec. Standardowa wymiana to koszt 200–500 zł, ale w przypadku jej urwania, operacja wyjęcia resztek może kosztować od 1000 do nawet 3000 zł. Nigdy nie wymieniaj tego bezpiecznika bez diagnostyki świec.
{{% /expert %}}

## Schemat bezpieczników Daily VI (2014+)

Wraz z debiutem szóstej generacji Daily w 2014 roku, instalacja elektryczna została gruntownie zmodernizowana. Dodano obwody dla nowych systemów bezpieczeństwa i normy Euro 6.

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
| F25 | Gniazdo USB | 5A |
| F28 | Tachograf cyfrowy | 10A |
| F31 | System AEBS | 10A |
| F32 | Kamera LDWS | 5A |
| F35 | Moduł AdBlue | 20A |
| F36 | Złącze diagnostyczne EOBD | 10A |
| F38 | Ogrzewanie postojowe Webasto | 20A |
| F44 | Gniazdo 12V (zapalniczka) | 20A |

## Najczęstsze awarie elektryczne w Daily

Mimo że instalacja elektryczna Daily jest stosunkowo solidna, kilka problemów powtarza się w wielu egzemplarzach. Najczęściej dotyczą one korozji i zużycia osprzętu.

-   **Korozja styków akumulatora** – wilgoć i zabrudzenia na klemach mogą powodować problemy z rozruchem, wahania napięcia i losowe błędy na desce rozdzielczej.
-   **Awaria modułu BCM (Body Computer)** – centralny komputer sterujący. Objawy to brak reakcji na kluczyk, niedziałające obwody (np. oświetlenie, szyby) czy "martwe" zegary. Naprawa wiąże się z wymianą i programowaniem (2000–5000 zł).
-   **Brak komunikacji ze złączem diagnostycznym** – jeśli skaner diagnostyczny nie może połączyć się z autem, przyczyną jest często przepalony bezpiecznik F36 (10A) w skrzynce pod deską, który zasila gniazdo EOBD.
-   **Bezpiecznik tachografu (F28)** – zdarza się, że przepala się przy podłączaniu nieoryginalnych urządzeń do instalacji pojazdu w sposób niezgodny ze sztuką.
-   **Przepalanie MF04 (świece żarowe)** – regularny problem w silnikach F1C z przebiegami powyżej 200 tys. km, niemal zawsze wskazujący na awarię świecy.

{{% info title="Profilaktyka" icon="engineering" %}}
Raz w roku oczyść zaciski akumulatora i połączenia masowe, a następnie zabezpiecz je smarem dielektrycznym lub wazeliną techniczną. Taka prosta czynność eliminuje ponad 30% potencjalnych problemów z elektryką w Daily.
{{% /info %}}

## Wymiana bezpiecznika – instrukcja

Wymiana przepalonego bezpiecznika jest prostą czynnością, ale wymaga precyzji i zachowania podstawowych zasad bezpieczeństwa. Poniżej instrukcja krok po kroku.

1.  Wyłącz zapłon i odłącz wszystkie odbiorniki prądu (radio, nawigacja, ładowarki).
2.  Zlokalizuj właściwą skrzynkę, posiłkując się schematem umieszczonym na jej pokrywie.
3.  Zdejmij pokrywę: pod deską odkręć śruby mocujące, w komorze silnika podważ plastikowe zatrzaski.
4.  Wyciągnij podejrzany bezpiecznik za pomocą plastikowego chwytaka, który zwykle znajduje się wewnątrz pokrywy. Kolory odpowiadają amperażowi: czerwony = 10A, niebieski = 15A, żółty = 20A, zielony = 30A.
5.  Obejrzyj [bezpiecznik](https://pl.wikipedia.org/wiki/Bezpiecznik) pod światło. Przerwany lub osmolony drucik wewnątrz oznacza, że element jest spalony.
6.  Wstaw nowy bezpiecznik o identycznym amperażu. Nigdy nie używaj bezpiecznika o wyższej wartości.
7.  Włącz zapłon i sprawdź, czy chroniony obwód działa. Jeśli nowy bezpiecznik przepali się natychmiast – w instalacji występuje zwarcie, które wymaga diagnostyki w warsztacie.

Źródła:
- Instrukcja obsługi Iveco Daily (lampki kontrolne, schemat): tirmet.pl
- Schematy bezpieczników Daily: autobezpieczniki.pl, selected.pl
- Bezpiecznik (Wikipedia): https://pl.wikipedia.org/wiki/Bezpiecznik