# Boty AI: kogo nie blokować, skąd wziąć adresy IP i jak to sprawdzić w Cloudflare

Stan na 2026-08-17. Wszystkie listy IP i tokeny pochodzą z dokumentacji producentów –
odnośniki w sekcji „Źródła adresów IP".

## 1. Dwie różne decyzje, nie jedna

Blokowanie botów AI to nie jeden przełącznik, tylko dwie osobne decyzje:

- **Czy chcesz być cytowany w odpowiedziach AI?** Wtedy boty wyszukiwawcze i on-demand
  muszą wejść. Ich zablokowanie to bezpośrednia utrata widoczności – dziś, nie kiedyś.
- **Czy zgadzasz się na trening modeli na Twoich treściach?** To decyzja biznesowa
  i licencyjna. Blokada jest legalna i sensowna dla wydawców, ale ma koszt: model,
  który nigdy nie widział Twojej marki, nie przywoła jej z pamięci.

Rozjazd bierze się stąd, że jeden dostawca ma kilka botów o różnych rolach. Blokada
`GPTBot` nie usuwa Cię z ChatGPT Search – od tego jest `OAI-SearchBot`. I odwrotnie:
zablokowanie `OAI-SearchBot` wycina Cię z cytowań, a treningu i tak nie powstrzyma,
bo dane mogą trafić do modelu przez Common Crawl.

## 2. Lista botów, których nie należy blokować

Jeśli celem jest widoczność w wyszukiwaniu AI, te tokeny muszą mieć dostęp. Kolumna
„token" to dokładnie ten ciąg, który dopasowuje `robots.txt` (bez rozróżniania
wielkości liter).

### Warstwa krytyczna – bez nich nie ma cytowań

| Token | Właściciel | Rola |
|---|---|---|
| `OAI-SearchBot` | OpenAI | Indeks dla wyszukiwarki w ChatGPT. To on decyduje o cytowaniu. |
| `ChatGPT-User` | OpenAI | Pobranie na żądanie, gdy użytkownik poda link lub ChatGPT sięga po stronę w trakcie rozmowy. |
| `Claude-SearchBot` | Anthropic | Indeks wyszukiwania w Claude. |
| `Claude-User` | Anthropic | Pobranie na żądanie w odpowiedzi na pytanie użytkownika. |
| `PerplexityBot` | Perplexity | Indeks Perplexity. |
| `Perplexity-User` | Perplexity | Pobranie na żądanie (deep research). |
| `Googlebot` | Google | Podstawa AI Overviews i groundingu Gemini. Blokada = zniknięcie z Google w całości. |
| `bingbot` | Microsoft | Indeks Bing, z którego korzysta Microsoft Copilot. |
| `Applebot` | Apple | Indeks Siri i Spotlight; osobny od `Applebot-Extended`. |

### Warstwa treningowa – blokuj świadomie, nie odruchowo

| Token | Właściciel | Co realnie kontroluje |
|---|---|---|
| `GPTBot` | OpenAI | Zbieranie treści pod trening modeli GPT. |
| `ClaudeBot` | Anthropic | Zbieranie treści pod trening modeli Claude. |
| `Google-Extended` | Google | **Nie jest crawlerem.** To wyłącznie przełącznik w `robots.txt`, którym mówisz, czy Google może użyć już pobranej treści do treningu i groundingu Gemini. Pobiera zawsze `Googlebot`. Dlatego `Google-Extended` nie ma i nie będzie miał własnej listy IP. |
| `CCBot` | Common Crawl | Otwarte archiwum, z którego korzysta większość twórców modeli. Blokada CCBot odcina Cię naraz od wielu dostawców, także tych, o których nie słyszałeś. |
| `Applebot-Extended` | Apple | Analogicznie do `Google-Extended` – kontrola użycia treści w Apple Intelligence, nie osobny crawler. |

### Reszta stawki

`GoogleOther`, `Google-NotebookLM`, `OAI-AdsBot`, `meta-externalagent` (Meta AI),
`Amazonbot`. Nisza, ale każdy z nich to osobny token – blokada „wszystkiego, co
wygląda na AI" jedną regułą WAF zbiera je hurtem razem z warstwą krytyczną.

### Minimalny `robots.txt`

Wpuszczenie warstwy krytycznej przy zablokowanym treningu wygląda tak:

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

