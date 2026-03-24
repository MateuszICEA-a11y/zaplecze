#!/usr/bin/env python3
"""
generate-image.py – kie.ai image generation for BusManiak.pl
Usage: python3 generate-image.py --prompt "..." --slug "slug" --alt "alt text"

Flow:
  1. POST kie.ai createTask (nano-banana-2, 1K, 16:9)
  2. Poll recordInfo every 5s (max 12 attempts)
  3. Download image -> /tmp/busmaniak_[slug].jpg
  4. Copy to portal static/images/
"""

import argparse
import json
import os
import sys
import time
import urllib.request
import urllib.error

KIE_API_KEY = "b0635a47a098a28a481d44af5a75731e"
KIE_BASE = "https://api.kie.ai/api/v1/jobs"
POLL_INTERVAL = 5
MAX_ATTEMPTS = 15
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def kie_request(method, endpoint, body=None):
    url = KIE_BASE + endpoint
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(
        url,
        data=data,
        method=method,
        headers={
            "Authorization": f"Bearer {KIE_API_KEY}",
            "Content-Type": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode())


def create_task(prompt):
    print(f"-> Tworzę task kie.ai (nano-banana-2, 1K)...")
    res = kie_request("POST", "/createTask", {
        "model": "nano-banana-2",
        "input": {
            "prompt": prompt,
            "aspect_ratio": "16:9",
            "resolution": "1K",
            "output_format": "jpg",
        },
    })
    if res.get("code") != 200:
        raise RuntimeError(f"kie.ai createTask error: {res.get('msg', res)}")
    task_id = res["data"]["taskId"]
    print(f"   taskId: {task_id}")
    return task_id


def poll_until_done(task_id):
    for attempt in range(1, MAX_ATTEMPTS + 1):
        time.sleep(POLL_INTERVAL)
        print(f"   Polling {attempt}/{MAX_ATTEMPTS}...", end=" ")
        try:
            res = kie_request("GET", f"/recordInfo?taskId={task_id}")
        except Exception as e:
            print(f"błąd sieci ({e}), ponawiam...")
            continue

        state = res.get("data", {}).get("state", "unknown")
        print(f"stan: {state}")

        if state.lower() in ("success", "completed"):
            result_json = res["data"].get("resultJson", "{}")
            if isinstance(result_json, str):
                result_json = json.loads(result_json)
            image_url = (
                result_json.get("resultUrls", [None])[0]
                or result_json.get("images", [None])[0]
                or ""
            )
            if not image_url:
                raise RuntimeError("Brak imageUrl w odpowiedzi kie.ai")
            return image_url

        if state.lower() in ("failed", "error"):
            raise RuntimeError(f"kie.ai task failed: {state}")

    raise RuntimeError(
        f"Timeout po {MAX_ATTEMPTS} próbach.\n"
        f"Sprawdź: GET {KIE_BASE}/recordInfo?taskId={task_id}"
    )


def download_file(url, dest):
    print(f"-> Pobieram obraz...")
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": "https://api.kie.ai/",
    })
    with urllib.request.urlopen(req, timeout=30) as resp:
        with open(dest, "wb") as f:
            f.write(resp.read())
    print(f"   Zapisano: {dest}")


def main():
    parser = argparse.ArgumentParser(description="Generate image via kie.ai")
    parser.add_argument("--prompt", required=True)
    parser.add_argument("--slug", required=True)
    parser.add_argument("--alt", required=True)
    parser.add_argument("--portal", default="busmaniak.pl")
    args = parser.parse_args()

    tmp_path = f"/tmp/busmaniak_{args.slug}.jpg"
    dest_dir = os.path.join(PROJECT_ROOT, "portals", args.portal, "static", "images")
    os.makedirs(dest_dir, exist_ok=True)
    dest_path = os.path.join(dest_dir, f"{args.slug}.jpg")

    # 1. Create task
    task_id = create_task(args.prompt)

    # 2. Poll
    print("-> Czekam na wygenerowanie...")
    image_url = poll_until_done(task_id)
    print(f"   URL: {image_url}")

    # 3. Download
    download_file(image_url, tmp_path)

    # 4. Copy to static
    import shutil
    shutil.copy2(tmp_path, dest_path)
    os.unlink(tmp_path)

    hugo_url = f"/images/{args.slug}.jpg"
    print(f"\n✅ GOTOWE")
    print(f"   Plik: {dest_path}")
    print(f"   Hugo URL: {hugo_url}")
    print(f"   Alt: {args.alt}")


if __name__ == "__main__":
    main()
