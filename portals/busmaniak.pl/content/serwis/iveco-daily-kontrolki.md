---
title: "Kontrolki Iveco Daily – znaczenie symboli i diagnostyka"
date: 2026-03-28
lastmod: 2026-08-30
description: "Kontrolki na desce rozdzielczej Iveco Daily V i VI – lista symboli, specyficzne wskaźniki (retarder, pneumatyka, ESP), najczęstsze problemy i reset serwisowy."
draft: false
author: "marek-kowalczyk"
h1: "Kontrolki Iveco Daily – co oznaczają i jak reagować"
parent_model: "iveco-daily"
type: "post"
volume: 500
main_keyword: "iveco daily kontrolki"
image: "/images/iveco-daily-kontrolki-hero.webp"
image_alt: "Zestaw wskaźników TFT na desce rozdzielczej Iveco Daily VI"
lead: "Iveco Daily ma więcej kontrolek niż większość busów dostawczych – wynika to z obecności układów typowych dla ciężarówek: retardera, zawieszenia pneumatycznego i zaawansowanych systemów hamulcowych. Poniżej znajdziesz kompletną listę wskaźników dla generacji V (2006–2014) i VI (2014+), najczęstsze przyczyny ich zapalenia oraz instrukcję resetu."
faq:
  - question: "Co oznacza migająca kontrolka DPF w Iveco Daily?"
    answer: "Miganie oznacza, że filtr cząstek stałych jest zapchany i wymaga natychmiastowej regeneracji. W Daily VI można włączyć regenerację postojową, przytrzymując przez ok. 5 sekund przycisk z ikoną DPF po lewej stronie kierownicy. Wymagane są rozgrzany silnik, bieg jałowy i zaciągnięty hamulec ręczny. Alternatywnie należy wyjechać w trasę i utrzymywać obroty powyżej 2000 obr./min przez 20–30 minut. Jeśli kontrolka nie zgaśnie – konieczna jest wizyta w serwisie."
  - question: "Dlaczego kontrolka AdBlue świeci się po uzupełnieniu płynu?"
    answer: "Czujnik poziomu w zbiorniku AdBlue bywa zawodny – zwłaszcza w Daily z lat 2016–2018. Może wymagać resetu testerem diagnostycznym. W skrajnych przypadkach trzeba wymienić cały moduł dozujący (1500–3000 zł)."
  - question: "Jak zresetować kontrolkę serwisową w Daily VI?"
    answer: "Procedura jest złożona. W niektórych wersjach kasowanie interwału serwisowego (klucz) jest możliwe przez sekwencję: wciśnij do oporu pedał gazu, włącz zapłon, wciśnij 10 razy pedał hamulca i wyłącz zapłon. Kasowanie inspekcji degradacji oleju (czerwona, migająca oliwiarka) zawsze jednak wymaga komputera diagnostycznego."
  - question: "Co oznacza kontrolka retardera w Iveco Daily?"
    answer: "Żółta ikona oznacza awarię opcjonalnego retardera elektromagnetycznego (Telma), montowanego na wale napędowym. Pojazd nadaje się do jazdy, ale dodatkowa siła hamowania jest niedostępna. Stanowi to zagrożenie podczas jazdy z ładunkiem w terenie górzystym."
sources:
  - "Instrukcja obsługi Iveco Daily (lampki kontrolne TFT) – tirmet.pl"
---

## Kontrolki Daily V (2006–2014)

Piąta generacja Daily ma klasyczny, analogowy zestaw wskaźników z centralnym wyświetlaczem jednokolorowym. Kontrolki podzielono na trzy grupy kolorystyczne.

### Kontrolki czerwone – natychmiastowy postój

| Symbol | Nazwa | Przyczyna | Reakcja |
| :--- | :--- | :--- | :--- |
| Oliwiarka | Ciśnienie oleju | Brak oleju, awaria pompy olejowej | Natychmiast zgaś silnik |
| Termometr | Temperatura silnika | Przegrzanie – uszkodzony termostat, brak płynu | Zatrzymaj się, odczekaj 15 minut |
| Akumulator | Ładowanie | Pasek wielorowkowy, alternator | Wyłącz zbędne odbiorniki, jedź do warsztatu |
| STOP | Hamulec awaryjny | Krytycznie niski poziom płynu hamulcowego | Nie jedź dalej, wezwij pomoc |
| Airbag | Poduszki powietrzne | Usterka systemu SRS, błąd czujnika | Diagnostyka – system może nie zadziałać |
| Ikona wtryskiwacza/EDC | Błąd sterowania silnikiem | Awaria regulatora ciśnienia paliwa, zaworu EGR lub wtryskiwacza | Silnik przejdzie w tryb awaryjny (ograniczenie mocy). Konieczna diagnostyka. |

