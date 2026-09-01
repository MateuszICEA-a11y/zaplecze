#!/usr/bin/env python3
"""
Facebook Auto-Poster for BusManiak.pl and widocznosc.ai.
Picks a random unposted article, generates a social media description
via Gemini Flash (OpenRouter), and posts it to the Facebook Page.

Usage:
    python post_to_fb.py [--site busmaniak|widocznosc] [--dry-run]

Environment variables:
    OPENROUTER_KEY   - OpenRouter API key (fallback: OPENROUTER_API_KEY)
    busmaniak:  FB_PAGE_ID / FB_ACCESS_TOKEN
    widocznosc: FB_WIDOCZNOSC_PAGE_ID / FB_WIDOCZNOSC_ACCESS_TOKEN
"""

import argparse
import json
import os
import random
import re
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone, date
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent.parent

# Per-portal configuration. `--site` selects one; busmaniak stays the default
# so the original workflow keeps working unchanged.
SITES = {
    "busmaniak": {
        "content_dir": REPO_ROOT / "portals" / "busmaniak.pl" / "content",
        "posted_file": SCRIPT_DIR / "posted.json",
        "base_url": "https://busmaniak.pl",
        # Hugo: portals/busmaniak.pl/content/<section>/<slug>.md -> /<section>/<slug>/
        "url_prefix": "",
        "skip_dirs": {"autor"},
        "skip_files": {"_index.md"},
        "summary_field": "lead",
        "page_id_env": "FB_PAGE_ID",
        "token_env": "FB_ACCESS_TOKEN",
        "prompt": """Napisz krótki, angażujący opis posta na Facebooka dla artykułu z portalu BusManiak.pl.

Tytuł artykułu: {title}
Temat (keyword): {keyword}
Lead artykułu: {summary}

Zasady:
- Maksymalnie 2-3 zdania
- Użyj 2-3 emoji (nie więcej)
- Napisz po polsku
- Ton: przyjazny, ekspercki, lekko nieformalny
- Zachęć do kliknięcia w link (ale bez "kliknij tutaj")
- NIE dodawaj URL-a – link zostanie dodany automatycznie
- NIE używaj hashtagów
- NIE zaczynaj od emoji

Zwróć TYLKO tekst posta, nic więcej.""",
    },
    "widocznosc": {
        "content_dir": REPO_ROOT / "portals" / "widocznosc.ai" / "src" / "content" / "blog",
        "posted_file": SCRIPT_DIR / "posted-widocznosc.json",
        "base_url": "https://widocznosc.ai",
        # Astro: src/content/blog/<pillar>/<slug>.md -> /<pillar>/<slug>/
        "url_prefix": "",
        "skip_dirs": set(),
        "skip_files": set(),
        "summary_field": "description",
        "page_id_env": "FB_WIDOCZNOSC_PAGE_ID",
        "token_env": "FB_WIDOCZNOSC_ACCESS_TOKEN",
        "prompt": """Napisz krótki opis posta na Facebooka dla artykułu z widocznosc.ai – serwisu eksperckiego o widoczności marek w wyszukiwarkach AI (ChatGPT, Perplexity, Google AI Overviews), modelach LLM i GEO.

Tytuł artykułu: {title}
Podtytuł: {subtitle}
Opis artykułu: {summary}
Tagi: {keyword}

Zasady:
- Maksymalnie 2-3 zdania, pierwsze zdanie ma zawierać konkret z artykułu (liczbę, mechanizm, wniosek), nie ogólnik
- Odbiorca: marketerzy, właściciele firm, specjaliści SEO – ton rzeczowy, ekspercki, bez clickbaitu i bez wykrzykników
- Napisz po polsku, poprawną polszczyzną
- Maksymalnie 1 emoji, najlepiej żadne
- Nazwy „ChatGPT" i „Perplexity" są nieodmienne
- Używaj półpauzy (–), nigdy myślnika (—)
- Zachęć do przeczytania, ale bez "kliknij tutaj" i bez "sprawdź"
- Bez zdań opisujących sam artykuł („lektura pozwala…", „ten przewodnik omawia…") – pisz o temacie, nie o tekście
- NIE dodawaj URL-a – link zostanie dodany automatycznie
- NIE używaj hashtagów
- NIE zaczynaj od emoji

Zwróć TYLKO tekst posta, nic więcej.""",
    },
}

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_KEY = os.environ.get("OPENROUTER_KEY") or os.environ.get("OPENROUTER_API_KEY", "")

FB_API_VERSION = "v22.0"


