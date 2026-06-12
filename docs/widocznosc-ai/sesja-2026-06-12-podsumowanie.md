# Sesja 2026-06-12 – artykuł-most grupa-icea.pl → widocznosc.ai

## Co zrobiono

### 1. Artykuł „Jak sprawdzić, czy AI poleca Twoją markę?" (commit 22fc551 + d0d87be)

Pierwszy artykuł pisany dla **grupa-icea.pl** (flagowa domena, WordPress – poza repo) w jakości widocznosc.ai.
Cel strategiczny: most topical authority + realne linkowanie wspierające cross-domain entity
(schema ICEA ↔ widocznosc.ai z sesji 2026-06-08).

- **Pozycjonowanie w lejku** – TOFU na grupa-icea.pl („test w 15 minut" dla właścicieli firm);
  świadomie NIE dubluje pogłębionego przewodnika `widocznosc.ai/geo/audyt-widocznosci-marki/` (ten sam autor!),
  tylko linkuje do niego jako pogłębienia.
- **Linki-most do widocznosc.ai** – strona główna (disclosure „projekt Grupy ICEA"), `/narzedzia/brand-check/` (×2),
  `/narzedzia/fanout/`, `/geo/czym-jest-geo/`, `/geo/audyt-widocznosci-marki/`.
- **Linki wewnętrzne grupa-icea** – badanie AI Overviews (400 stron), artykuł query fan-out.
- **Deliverables** – `portals/grupa-icea.pl/artykuly/jak-sprawdzic-czy-ai-poleca-twoja-marke.md` + `.html`
  (1:1 do wklejenia w WordPress, meta dane w komentarzu); spec w `docs/superpowers/specs/2026-06-12-...-design.md`.
- **Fact-check** – dual-engine (WebSearch + GPT-5.5) 4/4 twierdzeń potwierdzonych, 0 poprawek:
  10 mln Polaków w ChatGPT (Mediapanel X 2025), ~24% rozmów = szukanie informacji (NBER w34255),
  ChatGPT search „m.in. Bing" + OAI-SearchBot, własny indeks Perplexity.
- **Decyzja Mateusza po review** – tytuł/H1/slug uogólnione z „czy ChatGPT poleca" na „czy AI poleca"
  (artykuł traktuje 3 silniki równorzędnie); silniki w podtytule, meta title pod „widoczność marki w AI".

### 2. Hero + infografika w stylu ICEA przez kie.ai (commit bb7b11d)

- **Styl wyciągnięty z `branding guidelines/ICEA_Brand Manual (1).pdf`** (87 stron, czytany PyMuPDF):
  Midnight Blue `#000623`, Blue `#5768FF`, Orange `#F6704C` (akcent, NIGDY obok Blue ani Off White),
  Off White `#F9F9F9`, motyw rozet, font Roobert (Medium/Regular).
- **Reużywalny generator** – `pipeline/grupa-icea-article-images.py` (klon flow z widocznosc-infographics-gen,
  model `gpt-image-2-text-to-image`, styl w `STYLE_ICEA`).
- **Gotcha gpt-image-2** – pierwsza generacja infografiki dosypała akcenty („ćzy", „poléca");
  fix: instrukcja „EXACT spelling letter by letter + zakaz dodawania diakrytyków do liter, które ich nie mają" –
  druga generacja czysta. QA przez crop+upscale 2× (PIL) i odczyt Read.
- Hero bez tekstu (dymek czatu + pomarańczowy sygnał marki + rozeta), infografika 4 kroki testu po polsku.
- Koszt: 18 kredytów (3 × 6).

## Infra / klucze

- **Klucz kie.ai odświeżony** – podany przez Mateusza, zapisany w `~/.config/widocznosc-ai/kie.key` (chmod 600,
  poza repo). Odblokowuje też zaległy przejazd blog-polish (czekał na klucz wg memory).
- **Senuto MCP zwracało 404** na obu bazach (legacy + 2.0) – do sprawdzenia klucz/API; keyword research
  oparty o `docs/widocznosc-ai/keyword-map.md` (2026-05-06).

## Stan / do zrobienia

- 4 commity (22fc551, bb7b11d, d0d87be + podsumowanie) NIE wypchnięte – czekają na „push" Mateusza.
- Publikacja po stronie redakcji WordPress: wgrać obrazki do biblioteki mediów, podmienić `src` infografiki,
  ustawić hero jako obrazek wyróżniający, zweryfikować URL `/kontakt/` (założony standardowy).
- Pomysł na przyszłość: kolejne mosty z grupa-icea.pl (np. „pozycjonowanie w ChatGPT" – ryzyko kanibalizacji
  z pillarem widocznosc.ai omówione i odłożone).