### Kontrolki żółte – jedź do serwisu

- **Check engine** – w Daily V z silnikiem F1C (3.0 HPI) najczęstszą przyczyną jest zawór EGR lub czujnik ciśnienia w kolektorze ssącym. Szczegóły w artykule o [check engine](/serwis/check-engine/)
- **Świece żarowe (spirala)** – migająca po uruchomieniu = uszkodzona świeca lub moduł sterujący
- **DPF** – światło ciągłe = trwa regeneracja (nie gaś silnika). Migające = zapchany filtr
- **Klucz / wrench** – zbliża się przegląd serwisowy, to nie awaria
- **ABS** – awaria czujnika prędkości obrotowej koła lub modułu ABS

{{% info title="Silnik F1C" icon="engineering" %}}
Silnik 3.0 HPI w Daily V to konstrukcja sprawdzona, lecz wrażliwa na jakość oleju i filtrów. Kontrolka check engine w połączeniu ze spadkiem mocy zwykle wskazuje na zapchany DPF albo niesprawną turbosprężarkę o zmiennej geometrii. Diagnostyka komputerowa ujawnia kody P0299 (niska wydajność turbo) lub P2463 (DPF – nadmierne nagromadzenie sadzy).
{{% /info %}}

## Kontrolki Daily VI (2014+)

Szósta generacja Daily wprowadziła wyświetlacz TFT (w wyższych wersjach wyposażenia) z kolorowymi ikonami i komunikatami tekstowymi. Zestaw kontrolek jest znacznie bardziej rozbudowany.

### Nowe wskaźniki nieobecne w Daily V

- **AdBlue** – pomarańczowy dystrybutor z kroplą. Silniki Euro 6 wymagają regularnego uzupełniania [płynu AdBlue](/serwis/adblue/). Przy niskim poziomie pojawia się odliczanie kilometrów do ograniczenia mocy.
- **SCR (Selective Catalytic Reduction)** – awaria układu oczyszczania spalin. Często powiązana z jakością płynu AdBlue lub czujnikiem NOx.
- **Asystent pasa ruchu (LDWS)** – żółte faliste linie oznaczają włączenie systemu ostrzegającego o niezamierzonej zmianie pasa.
- **Ostrzeżenie o kolizji (AEBS)** – czerwony samochód z wykrzyknikiem. Układ autonomicznego hamowania awaryjnego.

### Tabela kontrolek Daily VI – wyświetlacz TFT

Częstym problemem jest żółta kontrolka immobilizera (kluczyk z kłódką), która może poprzedzać unieruchomienie pojazdu. Przyczyną bywa zwykle błąd odczytu kluczyka, nierzadko wywołany spadkiem napięcia w instalacji przy słabym akumulatorze.

| Kolor | Symbol | Znaczenie |
| :--- | :--- | :--- |
| Czerwony | STOP + termometr | Krytyczne przegrzanie silnika |
| Czerwony | STOP + oliwiarka | Krytycznie niskie ciśnienie lub degradacja oleju |
| Czerwony | Trójkąt + tekst | Awaria krytyczna – komunikat na wyświetlaczu |
| Czerwony | Ikona wtryskiwacza/EDC | Poważny błąd sterowania wtryskiem – tryb awaryjny |
| Żółty | Silnik (check) | Usterka układu napędowego |
| Żółty | DPF | Filtr cząstek stałych wymaga uwagi |
| Żółty | AdBlue | Niski poziom płynu / awaria układu SCR |
| Żółty | Kluczyk z kłódką | Awaria immobilizera (IMMO) |
| Żółty | ESP | Wyłączony lub niesprawny układ stabilizacji |
| Zielony | Tempomat | Tempomat włączony |
| Niebieski | Światła drogowe | Włączone światła drogowe |

{{% expert name="Marek Kowalczyk" %}}W Daily VI z lat 2016–2018 widuję plagę awarii modułu SCR – kontrolka AdBlue zapala się mimo pełnego zbiornika, a komputer odlicza kilometry do ograniczenia mocy. Przyczyna to najczęściej czujnik NOx (ok. 2000 zł) lub moduł dozujący AdBlue (1500–3000 zł). Zanim wymienisz moduł, sprawdź, czy problem nie leży w jakości płynu – tani AdBlue z nieznanych źródeł krystalizuje się i blokuje wtryskiwacz.{{% /expert %}}

![Kontrolki Iveco Daily – znaczenie symboli na desce rozdzielczej](/images/iveco-daily-kontrolki-hero.webp)

## Specyficzne kontrolki Daily – retarder, pneumatyka, ESP

