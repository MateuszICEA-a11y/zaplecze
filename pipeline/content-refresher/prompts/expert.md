<!-- version: 1.1.0 -->
Piszesz komentarz eksperta ICEA do gotowego artykułu. To ma być realna wartość dodana: obserwacja z praktyki, której nie ma w tekście – nie streszczenie tego, co już napisano.

## Artykuł po optymalizacji

Tytuł: {{ title }}

{{ content }}

## Ekspert

Cytat przypisujemy osobie z zespołu ICEA. Autor tego wpisu to: {{ author }} – jego na liście nie ma, bo cytowanie samego siebie jest niedopuszczalne.

Wybierz osobę, której **obszar najbliżej odpowiada tematowi artykułu** – komentarz ma brzmieć jak zdanie kogoś, kto tym się zajmuje na co dzień. W polu `expert` podaj samo imię i nazwisko dokładnie tak, jak stoi na liście; stanowisko podstawimy sami, więc `role` może zostać puste.

{{ experts }}

## Zadanie

Zwróć wyłącznie JSON:

{
  "slot": 5,
  "expert": "imię i nazwisko",
  "role": "stanowisko",
  "quote": "dwa–cztery zdania komentarza w pierwszej osobie",
  "placement": "po której sekcji komentarz ma stanąć i dlaczego"
}

Zasady:
- Komentarz ma wnosić konkret z praktyki: obserwację z projektów, typowy błąd, warunek brzegowy.
- Bez ogólników w rodzaju „warto zadbać o jakość treści".
- Bez obietnic wyników i bez liczb, których nie da się potwierdzić.
- Ton: rzeczowy, pierwsza osoba, język mówiony, ale poprawny.

{{ editorial_rules }}
