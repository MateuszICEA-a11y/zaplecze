# Fan-out Explorer 1.3.4 — kontynuacja strumienia

Próbka z konta Business potwierdza `stream_handoff` po `resume_conversation_token`, z opcjami `resume_sse_endpoint` i `subscribe_ws_topic`. Nie dowodzi, którą opcję wybrała aplikacja. Użytkownik nie widzi WS. Token i rzeczywiste identyfikatory nie są zapisane w repozytorium.

## Implementacja

- Pasywna obserwacja istniejącego WebSocket do ws.chatgpt.com po wywołaniu send przez aplikację; odczyt conversation-turn-stream, encoded_item i catchupów.
- Kontynuacja fetch/SSE z tego samego origin, z /backend-api/, gdy temat występuje w URL lub topic_id tekstowego JSON w init.body.
- Wiązanie z tematem wskazanym przez handoff; osobne dekodery dla SSE i WS, deduplikacja zapytań w partii.
- Fragmenty wyprzedzające handoff mają bufor ograniczony do 8 tematów, po 512 Ki znaków i 256 fragmentów, przyjmowanych przez maksymalnie 30 sekund. Zapis dopiero po dopasowaniu do handoffu.
- Bez własnych połączeń, subskrypcji i używania tokenu. Oryginalne Response, send i listenery pozostają dostępne aplikacji.
- Liczniki przekazań/WS i wyjaśnienie, że plakietka site: wymaga odczytanego zapytania z tym operatorem.

## Walidacja i ograniczenia

30 testów obejmuje SSE, zapis, handoff, catchupy, fragmentację, host/topic, wyścigi kontynuacji, deduplikację, zachowanie Response/send oraz brak zapisu tokenu i dodatkowych żądań. Dane są syntetyczne; synthetic-resume nie jest ustalonym endpointem ChatGPT. Niezależny przegląd kodu nie wykazał blokera.

Brak testu w zalogowanej przeglądarce Business. Rzeczywiste żądanie kontynuacji użytkownika nadal wymaga ustalenia. Temat wyłącznie w nagłówku, tokenie lub ciele Request zamiast init.body nie zostanie skojarzony przez matcher. WebSocket bez wywołania send po instalacji obserwatora pozostanie niewidoczny. To nie dowodzi, że Business nie udostępnia zapytań. Po aktualizacji zakładki należy przeładować chatgpt.com.

## Źródła obserwowanego protokołu

- https://github.com/SyntaxSmith/rosetta/blob/main/src/client.ts — handoff, conversation-turn-stream, encoded_item, catchups.
- https://github.com/xtekky/gpt4free/issues/3404 — zmiana transportu.
- https://html.spec.whatwg.org/multipage/server-sent-events.html#parsing-an-event-stream — ramki SSE.

Nie jest to oficjalna gwarancja zgodności protokołu ChatGPT.
