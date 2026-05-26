#!/usr/bin/env python3
"""Generate widocznosc.ai blog graphics (hero + infographic) via kie.ai gpt-image-2.

JEDEN ciemny plik per grafika (obsidian #070810 + sky-blue #0a9cff; infografiki
BIAŁY polski tekst). CSS w Article.astro: hero "stage", infografika auto-invert
w light mode. Klucz: env KIE_API_KEY lub ~/.config/widocznosc-ai/kie.key.

Usage:
    python3 pipeline/widocznosc-kie-images.py
    ONLY=blog-geo-przewodnik python3 pipeline/widocznosc-kie-images.py
"""
import json
import os
import sys
import time
import urllib.request
import urllib.error

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS_DIR = os.path.join(ROOT, "portals", "widocznosc.ai", "src", "assets", "images")

API_BASE = "https://api.kie.ai/api/v1/jobs"
MODEL = "gpt-image-2-text-to-image"
KEY_FILE = os.path.expanduser("~/.config/widocznosc-ai/kie.key")
POLL_INTERVAL = 6
MAX_POLLS = 40
ASPECT = "16:9"
RESOLUTION = "2K"

HERO_STYLE = (
    "Premium editorial tech illustration. Deep obsidian black background "
    "(#070810). Subtle sky-blue accents (#0a9cff) used sparingly for glow "
    "and key elements. Minimalist, sophisticated, high-end AI consultancy "
    "aesthetic. No people, no text, no letters, no logos, no UI mockups. "
    "Abstract geometric, wide cinematic composition. Soft volumetric "
    "lighting. "
)

INFO_STYLE = (
    "Modern editorial infographic. Deep obsidian black background "
    "(#070810). White (#ffffff) Polish text labels, clean sans-serif "
    "typography (Inter font style). Sky-blue (#0a9cff) accents for "
    "highlights and the key element. Minimal, premium, technical aesthetic "
    "– like a high-end consultancy report. Crisp lines, generous spacing, "
    "no decorative clutter. "
)

