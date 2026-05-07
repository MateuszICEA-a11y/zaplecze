---
title: 'Share of Voice zamiast rankingu – jak naprawdę mierzyć widoczność marki w AI'
subtitle: 'Dlaczego klasyczny rank tracking nie działa w ChatGPT, Claude i Perplexity – i co go zastępuje'
description: 'Badanie SparkToro pokazało, że odpowiedzi LLM mają mniej niż 1% powtarzalności. Mierzenie pozycji w AI nie ma sensu. Co zamiast tego: Share of Voice, Citation Rate, Mention Rate – metryki, które naprawdę pokazują, jak Twoja marka radzi sobie w erze AI search.'
date: 2026-05-07
image: ../../assets/images/blog-share-of-voice.png
icon: '<rect x="3" y="14" width="3" height="7" rx="1"/><rect x="9" y="9" width="3" height="12" rx="1"/><rect x="15" y="4" width="3" height="17" rx="1"/><rect x="20.5" y="11" width="2" height="10" rx="1"/>'
author:
  name: 'Tomasz Czechowski'
  role: 'Head of SEO · ICEA'
  avatar: ../../assets/images/authors/tomasz-czechowski.avif
readTime: '12 min'
tags: ['Pomiar AI', 'Share of Voice', 'Citation Rate', 'GEO']
category: 'geo'
---

Klient pyta: *„Na której pozycji jesteśmy w ChatGPT?"*. To pytanie nie ma odpowiedzi. I właśnie dlatego cały biznes klasycznego SEO – od rank trackerów przez Search Console po raporty miesięczne – zaczyna się rozsypywać przy próbie raportowania widoczności w AI. Problem nie jest taki, że nie potrafimy mierzyć – problem jest taki, że ranking jako metryka po prostu przestał istnieć w sensie, w jakim go znamy.

## Dlaczego ranking w LLM nie ma sensu

Rand Fishkin (SparkToro) opublikował na początku 2026 roku badanie, które powinno być punktem startowym każdej rozmowy o pomiarze widoczności AI. Sześciuset ochotników, 2961 testów, 12 zapytań × 3 platformy AI. Wynik: **mniej niż 1% powtarzalności**. Tylko mniej więcej raz na tysiąc uruchomień zobaczysz dwie identyczne listy źródeł w tej samej kolejności.

Powód jest techniczny i wynika wprost z natury LLM-ów. Każdy duży model językowy ma temperaturę – parametr decydujący o tym, jak losowo wybiera kolejne tokeny. Nawet przy temperaturze 0 (deterministycznej w teorii) różnice w batch processing, sample size retrieval i kolejności wczytywania pasaży powodują, że odpowiedzi się różnią. Dodatkowo, na każde zapytanie LLM uruchamia query fan-out – generuje kilkadziesiąt synthetic queries, których pula też jest niedeterministyczna.

W efekcie sprzedawanie klientowi raportu *„na frazę X jesteśmy na pozycji 3 w ChatGPT"* jest jak sprzedawanie raportu *„dziś było średnio 14 stopni na ulicy"* – formalnie poprawne, praktycznie bezużyteczne. Klient, który po trzech miesiącach zauważy, że pozycje skaczą losowo, ma prawo się wkurzyć.

## Trzy metryki, które naprawdę działają

Zamiast pozycji branża GEO ustaliła trzy metryki probabilistyczne – takie, które są stabilne na przestrzeni dziesiątek lub setek uruchomień, a nie pojedynczych testów. Razem dają one obraz znacznie bliższy temu, co klient naprawdę chce wiedzieć: *„czy klienci, którzy szukają nas w AI, mnie zauważają?"*.

**Share of Voice (SoV)** to procent zapytań, w których Twoja marka pojawiła się w odpowiedzi (z URL lub bez), na tle wszystkich marek konkurencyjnych w tej puli. Metryka działa tak: bierzemy 30 reprezentatywnych pytań Twoich klientów, każde uruchamiamy w 4 platformach AI po 5 razy, zliczamy wszystkie wzmianki marek. Twoja marka pojawiła się 47 razy, konkurent A – 78, konkurent B – 62, długi ogon innych – 35 razy. SoV = 47 / 222 = 21%. Tę liczbę można porównywać między audytami i zobaczyć ruch.

