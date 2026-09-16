# Fan-out Explorer 1.3.5 — Business, nagrywanie i HTTP 429

## Ustalenia z rzeczywistej karty Business

16.09.2026 połączono Chrome DevTools MCP z udostępnioną przez użytkownika kartą. Interfejs pokazywał Business. Istniał otwarty WebSocket do ws.chatgpt.com/p7/ws/user/…, mimo licznika WS=0 w bookmarklecie. Drugi skrypt miał własną metodę send na instancji socketu i wywoływał wcześniej zapisany oryginał; omijał przez to wrapper WebSocket.prototype.send. Sama podmiana window.fetch przez drugi skrypt nie zatrzymywała przechwytywania początkowego SSE.

Pasywny odczyt tego połączenia wykazał conversation-turn-stream i pola search_model_queries, także zapytania site:. To dowód dostępności tych danych w badanym koncie Business. Nie ustalano nazwy ani nie wyłączano drugiego skryptu.

Po uruchomieniu poprawki w tej samej karcie kolejny prompt przechwycił 10 zapytań w 2 partiach. Liczniki wskazywały 1 obserwowane połączenie WS i brak błędów parsera. Odczyt historii nadal podlegał limitowi 429.

## Zmiany

- Pasywny getter MessageEvent.data obserwuje odczyt wiadomości przez aplikację także na istniejącym sockecie z własnym send. Zachowuje wartość i wyjątki natywnego gettera; filtruje WebSocket do ws.chatgpt.com i deduplikuje odczyty jednego zdarzenia. Nie tworzy połączeń ani subskrypcji.
- Nagrane partie są przypisywane wyłącznie po ID wiadomości web.run. Nie ma dopasowania pozycyjnego do końca rozmowy: nowe zapytania nie trafiają do starych rund nieaktualnej kopii podczas 429.
- Wspólna blokada po 429 obejmuje polling, przycisk Odśwież i obserwator URL. Nie ma równoległych odczytów. Retry-After jest interpretowany jako sekundy lub data; przerwa przetrwa ponowne uruchomienie panelu w tej samej karcie.
- Przechwycenie partii aktualizuje model z pamięci bez dodatkowego fetch. Automatyczne pobieranie podczas generowania następuje najwyżej co 15 sekund. Spóźniony wynik poprzedniego czatu nie zastępuje bieżącej rozmowy.

## Walidacja

42 testy obejmują parser SSE, handoff, własne send, getter data i jego wyjątki, filtrowanie, deduplikację, dopasowanie wiadomości i aktywnej gałęzi, cooldown, automatyczne ponowienie, Retry-After, polling i zmianę rozmowy. Dane testowe są syntetyczne. Nie zapisano tokenów, identyfikatorów kont ani pełnych rozmów użytkownika w repozytorium.

Test w przeglądarce potwierdził przechwycenie zapytań. Limit historii oraz stare odpowiedzi, których nie nagrywano, pozostają odrębnymi ograniczeniami.