SPECS = [
    # ── GEO wave 2: 4 specjalne (zamiana orange + inline SVG na sky-blue) ──
    {
        "slug": "blog-geo-boty-ai-przewodnik",
        "prompt": (
            HERO_STYLE
            + "Abstract geometric crawler visualization: stylized "
            "spider/bot silhouettes (purely geometric, not realistic) "
            "traversing a structured grid of website pages, with luminous "
            "sky-blue beam paths connecting bots to grid cells. Clean vector "
            "feel, cybersecurity/web-crawling aesthetic. Represents AI bots "
            "(GPTBot, ClaudeBot) indexing a site."
        ),
    },
    {
        "slug": "infographic-geo-boty-ai-przewodnik",
        "prompt": (
            INFO_STYLE
            + "TITLE on top in Polish (white): '13 botów AI – kto indeksuje "
            "Twoją stronę'. Show a 4-column matrix with white Polish column "
            "headers: 'TRENING', 'WYSZUKIWANIE', 'NA ŻĄDANIE', 'COMMON "
            "CRAWL'. Under each header list bot names in mono font, each in a "
            "small rounded box with a tiny sky-blue check dot: column 1 "
            "'GPTBot', 'ClaudeBot', 'Google-Extended'; column 2 "
            "'OAI-SearchBot', 'PerplexityBot', 'Claude-SearchBot'; column 3 "
            "'ChatGPT-User', 'Claude-Web', 'Perplexity-User'; column 4 "
            "'CCBot', 'Applebot-Extended', 'GoogleOther', 'Google-NotebookLM'. "
            "Bottom caption: 'PEŁNE POKRYCIE = ZEZWÓL NA WSZYSTKIE 13 W "
            "ROBOTS.TXT'."
        ),
    },
    {
        "slug": "blog-geo-query-fan-out",
        "prompt": (
            HERO_STYLE
            + "A single glowing sky-blue node at the left branching outward "
            "into a fractal network of many smaller sub-query nodes, "
            "interconnected with thin luminous lines. Tree/fractal expansion "
            "topology, technical diagram feel. Represents Google AI Mode "
            "query fan-out decomposition. Left-to-right expansion."
        ),
    },
    {
        "slug": "infographic-geo-query-fan-out",
        "prompt": (
            INFO_STYLE
            + "TITLE on top in Polish (white): 'Query fan-out – jak jedno "
            "pytanie rozkłada się na wiele'. Horizontal flow: on the left a "
            "single rounded box 'PYTANIE UŻYTKOWNIKA' (sky-blue). From it 4 "
            "branches expand right to four labeled cluster boxes: "
            "'PORÓWNAWCZE', 'CENOWE', 'TECHNICZNE', 'OPINIE'. Under each "
            "cluster 2-3 tiny example sub-queries in small text. Bottom "
            "caption: '1 PROMPT → 4 GRUPY INTENCJI → 14 PODZAPYTAŃ'."
        ),
    },
    {
        "slug": "blog-geo-topical-authority",
        "prompt": (
            HERO_STYLE
            + "Abstract knowledge-graph architecture: a tall central pillar "
            "with glowing sky-blue edges, surrounded by interconnected "
            "cluster nodes radiating outward in a hub-and-spoke topology, "
            "hierarchical structure. Represents pillar + cluster content "
            "strategy for topical authority. Centered composition."
        ),
    },
    {
        "slug": "infographic-geo-topical-authority",
        "prompt": (
            INFO_STYLE
            + "TITLE on top in Polish (white): 'Pillar + cluster – "
            "architektura topical authority'. Hub-and-spoke diagram: a "
            "central rounded box 'STRONA PILLAR' (sky-blue, glowing) in the "
            "middle, with 8 smaller rounded boxes labeled 'CLUSTER 1' … "
            "'CLUSTER 8' arranged in a circle around it. Solid sky-blue lines "
            "connect each cluster to the pillar; thinner gray dashed lines "
            "connect adjacent clusters. Two small callouts: 'Cluster → "
            "Pillar (2×)' and 'Cluster → Cluster (3–5×)'. Bottom caption: "
            "'TOP 10 DOMEN W NISZY = 46% CYTOWAŃ AI'."
        ),
    },
    {
        "slug": "blog-geo-share-of-voice",
        "prompt": (
            HERO_STYLE
            + "Abstract horizontal bar-chart visualization with five stacked "
            "horizontal bars of varying lengths; the dominant bar glows "
            "bright sky-blue, the others are muted dark gray. Premium "
            "analytics dashboard aesthetic. Represents brand share of voice "
            "in AI conversations. Clean, data-driven."
        ),
    },
    {
        "slug": "infographic-geo-share-of-voice",
        "prompt": (
            INFO_STYLE
            + "TITLE on top in Polish (white): 'Share of Voice – jak liczymy "
            "widoczność marki w AI'. Show a horizontal bar chart with 5 bars "
            "labeled in Polish: 'Konkurent A' (32%), 'Konkurent B' (25%), "
            "'Twoja marka' (21%, glowing sky-blue, emphasized), 'Konkurent C' "
            "(14%), 'Pozostali' (8%). To the right a clean formula box: 'SoV "
            "= wzmianki Twojej marki / wszystkie wzmianki × 100%' with example "
            "'47 / 222 = 21%'. Bottom caption: '30 ZAPYTAŃ × 4 PLATFORMY × 5 "
            "URUCHOMIEŃ = 600 TESTÓW'."
        ),
    },
    # ── (wave 1 GEO – już wygenerowane, zostawione dla referencji) ────
    {
        "slug": "blog-geo-przewodnik",
        "prompt": (
            HERO_STYLE
            + "Abstract visualization of Generative Engine Optimization: a "
            "glowing sky-blue brand mark at the center of concentric radar "
            "orbits, with citation links pulling toward it from several AI "
            "answer panels around the edges. Conveys 'brand cited across AI "
            "engines'. Centered composition, generous negative space."
        ),
    },
    {
        "slug": "infographic-geo-przewodnik",
        "prompt": (
            INFO_STYLE
            + "TITLE on top in Polish (white): 'SEO vs AEO vs GEO – czym się "
            "różnią'. Show three columns side by side, each a rounded card "
            "with a white heading and two short lines: 'SEO – cel: pozycja w "
            "linkach; miara: kliknięcia', 'AEO – cel: odpowiedź w snippecie; "
            "miara: wyświetlenia', 'GEO – cel: cytowanie w odpowiedzi AI; "
            "miara: wzmianki' (the GEO column highlighted in sky-blue). "
            "Bottom caption: 'GEO WALCZY O CYTOWANIE, NIE O KLIKNIĘCIE'."
        ),
    },
    # ── GEO / czym-jest-geo ───────────────────────────────────────────
    {
        "slug": "blog-geo-czym-jest-geo",
        "prompt": (
            HERO_STYLE
            + "Abstract split visualization: on the left a classic list of "
            "search-result link bars, on the right a single glowing sky-blue "
            "AI answer panel with a citation. Conveys the shift from ranked "
            "links to a synthesized cited answer. Balanced composition."
        ),
    },
    {
        "slug": "infographic-geo-czym-jest-geo",
        "prompt": (
            INFO_STYLE
            + "TITLE on top in Polish (white): 'Czym GEO różni się od SEO'. "
            "Show two columns side by side: 'SEO' (icon of a list of links; "
            "lines: 'Cel: wysoka pozycja w wynikach', 'Miara: kliknięcia i "
            "ruch') and 'GEO' (sky-blue, icon of an AI answer bubble; lines: "
            "'Cel: cytowanie przez modele AI', 'Miara: wzmianki i cytowania'). "
            "Bottom caption: 'SEO WALCZY O KLIKNIĘCIE, GEO O CYTOWANIE'."
        ),
    },
    # ── GEO / audyt-widocznosci-marki ─────────────────────────────────
    {
        "slug": "blog-geo-audyt-widocznosci-marki",
        "prompt": (
            HERO_STYLE
            + "Abstract visualization of a brand-visibility audit across AI "
            "engines: a glowing sky-blue brand node measured by several "
            "gauge/meter arcs, with faint scan lines sweeping across data "
            "points. Conveys 'measuring how AI sees a brand'. Wide "
            "composition."
        ),
    },
    {
        "slug": "infographic-geo-audyt-widocznosci-marki",
        "prompt": (
            INFO_STYLE
            + "TITLE on top in Polish (white): 'Audyt widoczności marki w AI "
            "– 6 kroków'. Show a left-to-right numbered flow of 6 rounded "
            "steps with short white Polish labels: '1. BIBLIOTEKA ZAPYTAŃ', "
            "'2. ODPYTANIE SILNIKÓW AI', '3. POMIAR (Citation, SoV, Mention)' "
            "(sky-blue, key step), '4. AUDYT TECHNICZNY', '5. LUKI I "
            "PRIORYTETY', '6. MONITORING'. Thin sky-blue arrows connect the "
            "steps. Bottom caption: 'OD ZAPYTAŃ DO STAŁEGO MONITORINGU'."
        ),
    },
    # ── GEO / geo-dla-ecommerce ───────────────────────────────────────
    {
        "slug": "blog-geo-geo-dla-ecommerce",
        "prompt": (
            HERO_STYLE
            + "Abstract visualization of e-commerce in AI answers: glowing "
            "sky-blue product cards flowing from a catalogue grid into a "
            "single AI answer panel that recommends them. Conveys 'products "
            "surfaced in AI responses'. Left-to-right flow."
        ),
    },
    {
        "slug": "infographic-geo-geo-dla-ecommerce",
        "prompt": (
            INFO_STYLE
            + "TITLE on top in Polish (white): 'Dane strukturalne produktu "
            "dla GEO'. Show five rounded cards in a row, each with a white "
            "Polish label and a tiny icon: 'Product – nazwa, opis, marka', "
            "'Offer – cena, dostępność', 'AggregateRating – oceny' "
            "(sky-blue), 'MerchantListing – feed produktowy', 'FAQPage – "
            "pytania o produkt'. Bottom caption: 'SCHEMA = PRODUKT CZYTELNY "
            "DLA AI'."
        ),
    },
    # ── GEO / geo-dla-lokalnego-biznesu ───────────────────────────────
    {
        "slug": "blog-geo-geo-dla-lokalnego-biznesu",
        "prompt": (
            HERO_STYLE
            + "Abstract visualization of local business in AI search: a "
            "glowing sky-blue location pin connected to an AI answer panel, "
            "surrounded by faint map-grid lines and review stars. Conveys "
            "'local brand recommended by AI'. Centered composition."
        ),
    },
    {
        "slug": "infographic-geo-geo-dla-lokalnego-biznesu",
        "prompt": (
            INFO_STYLE
            + "TITLE on top in Polish (white): 'GEO dla lokalnego biznesu – "
            "fundamenty'. Show four rounded cards with white Polish headings "
            "and short notes: 'SPÓJNOŚĆ NAP – nazwa, adres, telefon wszędzie "
            "takie same', 'JSON-LD LocalBusiness – dane firmy dla AI' "
            "(sky-blue), 'RECENZJE JAKO TREŚĆ – opinie zasilają odpowiedzi', "
            "'llms.txt – wskazówka dla botów'. Bottom caption: 'SPÓJNE DANE "
            "= AI POLECA TWOJĄ FIRMĘ'."
        ),
    },
    # ── GEO / jak-llm-cytuja-zrodla ───────────────────────────────────
    {
        "slug": "blog-geo-jak-llm-cytuja-zrodla",
        "prompt": (
            HERO_STYLE
            + "Abstract visualization of how LLMs cite sources: several "
            "document fragments on the left, a few selected and pulled by "
            "glowing sky-blue beams into an AI answer with small citation "
            "markers. Conveys 'a model picks and cites the best sources'. "
            "Left-to-right flow."
        ),
    },
    {
        "slug": "infographic-geo-jak-llm-cytuja-zrodla",
        "prompt": (
            INFO_STYLE
            + "TITLE on top in Polish (white): 'Co decyduje, że LLM zacytuje "
            "Twoje źródło'. Show five rounded chips/bars stacked, each a "
            "white Polish factor: 'TRAFNOŚĆ SEMANTYCZNA' (sky-blue, "
            "najważniejsze), 'AUTORYTET DOMENY', 'ŚWIEŻOŚĆ TREŚCI', "
            "'STRUKTURA I NAGŁÓWKI', 'GĘSTOŚĆ DANYCH I FAKTÓW'. Bottom "
            "caption: 'CYTOWANIE TO SUMA SYGNAŁÓW, NIE JEDEN TRIK'."
        ),
    },
    # ── GEO / llms-txt ────────────────────────────────────────────────
    {
        "slug": "blog-geo-llms-txt",
        "prompt": (
            HERO_STYLE
            + "Abstract visualization of an llms.txt signal file: a single "
            "glowing sky-blue document emitting a clear guiding beam toward "
            "stylized geometric crawler bots approaching a website grid. "
            "Conveys 'a file that guides AI crawlers'. Wide composition."
        ),
    },
    {
        "slug": "infographic-geo-llms-txt",
        "prompt": (
            INFO_STYLE
            + "TITLE on top in Polish (white): 'robots.txt vs sitemap.xml vs "
            "llms.txt'. Show three rounded cards side by side, each with a "
            "white Polish heading and one line: 'robots.txt – co bot MOŻE "
            "odwiedzić', 'sitemap.xml – GDZIE są strony', 'llms.txt – KTÓRE "
            "treści są ważne dla AI' (sky-blue, highlighted). Bottom caption: "
            "'llms.txt WSKAZUJE AI NAJWAŻNIEJSZĄ TREŚĆ'."
        ),
    },
    # ── GEO / najczestsze-bledy-geo ───────────────────────────────────
    {
        "slug": "blog-geo-najczestsze-bledy-geo",
        "prompt": (
            HERO_STYLE
            + "Abstract visualization of GEO mistakes: a website grid where "
            "several blocks are dimmed or blocked by faint barrier lines, "
            "while a sky-blue scan struggles to reach them. Conveys 'content "
            "invisible to AI'. Wide composition, restrained."
        ),
    },
    {
        "slug": "infographic-geo-najczestsze-bledy-geo",
        "prompt": (
            INFO_STYLE
            + "TITLE on top in Polish (white): '6 najczęstszych błędów GEO'. "
            "Show a 2x3 grid of six rounded cards, each with a white Polish "
            "label and a small warning icon: 'MYLENIE SEO z GEO', 'BLOKADA "
            "BOTÓW AI (robots.txt, firewall)', 'TREŚĆ TYLKO W JAVASCRIPT', "
            "'TREŚĆ BEZ DANYCH I FAKTÓW', 'BRAK STRUKTURY SEMANTYCZNEJ', "
            "'BRAK POMIARU WIDOCZNOŚCI'. Bottom caption: 'KAŻDY BŁĄD = MARKA "
            "NIEWIDOCZNA DLA AI'."
        ),
    },
    # ── GEO / narzedzia-monitoring-wzmianek ───────────────────────────
    {
        "slug": "blog-geo-narzedzia-monitoring-wzmianek",
        "prompt": (
            HERO_STYLE
            + "Abstract visualization of brand-mention monitoring in AI: a "
            "glowing sky-blue radar/dashboard sweep detecting brand mention "
            "blips scattered across AI answer panels. Conveys 'tracking "
            "brand mentions in LLMs'. Centered composition."
        ),
    },
    {
        "slug": "infographic-geo-narzedzia-monitoring-wzmianek",
        "prompt": (
            INFO_STYLE
            + "TITLE on top in Polish (white): 'Wzmianka vs cytowanie – co "
            "mierzą narzędzia'. Show two rounded cards: 'WZMIANKA – marka "
            "wymieniona w odpowiedzi AI (bez linku)' and 'CYTOWANIE – marka "
            "podana jako źródło z odnośnikiem' (sky-blue). Below, a small row "
            "of four neutral chips labeled 'ChatGPT', 'Gemini', 'Perplexity', "
            "'Copilot'. Bottom caption: 'NARZĘDZIA ODPYTUJĄ SILNIKI I LICZĄ "
            "OBA SYGNAŁY'."
        ),
    },
    # ── GEO / roi-z-geo ───────────────────────────────────────────────
    {
        "slug": "blog-geo-roi-z-geo",
        "prompt": (
            HERO_STYLE
            + "Abstract visualization of GEO ROI: a glowing sky-blue upward "
            "trend line rising through three stacked tiers, with faint data "
            "points and a subtle funnel shape. Conveys 'visibility turning "
            "into business results'. Left-to-right ascending composition."
        ),
    },
    {
        "slug": "infographic-geo-roi-z-geo",
        "prompt": (
            INFO_STYLE
            + "TITLE on top in Polish (white): 'Hierarchia KPI w GEO'. Show a "
            "three-level pyramid or three stacked tiers, bottom to top: "
            "'WIDOCZNOŚĆ – Citation Rate, Share of Voice', 'ZAANGAŻOWANIE – "
            "ruch i sesje z AI' (sky-blue, middle), 'BIZNES – leady, "
            "konwersje, ROI' (top). Thin sky-blue arrows pointing upward "
            "between tiers. Bottom caption: 'OD CYTOWAŃ DO PRZYCHODU'."
        ),
    },
    # ── GEO / schema-org-dane-strukturalne ────────────────────────────
    {
        "slug": "blog-geo-schema-org-dane-strukturalne",
        "prompt": (
            HERO_STYLE
            + "Abstract visualization of structured data: glowing sky-blue "
            "nested bracket/graph nodes (a knowledge graph) feeding clean "
            "labeled data into an AI answer panel. Conveys 'schema makes "
            "content machine-readable'. Wide composition."
        ),
    },
    {
        "slug": "infographic-geo-schema-org-dane-strukturalne",
        "prompt": (
            INFO_STYLE
            + "TITLE on top in Polish (white): 'Schema.org w erze GEO'. Show "
            "a central rounded node '@graph' (sky-blue) connected to five "
            "smaller nodes with white Polish labels: 'Organization', "
            "'Article', 'FAQPage', 'HowTo', 'Product'. Plus a small side "
            "label 'sameAs – spójność encji'. Hub-and-spoke layout. Bottom "
            "caption: 'DANE STRUKTURALNE = TREŚĆ ZROZUMIAŁA DLA AI'."
        ),
    },
]


