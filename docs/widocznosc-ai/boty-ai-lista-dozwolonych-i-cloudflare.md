# Boty AI: kogo nie blokować, skąd wziąć adresy IP i jak to sprawdzić w Cloudflare

Stan na 17.08.2026 r. Wszystkie listy IP i tokeny pochodzą z dokumentacji producentów –
odnośniki znajdują się w sekcji „Źródła adresów IP”.

## 1. Dwie różne decyzje, a nie jedna

Blokowanie botów AI to nie jeden przełącznik, ale dwie osobne decyzje:

- **Czy chcesz być cytowany w odpowiedziach AI?** Wtedy boty wyszukiwawcze i on-demand
  muszą mieć dostęp. Ich zablokowanie to bezpośrednia utrata widoczności – dziś, nie kiedyś.
- **Czy zgadzasz się na trenowanie modeli na Twoich treściach?** To decyzja biznesowa
  i licencyjna. Blokada jest legalna i sensowna dla wydawców, ale niesie za sobą koszt: model,
  który nigdy nie widział Twojej marki, nie przywoła jej z pamięci.

Rozbieżność wynika z faktu, że jeden dostawca ma kilka botów o różnych rolach. Blokada
`GPTBot` nie usuwa Cię z ChatGPT Search – od tego jest `OAI-SearchBot`. I odwrotnie:
zablokowanie bota `OAI-SearchBot` pozbawia Cię cytowań, a treningu i tak nie powstrzyma,
ponieważ dane mogą trafić do modelu przez Common Crawl.

## 2. Lista botów, których nie należy blokować

Jeśli celem jest widoczność w wyszukiwaniu AI, poniższe tokeny muszą mieć dostęp. Kolumna
„token” to dokładnie ten ciąg, który dopasowuje reguła w `robots.txt` (bez rozróżniania
wielkości liter).

### Warstwa krytyczna – bez nich nie ma cytowań

| Token | Właściciel | Rola |
|---|---|---|
| `OAI-SearchBot` | OpenAI | Indeks dla wyszukiwarki w ChatGPT. To on decyduje o cytowaniu. |
| `ChatGPT-User` | OpenAI | Pobranie na żądanie, gdy użytkownik poda link lub ChatGPT sięga po stronę w trakcie rozmowy. |
| `Claude-SearchBot` | Anthropic | Indeks wyszukiwania w Claude. |
| `Claude-User` | Anthropic | Pobranie na żądanie w odpowiedzi na pytanie użytkownika. |
| `PerplexityBot` | Perplexity | Indeks Perplexity. |
| `Perplexity-User` | Perplexity | Pobranie na żądanie (deep research / głębokie wyszukiwanie). |
| `Googlebot` | Google | Podstawa AI Overviews i zakotwiczenia (groundingu) modelu Gemini. Blokada = całkowite zniknięcie z Google. |
| `bingbot` | Microsoft | Indeks Bing, z którego korzysta Microsoft Copilot. |
| `Applebot` | Apple | Indeks Siri i Spotlight; niezależny od `Applebot-Extended`. |

Uwaga na `Claude-User`: Cloudflare klasyfikuje go jako *AI Crawler*, więc zbiorcze
blokowanie botów treningowych wycina go razem z nimi – szczegóły w sekcji 4.

### Warstwa treningowa – blokuj świadomie, nie odruchowo

| Token | Właściciel | Co w praktyce kontroluje |
|---|---|---|
| `GPTBot` | OpenAI | Zbieranie treści na potrzeby treningu modeli GPT. |
| `ClaudeBot` | Anthropic | Zbieranie treści na potrzeby treningu modeli Claude. |
| `Google-Extended` | Google | **Nie jest crawlerem.** To wyłącznie przełącznik w `robots.txt`, którym deklarujesz, czy Google może użyć już pobranej treści do treningu i zakotwiczenia Gemini. Treści pobiera zawsze `Googlebot`. Dlatego `Google-Extended` nie ma i nie będzie miał własnej listy IP. |
| `CCBot` | Common Crawl | Otwarte archiwum, z którego korzysta większość twórców modeli. Blokada bota CCBot odcina Cię naraz od wielu dostawców, także tych, o których nie słyszałeś. |
| `Applebot-Extended` | Apple | Analogicznie do `Google-Extended` – kontrola użycia treści w Apple Intelligence, a nie osobny crawler. |

### Pozostałe boty

`GoogleOther`, `Google-NotebookLM`, `OAI-AdsBot`, `meta-externalagent` (Meta AI),
`Amazonbot`. To nisza, ale każdy z nich to osobny token – blokada „wszystkiego, co
wygląda na AI” jedną regułą WAF blokuje je masowo razem z warstwą krytyczną.

