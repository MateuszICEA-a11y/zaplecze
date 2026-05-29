"""Hero image generator for news articles via kie.ai.

Generates abstract portal-style hero illustrations (obsidian + sky-blue)
with GPT-5.4 Vision validation gate.
"""

from __future__ import annotations

import base64
import json
import logging
import os
import re
import time
import urllib.request
import urllib.error
from pathlib import Path

log = logging.getLogger("news-generator.image")

KIE_API_KEY = os.environ.get("KIE_API_KEY", "")
KIE_BASE = "https://api.kie.ai/api/v1/jobs"
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
POLL_INTERVAL = 5
MAX_ATTEMPTS = 15
MAX_VALIDATION_RETRIES = 2

# ---------------------------------------------------------------------------
# Portal hero style
# ---------------------------------------------------------------------------

HERO_STYLE = (
    "Premium editorial tech illustration. Deep obsidian black background "
    "(#070810). Subtle sky-blue accents (#0a9cff) used sparingly for glow "
    "and key elements. Minimalist, sophisticated, high-end AI consultancy "
    "aesthetic. No people, no text, no letters, no logos, no UI mockups. "
    "Abstract geometric, wide cinematic composition. Soft volumetric lighting. "
)
MODEL = "gpt-image-2-text-to-image"


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
        "model": MODEL,
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


def build_prompt(title: str, section: str = "news", *, _category=None, _vehicle_hint=None) -> str:
    return (
        HERO_STYLE
        + f"Abstract visual metaphor for an AI/search-industry news headline: \"{title}\". "
        "Translate the concept into geometric forms, nodes, light beams or data flows. "
        "No readable text."
    )


def _validate_image(image_path: Path, title: str) -> tuple[bool, str]:
    """Validate generated image using GPT-5.4 Vision.

    Returns (is_valid, reason). Confirms the image was produced and is a
    professional, thematically appropriate abstract hero illustration.
    """
    if not OPENAI_API_KEY:
        log.warning("OPENAI_API_KEY not set, skipping vision validation")
        return True, "no API key"

    with open(image_path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode()

    suffix = image_path.suffix.lstrip(".")
    media_type = "image/webp" if suffix == "webp" else f"image/{suffix}"

    payload = {
        "model": "gpt-5.4",
        "max_completion_tokens": 200,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": (
                            f"This AI-generated image is a hero illustration for an article titled: \"{title}\".\n"
                            "Evaluate it and respond ONLY with JSON: {\"valid\": true/false, \"reason\": \"...\"}\n"
                            "Context: this is for widocznosc.ai – a portal about brand visibility in AI search.\n"
                            "Check:\n"
                            "1. Is there any readable text, letters, or logos? If yes → INVALID.\n"
                            "2. Is the image physically sensible? (no impossible physics, "
                            "objects clipping through each other)\n"
                            "3. Does it look professional? (not an obvious AI failure with artifacts)\n"
                            "4. Is it an abstract, geometric, dark editorial composition fitting the brand?\n"
                            "Be strict on points 1 and 3."
                        ),
                    },
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:{media_type};base64,{b64}"},
                    },
                ],
            }
        ],
    }

    req = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=json.dumps(payload).encode(),
        method="POST",
        headers={
            "Authorization": f"Bearer {OPENAI_API_KEY}",
            "Content-Type": "application/json",
        },
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            result = json.loads(resp.read().decode())
        text = result["choices"][0]["message"]["content"].strip()
        # Extract JSON from response (may be wrapped in markdown code block)
        json_match = re.search(r"\{.*\}", text, re.DOTALL)
        if not json_match:
            log.warning("  Vision returned non-JSON: %s", text[:100])
            return True, "unparseable response"
        verdict = json.loads(json_match.group())
        is_valid = verdict.get("valid", True)
        reason = verdict.get("reason", "no reason given")
        log.info("  Vision verdict: valid=%s reason=%s", is_valid, reason)
        return is_valid, reason
    except Exception as e:
        log.warning("  Vision validation failed: %s – accepting image", e)
        return True, f"validation error: {e}"


def generate_hero_image(
    title: str,
    section: str,
    dest: Path,
) -> Path | None:
    """Generate a portal-style hero image and save it to ``dest`` (webp).

    Returns the written Path, or None on failure. Includes vision validation –
    retries up to MAX_VALIDATION_RETRIES times if the image fails quality checks,
    then falls back to None (placeholder).
    """
    if not KIE_API_KEY:
        log.warning("KIE_API_KEY not set, skipping image generation")
        return None

    dest = Path(dest).with_suffix(".webp")
    dest.parent.mkdir(parents=True, exist_ok=True)

    if dest.exists():
        log.info("Image already exists: %s", dest.name)
        return dest

    prompt = build_prompt(title, section)
    rejection_reasons: list[str] = []

    for attempt in range(1, MAX_VALIDATION_RETRIES + 2):  # 1 initial + retries
        log.info("Generating hero image for '%s' (attempt %d)...", title[:60], attempt)

        if attempt > 1 and rejection_reasons:
            prompt = (
                f"{prompt} "
                f"IMPORTANT: Previous image was rejected because: {rejection_reasons[-1]}. "
                f"Avoid this issue."
            )

        try:
            task_id = _create_task(prompt)
            log.info("  kie.ai taskId: %s", task_id)
            image_url = _poll_until_done(task_id)
            log.info("  Image URL: %s", image_url[:80])
            written = _download_and_optimize(image_url, dest)

            is_valid, reason = _validate_image(written, title)
            if is_valid:
                log.info("  Image accepted (attempt %d): %s", attempt, written)
                return written

            log.warning("  Image rejected (attempt %d): %s", attempt, reason)
            rejection_reasons.append(reason)
            written.unlink(missing_ok=True)

        except Exception as e:
            log.error("Image generation failed (attempt %d): %s", attempt, e)
            dest.unlink(missing_ok=True)
            if attempt >= MAX_VALIDATION_RETRIES + 1:
                return None

    log.error("All %d attempts failed for '%s', using placeholder", MAX_VALIDATION_RETRIES + 1, title[:60])
    return None