def load_api_key() -> str:
    key = os.environ.get("KIE_API_KEY", "").strip()
    if key:
        return key
    if os.path.exists(KEY_FILE):
        with open(KEY_FILE, "r") as f:
            return f.read().strip()
    raise SystemExit(f"ERROR: brak klucza. KIE_API_KEY lub {KEY_FILE}")


def _urlopen_retry(req, timeout: int, attempts: int = 5):
    """urlopen z retry na transient błędach sieci (DNS/timeout na WSL)."""
    last = None
    for a in range(attempts):
        try:
            return urllib.request.urlopen(req, timeout=timeout)
        except (urllib.error.URLError, TimeoutError, OSError) as e:
            last = e
            time.sleep(min(5 * (a + 1), 30))
    raise last


def post_json(url: str, payload: dict, api_key: str) -> dict:
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with _urlopen_retry(req, timeout=60) as resp:
        return json.loads(resp.read().decode("utf-8"))


def get_status(task_id: str, api_key: str) -> dict:
    req = urllib.request.Request(
        f"{API_BASE}/recordInfo?taskId={task_id}",
        headers={"Authorization": f"Bearer {api_key}"},
        method="GET",
    )
    with _urlopen_retry(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def download(url: str, out_path: str) -> int:
    req = urllib.request.Request(
        url, headers={"User-Agent": "Mozilla/5.0 widocznosc-ai-bot/1.0"}
    )
    with _urlopen_retry(req, timeout=120) as r:
        png = r.read()
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "wb") as f:
        f.write(png)
    return len(png)