def load_posted(posted_file: Path) -> dict:
    """Load the set of already-posted article URLs."""
    if posted_file.exists():
        with open(posted_file, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_posted(posted_file: Path, posted: dict) -> None:
    """Save the posted tracking data."""
    with open(posted_file, "w", encoding="utf-8") as f:
        json.dump(posted, f, indent=2, ensure_ascii=False)


def _unquote(val: str) -> str:
    """Strip YAML quotes and unescape ('' inside single quotes, \\" inside double)."""
    if len(val) >= 2 and val[0] == val[-1] == "'":
        return val[1:-1].replace("''", "'")
    if len(val) >= 2 and val[0] == val[-1] == '"':
        return val[1:-1].replace('\\"', '"')
    return val


def parse_frontmatter(filepath: Path, summary_field: str) -> dict | None:
    """Extract flat YAML frontmatter keys from a markdown file (Hugo or Astro)."""
    text = filepath.read_text(encoding="utf-8")
    match = re.match(r"^---\n(.*?)\n---", text, re.DOTALL)
    if not match:
        return None

    fm = {}
    raw = match.group(1)

    # Simple YAML parsing for flat scalar keys (title, lead, description, tags…).
    # Nested blocks (author:, faq:) start with an empty value and are skipped.
    for line in raw.split("\n"):
        m = re.match(r"^(\w[\w_]*):\s*(.*?)\s*$", line)
        if not m:
            continue
        key, val = m.group(1), m.group(2)
        if not val or val.startswith("{") or val.startswith(">") or val.startswith("|"):
            continue
        if val.startswith("["):
            # inline list: ['GEO', 'E-commerce'] -> "GEO, E-commerce"
            items = re.findall(r"""['"]([^'"]+)['"]""", val)
            fm[key] = ", ".join(items) if items else val.strip("[]")
            continue
        fm[key] = _unquote(val)

    # Check for draft status
    if fm.get("draft", "").lower() == "true":
        return None

    # Must have at minimum title and a summary
    if "title" not in fm or summary_field not in fm:
        return None

    return fm


def get_article_url(filepath: Path, site: dict) -> str:
    """Convert a content file path to a public URL."""
    relative = filepath.relative_to(site["content_dir"])
    slug = str(relative).replace(".md", "").replace("\\", "/")
    return f"{site['base_url']}{site['url_prefix']}/{slug}/"


def scan_articles(site: dict) -> list[dict]:
    """Scan all content files of a portal and return article metadata."""
    articles = []
    for md_file in site["content_dir"].rglob("*.md"):
        if md_file.name in site["skip_files"]:
            continue
        relative = md_file.relative_to(site["content_dir"])
        top_dir = relative.parts[0] if len(relative.parts) > 1 else None
        if top_dir in site["skip_dirs"]:
            continue

        fm = parse_frontmatter(md_file, site["summary_field"])
        if fm is None:
            continue

        articles.append({
            "path": str(md_file),
            "url": get_article_url(md_file, site),
            "title": fm.get("title", ""),
            "subtitle": fm.get("subtitle", ""),
            "summary": fm.get(site["summary_field"], ""),
            "keyword": fm.get("main_keyword") or fm.get("tags", ""),
            "image": fm.get("image", ""),
        })

    return articles


def already_posted_today(posted: dict) -> bool:
    """Check if any article was already posted today (UTC)."""
    today = date.today().isoformat()
    for entry in posted.values():
        posted_at = entry.get("posted_at", "")
        if posted_at.startswith(today):
            return True
    return False


def pick_random_article(articles: list[dict], posted: dict) -> dict | None:
    """Pick a random article that hasn't been posted yet."""
    unposted = [a for a in articles if a["url"] not in posted]
    if not unposted:
        return None
    return random.choice(unposted)


def generate_description(article: dict, site: dict) -> str:
    """Generate a social media description using Gemini Flash via OpenRouter."""
    if not OPENROUTER_KEY:
        print("ERROR: OPENROUTER_KEY env var not set", file=sys.stderr)
        sys.exit(1)

    prompt = site["prompt"].format(
        title=article["title"],
        subtitle=article["subtitle"],
        summary=article["summary"],
        keyword=article["keyword"],
    )

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


def post_to_facebook(message: str, link: str, site: dict) -> dict:
    """Publish a link post to the Facebook Page."""
    page_id = os.environ.get(site["page_id_env"], "")
    token = os.environ.get(site["token_env"], "")
    if not page_id or not token:
        print(f"ERROR: {site['page_id_env']} and {site['token_env']} env vars required", file=sys.stderr)
        sys.exit(1)

    url = f"https://graph.facebook.com/{FB_API_VERSION}/{page_id}/feed"

    payload = urllib.parse.urlencode({
        "message": message,
        "link": link,
        "access_token": token,
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
    parser = argparse.ArgumentParser(description="Post a random portal article to Facebook")
    parser.add_argument("--site", choices=sorted(SITES), default="busmaniak", help="Portal to post for")
    parser.add_argument("--dry-run", action="store_true", help="Generate description but don't post")
    args = parser.parse_args()
    site = SITES[args.site]
    posted_file = site["posted_file"]

    # 1. Scan articles
    articles = scan_articles(site)
    if not articles:
        print("ERROR: No articles found", file=sys.stderr)
        sys.exit(1)
    print(f"[{args.site}] Found {len(articles)} articles")

    # 2. Load posted tracking
    posted = load_posted(posted_file)
    print(f"Already posted: {len(posted)}")

    # 3. Guard: max 1 post per day
    if already_posted_today(posted):
        print("Already posted today – skipping.")
        return

    # 4. Pick random unposted article
    article = pick_random_article(articles, posted)
    if article is None:
        print("All articles have been posted! Resetting tracking.")
        posted = {}
        save_posted(posted_file, posted)
        article = pick_random_article(articles, posted)

    print(f"Selected: {article['title']}")
    print(f"URL: {article['url']}")

    # 4. Generate social media description
    description = generate_description(article, site)
    print(f"\nGenerated post:\n{description}\n")

    # 5. Post to Facebook (or dry-run)
    if args.dry_run:
        print("[DRY RUN] Skipping Facebook post")
        return

    result = post_to_facebook(description, article["url"], site)
    post_id = result.get("id", "unknown")
    print(f"Posted to Facebook! Post ID: {post_id}")

    # 6. Track posted article
    posted[article["url"]] = {
        "title": article["title"],
        "posted_at": datetime.now(timezone.utc).isoformat(),
        "fb_post_id": post_id,
    }
    save_posted(posted_file, posted)
    print(f"Saved to tracking ({len(posted)} total posted)")


if __name__ == "__main__":
    main()
