---
title: Google prezentuje Gemini 3.7 Flash – tańszy model do zadań agentowych
lead: Google udostępnił Gemini 3.7 Flash, następcę wersji 3.6 Flash nastawionego na wieloetapowe planowanie i wywoływanie narzędzi. Model wyraźnie poprawia wyniki w benchmarkach kodowania i analizy dokumentów, a do końca 2026 roku obowiązuje promocyjna cena 0,75 dolara za milion tokenów wejściowych.
date: '2026-08-14'
sourceName: Google
sourceUrl: https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-3-7-flash/
tags:
- Google
- Gemini
- premiera modelu
- modele językowe
author: Redakcja widocznosc.ai
image: ../../assets/images/blog-modele-llm-gemini.webp
---

## Co nowego wnosi Gemini 3.7 Flash?

Google ogłosił 13 sierpnia premierę Gemini 3.7 Flash – kolejnej odsłony lekkiego modelu z rodziny Gemini, tym razem wyraźnie sprofilowanej pod pracę agentową. Według ogłoszenia model cechuje „bardziej zdyscyplinowana egzekucja”: mniej powtórzeń i poprawek, lepsze wieloetapowe planowanie oraz sprawniejsze wywoływanie narzędzi.

Liczby z oficjalnych benchmarków pokazują skok względem Gemini 3.6 Flash. W FrontierCode 1.1 Main model osiąga 43,6% wobec 34,4% poprzednika, w DeepSWE v1.1 – 65,3% wobec 49,0%, a w AutomationBench – 30,4% wobec 17,0%. W rankingu WebDev Arena wynik Elo wzrósł z 1538 do 1588, a w teście analizy dokumentów GDP.pdf – z 22,0% do 34,0%.

Równie istotna jest cena. Do 31 grudnia 2026 roku obowiązuje stawka promocyjna: 0,75 dolara za milion tokenów wejściowych i 3,75 dolara za milion wyjściowych – połowa docelowego cennika, który od stycznia 2027 wyniesie odpowiednio 1,50 i 7,50 dolara. Model jest dostępny w Google AI Studio, przez Gemini API (w tym w Android Studio), w Google Antigravity, na platformie Gemini Enterprise Agent oraz w usłudze Gemini Spark dla subskrybentów planów Pro i Ultra w ponad 160 krajach.

> **Nasz komentarz:** Google gra tu ceną równie mocno jak benchmarkami – półroczna promocja na model o takich wynikach to jasny sygnał walki o developerów budujących agentów.

## Tanie modele agentowe stają się głównym polem rywalizacji

Naszym zdaniem najciekawsze w tej premierze nie są pojedyncze wyniki, lecz profil zmian. Największe skoki Gemini 3.7 Flash notuje dokładnie tam, gdzie liczy się praca agentowa: automatyzacja (AutomationBench niemal podwoił wynik), dłuższe zadania programistyczne (DeepSWE) i analiza dokumentów. To nie jest kosmetyczna aktualizacja czatbota, tylko tuning pod modele pracujące w tle, na wielu krokach, z narzędziami.

W naszej ocenie warto zwrócić uwagę na trzy rzeczy:

- **Tempo iteracji rośnie** – od premiery 3.6 Flash minęły zaledwie tygodnie, a Google już podnosi poprzeczkę. Cykl wydawniczy lekkich modeli skraca się do rytmu, w którym trudno mówić o „generacjach”, raczej o ciągłym strumieniu ulepszeń.
- **Cena staje się bronią strategiczną** – 0,75 dolara za milion tokenów wejściowych przy takich wynikach ustawia agresywny punkt odniesienia dla całego segmentu tanich modeli, w którym konkurują też GPT-5.x mini i Grok.
- **Agentowość schodzi do klasy „Flash”** – zdolności planowania i samodzielnej pracy z narzędziami, jeszcze niedawno zarezerwowane dla flagowców, stają się standardem w modelach budżetowych. To one będą napędzać masową automatyzację.

Uważamy, że dla rynku oznacza to dalszy spadek kosztu pojedynczej operacji agentowej – i przesunięcie rywalizacji z pytania „czyj model jest najmądrzejszy” na pytanie „czyj model wykona długie zadanie najtaniej i najpewniej”.

## W skrócie

- Google wydał Gemini 3.7 Flash – lekki model sprofilowany pod wieloetapowe zadania agentowe i pracę z narzędziami.
- Model wyraźnie poprawia wyniki względem 3.6 Flash, m.in. FrontierCode 43,6% (z 34,4%) i DeepSWE 65,3% (z 49,0%).
- Do końca 2026 roku obowiązuje promocyjna cena 0,75/3,75 dolara za milion tokenów; dostępność obejmuje AI Studio, Gemini API i Gemini Spark w 160+ krajach.