[Iveco Daily](/modele/iveco-daily/) to jedyny bus dostawczy z układami typowymi dla ciężarówek. Tych kontrolek nie ma w Ducato, Sprinterze ani Transicie.

### Retarder elektromagnetyczny

- **Zielona ikona wiatraczka** – retarder aktywny, trwa hamowanie wspomagające.
- **Żółta ikona wiatraczka** – awaria retardera Telma. Pojazd nadaje się do jazdy, lecz brakuje dodatkowego hamowania na zjazdach.
- **Przyczyna awarii** – najczęściej czujnik temperatury oleju w mechanizmie lub usterka sterownika.

### Zawieszenie pneumatyczne

- **Zielona ikona sprężyny** – zawieszenie pracuje prawidłowo, trwa regulacja wysokości.
- **Żółta ikona sprężyny** – awaria jednego z elementów: kompresora, elektrozaworu, czujnika wysokości lub nieszczelność poduszki.
- **Diagnoza** – nasłuchuj pracy kompresora. Jeśli pracuje bez przerwy dłużej niż 2 minuty, prawdopodobnie masz nieszczelność.

### ESP/EBD (układ stabilizacji toru jazdy)

- **Żółta ikona ESP** – usterka lub wyłączenie układu stabilizacji. Daily VI ma hydrauliczny układ hamulcowy (wspomagany podciśnieniowo) z systemem ESP 9. generacji, integrującym EBD (elektroniczny rozdział siły hamowania). Nie jest to pneumatyczny system EBS znany z ciężarówek.
- **Przyczyna** – najczęściej uszkodzenie czujnika prędkości obrotowej koła.

{{% info title="Bezpieczeństwo" icon="engineering" %}}
Przy zapalonej kontrolce ESP unikaj holowania przyczepy i jazdy z pełnym obciążeniem. Układ nie koryguje już rozdziału hamowania między osiami i nie stabilizuje toru jazdy. Może to prowadzić do utraty panowania nad pojazdem.
{{% /info %}}

## Najczęstsze problemy – DPF, AdBlue, zawieszenie

Na podstawie danych serwisowych trzy układy generują najwięcej wizyt w warsztacie:

| Problem | Generacja | Objaw | Koszt naprawy |
| :--- | :--- | :--- | :--- |
| Zapchany DPF | V, VI | Kontrolka DPF + utrata mocy | 500–3000 zł |
| Awaria AdBlue/SCR | VI | Odliczanie km do ograniczenia | 1500–4000 zł |
| Nieszczelność pneumatyki | V, VI | Auto „siada” po postoju | 800–2500 zł |
| Awaria ESP/ABS | VI | Żółta kontrolka + brak ABS | 500–2000 zł |
| Check engine + tryb awaryjny | V, VI | Ograniczenie do 80 km/h | 300–2000 zł |

Podane kwoty dotyczą naprawy z użyciem zamienników. Czujniki prędkości kół, elementy pneumatyki i osprzęt elektryczny do Daily mają w katalogach FEBI i MEYLE, a także <a href="https://fastoriginal.eu/" target="_blank" rel="noopener">FAST</a>, marka specjalizująca się w segmencie aut dostawczych, dystrybuowana w Polsce przez VanKing, z ofertą liczącą ponad 12 tys. kodów produktowych.

## Reset kontrolek serwisowych

W Iveco Daily należy rozróżnić kasowanie interwału serwisowego (komunikat „Service”) od kasowania inspekcji zużycia oleju (komunikat „Oil degradation”).

### Daily V (2006–2014)
Kasowanie inspekcji serwisowej i olejowej w tej generacji wymaga podłączenia testera diagnostycznego (np. Iveco E.A.SY., Texa, Delphi). Nie da się tego wykonać ręcznie z poziomu zegarów.

### Daily VI (2014+)
Układ w Daily VI rozróżnia interwał przeglądów (tzw. Service) od degradacji oleju. Migająca czerwona kontrolka oliwiarki oznacza zużycie oleju wyliczone przez sterownik silnika. Zignorowanie jej przez ok. 1000 km wprowadzi pojazd w tryb awaryjny (do 80 km/h).

Kasowanie obu inspekcji wymaga użycia komputera diagnostycznego. Reset interwału serwisowego wykonuje się w module Body Computer, a kasowanie degradacji oleju – w sterowniku silnika (ECU). Ręczne procedury (np. sekwencja pedałów) mogą kasować jedynie licznik „Service” i nie wpływają na degradację oleju.

Ogólne informacje o kontrolkach w dostawczakach znajdziesz w artykule [kontrolki w busie](/serwis/kontrolki-w-busie/).

- Kody błędów Iveco: motocezar.pl
- Kontrolka (Wikipedia): https://pl.wikipedia.org/wiki/Kontrolka