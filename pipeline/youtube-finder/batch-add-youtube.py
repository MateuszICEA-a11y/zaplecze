#!/usr/bin/env python3
"""
Batch YouTube video finder for BusManiak.pl articles.
Processes all .md files in a directory, finds relevant YouTube videos,
and updates frontmatter + inserts shortcode.

Usage:
    export YOUTUBE_API_KEY="your_key"
    python3 batch-add-youtube.py <path> [--dry-run] [--threshold 0.3]

    <path> = single .md file or directory (recursive)
"""

import argparse
import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
FIND_SCRIPT = SCRIPT_DIR / "find-youtube.py"

# Section-specific query suffixes
SECTION_SUFFIXES = {
    "kampery": "kamper recenzja",
    "modele": "recenzja test",
    "serwis": "naprawa serwis",
    "przerobki": "przeróbka kamper DIY",
    "zabudowy": "zabudowa bus",
    "vanlife": "vanlife Polska",
    "wynajem": "wynajem kamper",
    "przepisy": "przepisy prawo",
    "porownania": "porównanie test",
}


def extract_frontmatter(content: str) -> tuple[dict, str, int]:
    """Extract YAML frontmatter fields we need, return (fields, body, frontmatter_end_line)."""
    if not content.startswith("---"):
        return {}, content, 0

    end = content.find("\n---", 3)
    if end == -1:
        return {}, content, 0

    fm_text = content[3:end]
    body = content[end + 4:]  # skip \n---
    fm_end = content[:end + 4].count("\n")

    fields = {}
    for key in ("main_keyword", "h1", "title", "youtube"):
        match = re.search(rf'^{key}:\s*"?([^"\n]+)"?', fm_text, re.MULTILINE)
        if match:
            fields[key] = match.group(1).strip()

    return fields, body, fm_end


def build_query(fields: dict, section: str) -> str:
    """Build YouTube search query from article metadata."""
    keyword = fields.get("main_keyword", "")
    h1 = fields.get("h1", "")
    title = fields.get("title", "")

    # Use main_keyword as base
    base = keyword or h1 or title
    # Clean title suffixes
    base = re.sub(r'\s*[–-]\s*(generacje|kompletny|przewodnik|dane|porównanie).*', '', base)

    suffix = SECTION_SUFFIXES.get(section, "recenzja test")
    query = f"{base} {suffix}".strip()

    # Limit to ~8 words
    words = query.split()
    if len(words) > 8:
        query = " ".join(words[:8])

    return query


def find_last_h2_pos(body: str) -> int | None:
    """Find the position of the last ## heading in body."""
    matches = list(re.finditer(r'^## ', body, re.MULTILINE))
    if not matches:
        return None
    return matches[-1].start()


def update_article(filepath: Path, video: dict, dry_run: bool = False) -> bool:
    """Add youtube frontmatter and shortcode to article. Returns True if modified."""
    content = filepath.read_text(encoding="utf-8")
    fields, body, _ = extract_frontmatter(content)

    if "youtube" in fields:
        return False  # already has video

    video_id = video["video_id"]
    video_title = video["title"].replace('"', '\\"')

    # Insert youtube fields in frontmatter (after image_alt or after lead)
    fm_insert_patterns = [
        (r'(image_alt:\s*"[^"]*")', r'\1\nyoutube: "' + video_id + '"\nyoutube_title: "' + video_title + '"'),
        (r'(lead:\s*"[^"]*")', r'\1\nyoutube: "' + video_id + '"\nyoutube_title: "' + video_title + '"'),
        (r'(main_keyword:\s*"[^"]*")', r'\1\nyoutube: "' + video_id + '"\nyoutube_title: "' + video_title + '"'),
    ]

    new_content = content
    inserted_fm = False
    for pattern, replacement in fm_insert_patterns:
        if re.search(pattern, new_content):
            new_content = re.sub(pattern, replacement, new_content, count=1)
            inserted_fm = True
            break

    if not inserted_fm:
        return False

    # Insert shortcode before last H2
    _, new_body, _ = extract_frontmatter(new_content)
    last_h2 = find_last_h2_pos(new_body)
    if last_h2 is None:
        return False

    # Find the position in the full content
    fm_end_match = re.search(r'\n---\n', new_content)
    if not fm_end_match:
        return False

    body_start = fm_end_match.end()
    abs_pos = body_start + last_h2

    # Insert shortcode with blank lines
    shortcode = "\n{{% youtube %}}\n\n"
    new_content = new_content[:abs_pos] + shortcode + new_content[abs_pos:]

    if dry_run:
        print(f"  [DRY RUN] Would update {filepath.name}")
        return True

    filepath.write_text(new_content, encoding="utf-8")
    return True


