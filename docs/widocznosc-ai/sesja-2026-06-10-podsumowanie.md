# Sesja 2026-06-10 – podsumowanie (widocznosc.ai)

Temat: dodatkowy news o premierze **Claude Fable 5 / Mythos 5** + podpięcie **Anthropic** do pipeline'u newsów (źródło bez RSS). Wszystko wypchnięte na `main`, Cloudflare Pages deployuje.

## 1. Kolektor `type: sitemap` – Anthropic bez RSS (commit `c86f5ef`)

Anthropic nadal nie ma RSS (404, potwierdzone), ale `sitemap.xml` ma 224 wpisy `/news/`, każdy z `<lastmod>` (sort po dacie zwraca najświeższy poprawnie).

- Nowy generyczny kolektor w `pipeline/news-generator-widocznosc/collector.py`:
  - `parse_sitemap_feeds(feeds, max_age_hours)` – fetch sitemap → filtr `<loc>` po `path_filter` + `<lastmod>` w oknie → sort desc → cap `max_items` → scrape `og:title`/`og:description` (fallback `<title>` bez „ \\ Anthropic") → `Signal(source="rss", source_name="Anthropic")` (płynie do `sourceName` jak RSS).
  - Helpery: `_http_get` (UA, patchowalny w testach), `_extract_meta`, `_meta_content` (toleruje kolejność atrybutów), `_parse_lastmod` (ISO+Z).
  - `parse_rss_feeds` pomija `type != rss` (feedparser nie dotyka sitemap). Wpięte w `collect_all_signals` (krok 1b).
- `feeds.yaml`: wpis Anthropic `type: sitemap`, `path_filter: /news/`, `max_items: 6`, BEZ `ai_filter` (źródło zaufane; scorer rankuje).
- **TDD**: 9 nowych testów (`parse_sitemap_feeds` + skip-rss + `_extract_meta`), pełny suite **42 pass**. Żywy test na realnej sitemapie: 6 sygnałów, top = Fable 5.
- Wybór usera vs Google News RSS: własny kolektor = **źródło pierwotne** (zgodne z regułą atrybucji).

## 2. News Fable 5 / Mythos 5 (commity `081f4c5`, `4bfd0dc`, `38199a9`, `eecfb18`, `bc86cc9`)

Plik `portals/widocznosc.ai/src/content/news/claude-fable-5-model-klasy-mythos.md`, data `2026-06-09`, źródło `Anthropic` (blog), pozycja 1 listingu.

Iteracje wg uwag usera:
- **Treść** – struktura domowa (co się stało → `> Nasz komentarz` → analiza → `W skrócie`), bez naginania do marki (komentarz ekspercki o mechanizmie fallback do Opusa 4.8).
- **Hero** – najpierw lokalny stand-in PIL (klucz kie.ai z `.env` martwy – `Unauthorized`), potem podmienione na ilustrację kie.ai gdy user podał świeży klucz w czacie (`4bfd0dc`). Wniosek: lokalny kie.ai w `.env` bywa nieaktualny → prosić o świeży.
- **Rytm + nazwy własne** (`38199a9`) – zróżnicowane długości zdań (krótkie + długie), czytelne ramowanie nazw (firma Stripe, Cognition FrontierCode; tytuły gier kursywą), żeby nie zlewały się z tekstem.
- **Film YouTube** (`38199a9`) – Pokémon FireRed (vision-only), `<figure class="yt-embed">` + nowy responsywny styl 16:9 w `Article.astro` (`youtube-nocookie` + `loading=lazy`).
- **Tabela benchmarków** (`eecfb18`) – pełna, wierna kopia oryginału Anthropic: 15 testów × 5 modeli (Mythos 5/Fable 5, Mythos Preview, Opus 4.8, GPT 5.5, Gemini 3.1 Pro), pogrubiony najwyższy wynik w wierszu, gwiazdki + nota metodologiczna + przypisy (xhigh, Codex/Gemini CLI). Zastąpiła wcześniejszą ubogą tabelkę Fable/Mythos.
- **Ponowne wygładzenie Gemini + podświetlenie kolumny** (`bc86cc9`) – smoother (Gemini 3.1 Pro) bezpieczny (tabela chroniona przez `TABLEROW`, cytat/figure przez BLOCKQUOTE/HTMLTAG – dotknięta tylko proza). Ręczny fix „Projektowanie leków przyspieszył" → „Model przyspieszył projektowanie leków" (smoother nie łapie technicznie-poprawnych-ale-koślawych). Tabela owinięta w `<div class="bench-table">`; nowa reguła CSS podświetla kolumnę flagową (tło `rgba(accent-blue)` + niebieski nagłówek), scope przez wrapper.

### Nowe, reużywalne w `Article.astro` (global `<style is:global>`)
- `figure.yt-embed iframe` – responsywny YouTube 16:9 (do newsów i bloga).
- `.bench-table th/td:nth-child(2)` – podświetlenie 2. kolumny tabeli (wzorzec: owiń tabelę w `<div class="bench-table">`). `<div>` + blank line wokół tabeli markdown parsuje się poprawnie (`<div><table></table></div>`).

## Stan repo

- Branch `main`, wszystko wypchnięte: `081f4c5 → c86f5ef → 4bfd0dc → 38199a9 → eecfb18 → bc86cc9` (między nimi cron/fb-poster).
- Niezwiązane pre-existing zmiany (docs html, infografika png) zostawione nietknięte w working tree.
- Klucz kie.ai podany przez usera = jednorazowy do tej sesji (nie zapisany).

## Otwarte / na potem
- Opcjonalnie `ai_filter: true` dla źródła Anthropic (odsiałby wpisy nie-modelowe, np. o partnerstwach) – świadomie pominięte (źródło zaufane, scorer rankuje).
- Rozważyć dodanie `TABLE`/figure do `PROTECT` w blogu nie jest potrzebne – `TABLEROW` już chroni wiersze tabel.
