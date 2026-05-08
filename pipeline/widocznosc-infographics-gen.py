#!/usr/bin/env python3
"""Generate PNG infographics for widocznosc.ai blog posts via kie.ai/gpt-image-2.

gpt-image-2 obsługuje polski tekst na obrazach, więc generuje "prawdziwe"
infografiki z czytelnymi labelkami – w przeciwieństwie do gpt-image-1
od OpenAI (używanego dla heroes), który wstawia tylko abstrakcyjne kształty.

Klucz API:
    1) env var KIE_API_KEY, lub
    2) plik ~/.config/widocznosc-ai/kie.key (chmod 600)

Klucz NIGDY nie trafia do repo, do logów ani do memory.

Usage:
    python3 pipeline/widocznosc-infographics-gen.py
    # albo wybiórczo:
    ONLY=infographic-query-fan-out python3 pipeline/widocznosc-infographics-gen.py
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
MAX_POLLS = 30  # 6s × 30 = 180s max per image

STYLE_BASE = (
    "Modern editorial infographic. Deep obsidian black background "
    "(#070810). Subtle neon orange accents (#ff6a2e) used for highlights "
    "and key data points. Polish text labels, clean sans-serif typography "
    "(Inter font style). Minimal, premium, technical aesthetic – like "
    "a high-end consultancy report. Crisp lines, generous white space, "
    "no decorative clutter. 16:9 aspect ratio. "
)

INFOGRAPHICS = [
    {
        "slug": "infographic-query-fan-out",
        "prompt": (
            STYLE_BASE
            + "TITLE on top: 'Query fan-out – jak działa rozszczepienie zapytania'. "
            "Show a horizontal flow diagram. On the left: a single rounded "
            "rectangle labeled 'PYTANIE UŻYTKOWNIKA' in white text on "
            "orange-tinted background. From it, 4 branches expand to the "
            "right, each leading to a labeled cluster box: 'KOMPARATYWNE', "
            "'CENOWE', 'TECHNICZNE', 'OPINIE'. Each cluster has 3-4 example "
            "sub-queries listed underneath in small text, like 'HubSpot vs "
            "Pipedrive', 'koszt CRM 5 osób', 'integracje ze Slackiem'. "
            "Bottom caption in mono font: '1 PROMPT → 4 KLASTRY → 14 "
            "PODZAPYTAŃ'. Connecting lines glow subtly orange."
        ),
    },
    {
        "slug": "infographic-share-of-voice",
        "prompt": (
            STYLE_BASE
            + "TITLE on top: 'Share of Voice – jak liczymy widoczność marki w AI'. "
            "Show a horizontal bar chart with 5 horizontal bars labeled with "
            "Polish names: 'Konkurent A' (32%), 'Konkurent B' (25%), "
            "'Twoja marka' (21%, glowing orange, longest emphasis), "
            "'Konkurent C' (14%), 'Pozostali' (8%). To the right of the "
            "chart, a clean formula box: 'SoV = wzmianki Twojej marki / "
            "wszystkie wzmianki konkurencji × 100%'. Below: example "
            "calculation '47 / 222 = 21%'. Bottom caption in mono: "
            "'30 ZAPYTAŃ × 4 PLATFORMY AI × 5 URUCHOMIEŃ = 600 TESTÓW'."
        ),
    },
    {
        "slug": "infographic-topical-authority",
        "prompt": (
            STYLE_BASE
            + "TITLE on top: 'Pillar + cluster – architektura topical authority'. "
            "Show a hub-and-spoke network diagram. Center: large rounded "
            "rectangle labeled 'STRONA PILLAR' (glowing orange border, "
            "centered). Around it, 8 smaller rounded boxes arranged in "
            "a circle, each labeled 'CLUSTER 1', 'CLUSTER 2', ..., 'CLUSTER 8'. "
            "Lines connect: solid orange lines from pillar to clusters, "
            "thinner gray lines between adjacent clusters (lateral linking). "
            "Two callout labels with arrows: 'Cluster → Pillar (2×)' and "
            "'Cluster → Cluster (3-5×)'. Bottom caption in mono: 'TOP 10 "
            "DOMEN W NISZY ZABIERA 46% CYTOWAŃ AI'."
        ),
    },
    {
        "slug": "infographic-ai-bots",
        "prompt": (
            STYLE_BASE
            + "TITLE on top: '13 botów AI – kto i jak indeksuje Twoją stronę'. "
            "Show a 4-column matrix with column headers in Polish: "
            "'TRENING', 'WYSZUKIWANIE', 'NA ŻĄDANIE', 'COMMON CRAWL'. "
            "Below each header, list bot names in mono font: "
            "Column 1 (Trening): 'GPTBot', 'ClaudeBot', 'Google-Extended'. "
            "Column 2 (Wyszukiwanie): 'OAI-SearchBot', 'PerplexityBot', "
            "'Claude-SearchBot'. Column 3 (Na żądanie): 'ChatGPT-User', "
            "'Claude-Web', 'Perplexity-User'. Column 4 (Common Crawl): "
            "'CCBot', 'Applebot-Extended', 'GoogleOther', 'Google-NotebookLM'. "
            "Each bot name has a small green check icon. Bottom caption "
            "in mono: 'PEŁNE POKRYCIE: ALLOW ALL 13 W ROBOTS.TXT'."
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
    raise SystemExit(
        "ERROR: brak klucza API. Ustaw KIE_API_KEY env var lub utwórz "
        f"{KEY_FILE} (chmod 600)."
    )


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
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode("utf-8"))


def get_status(task_id: str, api_key: str) -> dict:
    req = urllib.request.Request(
        f"{API_BASE}/recordInfo?taskId={task_id}",
        headers={"Authorization": f"Bearer {api_key}"},
        method="GET",
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def download(url: str, out_path: str) -> int:
    # CDN tempfile.aiquickdraw.com blokuje default Python-urllib User-Agent → fake browser
    req = urllib.request.Request(
        url, headers={"User-Agent": "Mozilla/5.0 widocznosc-ai-bot/1.0"}
    )
    with urllib.request.urlopen(req, timeout=120) as r:
        png = r.read()
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "wb") as f:
        f.write(png)
    return len(png)


def generate_one(spec: dict, api_key: str) -> bool:
    slug = spec["slug"]
    out_path = os.path.join(ASSETS_DIR, f"{slug}.png")
    print(f"\n→ {slug}")

    create = post_json(
        f"{API_BASE}/createTask",
        {
            "model": MODEL,
            "input": {
                "prompt": spec["prompt"],
                "aspect_ratio": "16:9",
            },
        },
        api_key,
    )
    if create.get("code") != 200:
        print(f"  ✗ createTask failed: {create.get('msg')}", file=sys.stderr)
        return False
    task_id = create["data"]["taskId"]
    print(f"  taskId: {task_id}  ·  polling…")

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
                print(f"  ✗ success ale brak URL: {data}", file=sys.stderr)
                return False
            kb = download(url, out_path) // 1024
            credits = data.get("creditsConsumed", "?")
            print(f"  ✓ saved · {kb} KB · {credits} kredytów · {out_path}")
            return True
        if state in ("failed", "fail"):
            print(f"  ✗ failed: {data.get('failMsg') or data}", file=sys.stderr)
            return False
        if (i + 1) % 5 == 0:
            print(f"  …{state} ({(i+1)*POLL_INTERVAL}s)")

    print(f"  ✗ timeout po {MAX_POLLS * POLL_INTERVAL}s", file=sys.stderr)
    return False


def main() -> int:
    api_key = load_api_key()

    only = {s.strip() for s in os.environ.get("ONLY", "").split(",") if s.strip()}
    items = [i for i in INFOGRAPHICS if not only or i["slug"] in only]
    if not items:
        print(f"ERROR: ONLY={only} matched nothing", file=sys.stderr)
        return 1

    print(f"Model: {MODEL}  ·  {len(items)} infografik(a)")
    ok = 0
    for spec in items:
        if generate_one(spec, api_key):
            ok += 1
    print(f"\nGotowe: {ok}/{len(items)}")
    return 0 if ok == len(items) else 2


if __name__ == "__main__":
    sys.exit(main())