**Citation Rate** to procent zapytań, w których Twój URL został zacytowany jako źródło (z linkiem). Różni się od SoV o jeden szczegół: tu liczy się tylko cytowanie z URL, nie sama wzmianka marki w tekście. To metryka stricte technicznego SEO – jeśli rośnie, znaczy, że Twoja strona jest faktycznie indeksowana i wybierana przez retrieval engine. Brytyjska konferencja BrightonSEO 2025 podała benchmark: Citation Rate w okolicach 12–18% to dobry wynik dla ugruntowanej marki, powyżej 25% to wynik liderski.

**Mention Rate** to procent zapytań, w których Twoja marka pojawiła się tylko w tekście odpowiedzi, bez URL. Różnica vs Citation Rate jest znacząca i mówi o dwóch różnych mechanizmach. Mention bez linku wynika z obecności marki w danych treningowych modelu – AI „pamięta", że Twoja marka istnieje, ale nie wskazuje na konkretny artykuł. Cytat z linkiem oznacza, że konkretna strona została wczytana z indeksu w czasie odpowiedzi. Dlatego Britney Muller spuentowała to lapidarnie: *„brand mentions are the new backlinks"*. Mention rate budujesz przez PR, recenzje, listicles i cytowania w mediach – nie przez technical SEO.

## Jak to wszystko mierzyć w praktyce

Żaden komercyjny rank tracker nie daje gotowej odpowiedzi, więc proces wygląda hybrydowo. W ICEA stosujemy następujący schemat dla audytów Share of Voice:

**Krok 1: zdefiniowanie puli zapytań**. Klient nie zna swoich „buyer queries", więc je wyciągamy. Wywiad z product marketing, analiza Search Console (które frazy trafiają na konwersje), keyword research i transkrypcje calli sales. Z tego destylujemy 30–50 reprezentatywnych pytań w naturalnym języku – takich, jakie klient wpisze w ChatGPT, nie w Google.

**Krok 2: zaprojektowanie sample size**. Każde pytanie odpalamy minimum 5 razy w każdej z 4 platform (ChatGPT, Claude, Gemini, Perplexity). Dla 30 pytań × 5 uruchomień × 4 platform = 600 pojedynczych testów. Przy 50 pytaniach – 1000. To minimum, żeby probabilistyka była stabilna. Mniej oznacza ryzyko, że pojedyncza dziwna odpowiedź zniekształci wynik.

**Krok 3: scraping i normalizacja danych**. Każdą odpowiedź zapisujemy strukturalnie: tekst, lista cytowanych URL-i, lista wzmiankowanych marek, sentyment per marka. Normalizacja jest kluczowa – „Tesla" w odpowiedzi może odnosić się do firmy lub do produktu (Tesla Model 3), więc używamy NLP do disambiguation. Po tym kroku mamy strukturalny dataset, na którym liczymy SoV, Citation Rate i Mention Rate.

**Krok 4: porównanie z konkurencją**. SoV bez kontekstu nic nie znaczy. 21% SoV w niszy, gdzie lider ma 28%, to świetnie. 21% SoV w niszy, gdzie lider ma 65%, to katastrofa. Zawsze raportujemy 5 największych konkurentów wraz z naszą marką – to też pokazuje, czy są w ogóle realne szanse na wzrost.

**Krok 5: tracking w czasie**. Pojedynczy pomiar to baseline. Realna wartość SoV pojawia się przy trzecim, czwartym pomiarze – kiedy widać trend. Dlatego miesięczny re-scan tej samej puli zapytań to standard. Jeśli wdrażamy roadmapę GEO i SoV w 60 dniach z 21% wzrasta na 27%, klient widzi, że pieniądze nie idą w ścianę.

## Czego unikać przy raportowaniu

Trzy najczęstsze pułapki, w które wpadają agencje próbujące „dorobić" GEO do istniejących raportów SEO:

