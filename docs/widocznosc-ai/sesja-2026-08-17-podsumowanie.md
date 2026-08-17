# Sesja 2026-08-17: druga warstwa diagnozy w ai-bots-check + dokumentacja botów AI

## Punkt wyjścia

Pytanie o narzędzie „Dostęp botów AI”: sprawdza `robots.txt`, ale co z blokadami
w Cloudflare? Audyt kodu potwierdził lukę – `functions/api/tools/ai-bots-check.ts` wykrywał
challenge Cloudflare wyłącznie na samym pliku `robots.txt`, a typowa konfiguracja jest
odwrotna: `robots.txt` przechodzi (bywa wyjęty z reguł), natomiast HTML jest odrzucany po
User-Agencie. Narzędzie pokazywało wtedy zielone „13/13 dopuszczonych”, choć GPTBot
dostawał 403.

## Co powstało

### 1. Rozbudowa narzędzia (2 commity, wypchnięte: c48f0774, 9dfc5b8a)

Nowa biblioteka `functions/_lib/ai-bots-probe.ts` – czyste funkcje oddzielone od fetchy,
24 testy jednostkowe.

**Krok 1 – bez podszywania się.** Z jednego pobrania strony przeglądarkowym User-Agentem:
parser `X-Robots-Tag` (z obsługą prefiksu user-agenta i pułapki `max-snippet: 20`, którego
nie wolno wziąć za nazwę bota), parser `meta robots` per bot, wykrycie Cloudflare po
`cf-ray` / `server` / `/cdn-cgi/`.

**Krok 2 – sonda porównawcza.** Ta sama strona pobrana jako przeglądarka i jako GPTBot,
OAI-SearchBot, ClaudeBot, PerplexityBot. Werdykty: `ua-blocked`, `challenged`,
`both-blocked`, `thin` (200, ale treść poniżej 40 % baseline – rendering JS albo cloaking),
`unknown`.

Decyzje projektowe warte zapamiętania:

- Obie warstwy lecą **równolegle** z pobraniem `robots.txt`. Szeregowo suma timeoutów
  (10 s + 8 s + 8 s) ocierałaby się o limit żądania w Pages Functions.
- Sonda jest **fail-soft** – jej błąd nie wywraca raportu `robots.txt`, tylko dokłada
  punkt „nie udało się sprawdzić samej strony”.
- `PROBE_DISCLAIMER` jedzie w każdej odpowiedzi i w każdym action itemie o blokadzie.
  Żądania idą z infrastruktury Cloudflare i podszywają się pod UA, a prawdziwe boty są
  weryfikowane po IP i reverse DNS – wynik jest sygnałem, nie werdyktem.
- Sondujemy 4 boty, nie 13 – każdy to osobne żądanie do cudzego serwera, a te cztery
  pokrywają reguły, które faktycznie decydują o cytowaniach.

Front: sekcja „Warstwa serwera” pod tabelą botów plus druga linia `Serwer: …` przy
sondowanych botach. Raport mailowy analogicznie, bez pustego bloku gdy sondy brak.

### 2. Dokumentacja (3 commity, niewypchnięte: 172af0f5, 486782d8, 5d1a7586)

`docs/widocznosc-ai/boty-ai-lista-dozwolonych-i-cloudflare.md` + bliźniacza wersja HTML
(samodzielna, oba motywy, arkusz do druku).

Zawartość: podział na warstwę krytyczną (cytowania) i treningową, 13 źródeł adresów IP
z liczbą prefiksów i datą list, mapa panelu Cloudflare po przebudowie z kwietnia 2026.

Dokument przeszedł korektę językową zleconą na zewnątrz – usunięte kalki (allowlista,
rozwiązać się do domeny, kruche, rzucać challenge), potocyzmy i błędy fleksji.

## Ustalenia faktograficzne

**Adresy IP się zmieniają** – dlatego producenci publikują je jako JSON pod stałym
adresem. Stały jest URL, nie zawartość. Google podmienia prawie 1100 prefiksów w trzech
plikach co kilka dni, Perplexity trzyma 12 pojedynczych `/32`, Anthropic wprost odradza
blokowanie po IP, bo utrudnia to odczyt `robots.txt` i psuje opt-out.

**`Google-Extended` i `Applebot-Extended` nie mają i nie będą miały list IP** – to tokeny
kontrolne w `robots.txt`, nie crawlery. Pobiera zawsze `Googlebot` / `Applebot`.

