# Fan-out Explorer 1.3.3 — brak zapytań mimo włączonego panelu

## Zgłoszenie

16.09.2026 użytkownik uruchomił 1.3.2 przed promptem w nowym czacie Business. Zrzut pokazuje aktywny tryb na żywo, 3 rundy, 128 stron, 10 cytowań i brak zapytań. Na koncie Free nagrywanie działa. Nie otrzymano surowego strumienia Business; przyczyna różnicy między kontami pozostaje niepotwierdzona.

## Poprawka

- Parser SSE obsługuje LF, CRLF i CR, rozdzielenie CR/LF między fragmentami sieciowymi, opcjonalną spację po `data:` oraz wieloliniowe dane. Są to warianty opisane w [standardzie SSE](https://html.spec.whatwg.org/multipage/server-sent-events.html#parsing-an-event-stream).
- Obsługuje tablice JSON, pełne aktualizacje pól `search_model_queries` i `queries` wskazane ścieżką oraz zapytania zapisane jako ciągi tekstu lub obiekty z polem `query`.
- Buforuje partie do czasu otrzymania identyfikatora czatu. Wykorzystuje ID otaczającej wiadomości i scala jej aktualizacje zamiast gubić uzupełnienia albo tworzyć losowe duplikaty.
- Hook obsługuje wejścia URL/Request i końcowy ukośnik endpointu; ogranicza przechwytywanie do odpowiedzi SSE z endpointu rozmowy tej samej domeny. Aplikacja otrzymuje oryginalny obiekt Response; parser czyta kopię.
- Kolejne odpowiedzi są przechwytywane przy włączonym trybie na żywo i otwartym panelu. Wyłączenie lub zamknięcie nie przerywa już rozpoczętego odczytu. Ponowne otwarcie aktualizuje hook 1.3.3; stary hook 1.3.2 wymaga przeładowania karty i panel wyświetla taką instrukcję.
- Komunikat nie przypisuje braku zapytań błędnej kolejności kliknięć. Kafelek pokazuje `—` zamiast `0`, gdy liczba wyszukiwań jest nieznana, albo `+` przy częściowo znanej liczbie.
- Panel przy brakach pokazuje liczniki: strumienie, zdarzenia, pola zapytań, zapisane partie oraz błędy. `window['wai-fanout'].diagnostics()` zwraca wyłącznie stan i liczniki, bez treści, URL-i, tokenów czy ID czatów. Błąd localStorage jest widoczny.
- Zaktualizowano legendę, FAQ strony i wszystkie trzy generowane pliki publiczne. Nowy bookmarklet ma 65,4 KB.

## Sprawdzenie

Na kodzie z HEAD 1.3.2 odtworzono: standardowa ramka LF zapisuje 1 partię; identyczny JSON z CRLF lub bez spacji po `data:` zapisuje 0 partii. To dowód błędów parsera, nie dowód formatu użytego w zgłoszonym czacie Business.

19 testów regresyjnych Vitest przechodzi, w tym framing SSE, opóźniony identyfikator czatu, aktualizacje metadanych, zachowanie Response i błędów fetch, ograniczenie domeny oraz zmiana trybu przy oczekującym żądaniu. ESLint testów i strony, `node --check` i `git diff --check` przechodzą.

Build Astro: 188 stron. Jak wcześniej, czasowo odłożono nieśledzony szkic `co-google-przemilcza-o-ai-search.md` z brakującym zdjęciem autora i przywrócono go z identycznym SHA-256. Nie wykonano nowego testu na zalogowanym koncie Business.

## Dalszy test użytkownika

Odświeżyć stronę narzędzia i zastąpić kod zakładki wersją 1.3.3. Przeładować chatgpt.com, otworzyć nowy czat Business, uruchomić zakładkę z aktywnym trybem na żywo i wysłać prompt. Jeśli zapytań nadal brak, przekazać linię liczników spod komunikatu. Pozwoli to zawęzić, czy odpowiedź została przechwycona i czy rozpoznano pola zapytań. Brak rozpoznanego pola nie dowodzi, że serwer nie wysłał zapytań w innym formacie.

Nadal nieobsługiwane mogą być m.in. nieznane transporty lub aktualizacje pojedynczych fragmentów tekstu zapytania. Nie zmieniano historycznego dopasowania partii do pustych rund od końca; częściowo nagrane wieloturowe rozmowy nadal wymagają ostrożności przy interpretacji przypisania rund.