**Raportowanie pozycji**. Klasyczne rank trackery typu Semrush czy Ahrefs zaczęły obiecywać tracking AI Overviews i ChatGPT. To częściowa półprawda – pokazują pojedynczy snapshot, nie probabilistyczną dystrybucję. Klient, który dostaje raport *„na frazę X jesteś w AI Overview na pozycji 2"*, przy następnym sprawdzeniu zobaczy *„nie ma Cię w ogóle"* – nie dlatego, że coś się zepsuło, tylko dlatego, że to inne uruchomienie. To nie jest błąd narzędzia, to fundamentalna cecha LLM.

**Mieszanie SoV z impressions**. Search Console pokazuje impressions w klasycznym Google. Niektórzy próbują tę metrykę przekładać na AI: *„mamy 10 000 impressions miesięcznie z AI Overviews"*. To liczba, która nie ma żadnego znaczenia, dopóki nie zestawisz jej z impressions konkurencji. SoV to relacja, impressions to liczba absolutna – i tylko relacja mówi coś o pozycji konkurencyjnej.

**Ignorowanie Mention Rate**. Większość early-stage agencji GEO skupia się tylko na Citation Rate, bo to mierzalne za pomocą scrapera. Mention Rate wymaga analizy NLP, więc zostaje pomijany. Tymczasem dla marek B2C i ugruntowanych marek B2B Mention Rate jest często 3–5× wyższy niż Citation Rate – a to on ostatecznie buduje rozpoznawalność w AI. Pomijanie go zafałszowuje obraz.

## Jak interpretować wyniki

Najczęstsze pytanie klienta po pierwszym audycie SoV: *„Co znaczy 18% Share of Voice?"*. Odpowiedź zależy od trzech zmiennych: branży, sample size i kontekstu konkurencyjnego.

W niszach silnie zdominowanych przez 1–2 graczy (np. Stripe vs PayPal w fintechu, Salesforce vs HubSpot w CRM) SoV poniżej 10% jest realistyczny dla challenger brand i nie powinien być powodem do paniki. W rozdrobnionych niszach (np. agencje SEO, software houses, konsulting) lider często ma SoV w okolicach 15–20%, więc 8% to wynik solidny.

Drugi czynnik to charakter zapytań. SoV liczone na pytaniach branded (*„czy [Twoja marka] dobrze tłumaczy [coś]"*) powinien być powyżej 50% – to test rozpoznawalności. SoV liczone na pytaniach generic kategorii (*„najlepsze CRM 2026"*) mówi o kompetycyjności w samym rynku. Mieszanie tych dwóch w jednej liczbie zafałszowuje obraz – dlatego raportujemy oddzielnie.

Trzeci czynnik to kierunek zmiany. Pojedynczy SoV 18% nic nie mówi. Trzy pomiary z trendem 12% → 15% → 18% przez kwartał to twardy dowód, że roadmapa GEO działa. Trzy pomiary 22% → 19% → 16% w tym samym okresie to alarm – konkurencja wdraża coś, czego my nie obsługujemy.

## Wnioski

Branża SEO przechodzi przez fazę, w której narzędzia istnieją (mamy LLM-y, mamy API, mamy scraping), ale ustalonych standardów raportowania jeszcze nie ma. Każda agencja, która sprzedaje GEO, definiuje własne KPI. Część z nich będzie sensowna i zostanie z nami na kolejne lata. Część zniknie, gdy klient zobaczy, że metryki są kosmetyką, nie diagnostyką.

Share of Voice, Citation Rate i Mention Rate – mierzone na rozsądnym sample size, porównywalne z konkurencją, raportowane w trendzie – są dziś najsilniejszą propozycją, jaką może postawić agencja przed klientem. Nie są idealne. Ale są lepsze niż udawanie, że ranking w AI istnieje tak samo, jak w klasycznym Google.

W audycie pełnym widoczności AI w ICEA każdy raport zawiera te trzy metryki w trzech ujęciach: Twoja marka, top 5 konkurencji, dynamika kwartalna. Plus szczegółowy breakdown per platforma – bo SoV w ChatGPT i SoV w Perplexity to różne historie, czasem dramatycznie się różniące. Jeśli chcesz zobaczyć, jak wygląda Twoja marka w tym układzie, [zacznij od darmowego brand check](/narzedzia/brand-check) – w 60 sekund dostaniesz pierwszy snapshot SoV w 4 silnikach AI.