### Minimalny `robots.txt`

Odblokowanie dostępu dla warstwy krytycznej przy jednoczesnym zablokowaniu treningu
wygląda tak:

```
User-agent: OAI-SearchBot
User-agent: ChatGPT-User
User-agent: Claude-SearchBot
User-agent: Claude-User
User-agent: PerplexityBot
User-agent: Perplexity-User
Allow: /

User-agent: GPTBot
User-agent: ClaudeBot
User-agent: Google-Extended
Disallow: /

Sitemap: https://twoja-domena.pl/sitemap.xml
```

Brak reguły dla danego bota oznacza dostęp – `Allow: /` jest tutaj deklaracją intencji
dla człowieka czytającego plik, a nie technicznym wymogiem.

## 3. Źródła adresów IP

**Adresy ulegają zmianom** – i właśnie dlatego producenci publikują je jako pliki JSON pod
stałym adresem URL, a nie jako statyczną listę w dokumentacji. Stały jest URL, nie
zawartość. Poniżej stan pobrany 17.08.2026 r.:

| Bot / grupa | URL listy | Prefiksów | Data listy |
|---|---|---|---|
| GPTBot | `https://openai.com/gptbot.json` | 21 | 2025-10-30 |
| OAI-SearchBot | `https://openai.com/searchbot.json` | 35 | 2026-01-02 |
| OAI-AdsBot | `https://openai.com/adsbot.json` | 2 | 2026-05-12 |
| ChatGPT-User | `https://openai.com/chatgpt-user.json` | – | punkt końcowy (endpoint) zwraca obecnie błąd HTTP 400 (zgłaszane na forum OpenAI) |
| ClaudeBot, Claude-User, Claude-SearchBot (wspólna) | `https://claude.com/crawling/bots.json` | 23 | 2026-08-13 |
| Googlebot | `https://developers.google.com/search/apis/ipranges/googlebot.json` | 315 | 2026-08-14 |
| Google – crawlery specjalne | `https://developers.google.com/search/apis/ipranges/special-crawlers.json` | 270 | 2026-08-14 |
| Google – pobrania na żądanie użytkownika | `https://developers.google.com/search/apis/ipranges/user-triggered-fetchers-google.json` | 494 | 2026-08-14 |
| PerplexityBot | `https://www.perplexity.ai/perplexitybot.json` | 8 | 2025-02-07 |
| Perplexity-User | `https://www.perplexity.ai/perplexity-user.json` | 4 | 2025-10-17 |
| Applebot | `https://search.developer.apple.com/applebot.json` | 33 | 2026-07-31 |
| bingbot | `https://www.bing.com/toolbox/bingbot.json` | 28 | 2024-01-03 |
| CCBot | brak oficjalnej listy | – | korzysta z adresów AWS, weryfikacja po IP jest niewykonalna |

Wszystkie pliki mają tę samą strukturę: `creationTime` + tablica `prefixes` z polami
`ipv4Prefix` / `ipv6Prefix`.

Co z tego wynika w praktyce:

- **Perplexity używa pojedynczych adresów `/32`** – łącznie 12 hostów. Są one najbardziej
  podatne na zmiany z całego zestawienia; jedna modyfikacja infrastruktury i Twoja lista
  dozwolonych adresów staje się bezużyteczna.
- **Google ma prawie 1100 prefiksów w trzech plikach** i podmienia je co kilka dni.
  Ręczne przepisywanie tego do zapory WAF mija się z celem.
- **Anthropic wprost odradza blokowanie po IP**: zablokowanie adresów utrudnia im
  odczyt Twojego pliku `robots.txt`, przez co wstrzymanie indeksowania (opt-out) może
  przestać działać.

### Odświeżanie list

```bash
for u in \
  https://openai.com/gptbot.json \
  https://openai.com/searchbot.json \
  https://claude.com/crawling/bots.json \
  https://developers.google.com/search/apis/ipranges/googlebot.json \
  https://www.perplexity.ai/perplexitybot.json \
  https://search.developer.apple.com/applebot.json \
  https://www.bing.com/toolbox/bingbot.json ; do
  echo "== $u"
  curl -sL -A 'Mozilla/5.0' "$u" \
    | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d["creationTime"], len(d["prefixes"]), "prefiksów")'
done
```

### Lepsza metoda niż lista dozwolonych adresów IP

Google, Bing i Apple pozwalają zweryfikować bota za pomocą odwrotnego DNS (rDNS): rDNS
adresu musi wskazywać na domenę producenta (`googlebot.com`, `google.com`,
`googleusercontent.com`, `search.msn.com`, `applebot.apple.com`), a następnie zwykłe
zapytanie DNS (forward DNS) dla tej nazwy musi zwracać ten sam adres IP. To rozwiązanie
działa bez konieczności utrzymywania listy.