Brak reguły dla danego bota oznacza dostęp – `Allow: /` jest tu deklaracją intencji
dla człowieka czytającego plik, nie technicznym wymogiem.

## 3. Źródła adresów IP

**Adresy się zmieniają** – i właśnie dlatego producenci publikują je jako JSON pod
stałym adresem, a nie jako statyczną listę w dokumentacji. Stały jest URL, nie
zawartość. Poniżej stan pobrany 2026-08-17:

| Bot / grupa | URL listy | Prefiksów | Data listy |
|---|---|---|---|
| GPTBot | `https://openai.com/gptbot.json` | 21 | 2025-10-30 |
| OAI-SearchBot | `https://openai.com/searchbot.json` | 35 | 2026-01-02 |
| OAI-AdsBot | `https://openai.com/adsbot.json` | 2 | 2026-05-12 |
| ChatGPT-User | `https://openai.com/chatgpt-user.json` | – | endpoint zwraca dziś HTTP 400 (zgłaszane na forum OpenAI) |
| ClaudeBot, Claude-User, Claude-SearchBot (wspólna) | `https://claude.com/crawling/bots.json` | 23 | 2026-08-13 |
| Googlebot | `https://developers.google.com/search/apis/ipranges/googlebot.json` | 315 | 2026-08-14 |
| Google – crawlery specjalne | `https://developers.google.com/search/apis/ipranges/special-crawlers.json` | 270 | 2026-08-14 |
| Google – pobrania na żądanie użytkownika | `https://developers.google.com/search/apis/ipranges/user-triggered-fetchers-google.json` | 494 | 2026-08-14 |
| PerplexityBot | `https://www.perplexity.ai/perplexitybot.json` | 8 | 2025-02-07 |
| Perplexity-User | `https://www.perplexity.ai/perplexity-user.json` | 4 | 2025-10-17 |
| Applebot | `https://search.developer.apple.com/applebot.json` | 33 | 2026-07-31 |
| bingbot | `https://www.bing.com/toolbox/bingbot.json` | 28 | 2024-01-03 |
| CCBot | brak oficjalnej listy | – | chodzi z adresów AWS, weryfikacja po IP niewykonalna |

Wszystkie pliki mają ten sam kształt: `creationTime` + tablica `prefixes` z polami
`ipv4Prefix` / `ipv6Prefix`.

Co z tego wynika praktycznie:

- **Perplexity używa pojedynczych adresów `/32`** – 12 hostów łącznie. Najbardziej
  kruche z całej stawki; jedna zmiana infrastruktury i Twoja allowlista jest martwa.
- **Google ma prawie 1100 prefiksów w trzech plikach** i podmienia je co kilka dni.
  Ręczne przepisanie tego do WAF-a nie ma sensu.
- **Anthropic wprost odradza blokowanie po IP**: zablokowanie adresów utrudnia im
  odczyt Twojego `robots.txt`, więc opt-out może przestać działać.

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

### Lepsza metoda niż allowlista IP

Google, Bing i Apple pozwalają zweryfikować bota **odwrotnym DNS-em**: rDNS adresu
musi rozwiązać się do domeny producenta (`googlebot.com`, `google.com`,
`googleusercontent.com`, `search.msn.com`, `applebot.apple.com`), a następnie
forward DNS tej nazwy musi wrócić do tego samego adresu. To działa bez utrzymywania
listy.

W praktyce jednak **na Cloudflare nie musisz robić żadnej z tych rzeczy** – CF sam
weryfikuje znane boty i wystawia je jako kategorię „verified bots". Listy IP są
potrzebne dopiero wtedy, gdy filtrujesz ruch na poziomie serwera albo innego CDN-a.

## 4. Jak to sprawdzić w panelu Cloudflare

Poniższa ścieżka odpowiada na pytanie „czy mój serwer wpuszcza boty AI" twardymi
danymi – w odróżnieniu od sondy z zewnątrz, która podszywa się pod User-Agent i
może dać zarówno fałszywy alarm, jak i fałszywy spokój.

### Krok 1 – AI Crawl Control (źródło rozstrzygające)

Wybierz domenę w panelu, następnie **AI Crawl Control** w lewej nawigacji. Zakładki:

- **Overview** – migawka aktywności botów AI.
- **Crawlers** – tabela crawlerów, które pukają do Twoich treści, wraz z tym, jak
  wchodzą w interakcję ze stronami. Tu widzisz per bot, czy żądania w ogóle
  docierają i jaką dostają decyzję.
