#!/usr/bin/env python3
"""
Facebook Auto-Poster for BusManiak.pl.
Picks a random unposted article, generates a social media description
via Gemini Flash (OpenRouter), and posts it to the Facebook Page.

Usage:
    python post_to_fb.py [--dry-run]

Environment variables:
    OPENROUTER_KEY   - OpenRouter API key
    FB_PAGE_ID       - Facebook Page ID
    FB_ACCESS_TOKEN  - Facebook Page Access Token
"""

import argparse
import json
import os
import random
import re
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent.parent
CONTENT_DIR = REPO_ROOT / "portals" / "busmaniak.pl" / "content"
POSTED_FILE = SCRIPT_DIR / "posted.json"
BASE_URL = "https://busmaniak.pl"

# Directories to skip (not real articles)
SKIP_DIRS = {"autor"}

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_KEY = os.environ.get("OPENROUTER_KEY", "")

FB_PAGE_ID = os.environ.get("FB_PAGE_ID", "")
FB_ACCESS_TOKEN = os.environ.get("FB_ACCESS_TOKEN", "")
FB_API_VERSION = "v22.0"


def load_posted() -> dict:
    """Load the set of already-posted article URLs."""
    if POSTED_FILE.exists():
        with open(POSTED_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_posted(posted: dict) -> None:
    """Save the posted tracking data."""
    with open(POSTED_FILE, "w", encoding="utf-8") as f:
        json.dump(posted, f, indent=2, ensure_ascii=False)


def parse_frontmatter(filepath: Path) -> dict | None:
    """Extract YAML frontmatter from a Hugo markdown file."""
    text = filepath.read_text(encoding="utf-8")
    match = re.match(r"^---\n(.*?)\n---", text, re.DOTALL)
    if not match:
        return None

    fm = {}
    raw = match.group(1)

    # Simple YAML parsing for flat keys (title, lead, image, etc.)
    for line in raw.split("\n"):
        m = re.match(r'^(\w[\w_]*):\s*"?(.*?)"?\s*$', line)
        if m:
            key, val = m.group(1), m.group(2)
            if val and not val.startswith("[") and not val.startswith("{"):
                fm[key] = val.strip('"').strip("'")

    # Check for draft status
    if fm.get("draft", "").lower() == "true":
        return None

    # Must have at minimum title and lead
    if "title" not in fm or "lead" not in fm:
        return None

    return fm


def get_article_url(filepath: Path) -> str:
    """Convert a content file path to a public URL."""
    relative = filepath.relative_to(CONTENT_DIR)
    slug = str(relative).replace(".md", "").replace("\\", "/")
    return f"{BASE_URL}/{slug}/"


def scan_articles() -> list[dict]:
    """Scan all Hugo content files and return article metadata."""
    articles = []
    for md_file in CONTENT_DIR.rglob("*.md"):
        # Skip _index.md and excluded directories
        if md_file.name == "_index.md":
            continue
        relative = md_file.relative_to(CONTENT_DIR)
        top_dir = relative.parts[0] if len(relative.parts) > 1 else None
        if top_dir in SKIP_DIRS:
            continue

        fm = parse_frontmatter(md_file)
        if fm is None:
            continue

        articles.append({
            "path": str(md_file),
            "url": get_article_url(md_file),
            "title": fm.get("title", ""),
            "lead": fm.get("lead", ""),
            "main_keyword": fm.get("main_keyword", ""),
            "image": fm.get("image", ""),
        })

    return articles


def pick_random_article(articles: list[dict], posted: dict) -> dict | None:
    """Pick a random article that hasn't been posted yet."""
    unposted = [a for a in articles if a["url"] not in posted]
    if not unposted:
        return None
    return random.choice(unposted)


def generate_description(article: dict) -> str:
    """Generate a social media description using Gemini Flash via OpenRouter."""
    if not OPENROUTER_KEY:
        print("ERROR: OPENROUTER_KEY env var not set", file=sys.stderr)
        sys.exit(1)

    prompt = f"""Napisz krótki, angażujący opis posta na Facebooka dla artykułu z portalu BusManiak.pl.

Tytuł artykułu: {article['title']}
Temat (keyword): {article['main_keyword']}
Lead artykułu: {article['lead']}

Zasady:
- Maksymalnie 2-3 zdania
- Użyj 2-3 emoji (nie więcej)
- Napisz po polsku
- Ton: przyjazny, ekspercki, lekko nieformalny
- Zachęć do kliknięcia w link (ale bez "kliknij tutaj")
- NIE dodawaj URL-a – link zostanie dodany automatycznie
- NIE używaj hashtagów
- NIE zaczynaj od emoji

Zwróć TYLKO tekst posta, nic więcej."""

    payload = json.dumps({
        "model": "google/gemini-3-flash-preview",
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 300,
        "temperature": 0.8,
    }).encode("utf-8")

    req = urllib.request.Request(
        OPENROUTER_URL,
        data=payload,
        headers={
            "Authorization": f"Bearer {OPENROUTER_KEY}",
            "Content-Type": "application/json",
        },
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode())
    except Exception as e:
        print(f"ERROR: OpenRouter API call failed: {e}", file=sys.stderr)
        sys.exit(1)

    return data["choices"][0]["message"]["content"].strip()


def post_to_facebook(message: str, link: str) -> dict:
    """Publish a link post to the Facebook Page."""
    if not FB_PAGE_ID or not FB_ACCESS_TOKEN:
        print("ERROR: FB_PAGE_ID and FB_ACCESS_TOKEN env vars required", file=sys.stderr)
        sys.exit(1)

    url = f"https://graph.facebook.com/{FB_API_VERSION}/{FB_PAGE_ID}/feed"

    payload = urllib.parse.urlencode({
        "message": message,
        "link": link,
        "access_token": FB_ACCESS_TOKEN,
    }).encode("utf-8")

    req = urllib.request.Request(url, data=payload, method="POST")

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"ERROR: Facebook API returned {e.code}: {body}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"ERROR: Facebook API call failed: {e}", file=sys.stderr)
        sys.exit(1)

    return data


def main():
    parser = argparse.ArgumentParser(description="Post a random BusManiak.pl article to Facebook")
    parser.add_argument("--dry-run", action="store_true", help="Generate description but don't post")
    args = parser.parse_args()

    # 1. Scan articles
    articles = scan_articles()
    if not articles:
        print("ERROR: No articles found", file=sys.stderr)
        sys.exit(1)
    print(f"Found {len(articles)} articles")

    # 2. Load posted tracking
    posted = load_posted()
    print(f"Already posted: {len(posted)}")

    # 3. Pick random unposted article
    article = pick_random_article(articles, posted)
    if article is None:
        print("All articles have been posted! Resetting tracking.")
        posted = {}
        save_posted(posted)
        article = pick_random_article(articles, posted)

    print(f"Selected: {article['title']}")
    print(f"URL: {article['url']}")

    # 4. Generate social media description
    description = generate_description(article)
    print(f"\nGenerated post:\n{description}\n")

    # 5. Post to Facebook (or dry-run)
    if args.dry_run:
        print("[DRY RUN] Skipping Facebook post")
        return

    result = post_to_facebook(description, article["url"])
    post_id = result.get("id", "unknown")
    print(f"Posted to Facebook! Post ID: {post_id}")

    # 6. Track posted article
    posted[article["url"]] = {
        "title": article["title"],
        "posted_at": datetime.now(timezone.utc).isoformat(),
        "fb_post_id": post_id,
    }
    save_posted(posted)
    print(f"Saved to tracking ({len(posted)} total posted)")


if __name__ == "__main__":
    main()