def search_youtube(query: str, threshold: float = 0.3) -> dict | None:
    """Run find-youtube.py and return result."""
    try:
        result = subprocess.run(
            [sys.executable, str(FIND_SCRIPT), query, "--lang", "pl", "--threshold", str(threshold)],
            capture_output=True, text=True, timeout=15,
            env={**os.environ}
        )
        data = json.loads(result.stdout.strip())
        if data.get("video_id"):
            return data
        return None
    except Exception as e:
        print(f"  [ERROR] API call failed: {e}")
        return None


def process_file(filepath: Path, threshold: float, dry_run: bool) -> dict:
    """Process a single article file. Returns status dict."""
    content = filepath.read_text(encoding="utf-8")
    fields, body, _ = extract_frontmatter(content)

    # Skip if already has youtube
    if "youtube" in fields:
        return {"file": filepath.name, "status": "skip", "reason": "already has video"}

    # Skip section hub pages without real content
    if not fields.get("main_keyword") and not fields.get("h1"):
        return {"file": filepath.name, "status": "skip", "reason": "no keyword/h1"}

    # Skip if no H2 headings
    if not re.search(r'^## ', body, re.MULTILINE):
        return {"file": filepath.name, "status": "skip", "reason": "no H2 headings"}

    # Detect section from path
    parts = filepath.parts
    section = ""
    for p in parts:
        if p in SECTION_SUFFIXES:
            section = p
            break

    query = build_query(fields, section)
    print(f"  Searching: \"{query}\"")

    video = search_youtube(query, threshold)
    if not video:
        return {"file": filepath.name, "status": "no_match", "query": query}

    # Update article
    updated = update_article(filepath, video, dry_run)
    if updated:
        return {
            "file": filepath.name,
            "status": "added",
            "video_id": video["video_id"],
            "title": video["title"],
            "score": video.get("relevance_score", "?"),
        }
    else:
        return {"file": filepath.name, "status": "error", "reason": "could not insert"}


def main():
    parser = argparse.ArgumentParser(description="Batch add YouTube videos to articles")
    parser.add_argument("path", help="Single .md file or directory")
    parser.add_argument("--dry-run", action="store_true", help="Don't modify files")
    parser.add_argument("--threshold", type=float, default=0.3, help="Min relevance score")
    parser.add_argument("--limit", type=int, default=95, help="Max API calls (default 95, safe for daily quota)")
    args = parser.parse_args()

    target = Path(args.path)
    if target.is_file():
        files = [target]
    elif target.is_dir():
        files = sorted(target.rglob("*.md"))
    else:
        print(f"Error: {target} not found")
        sys.exit(1)

    print(f"Found {len(files)} markdown files")
    print(f"Threshold: {args.threshold}, Limit: {args.limit}, Dry run: {args.dry_run}\n")

    results = []
    api_calls = 0

    for filepath in files:
        print(f"[{len(results)+1}/{len(files)}] {filepath.relative_to(target) if target.is_dir() else filepath.name}")

        # Check API quota
        if api_calls >= args.limit:
            print(f"\n⚠ API limit reached ({args.limit} calls). Stopping.")
            break

        result = process_file(filepath, args.threshold, args.dry_run)
        results.append(result)

        if result["status"] in ("added", "no_match"):
            api_calls += 1
            time.sleep(0.2)  # light rate limiting

        # Print inline status
        if result["status"] == "added":
            print(f"  ✅ {result['title'][:60]}... (score: {result['score']})")
        elif result["status"] == "no_match":
            print(f"  ❌ no match")
        elif result["status"] == "skip":
            print(f"  ⏭️  {result['reason']}")
        elif result["status"] == "error":
            print(f"  ⚠️  {result['reason']}")
        print()

    # Summary
    added = [r for r in results if r["status"] == "added"]
    no_match = [r for r in results if r["status"] == "no_match"]
    skipped = [r for r in results if r["status"] == "skip"]

    print("=" * 60)
    print(f"SUMMARY: {len(added)} added, {len(no_match)} no match, {len(skipped)} skipped")
    print(f"API calls used: {api_calls}/{args.limit}")
    print()

    if added:
        print("Added videos:")
        for r in added:
            print(f"  {r['file']}: {r['title'][:50]}... (score: {r['score']})")


if __name__ == "__main__":
    main()
