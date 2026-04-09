"""Hero image generator for news articles via kie.ai (nano-banana-2).

Includes category-specific prompts and GPT-5.4 Vision validation gate.
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
# Category prompt templates
# ---------------------------------------------------------------------------

STYLE_SUFFIX = (
    "Style: photojournalistic, clean composition, natural lighting, "
    "shallow depth of field, 16:9 landscape. "
    "No text overlays, no watermarks, no logos, no impossible physics, "
    "no anatomical errors, no people interacting with vehicles incorrectly, "
    "no floating objects, no distorted proportions."
)

CATEGORY_PROMPTS: dict[str, str] = {
    "fuel": (
        "Wide shot of a modern fuel station at daytime, diesel dispensers visible, "
        "commercial vehicles in the background. Clean, professional atmosphere."
    ),
    "regulations": (
        "Official documents and road signs related to commercial vehicle transport. "
        "Clean desk or road scene with regulatory elements, professional tone."
    ),
    "model_specific": (
        "Professional side-view photograph of a modern {vehicle_hint} commercial vehicle "
        "parked on a clean urban road, natural daylight."
    ),
    "camper": (
        "A modern campervan parked in scenic travel scenery, mountains or lake "
        "in the background, golden hour lighting."
    ),
    "electric": (
        "Modern electric commercial vehicle plugged into a charging station, "
        "clean urban environment, daylight."
    ),
    "market": (
        "Wide shot of a commercial vehicle dealer lot with rows of new vans and buses, "
        "professional automotive photography."
    ),
    "default": (
        "Professional photograph of a modern commercial van driving on a highway, "
        "dynamic angle, natural daylight, motion blur on background."
    ),
}

# Order matters – checked top to bottom; more specific categories first.
_CATEGORY_KEYWORDS: list[tuple[str, list[str]]] = [
    ("fuel", ["paliwo", "diesel", "benzyna", "lpg", "ceny paliw", "tankowanie",
              "ropa", "stacja benzynowa"]),
    ("camper", ["kamper", "campervan", "vanlife", "zabudowa kampera",
                "kampervan", "dom na kółkach"]),
    ("electric", ["elektryczn", "ev ", "ładowani", "bateria", "zeroemisyjn"]),
    ("market", ["sprzedaż", "rynek", "producent", "wyniki sprzedaży",
                "ranking", "udział w rynku"]),
    ("regulations", ["prawo", "regulacje", "mandat", "przepisy", "rejestracja",
                     "homologacja", "ubezpieczenie", "przegląd", "kodeks"]),
]

_MODEL_KEYWORDS: list[str] = [
    "ducato", "sprinter", "transit", "crafter", "boxer", "master",
    "daily", "transporter", "vito", "berlingo", "combo", "trafic",
    "jumper", "jumpy", "movano", "interstar", "e-transit", "id.buzz",
    "proace", "expert", "vivaro",
]


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


def _detect_category(title: str) -> tuple[str, str | None]:
    """Detect image category from article title.

    Returns (category, vehicle_hint). vehicle_hint is set only for model_specific.
    """
    title_lower = title.lower()

    for model in _MODEL_KEYWORDS:
        if model in title_lower:
            return "model_specific", model.capitalize()

    for category, keywords in _CATEGORY_KEYWORDS:
        for kw in keywords:
            if kw in title_lower:
                return category, None

    return "default", None


def build_prompt(title: str, section: str) -> str:
    """Build a category-aware image generation prompt."""
    category, vehicle_hint = _detect_category(title)
    scene = CATEGORY_PROMPTS[category]
    if vehicle_hint and "{vehicle_hint}" in scene:
        scene = scene.replace("{vehicle_hint}", vehicle_hint)
    log.info("  Image category: %s (hint: %s)", category, vehicle_hint or "none")
    return f"{scene} {STYLE_SUFFIX}"


def _validate_image(image_path: Path, title: str) -> tuple[bool, str]:
    """Validate generated image using GPT-5.4 Vision.

    Returns (is_valid, reason).
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
        "max_tokens": 200,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": (
                            f"This AI-generated image is a hero photo for an article titled: \"{title}\".\n"
                            "Evaluate it and respond ONLY with JSON: {\"valid\": true/false, \"reason\": \"...\"}\n"
                            "Check:\n"
                            "1. Is the image physically sensible? (no anatomical absurdities, impossible physics, "
                            "objects clipping through each other, distorted body parts)\n"
                            "2. Does it look professional? (not an obvious AI failure with artifacts)\n"
                            "3. Is it thematically appropriate for the article topic?\n"
                            "Be strict – if anything looks wrong, mark as invalid."
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
    slug: str,
    section: str,
    static_dir: Path,
) -> str | None:
    """Generate a hero image and return its Hugo URL, or None on failure.

    Includes vision validation – retries up to MAX_VALIDATION_RETRIES times
    if the image fails quality checks, then falls back to None (placeholder).
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
            _download_and_optimize(image_url, dest)

            is_valid, reason = _validate_image(dest, title)
            if is_valid:
                log.info("  Image accepted (attempt %d): %s", attempt, dest)
                return f"/images/news/{slug}.webp"

            log.warning("  Image rejected (attempt %d): %s", attempt, reason)
            rejection_reasons.append(reason)
            dest.unlink(missing_ok=True)

        except Exception as e:
            log.error("Image generation failed (attempt %d): %s", attempt, e)
            dest.unlink(missing_ok=True)
            if attempt >= MAX_VALIDATION_RETRIES + 1:
                return None

    log.error("All %d attempts failed for '%s', using placeholder", MAX_VALIDATION_RETRIES + 1, title[:60])
    return None
