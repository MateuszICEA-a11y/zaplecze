#!/usr/bin/env python3
"""Apply approved YouTube video assignments from JSON mapping to article files."""

import json
import re
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
MAPPING_FILE = SCRIPT_DIR / "approved-videos.json"


def apply_video(filepath: Path, video_id: str, video_title: str) -> bool:
    content = filepath.read_text(encoding="utf-8")

    # Skip if already has youtube
    if "youtube:" in content.split("---")[1] if content.startswith("---") else "":
        return False

    # Escape quotes in title
    safe_title = video_title.replace('"', '\\"')

    # Insert youtube fields in frontmatter
    fm_patterns = [
        (r'(image_alt:\s*"[^"]*")', r'\1\nyoutube: "' + video_id + '"\nyoutube_title: "' + safe_title + '"'),
        (r'(lead:\s*"[^"]*")', r'\1\nyoutube: "' + video_id + '"\nyoutube_title: "' + safe_title + '"'),
        (r'(main_keyword:\s*"[^"]*")', r'\1\nyoutube: "' + video_id + '"\nyoutube_title: "' + safe_title + '"'),
    ]

    new_content = content
    inserted = False
    for pattern, replacement in fm_patterns:
        if re.search(pattern, new_content):
            new_content = re.sub(pattern, replacement, new_content, count=1)
            inserted = True
            break

    if not inserted:
        return False

    # Find last ## heading in body
    fm_end = new_content.find("\n---", 3)
    if fm_end == -1:
        return False
    body_start = fm_end + 4
    body = new_content[body_start:]

    h2_matches = list(re.finditer(r'^## ', body, re.MULTILINE))
    if not h2_matches:
        return False

    last_h2_pos = body_start + h2_matches[-1].start()
    shortcode = "\n{{% youtube %}}\n\n"
    new_content = new_content[:last_h2_pos] + shortcode + new_content[last_h2_pos:]

    filepath.write_text(new_content, encoding="utf-8")
    return True


def main():
    content_root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(".")

    with open(MAPPING_FILE) as f:
        mapping = json.load(f)

    added = 0
    skipped = 0
    errors = 0

    for rel_path, video in mapping.items():
        if rel_path.startswith("_"):
            continue

        filepath = content_root / rel_path
        if not filepath.exists():
            print(f"  ⚠️  NOT FOUND: {rel_path}")
            errors += 1
            continue

        video_id = video["id"]
        video_title = video["title"]

        ok = apply_video(filepath, video_id, video_title)
        if ok:
            print(f"  ✅ {rel_path}")
            added += 1
        else:
            print(f"  ⏭️  {rel_path} (already has video or no H2)")
            skipped += 1

    print(f"\nDone: {added} added, {skipped} skipped, {errors} errors")


if __name__ == "__main__":
    main()