W praktyce jednak w Cloudflare nie musisz robić żadnej z tych rzeczy – CF sam weryfikuje
znane boty i oznacza je jako kategorię „verified bots”. Listy IP są potrzebne dopiero
wtedy, gdy filtrujesz ruch na poziomie serwera lub innej sieci CDN.
## 4. Mapa panelu Cloudflare

Cloudflare przebudował panel w kwietniu 2026 r. i sterowanie botami AI rozpadło się na
dwie niezależne gałęzie w lewej nawigacji domeny: **AI Crawl Control** (decyzje dla
pojedynczych botów) oraz **Security** (reguły ogólne, w tym WAF). Jeśli widzisz starszy
układ, w prawym górnym rogu dowolnej strony w sekcji Security znajdziesz przycisk
„Try new dashboard”.

### Gałąź 1: AI Crawl Control – decyzje dla pojedynczych botów

Pozycje w menu: **Overview**, **Metrics**, **Security**, **Optimization**, **Signals**.

Cała praca odbywa się w zakładce **Security**. Znajdziesz tam tabelę wszystkich znanych
Cloudflare crawlerów z kolumnami:

- **Crawler** – nazwa bota i właściciel.
- **Category** – klasyfikacja Cloudflare: *Search Engine Crawler*, *AI Crawler*,
  *AI Search*, *AI Assistant*, *Archiver*.
- **Bytes Transferred** – ile danych bot faktycznie pobrał.
- **Requests** – rozbicie na *Allowed* i *Unsuccessful*.
- **Block Crawler** – przełącznik blokady dla tego konkretnego bota.

Nad tabelą są filtry (*Select crawler*, *Select operator*, *Add filter*), wybór zakresu
czasu oraz pole **Show inactive crawlers** – bez jego zaznaczenia zobaczysz wyłącznie boty,
które w danym okresie próbowały wejść. Karta **Configure Response** ustawia kod odpowiedzi
i komunikat pokazywany zablokowanym crawlerom.

To jest decydujące źródło informacji: przełącznik **Block Crawler** w pozycji włączonej
oznacza blokadę wprowadzoną w Twojej konfiguracji, a nie domysł na podstawie testu
z zewnątrz.

**Jak czytać kolumnę Requests.** Wartość *Unsuccessful* nie musi oznaczać zadziałania
blokady dla danego bota. Wpadają tam również żądania odrzucone przez ogólną ochronę przed
podszywaniem się – na przykład testy narzędzi zewnętrznych, które ustawiają sobie
User-Agent bota. Jeśli przełącznik **Block Crawler** jest wyłączony, a mimo to widzisz
niezerowe *Unsuccessful*, sprawdź Bot Fight Mode, zanim uznasz, że blokujesz tego bota.

### Gałąź 2: Security – reguły ogólne i WAF

WAF nie jest już osobną pozycją w menu. To najczęstsza przyczyna bezskutecznego szukania –
funkcje zapory rozeszły się na dwie strony w sekcji **Security**:

| Czego szukasz | Gdzie to jest teraz |
|---|---|
| Reguły własne WAF (custom rules) | Security → **Security rules** → *Create rule* → *Custom rules* |
| Rate limiting (ograniczanie liczby żądań) | Security → **Security rules** |
| Reguły zarządzane: Cloudflare Managed Ruleset, OWASP | Security → **Settings** → kategoria *Web application exploits* |
| Bot Fight Mode / Super Bot Fight Mode | Security → **Settings** → kategoria *Bot traffic* |
| Block AI Bots, AI Labyrinth, zarządzany `robots.txt` | Security → **Settings** → kategoria *Bot traffic* |
| Zdarzenia bezpieczeństwa (dawne Security Events) | Security → **Analytics** → zakładka *Events* |
| Ochrona przed DDoS | Security → **Settings** → kategoria *DDoS attacks* |

Strona **Settings** grupuje ustawienia w pięć kategorii według rodzaju zagrożenia:
*Web application exploits*, *DDoS attacks*, *Bot traffic*, *API abuse*, *Client-side
abuse*. Dla botów AI liczy się wyłącznie **Bot traffic**.

### Co daje plan Free

Wbrew pozorom na darmowym planie masz komplet narzędzi potrzebnych do tej diagnozy:
AI Crawl Control z przełącznikami dla pojedynczych botów, **Block AI bots**,
**AI Labyrinth**, zarządzany `robots.txt` oraz **Bot Fight Mode**. Poza zasięgiem
pozostają Super Bot Fight Mode, Bot Management i reguły zarządzane WAF – czyli rzeczy,
które w tej sprawie i tak nie są potrzebne.

