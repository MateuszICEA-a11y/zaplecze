#!/usr/bin/env python3
"""Generate brand & blog hero images for widocznosc.ai via OpenAI Images API.

Usage:
    OPENAI_API_KEY="sk-proj-..." python3 pipeline/widocznosc-images-gen.py

Optional env vars:
    IMAGE_MODEL  – defaults to "gpt-image-1" (OpenAI's current production model
                   in the GPT-Image family, after DALL-E 3).
    ONLY         – comma-separated slugs to regenerate (default: all).

Image style is unified: deep obsidian background, subtle #ff6a2e neon orange
accents, abstract editorial tech illustration, no text, no people.
"""
import base64
import json
import os
import sys
import urllib.request
import urllib.error

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC_DIR = os.path.join(ROOT, "portals", "widocznosc.ai", "public")
ASSETS_DIR = os.path.join(ROOT, "portals", "widocznosc.ai", "src", "assets", "images")

API_URL = "https://api.openai.com/v1/images/generations"
MODEL = os.environ.get("IMAGE_MODEL", "gpt-image-1")

# Unified style prefix – every prompt starts with this for visual cohesion
STYLE = (
    "Premium editorial tech illustration. Deep obsidian black background "
    "(#070810). Subtle neon orange accents (#ff6a2e) used sparingly. "
    "Minimalist, sophisticated, high-end AI consultancy aesthetic. "
    "No people, no text, no logos, no UI mockups. Abstract geometric, "
    "wide cinematic composition. Soft volumetric lighting. "
)

IMAGES = [
    {
        "slug": "og-image",
        "size": "1536x1024",
        "out": os.path.join(PUBLIC_DIR, "og-image.png"),
        "prompt": (
            STYLE
            + "Abstract visualization of AI search radar – three concentric "
            "circular orbits with a glowing orange core at center, faint "
            "data points orbiting like satellites. Conveys 'visibility "
            "across AI engines'. Centered composition, generous negative "
            "space."
        ),
    },
    {
        "slug": "blog-query-fan-out",
        "size": "1536x1024",
        "out": os.path.join(ASSETS_DIR, "blog-query-fan-out.png"),
        "prompt": (
            STYLE
            + "Single glowing orange node at the left, branching outward "
            "into a fractal network of 30+ smaller sub-query nodes, "
            "interconnected with thin luminous lines. Tree/fractal "
            "expansion topology, technical diagram feel. Represents "
            "Google AI Mode query fan-out decomposition."
        ),
    },
    {
        "slug": "blog-share-of-voice",
        "size": "1536x1024",
        "out": os.path.join(ASSETS_DIR, "blog-share-of-voice.png"),
        "prompt": (
            STYLE
            + "Abstract horizontal bar chart visualization with five "
            "stacked horizontal bars of varying lengths. The dominant bar "
            "glows bright orange, the others are muted dark gray. "
            "Conveys 'brand share of voice in AI conversations'. Clean, "
            "data-driven, premium analytics dashboard aesthetic."
        ),
    },
    {
        "slug": "blog-topical-authority",
        "size": "1536x1024",
        "out": os.path.join(ASSETS_DIR, "blog-topical-authority.png"),
        "prompt": (
            STYLE
            + "Abstract knowledge graph architecture: a tall central pillar "
            "in the middle with glowing orange edges, surrounded by "
            "interconnected cluster nodes radiating outward. Hub-and-spoke "
            "topology, hierarchical structure. Represents pillar + cluster "
            "content strategy for topical authority in AI search."
        ),
    },
    {
        "slug": "blog-ai-bots",
        "size": "1536x1024",
        "out": os.path.join(ASSETS_DIR, "blog-ai-bots.png"),
        "prompt": (
            STYLE
            + "Abstract geometric crawler visualization: stylized "
            "spider/bot silhouettes (purely geometric, not realistic) "
            "traversing a structured grid of website pages. Multiple "
            "luminous orange beam paths connecting bots to grid cells. "
            "Cybersecurity/web-crawling aesthetic, clean vector feel. "
            "Represents AI bots (GPTBot, ClaudeBot) indexing a site."
        ),
    },
]


def generate(image_spec: dict, api_key: str) -> None:
    out_path = image_spec["out"]
    slug = image_spec["slug"]
    print(f"→ {slug}  ({image_spec['size']})  → {out_path}")

    payload = {
        "model": MODEL,
        "prompt": image_spec["prompt"],
        "size": image_spec["size"],
        "n": 1,
    }
    req = urllib.request.Request(
        API_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=180) as resp:
            body = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err = e.read().decode("utf-8", errors="replace")
        print(f"  ✗ HTTP {e.code}: {err[:300]}", file=sys.stderr)
        return
    except urllib.error.URLError as e:
        print(f"  ✗ network error: {e}", file=sys.stderr)
        return

    data = body.get("data") or []
    if not data:
        print(f"  ✗ empty data: {body}", file=sys.stderr)
        return

    item = data[0]
    if "b64_json" in item:
        png = base64.b64decode(item["b64_json"])
    elif "url" in item:
        with urllib.request.urlopen(item["url"], timeout=60) as r:
            png = r.read()
    else:
        print(f"  ✗ no b64_json or url in response: {item}", file=sys.stderr)
        return

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "wb") as f:
        f.write(png)
    kb = len(png) // 1024
    print(f"  ✓ saved · {kb} KB")


def main() -> int:
    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not api_key:
        print("ERROR: set OPENAI_API_KEY env var", file=sys.stderr)
        return 1

    only = {s.strip() for s in os.environ.get("ONLY", "").split(",") if s.strip()}
    images = [i for i in IMAGES if not only or i["slug"] in only]
    if not images:
        print(f"ERROR: ONLY={only} matched no slugs. Available: "
              f"{[i['slug'] for i in IMAGES]}", file=sys.stderr)
        return 1

    print(f"Model: {MODEL}  ·  Generating {len(images)} image(s)\n")
    for spec in images:
        generate(spec, api_key)
    print("\nDone.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
