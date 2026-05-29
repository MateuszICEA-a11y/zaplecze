/**
 * FAQ na homepage – współdzielone między komponentem FAQ.astro
 * a JSON-LD FAQPage emitowanym w pages/index.astro.
 */

export type HomepageFAQ = {
  q: string;
  a: string;
};

export const homepageFaq: HomepageFAQ[] = [
  {
    q: 'Czym GEO różni się od klasycznego SEO?',
    a: 'SEO uczy wyszukiwarkę, jak zaindeksować Twoją stronę. GEO uczy modele językowe (LLM), jak ją cytować. SEO pozostaje fundamentem &ndash; bez technicznego porządku i&nbsp;wysokiej jakości treści AI Cię nie znajdzie. Jednak w&nbsp;GEO nie walczymy o&nbsp;niebieski link na liście, ale o&nbsp;to, by marka stała się częścią syntetycznej odpowiedzi, którą dostaje użytkownik.',
  },
  {
    q: 'Czy darmowa analiza widoczności AI jest naprawdę bezpłatna?',
    a: 'Tak. Nie ukrywamy kosztów i&nbsp;nie wymagamy podpięcia karty. Robimy to, bo wiemy, że większość marek jest dziś całkowicie niewidoczna dla ChatGPT czy Perplexity. Pokazujemy Ci stan faktyczny, bo wierzymy, że dane z&nbsp;Twojego własnego raportu są najlepszym argumentem za podjęciem współpracy.',
  },
  {
    q: 'Kiedy AI zacznie mnie cytować? Jak szybko widać efekty GEO?',
    a: 'To zależy od&nbsp;cyklu aktualizacji wiedzy przez modele (tzw. training data) oraz szybkości działania crawlerów AI (np. GPTBot). W&nbsp;przypadku silników działających w&nbsp;czasie rzeczywistym, jak Perplexity czy SearchGPT, zmiany mogą być widoczne już po&nbsp;kilku dniach od&nbsp;reindeksacji strony. SEO buduje trwałość, GEO zapewnia natychmiastową obecność w&nbsp;kontekście zapytania.',
  },
  {
    q: 'Jak mierzycie efekty, skoro odpowiedzi AI za każdym razem mogą wyglądać inaczej?',
    a: 'Klasyczne „TOP 1" w&nbsp;AI nie istnieje. Dlatego zamiast pozycji, mierzymy <strong>Citation Rate</strong> (wskaźnik cytowań) oraz <strong>Brand Share of Voice</strong> w&nbsp;setkach wygenerowanych odpowiedzi. Sprawdzamy prawdopodobieństwo, z&nbsp;jakim AI rekomenduje Twoją markę na tle konkurencji. Używamy do&nbsp;tego zaawansowanych narzędzi monitorujących, które symulują tysiące zapytań, by wyciągnąć średnią statystyczną.',
  },
  {
    q: 'Czy nowa lub niszowa marka ma szansę przebić się w odpowiedziach AI?',
    a: 'Paradoksalnie &ndash; w&nbsp;świecie AI niszowość to&nbsp;Twoja największa przewaga. Modele językowe szukają precyzyjnych, eksperckich odpowiedzi (tzw. Information Gain). Jeśli Twoje SEO dostarczy im unikalnej wiedzy, której nie ma w&nbsp;masowych serwisach, AI chętniej zacytuje Ciebie jako autorytet w&nbsp;danej dziedzinie niż ogólnotematycznego giganta.',
  },
];
