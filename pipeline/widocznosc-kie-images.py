#!/usr/bin/env python3
"""Generate widocznosc.ai blog graphics (hero + infographic) via kie.ai gpt-image-2.

Zunifikowany pipeline: JEDEN model (gpt-image-2-text-to-image) dla obu typów.
- hero: abstrakcyjna ilustracja edytorska, ZERO tekstu/ludzi/logo
- infographic: polskie labelki, czytelne dane (gpt-image-2 renderuje polski tekst)

Styl: tło obsidian #070810 + akcent brandowy sky-blue #0a9cff (NIE pomarańcz).

Klucz API:
    1) env KIE_API_KEY, lub
    2) ~/.config/widocznosc-ai/kie.key (chmod 600)
Klucz NIGDY nie trafia do repo/logów/memory.

Usage:
    python3 pipeline/widocznosc-kie-images.py            # wszystkie z listy SPECS
    ONLY=blog-rag-przewodnik python3 pipeline/widocznosc-kie-images.py
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
MAX_POLLS = 40  # 6s × 40 = 240s max per image (2K bywa wolniejsze)
ASPECT = "16:9"
RESOLUTION = "2K"

# Wspólny prefiks dla HERO – sky-blue, bez tekstu
HERO_STYLE = (
    "Premium editorial tech illustration. Deep obsidian black background "
    "(#070810). Subtle sky-blue accents (#0a9cff) used sparingly for glow "
    "and key elements. Minimalist, sophisticated, high-end AI consultancy "
    "aesthetic. No people, no text, no letters, no logos, no UI mockups. "
    "Abstract geometric, wide cinematic composition. Soft volumetric "
    "lighting. "
)

# Wspólny prefiks dla INFOGRAFIK – sky-blue, polski tekst
INFO_STYLE = (
    "Modern editorial infographic. Deep obsidian black background "
    "(#070810). Subtle sky-blue accents (#0a9cff) for highlights and key "
    "data points. Polish text labels, clean sans-serif typography (Inter "
    "font style). Minimal, premium, technical aesthetic – like a high-end "
    "consultancy report. Crisp lines, generous spacing, no decorative "
    "clutter. "
)

SPECS = [
    {
        "slug": "blog-rag-przewodnik",
        "prompt": (
            HERO_STYLE
            + "Abstract visualization of Retrieval-Augmented Generation: on "
            "the left a scattered field of small document fragments (thin "
            "rounded rectangles), drawn by luminous sky-blue beams into a "
            "central glowing core, then emerging on the right as a single "
            "coherent stream of light. Conveys 'retrieve fragments → "
            "generate grounded answer'. Left-to-right flow, generous "
            "negative space."
        ),
    },
    {
        "slug": "infographic-rag-przewodnik",
        "prompt": (
            INFO_STYLE
            + "TITLE on top in Polish: 'RAG – jak działa generowanie "
            "wspomagane wyszukiwaniem'. Show a clean left-to-right pipeline "
            "with 5 connected stages, each a rounded rectangle with a Polish "
            "label: '1. ZAPYTANIE', '2. WYSZUKIWANIE (baza wektorowa)', "
            "'3. NAJTRAFNIEJSZE FRAGMENTY', '4. GENERACJA (LLM)', "
            "'5. ODPOWIEDŹ ZE ŹRÓDŁAMI'. The retrieval stage (2) glows "
            "sky-blue as the key step. Thin luminous sky-blue arrows connect "
            "the stages. Bottom caption in mono font: 'MNIEJ HALUCYNACJI · "
            "AKTUALNE DANE · BEZ FINE-TUNINGU'."
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
    print(f"\n→ {slug}  ({ASPECT} {RESOLUTION})")

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
        print(f"  ✗ createTask: {create.get('code')} {create.get('msg')}", file=sys.stderr)
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
                print(f"  ✗ success bez URL: {data}", file=sys.stderr)
                return False
            kb = download(url, out_path) // 1024
            print(f"  ✓ {kb} KB · {data.get('creditsConsumed','?')} kredytów · {out_path}")
            return True
        if state in ("failed", "fail"):
            print(f"  ✗ failed: {data.get('failMsg') or data}", file=sys.stderr)
            return False
        if (i + 1) % 5 == 0:
            print(f"  …{state} ({(i+1)*POLL_INTERVAL}s)")

    print(f"  ✗ timeout {MAX_POLLS*POLL_INTERVAL}s", file=sys.stderr)
    return False


def main() -> int:
    api_key = load_api_key()
    only = {s.strip() for s in os.environ.get("ONLY", "").split(",") if s.strip()}
    items = [s for s in SPECS if not only or s["slug"] in only]
    if not items:
        print(f"ERROR: ONLY={only} nic nie dopasowało", file=sys.stderr)
        return 1
    print(f"Model: {MODEL} · {len(items)} grafik(a)")
    ok = sum(generate_one(s, api_key) for s in items)
    print(f"\nGotowe: {ok}/{len(items)}")
    return 0 if ok == len(items) else 2


if __name__ == "__main__":
    sys.exit(main())
