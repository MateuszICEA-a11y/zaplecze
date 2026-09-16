# Fan-out Explorer — korekta strony, spójność wpisu i teksty na czat

Zmiany lokalne z 16.09.2026. Bez publikacji i bez wysyłania wiadomości na czat.

## Zmiany

- Podmieniono tekst strony narzędzia na podstawie przekazanej redakcji, z korektami wynikającymi z weryfikacji. Zaktualizowano title, H1, meta description, instrukcje, opisy panelu, eksportów, zastosowań oraz FAQ i JSON-LD. Meta description skrócono i rozdzielono zapytania na żywo od danych dostępnych w historii.
- W obu tekstach wyjaśniono wspólną pulę wyników rundy. Wierszy nie należy sumować jako unikalnych stron. `site:` wskazuje ograniczenie zapytania do domeny; nie mierzy zaufania. Wynik bez cytowania nie dowodzi przeczytania pełnej strony ani problemu z jej treścią.
- Ujednolicono opis nagrywania: uruchomienie przed promptem, włączony tryb „na żywo”, dostępność lokalnego nagrania w tej samej przeglądarce. Parser nadal obsługuje zapytania zachowane w starszym formacie rozmów.
- Doprecyzowano prywatność, cache, pierwszą próbę po 429 i rosnący odstęp kolejnych prób, nietestowane przeglądarki oraz różnicę między bookmarkletem a narzędziem przez API.
- Usunięto z przekazanej redakcji błędny przykład „seria o1” jako modeli bez myślenia. OpenAI opisuje o1 jako modele rozumujące: [dokumentacja o1](https://developers.openai.com/api/docs/models/o1).
- Instrukcja konsoli mówi, że Chrome **może** poprosić o `allow pasting`; ostrzeżenie zależy od profilu i historii konsoli: [dokumentacja Chrome](https://developer.chrome.com/blog/self-xss).
- Uzupełniono brakujące dziesiąte zapytanie w tabeli kredytowej. Usunięto twierdzenie, że model dopisał miesiąc i rok — były już w prompcie. Dopisano ograniczenie danych o cytowaniach ING i forów.
- Wpis rozróżnia dane z wersji 1.1.0 od zrzutów 1.3.2 oraz ręczne przechwycenie zapytań Shoper/WooCommerce od analizy CRM bez nagrania zapytań. Wnioski ograniczono do opisanych sesji.
- Dodano link ze strony narzędzia do wpisu; wpis już odsyła do narzędzia.

## Weryfikacja i ograniczenia

Niezależnie przejrzano kod bookmarkletu oraz spójność wpisu z notatkami testowymi. Pliki `tools-src/fanout-explorer.js` i `public/tools/fanout-explorer.js` są identyczne; kod bookmarkletu i wersja 1.3.2 pozostały bez zmian.

Build Astro przechodzi po tymczasowym odłożeniu niezwiązanego, nieśledzonego szkicu `co-google-przemilcza-o-ai-search.md`, który odwołuje się do nieistniejącego zdjęcia `mateusz-wisniewski.webp`. Szkic przywrócono z kontrolą identyczności SHA-256. Pełny build bieżącego katalogu nadal wymaga naprawienia tego osobnego szkicu. Kontrola ESLint strony i `git diff --check` przeszły.

Weryfikacja HTML obejmuje H1, canonical, lokalne linki, poprawność JSON-LD, zgodność sześciu odpowiedzi FAQ z widoczną treścią oraz identyczność adresu zakładki z gotowym bookmarkletem. Próba uruchomienia Chrome do zrzutów została odrzucona przez automatyczną kontrolę („blocked by policy”); brak wizualnej weryfikacji i nowego testu na zalogowanym chatgpt.com.

Historycznej notatki `fanout-explorer-dane-2026-09-16.md` nie zmieniano. Jej liczby dotyczące forów w przykładzie kredytu są **niezweryfikowane**: podsumowanie podaje zero cytowań z forów, a lista źródeł obejmuje społeczność ING. W tabeli wiersz ING ma zero cytowań. Brakuje surowego eksportu pozwalającego rozstrzygnąć rozbieżność. Wpis ujawnia tę niepewność i nie używa dokładnego udziału forów jako wniosku. Nie odtwarzano eksperymentów ani nie potwierdzano niezależnie wszystkich historycznych liczb i materiałów zewnętrznych.

## Zajawka wpisu — do wklejenia na czat

Co ChatGPT wpisuje do wyszukiwarki, zanim odpowie klientowi? We wpisie pokazujemy sześć polskich promptów — od kredytu i laptopa po wybór agencji SEO — oraz zapytania, wyniki i cytowania, które udało się zarejestrować. W przykładzie agencyjnym pojawia się też ICEA. Zobaczcie, jak wykorzystać te obserwacje do analizy widoczności marki i planowania treści: https://widocznosc.ai/geo/fanout-explorer-chatgpt/

## Krótki opis narzędzia — do wklejenia na czat

Fan-out Explorer to nasz darmowy bookmarklet do chatgpt.com. Pokazuje przechwycone zapytania ChatGPT, wyniki wyszukiwania i cytowane strony; dane można wyeksportować do CSV. Kliknijcie zakładkę przed wysłaniem promptu i zostawcie włączony tryb „na żywo”. Narzędzie nie przekazuje danych do widocznosc.ai: https://widocznosc.ai/narzedzia/fanout-explorer/
