#!/usr/bin/env python3
"""Generate widocznosc.ai blog graphics (hero + infographic) via kie.ai gpt-image-2.

Zunifikowany pipeline: JEDEN model (gpt-image-2-text-to-image), JEDEN ciemny
plik per grafika. CSS w Article.astro robi resztę:
- hero: "stage" – wtapia się w tło na obu motywach
- infographic: w light mode auto-inwersja (invert + hue-rotate)

Styl: tło obsidian #070810 + akcent sky-blue #0a9cff.
- hero: abstrakcyjna ilustracja edytorska, ZERO tekstu/ludzi/logo
- infographic: BIAŁY polski tekst + sky-blue akcenty (po inwersji → ciemny tekst)

Klucz API: env KIE_API_KEY lub ~/.config/widocznosc-ai/kie.key (chmod 600).
Klucz NIGDY do repo/logów/memory.

Usage:
    python3 pipeline/widocznosc-kie-images.py
    ONLY=blog-rag-embeddingi python3 pipeline/widocznosc-kie-images.py
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
    "highlights and the key step. Minimal, premium, technical aesthetic – "
    "like a high-end consultancy report. Crisp lines, generous spacing, "
    "no decorative clutter. "
)

SPECS = [
    # ── Agenci AI / przewodnik ────────────────────────────────────────
    {
        "slug": "blog-agenci-ai-przewodnik",
        "prompt": (
            HERO_STYLE
            + "Abstract visualization of an autonomous AI agent: a glowing "
            "sky-blue core in the center with a circular arrow loop around "
            "it (decision loop), reaching out to several orbiting nodes "
            "representing tools and actions. Conveys 'an agent that plans, "
            "acts and observes in a loop'. Wide composition, negative space."
        ),
    },
    {
        "slug": "infographic-agenci-ai-przewodnik",
        "prompt": (
            INFO_STYLE
            + "TITLE on top in Polish (white): 'Jak działa agent AI – pętla "
            "decyzyjna'. Show a circular loop diagram with 5 stages arranged "
            "in a ring, connected by sky-blue arrows going clockwise, with "
            "the word 'AGENT' in the center: '1. CEL', '2. PLAN', "
            "'3. WYBÓR NARZĘDZIA' (sky-blue, key step), '4. WYKONANIE', "
            "'5. OBSERWACJA' (arrow loops back to PLAN). Bottom caption: "
            "'AGENT DZIAŁA W PĘTLI, AŻ OSIĄGNIE CEL'."
        ),
    },
    # ── Agenci AI / anatomia-agenta ───────────────────────────────────
    {
        "slug": "blog-agenci-ai-anatomia-agenta",
        "prompt": (
            HERO_STYLE
            + "Abstract visualization of an AI agent's anatomy: a central "
            "glowing sky-blue core connected by luminous lines to four "
            "distinct orbiting modules (geometric, abstract) representing "
            "memory, tools, planning and a decision loop. Exploded-diagram "
            "feel, clean and technical. Wide composition."
        ),
    },
    {
        "slug": "infographic-agenci-ai-anatomia-agenta",
        "prompt": (
            INFO_STYLE
            + "TITLE on top in Polish (white): 'Anatomia agenta AI'. Show a "
            "central rounded box labeled 'MODEL (LLM)' (sky-blue) with four "
            "modules connected around it by lines, each a rounded card with "
            "a white Polish heading and short description: 'PAMIĘĆ – kontekst "
            "i historia rozmowy', 'NARZĘDZIA – API, wyszukiwanie, kod', "
            "'PLANOWANIE – rozbicie celu na kroki', 'PĘTLA DECYZYJNA – "
            "obserwuj, myśl, działaj'. Hub-and-spoke layout. Bottom caption: "
            "'AGENT = MODEL + NARZĘDZIA + PAMIĘĆ + PĘTLA'."
        ),
    },
    # ── Prompty / przewodnik ──────────────────────────────────────────
    {
        "slug": "blog-prompty-przewodnik",
        "prompt": (
            HERO_STYLE
            + "Abstract visualization of prompt engineering: on the left a "
            "structured stack of glowing sky-blue instruction blocks feeding "
            "into a central core, emerging on the right as a clean, ordered "
            "stream of output. Conveys 'a well-structured instruction yields "
            "a precise answer'. Left-to-right flow, negative space."
        ),
    },
    {
        "slug": "infographic-prompty-przewodnik",
        "prompt": (
            INFO_STYLE
            + "TITLE on top in Polish (white): 'Anatomia skutecznego "
            "promptu'. Show five stacked horizontal layers (building blocks), "
            "each a rounded bar with a white Polish heading and short note: "
            "'ROLA – kim ma być model', 'KONTEKST – tło i dane', 'ZADANIE – "
            "co dokładnie zrobić' (sky-blue, key step), 'FORMAT – jak ma "
            "wyglądać odpowiedź', 'PRZYKŁADY – wzorce few-shot'. Bottom "
            "caption: 'IM PRECYZYJNIEJ, TYM LEPSZA ODPOWIEDŹ'."
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
