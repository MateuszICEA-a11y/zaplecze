#!/usr/bin/env python3
"""Generate hero + infographic for grupa-icea.pl article via kie.ai/gpt-image-2.

Styl wg ICEA Brand Manual 2025: Midnight Blue #000623, Blue #5768FF,
Orange #F6704C (akcent, nigdy obok Blue/Off White), Off White #F9F9F9,
motyw rozet, typografia Roobert-like (clean geometric sans).

Klucz API: env KIE_API_KEY lub ~/.config/widocznosc-ai/kie.key.

Usage:
    python3 pipeline/grupa-icea-article-images.py
    ONLY=<slug> python3 pipeline/grupa-icea-article-images.py
"""
import json
import os
import sys
import time
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "portals", "grupa-icea.pl", "artykuly", "images")

API_BASE = "https://api.kie.ai/api/v1/jobs"
MODEL = "gpt-image-2-text-to-image"
KEY_FILE = os.path.expanduser("~/.config/widocznosc-ai/kie.key")
POLL_INTERVAL = 6
MAX_POLLS = 30

STYLE_ICEA = (
    "Premium brand design for a digital marketing agency. Deep midnight "
    "navy background (#000623). Color palette strictly limited to: midnight "
    "navy #000623, vivid periwinkle blue #5768FF, soft off-white #F9F9F9, "
    "and warm coral orange #F6704C used ONLY as a small accent on the navy "
    "background – orange must never touch or sit next to blue elements. "
    "Clean geometric sans-serif typography (Roobert/Inter style), low "
    "contrast letterforms. Minimal, technical, high-end consultancy "
    "aesthetic. Generous negative space, crisp thin lines, no gradients "
    "except subtle glows, no decorative clutter. 16:9 aspect ratio. "
)

IMAGES = [
    {
        "slug": "hero-widocznosc-marki-w-ai",
        "prompt": (
            STYLE_ICEA
            + "Abstract editorial hero image, NO text, no letters, no words. "
            "Central motif: a large minimalist chat bubble outline in "
            "off-white containing a small glowing coral orange dot (the "
            "brand being mentioned by AI). Around the bubble, a cropped "
            "geometric rosette shape – concentric overlapping circles "
            "forming a flower-like pattern – rendered in periwinkle blue "
            "thin lines, partially cropped by the frame edges. A few "
            "subtle off-white radar rings emanate from the orange dot. "
            "Composition: rosette anchored to the right edge, chat bubble "
            "left of center. Dark, calm, premium."
        ),
    },
    {
        "slug": "infografika-test-widocznosci-marki-w-ai",
        "prompt": (
            STYLE_ICEA
            + "Modern editorial infographic with Polish text labels. "
            "TITLE at top in off-white, EXACT spelling letter by letter: "
            "'Jak sprawdzić, czy AI poleca Twoją markę?'. Spelling rules "
            "for the title: the word 'czy' is plain c-z-y with NO accent "
            "marks; the word 'poleca' is plain p-o-l-e-c-a with NO accent "
            "marks; never add accents, diacritics or marks to letters "
            "that do not have them in the provided text. "
            "Below the title, a horizontal 4-step flow of rounded "
            "rectangle cards with thin periwinkle blue borders, connected "
            "by thin arrows. Card 1 header: '1. OTWÓRZ 3 SILNIKI', "
            "small text below: 'ChatGPT · Gemini · Perplexity'. "
            "Card 2 header: '2. ZADAJ 5 TYPÓW PYTAŃ', small text: "
            "'kategoria, zakup, porównanie, opinia, problem'. "
            "Card 3 header: '3. NOTUJ 4 RZECZY', small text: 'obecność, "
            "pozycja, poprawność, źródła'. Card 4 header: '4. POWTÓRZ "
            "2-3 RAZY', small text: 'osobne sesje, tryb incognito'. "
            "Step numbers highlighted in coral orange. Bottom caption in "
            "monospace font: 'RĘCZNY TEST: OK. 15 MINUT'. All Polish "
            "diacritics rendered correctly."
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
    raise SystemExit(f"ERROR: brak klucza API (env KIE_API_KEY lub {KEY_FILE}).")


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
    out_path = os.path.join(OUT_DIR, f"{slug}.png")
    print(f"\n→ {slug}")

    create = post_json(
        f"{API_BASE}/createTask",
        {"model": MODEL, "input": {"prompt": spec["prompt"], "aspect_ratio": "16:9"}},
        api_key,
    )
    if create.get("code") != 200:
        print(f"  ✗ createTask failed: {create.get('msg')}", file=sys.stderr)
        return False
    task_id = create["data"]["taskId"]
    print(f"  taskId: {task_id}  ·  polling…")

    for _ in range(MAX_POLLS):
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
            print(f"  ✗ generation failed: {data.get('failMsg')}", file=sys.stderr)
            return False
    print("  ✗ timeout polling", file=sys.stderr)
    return False


def main() -> int:
    api_key = load_api_key()
    only = os.environ.get("ONLY", "").strip()
    specs = [s for s in IMAGES if not only or s["slug"] == only]
    if not specs:
        print(f"ONLY={only} nie pasuje do żadnego sluga", file=sys.stderr)
        return 1
    ok = sum(generate_one(s, api_key) for s in specs)
    print(f"\n{ok}/{len(specs)} OK")
    return 0 if ok == len(specs) else 1


if __name__ == "__main__":
    sys.exit(main())