- **Metrics** – wykresy i analityka ruchu botów w czasie.
- **Robots.txt** – jak boty AI faktycznie traktują Twój `robots.txt`.

Jeśli w **Crawlers** widzisz żądania danego bota z akcją „block", masz odpowiedź:
blokada jest realna, nie jest artefaktem sondy. Jeśli bot w ogóle się nie pojawia,
sprawdź zakres dat – brak wpisów przy świeżej stronie znaczy tylko, że nikt jeszcze
nie przyszedł.

AI Crawl Control działa na wszystkich planach i nie wymaga włączania.

### Krok 2 – przełącznik „Block AI Scrapers and Crawlers"

To najczęstsza przyczyna nieświadomej blokady: jeden przełącznik, włączony kiedyś
„na wszelki wypadek", wycina całą warstwę krytyczną.

Panel → **Security** → **Bots**, potem odnośnik konfiguracji obsługi ruchu botów
przez proxy w prawym górnym rogu → karta **Block AI Scrapers and Crawlers** →
przełącznik.

W tym samym miejscu sprawdź **Bot Fight Mode** / **Super Bot Fight Mode**. Bot
Fight Mode rzuca challenge w każdy ruch uznany za zautomatyzowany, a nie tylko w
boty AI – to on najczęściej odpowiada za 403 dla podszywającego się User-Agenta.

### Krok 3 – reguły własne WAF

Panel → **Security** → **WAF** → **Custom rules**. Przejrzyj reguły pod kątem
wyrażeń odwołujących się do:

- `cf.verified_bot_category` – celowanie w kategorię zweryfikowanych botów,
  w tym „AI Crawler",
- `http.user_agent contains "bot"` – klasyk, który zbiera hurtem wszystko,
- `cf.bot_management.score` z niskim progiem,
- blokad krajowych, jeśli boty wychodzą z regionu, który odcinasz.

Reguła z akcją *Block* lub *Managed Challenge* trafiająca w którykolwiek token z
sekcji 2 to problem – challenge jest dla bota równoznaczny z blokadą, bo żaden
crawler nie rozwiąże JS-owego wyzwania.

### Krok 4 – Analytics → Events, dowód na konkretnym żądaniu

Panel → **Analytics** → zakładka **Events**. Dostępne filtry to m.in. **Action**,
**Host**, **Country**, **ASN**, **IP**, **User Agents** i **Paths**.

Ustaw filtr `User Agents` *contains* `GPTBot` (potem kolejno: `ClaudeBot`,
`PerplexityBot`, `OAI-SearchBot`). Interesuje Cię kolumna akcji:

- brak wyników – nic nie było blokowane w tym oknie czasowym,
- *Block* / *Managed Challenge* – masz nazwę reguły, która to zrobiła; klik
  w zdarzenie pokazuje, czy to reguła własna, managed rule czy Bot Fight Mode.

To krok, który zamienia „coś blokuje boty" w „blokuje je reguła X, wyłączam ją tu".

### Krok 5 – Cloudflare Pages i inne wyjątki

Jeżeli strona stoi na Cloudflare Pages, ustawienia bezpieczeństwa mogą siedzieć
zarówno na strefie domeny, jak i na projekcie Pages. Sprawdź obie warstwy, zanim
uznasz konfigurację za czystą.

Podobnie z zarządzanym `robots.txt` – Cloudflare potrafi serwować własne dyrektywy
dla botów AI. Wtedy plik, który widzisz w repozytorium, nie jest tym, który dostaje
crawler. Rozstrzyga to zakładka **Robots.txt** w AI Crawl Control.

## 5. Kolejność działań przy diagnozie

1. Narzędzie [Dostęp botów AI](https://widocznosc.ai/narzedzia/ai-bots-check/) –
   pokazuje warstwę deklaracji (`robots.txt`) i warstwę serwera (WAF, `X-Robots-Tag`,
   meta robots, sonda po User-Agencie). Daje kierunek.
2. AI Crawl Control → **Crawlers** – potwierdzenie na prawdziwym ruchu.
3. Analytics → **Events** z filtrem po User Agent – wskazanie konkretnej reguły.
4. Wyłączenie reguły albo dopisanie wyjątku dla warstwy krytycznej z sekcji 2.
5. Ponowne sprawdzenie po 24 h – crawlery wracają w swoim tempie, nie na żądanie.

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
