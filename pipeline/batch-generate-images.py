#!/usr/bin/env python3
"""Batch generate missing hero images via kie.ai."""
import json
import os
import re
import shutil
import sys
import time
import urllib.request
import urllib.error

KIE_API_KEY = os.environ.get("KIE_API_KEY", "")
KIE_BASE = "https://api.kie.ai/api/v1/jobs"
POLL_INTERVAL = 5
MAX_ATTEMPTS = 15

CONTENT_DIR = "portals/busmaniak.pl/content"
STATIC_DIR = "portals/busmaniak.pl/static/images"

PROMPT_PREFIX = "Professional editorial photograph, natural lighting, shallow depth of field, 16:9 aspect ratio. "


def kie_request(method, endpoint, body=None):
    url = KIE_BASE + endpoint
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(
        url, data=data, method=method,
        headers={"Authorization": f"Bearer {KIE_API_KEY}", "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode())


def create_task(prompt):
    res = kie_request("POST", "/createTask", {
        "model": "nano-banana-2",
        "input": {"prompt": prompt, "aspect_ratio": "16:9", "resolution": "1K", "output_format": "jpg"},
    })
    if res.get("code") != 200:
        raise RuntimeError(f"createTask error: {res.get('msg', res)}")
    return res["data"]["taskId"]


def poll_until_done(task_id):
    for attempt in range(1, MAX_ATTEMPTS + 1):
        time.sleep(POLL_INTERVAL)
        try:
            res = kie_request("GET", f"/recordInfo?taskId={task_id}")
        except Exception as e:
            print(f"    retry ({e})")
            continue
        state = res.get("data", {}).get("state", "unknown")
        if state.lower() in ("success", "completed"):
            result_json = res["data"].get("resultJson", "{}")
            if isinstance(result_json, str):
                result_json = json.loads(result_json)
            url = (result_json.get("resultUrls", [None])[0]
                   or result_json.get("images", [None])[0] or "")
            if not url:
                raise RuntimeError("No image URL in response")
            return url
        if state.lower() in ("failed", "error"):
            raise RuntimeError(f"Task failed: {state}")
    raise RuntimeError(f"Timeout after {MAX_ATTEMPTS} polls")


def download(url, dest):
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0", "Referer": "https://api.kie.ai/",
    })
    with urllib.request.urlopen(req, timeout=30) as resp:
        with open(dest, "wb") as f:
            f.write(resp.read())


def find_missing():
    existing = set(os.listdir(STATIC_DIR)) if os.path.isdir(STATIC_DIR) else set()
    missing = []
    for root, dirs, files in os.walk(CONTENT_DIR):
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
                alt = alt_m.group(1) if alt_m else filename.replace("-", " ").replace(".jpg", "")
                slug = filename.replace(".jpg", "").replace(".png", "")
                missing.append((slug, filename, alt))
    return sorted(missing)


def main():
    if not KIE_API_KEY:
        print("ERROR: Set KIE_API_KEY environment variable")
        sys.exit(1)

    os.makedirs(STATIC_DIR, exist_ok=True)
    missing = find_missing()
    total = len(missing)
    print(f"Found {total} missing images\n")

    success = 0
    failed = []

    for i, (slug, filename, alt) in enumerate(missing, 1):
        print(f"[{i}/{total}] {slug}")
        prompt = PROMPT_PREFIX + alt
        dest = os.path.join(STATIC_DIR, filename)

        try:
            task_id = create_task(prompt)
            print(f"  task: {task_id}, polling...")
            url = poll_until_done(task_id)
            tmp = f"/tmp/busmaniak_{slug}.jpg"
            download(url, tmp)
            shutil.move(tmp, dest)
            print(f"  OK -> {dest}")
            success += 1
        except Exception as e:
            print(f"  FAILED: {e}")
            failed.append((slug, str(e)))

        # small delay between tasks
        if i < total:
            time.sleep(1)

    print(f"\n{'='*40}")
    print(f"Done: {success}/{total} generated")
    if failed:
        print(f"Failed ({len(failed)}):")
        for s, e in failed:
            print(f"  - {s}: {e}")


if __name__ == "__main__":
    main()
