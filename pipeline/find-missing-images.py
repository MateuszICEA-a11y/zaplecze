#!/usr/bin/env python3
"""Find articles with missing hero images."""
import os
import re

content_dir = "portals/busmaniak.pl/content"
static_dir = "portals/busmaniak.pl/static/images"
existing = set(os.listdir(static_dir)) if os.path.isdir(static_dir) else set()

missing = []
for root, dirs, files in os.walk(content_dir):
    for f in files:
        if not f.endswith(".md"):
            continue
        path = os.path.join(root, f)
        with open(path) as fh:
            text = fh.read()
        lines = [l for l in text.split("\n") if l.strip()]
        if len(lines) < 15:
            continue
        if "redirect:" in text[:500] or "draft: true" in text[:500]:
            continue
        m = re.search(r'image:\s*["\']?(/images/([^"\'\s]+))', text)
        if not m:
            continue
        filename = m.group(2)
        if filename not in existing:
            alt_m = re.search(r'image_alt:\s*["\']?(.+?)["\']?\s*$', text, re.MULTILINE)
            alt = alt_m.group(1) if alt_m else ""
            slug = filename.replace(".jpg", "").replace(".png", "")
            missing.append((slug, alt))

missing.sort()
print(f"Total missing: {len(missing)}\n")
for slug, alt in missing:
    print(f"{slug}|{alt}")