Jedno zastrzeżenie do Bot Fight Mode: działa on na całym ruchu domeny i nie da się go
zawęzić do wybranych ścieżek. Wysyła kosztowne obliczeniowo wyzwanie każdemu żądaniu
uznanemu za zautomatyzowane – a crawler nie wykona kodu JavaScript, więc wyzwanie jest
dla niego równoznaczne z blokadą.

### Pułapka: kategorie Cloudflare nie pokrywają się z rolami u producenta

Domyślne blokowanie botów AI działa na kategorii *AI Crawler* i zostawia w spokoju
*AI Search* oraz *AI Assistant*. Podział jest sensowny, ale przypisanie pojedynczych botów
bywa mylące.

Najważniejszy przypadek: **`Claude-User` figuruje jako *AI Crawler***, mimo że według
dokumentacji Anthropic jest botem pobierającym stronę na żądanie użytkownika – jego
odpowiednikiem po stronie OpenAI jest `ChatGPT-User`, którego Cloudflare zalicza do
*AI Assistant*. Skutek jest taki, że blokada „wszystkich botów treningowych” wycina
również odczyt strony w trakcie rozmowy z Claude, choć ChatGPT w tej samej sytuacji stronę
przeczyta.

Wniosek: po włączeniu zbiorczej blokady przejdź tabelę wiersz po wierszu i porównaj ją
z listą z sekcji 2, zamiast ufać kategoriom.

### Cloudflare Pages i inne wyjątki

Jeżeli strona jest hostowana na Cloudflare Pages, ustawienia bezpieczeństwa mogą znajdować
się zarówno w strefie domeny, jak i w samym projekcie Pages. Sprawdź obie warstwy, zanim
uznasz konfigurację za wolną od blokad.

Podobnie wygląda kwestia zarządzanego pliku `robots.txt` – Cloudflare potrafi serwować
własne dyrektywy dla botów AI. W takiej sytuacji plik, który widzisz w repozytorium, nie
jest tym, który faktycznie otrzymuje crawler.

## 5. Kolejność działań przy diagnozie

1. Narzędzie [Dostęp botów AI](https://widocznosc.ai/narzedzia/ai-bots-check/) – pokazuje
   warstwę deklaracji (`robots.txt`) i warstwę serwera (WAF, `X-Robots-Tag`, meta robots,
   sonda po User-Agencie). Daje ogólny ogląd sytuacji.
2. **AI Crawl Control → Security** – przejrzyj kolumnę *Block Crawler* i porównaj ją
   z listą z sekcji 2. To rozstrzyga, które blokady są Twoją decyzją.
3. **Security → Analytics → Events** z filtrem `User Agents` *contains* `GPTBot`
   (następnie `ClaudeBot`, `PerplexityBot`, `OAI-SearchBot`). Dostępne filtry to m.in.
   *Action*, *Host*, *Country*, *ASN*, *IP*, *User Agents* i *Paths*. Akcja *Block* lub
   *Managed Challenge* wskazuje regułę, która odrzuciła ruch; kliknięcie w zdarzenie
   pokazuje, czy to reguła własna, reguła zarządzana, czy Bot Fight Mode.
4. **Security → Security rules** – jeśli winna jest reguła własna, tutaj ją poprawisz.
   **Security → Settings → Bot traffic** – jeśli winny jest Bot Fight Mode albo zbiorcze
   Block AI Bots.
5. Ponowne sprawdzenie po 24 godzinach – crawlery wracają w swoim tempie, a nie na
   żądanie. Postęp śledź w kolumnie *Requests* w AI Crawl Control: rosnące *Allowed*
   oznacza, że boty wróciły.

## Źródła adresów IP

- OpenAI: [dokumentacja botów](https://developers.openai.com/api/docs/bots)
- Anthropic: [artykuł o crawlerach](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler),
  lista pod `https://claude.com/crawling/bots.json`
- Google: [zakresy IP crawlerów](https://developers.google.com/search/apis/ipranges/googlebot.json)
- Perplexity: `https://www.perplexity.ai/perplexitybot.json`
- Apple: `https://search.developer.apple.com/applebot.json`
- Microsoft: `https://www.bing.com/toolbox/bingbot.json`
- Cloudflare: [AI Crawl Control](https://developers.cloudflare.com/ai-crawl-control/),
  [Manage AI crawlers](https://developers.cloudflare.com/ai-crawl-control/features/manage-ai-crawlers/),
  [Security Events](https://developers.cloudflare.com/waf/analytics/security-events/)
