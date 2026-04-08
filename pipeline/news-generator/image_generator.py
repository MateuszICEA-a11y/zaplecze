"""Hero image generator for news articles via kie.ai (nano-banana-2)."""

from __future__ import annotations

import json
import logging
import os
import time
import urllib.request
import urllib.error
from pathlib import Path

log = logging.getLogger("news-generator.image")

KIE_API_KEY = os.environ.get("KIE_API_KEY", "")
KIE_BASE = "https://api.kie.ai/api/v1/jobs"
POLL_INTERVAL = 5
MAX_ATTEMPTS = 15


def _kie_request(method: str, endpoint: str, body: dict | None = None) -> dict:
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


def _create_task(prompt: str) -> str:
    res = _kie_request("POST", "/createTask", {
        "model": "nano-banana-2",
        "input": {
            "prompt": prompt,
            "aspect_ratio": "16:9",
            "resolution": "1K",
        },
    })
    if res.get("code") != 200:
        raise RuntimeError(f"kie.ai createTask error: {res.get('msg', res)}")
    return res["data"]["taskId"]


def _poll_until_done(task_id: str) -> str:
    for attempt in range(1, MAX_ATTEMPTS + 1):
        time.sleep(POLL_INTERVAL)
        log.info("  Polling %d/%d...", attempt, MAX_ATTEMPTS)
        try:
            res = _kie_request("GET", f"/recordInfo?taskId={task_id}")
        except Exception as e:
            log.warning("  Network error: %s, retrying...", e)
            continue

        state = res.get("data", {}).get("state", "unknown")
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
                raise RuntimeError("No imageUrl in kie.ai response")
            return image_url

        if state.lower() in ("failed", "error"):
            raise RuntimeError(f"kie.ai task failed: {state}")

    raise RuntimeError(f"Timeout after {MAX_ATTEMPTS} attempts")


def _download_and_optimize(url: str, dest: Path, max_width: int = 1200, quality: int = 80) -> Path:
    """Download image, resize, convert to optimized WebP."""
    from PIL import Image
    import io

    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0",
        "Referer": "https://api.kie.ai/",
    })
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = resp.read()

    original_kb = len(data) / 1024
    img = Image.open(io.BytesIO(data))

    if img.width > max_width:
        ratio = max_width / img.width
        img = img.resize((max_width, int(img.height * ratio)), Image.LANCZOS)

    webp_dest = dest.with_suffix(".webp")
    img.save(webp_dest, "WEBP", quality=quality, method=6)
    optimized_kb = webp_dest.stat().st_size / 1024
    log.info("  Optimized: %.0fKB → %.0fKB (WebP q%d, %dx%d)",
             original_kb, optimized_kb, quality, img.width, img.height)
    return webp_dest


def build_prompt(title: str, section: str) -> str:
    """Build an image generation prompt from news title and section."""
    return (
        f"Professional editorial photo for a news article about: {title}. "
        f"Topic area: commercial vehicles, vans, buses, campers. "
        f"Style: photojournalistic, clean, modern, high contrast, "
        f"no text overlays, no watermarks, no logos. "
        f"Aspect ratio 16:9, landscape orientation."
    )


def generate_hero_image(
    title: str,
    slug: str,
    section: str,
    static_dir: Path,
) -> str | None:
    """Generate a hero image and return its Hugo URL, or None on failure.

    Args:
        title: Article title (used to build prompt).
        slug: URL slug (used for filename).
        section: Hugo section (e.g. "news").
        static_dir: Path to portal's static/ directory.

    Returns:
        Hugo image path (e.g. "/images/news/slug.webp") or None.
    """
    if not KIE_API_KEY:
        log.warning("KIE_API_KEY not set, skipping image generation")
        return None

    images_dir = static_dir / "images" / "news"
    images_dir.mkdir(parents=True, exist_ok=True)

    dest = images_dir / f"{slug}.webp"
    if dest.exists():
        log.info("Image already exists: %s", dest.name)
        return f"/images/news/{slug}.webp"

    prompt = build_prompt(title, section)
    log.info("Generating hero image for '%s'...", title[:60])

    try:
        task_id = _create_task(prompt)
        log.info("  kie.ai taskId: %s", task_id)
        image_url = _poll_until_done(task_id)
        log.info("  Image URL: %s", image_url[:80])
        _download_and_optimize(image_url, dest)
        log.info("  Saved: %s", dest)
        return f"/images/news/{slug}.webp"
    except Exception as e:
        log.error("Image generation failed: %s", e)
        return None