def generate_one(spec: dict, api_key: str) -> bool:
    slug = spec["slug"]
    out_path = os.path.join(ASSETS_DIR, f"{slug}.png")
    print(f"\n→ {slug}  ({ASPECT} {RESOLUTION})", flush=True)

    create = post_json(
        f"{API_BASE}/createTask",
        {
            "model": MODEL,
            "input": {
                "prompt": spec["prompt"],
                "aspect_ratio": ASPECT,
                "resolution": RESOLUTION,
            },
        },
        api_key,
    )
    if create.get("code") != 200:
        print(f"  ✗ createTask: {create.get('code')} {create.get('msg')}", file=sys.stderr, flush=True)
        return False
    task_id = create["data"]["taskId"]
    print(f"  taskId: {task_id}  ·  polling…", flush=True)

    for i in range(MAX_POLLS):
        time.sleep(POLL_INTERVAL)
        info = get_status(task_id, api_key)
        data = info.get("data") or {}
        state = data.get("state")
        if state == "success":
            result = json.loads(data.get("resultJson") or "{}")
            urls = result.get("resultUrls") or [result.get("imageUrl")]
            url = next((u for u in urls if u), None)
            if not url:
                print(f"  ✗ success bez URL: {data}", file=sys.stderr, flush=True)
                return False
            kb = download(url, out_path) // 1024
            print(f"  ✓ {kb} KB · {data.get('creditsConsumed','?')} kredytów · {slug}", flush=True)
            return True
        if state in ("failed", "fail"):
            print(f"  ✗ failed: {data.get('failMsg') or data}", file=sys.stderr, flush=True)
            return False

    print(f"  ✗ timeout {MAX_POLLS*POLL_INTERVAL}s · {slug}", file=sys.stderr, flush=True)
    return False


def main() -> int:
    api_key = load_api_key()
    only = {s.strip() for s in os.environ.get("ONLY", "").split(",") if s.strip()}
    items = [s for s in SPECS if not only or s["slug"] in only]
    if not items:
        print(f"ERROR: ONLY={only} nic nie dopasowało", file=sys.stderr)
        return 1
    print(f"Model: {MODEL} · {len(items)} grafik(a)", flush=True)
    ok = 0
    for s in items:
        try:
            if generate_one(s, api_key):
                ok += 1
        except Exception as e:
            print(f"  ✗ wyjątek dla {s['slug']}: {e}", file=sys.stderr, flush=True)
    print(f"\nGotowe: {ok}/{len(items)}", flush=True)
    return 0 if ok == len(items) else 2


if __name__ == "__main__":
    sys.exit(main())
