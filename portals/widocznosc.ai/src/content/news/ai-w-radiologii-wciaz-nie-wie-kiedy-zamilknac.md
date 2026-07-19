---
title: AI w radiologii wciąż nie wie, kiedy zamilknąć
lead: Nowy benchmark RadLE 2.0 sprawdza nie tylko trafność modeli analizujących zdjęcia RTG, ale też ich zdolność do wycofania się z odpowiedzi. Wynik jest niepokojący – wiele systemów myli się, a mimo to odpowiada z pełnym przekonaniem.
date: '2026-07-19'
sourceName: The Decoder
sourceUrl: https://the-decoder.com/ai-chatbots-reading-x-rays-can-be-dangerously-confident-even-when-theyre-wrong/
tags:
- AI w medycynie
- radiologia
- benchmarki
- LLM
author: Redakcja widocznosc.ai
image: ../../assets/images/news-2026-07-19-ai-w-radiologii-wciaz-nie-wie-kiedy-zamilknac.webp
---

## RadLE 2.0 pokazuje kluczowy problem – błędna diagnoza bez cienia wahania

The Decoder opisuje benchmark RadLE 2.0, który sprawdza modele AI używane w radiologii pod kątem bardzo konkretnej kompetencji – czy potrafią rozpoznać moment, w którym nie powinny samodzielnie stawiać diagnozy i muszą zostawić decyzję człowiekowi. To istotna różnica względem wielu typowych testów, które mierzą głównie poprawność odpowiedzi. Tutaj równie ważne jest to, czy model umie powiedzieć: „nie wiem” albo „to wymaga oceny radiologa”.

Wyniki wypadają słabo dla wielu badanych systemów. Z opisu wynika, że część modeli generuje nieprawidłowe wnioski z pełną pewnością siebie, zamiast sygnalizować niepewność lub odmówić jednoznacznej interpretacji. To szczególnie niebezpieczne w zastosowaniach medycznych, gdzie nie chodzi tylko o samą odpowiedź, ale o jakość decyzji w warunkach ryzyka.

Benchmark pokazuje też, że ludzcy radiolodzy nadal wyraźnie wyprzedzają modele. Najważniejszy wniosek z badania jest prosty – zanim AI będzie mogła działać samodzielnie w diagnostyce, musi nauczyć się nie tylko rozpoznawać obrazy, ale też poprawnie oceniać granice własnych kompetencji.

> **Nasz komentarz:** Najgroźniejszy błąd modelu medycznego to nie sama pomyłka, lecz pomyłka podana tonem absolutnej pewności.

## Problem nie leży tylko w trafności, ale w kalibracji pewności

Naszym zdaniem ten news dotyka jednego z najważniejszych ograniczeń współczesnych modeli – braku dobrej kalibracji pewności odpowiedzi. W praktyce oznacza to, że model nie tylko może się mylić, ale często nie umie wiarygodnie zakomunikować, kiedy się myli albo kiedy dane zadanie wykracza poza jego możliwości. W medycynie to wada fundamentalna.

RadLE 2.0 zwraca uwagę na coś, co w świecie AI bywa długo traktowane po macoszemu: zdolność do bezpiecznej abstencji od odpowiedzi. Uważamy, że to powinien być jeden z podstawowych wymogów dla systemów wdrażanych w środowiskach wysokiego ryzyka. Model, który zawsze odpowiada, może wyglądać na użyteczny, ale w praktyce jest mniej bezpieczny niż system, który umie się zatrzymać i przekazać sprawę ekspertowi.

W naszej ocenie to także ważny sygnał dla całego kierunku rozwoju multimodalnych modeli językowych. Samo połączenie analizy obrazu z generowaniem płynnego tekstu nie wystarcza, jeśli warstwa językowa wzmacnia fałszywe poczucie kompetencji. Im bardziej naturalna i przekonująca odpowiedź, tym większe ryzyko, że użytkownik uzna ją za wiarygodną nawet wtedy, gdy jest błędna.

Można z tego wyciągnąć kilka konkretnych obserwacji:

- **Bezpieczeństwo** – w zastosowaniach klinicznych liczy się nie tylko poprawna diagnoza, ale też poprawne rozpoznanie własnej niepewności.
- **Ocena modeli** – benchmarki powinny mierzyć nie tylko trafność, lecz także to, czy system potrafi odmówić odpowiedzi w odpowiednim momencie.
- **Rola człowieka** – przewaga radiologów pokazuje, że AI nadal lepiej traktować jako narzędzie wspierające niż autonomicznego diagnostę.

Uważamy, że właśnie takie testy są dziś bardziej wartościowe niż kolejne demonstracje „imponujących” odpowiedzi modeli. Pokazują bowiem nie to, jak dobrze AI wypada w idealnych warunkach, ale gdzie kończy się jej realna użyteczność. A w medycynie to granica ważniejsza niż efektowność.

## W skrócie

- Benchmark RadLE 2.0 sprawdza, czy modele radiologiczne wiedzą, kiedy powinny oddać diagnozę człowiekowi.
- Wiele systemów popełnia błędy, ale prezentuje je z pełną pewnością, co zwiększa ryzyko w zastosowaniach medycznych.
- Ludzcy radiolodzy nadal wyraźnie przewyższają AI, a kluczowym wyzwaniem pozostaje nauczenie modeli rozpoznawania własnych ograniczeń.