**`openai.com/chatgpt-user.json` zwraca HTTP 400** – endpoint jest w dokumentacji OpenAI,
ale nie działa; znany problem zgłaszany na ich forum. Pozostałe (gptbot, searchbot,
adsbot) działają.

**Anthropic publikuje wspólną listę dla trzech botów** pod `https://claude.com/crawling/bots.json`
– aktywnie utrzymywaną (odświeżona 4 dni przed sesją).

**Cloudflare przebudował panel w kwietniu 2026.** WAF przestał być osobną pozycją w menu,
co skutecznie utrudnia jego znalezienie. Reguły własne i rate limiting są w
Security → Security rules, reguły zarządzane i Bot Fight Mode w Security → Settings
(kategorie *Web application exploits* i *Bot traffic*), zdarzenia w Security → Analytics →
Events. Sterowanie pojedynczymi botami siedzi zupełnie gdzie indziej – w gałęzi
AI Crawl Control → Security.

## Znalezisko: widocznosc.ai blokuje boty AI

Sonda na własnej domenie zwróciła 403 dla wszystkich czterech botów. Weryfikacja
w panelu (AI Crawl Control → Security) doprecyzowała obraz.

Zablokowane przełącznikiem *Block Crawler*: GPTBot, ClaudeBot, **Claude-User**, CCBot,
Amazonbot, Bytespider, Anchor Browser, Arquivo Web Crawler.
Przepuszczane: Googlebot (47 żądań), BingBot (27), ChatGPT-User (2), OAI-SearchBot,
PerplexityBot, Claude-SearchBot, Applebot, DuckAssistBot.

To domyślny preset Cloudflare – blokuje kategorię *AI Crawler*, zostawia *AI Search*
i *AI Assistant*. Przy czystym `robots.txt` to podręcznikowy rozjazd deklaracji i serwera,
dokładnie ten, który narzędzie od tej sesji wykrywa.

**Do poprawy: `Claude-User`.** Cloudflare klasyfikuje go jako *AI Crawler*, choć u Anthropic
jest botem on-demand – jego odpowiednik `ChatGPT-User` siedzi u CF w *AI Assistant*
i przechodzi. Efekt: pytanie zadane Claude nie doczyta strony, to samo pytanie w ChatGPT –
tak. To nie była świadoma decyzja, tylko skutek kategoryzacji.

GPTBot, ClaudeBot i CCBot to osobna decyzja (trening). Warta rozważenia, bo portal
o widoczności w AI, którego treści nie zna żaden model, jest w niezręcznej pozycji.
Bytespider, Amazonbot, Anchor Browser i Arquivo można zostawić zablokowane.

## Dwie rzeczy, których nie ma w dokumentacji Cloudflare

Obie wyszły z obserwacji panelu i trafiły do dokumentu:

1. **Kolumna `Unsuccessful` nie oznacza blokady danego bota.** Zbiera też żądania odbite
   przez ochronę przed podszywaniem się. OAI-SearchBot i PerplexityBot miały po 1, mimo
   wyłączonego *Block Crawler* – to były sondy z narzędzia. Reguła diagnostyczna:
   niezerowe *Unsuccessful* przy wyłączonym przełączniku → sprawdź Bot Fight Mode.
2. **Kategorie Cloudflare nie pokrywają się z rolami u producenta** – przypadek
   `Claude-User` opisany wyżej.

Pierwsza z nich jest zarazem potwierdzeniem, że zastrzeżenie dołączane do wyników sondy
było potrzebne: dla dwóch z czterech botów 403 okazało się fałszywym alarmem.

## Stan repozytorium

Wypchnięte: `c48f0774`, `9dfc5b8a` (narzędzie).
Niewypchnięte: `172af0f5`, `486782d8`, `5d1a7586` (dokumentacja).

Pliki dla użytkownika: `C:\Users\sibil\Downloads\boty-ai-lista-dozwolonych-i-cloudflare.{md,html}`.

## Do zrobienia

- Odblokować `Claude-User` w AI Crawl Control → Security.
- Zdecydować o GPTBot / ClaudeBot / CCBot.
- Po zmianie sprawdzić po 24 h kolumnę *Requests* – rosnące *Allowed* oznacza powrót botów.
- Odpalić narzędzie na produkcji po deployu; sonda pójdzie wtedy z IP Cloudflare, nie
  z łącza lokalnego, więc wyniki mogą się różnić od przejazdu na `wrangler pages dev`.
