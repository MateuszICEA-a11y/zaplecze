"""Post-processor – validation, typography, cleanup, markdown assembly."""

from __future__ import annotations

import re
from datetime import datetime

import yaml


REQUIRED_FIELDS = ["title", "lead", "date", "sourceName", "sourceUrl"]

# Shortcodes that Hugo actually supports in this project
ALLOWED_SHORTCODES = {"youtube"}


def fix_typography(text: str) -> str:
    """Fix typography: em-dash → en-dash."""
    text = text.replace("\u2014", "\u2013")
    return text


def validate_frontmatter(fm: dict) -> list[str]:
    """Validate frontmatter has all required fields. Returns list of error messages."""
    errors = []
    for field in REQUIRED_FIELDS:
        if field not in fm or fm[field] is None or fm[field] == "":
            errors.append(f"Missing required frontmatter field: {field}")
    return errors


def clean_body(body: str) -> str:
    """Clean body text: remove invalid shortcodes, fix formatting."""

    def replace_shortcode(match: re.Match) -> str:
        name = match.group(1).strip()
        if name in ALLOWED_SHORTCODES:
            return match.group(0)
        return ""

    body = re.sub(r"\{\{[<%]\s*(\w+)[^}>]*[%>]\}\}", replace_shortcode, body)

    # Clean up resulting empty lines (more than 2 consecutive)
    body = re.sub(r"\n{3,}", "\n\n", body)

    return body.strip()


def ensure_body_starts_with_h2(body: str) -> str:
    """Ensure body starts with ## H2 heading, strip any intro text."""
    h2_match = re.search(r"^(## .+)$", body, re.MULTILINE)
    if h2_match:
        return body[h2_match.start():]
    return body


def build_markdown(fm: dict, body: str) -> str:
    """Combine frontmatter and body into a complete markdown file."""
    if isinstance(fm.get("date"), datetime):
        fm["date"] = fm["date"].strftime("%Y-%m-%d")

    fm_str = yaml.dump(
        fm,
        default_flow_style=False,
        allow_unicode=True,
        sort_keys=False,
        width=1000,
    ).strip()

    return f"---\n{fm_str}\n---\n\n{body}\n"


def generate_slug(title: str) -> str:
    """Generate a URL-friendly slug from a title."""
    char_map = {
        "ą": "a", "ć": "c", "ę": "e", "ł": "l", "ń": "n",
        "ó": "o", "ś": "s", "ź": "z", "ż": "z",
        "Ą": "a", "Ć": "c", "Ę": "e", "Ł": "l", "Ń": "n",
        "Ó": "o", "Ś": "s", "Ź": "z", "Ż": "z",
    }
    slug = title.lower()
    for pl_char, ascii_char in char_map.items():
        slug = slug.replace(pl_char, ascii_char)

    slug = re.sub(r"[^a-z0-9\s-]", "", slug)
    slug = re.sub(r"[\s]+", "-", slug.strip())
    slug = re.sub(r"-+", "-", slug)
    if len(slug) <= 80:
        return slug
    truncated = slug[:80]
    last_hyphen = truncated.rfind("-")
    if last_hyphen > 0:
        return truncated[:last_hyphen]
    return truncated


def postprocess(
    fm: dict,
    body: str,
    image_path: str | None = None,
    author: str = "Redakcja widocznosc.ai",
) -> tuple[dict, str, list[str]]:
    """Astro frontmatter post-processing. Returns (fm, body, errors)."""
    errors = validate_frontmatter(fm)

    for key, val in list(fm.items()):
        if isinstance(val, str):
            fm[key] = fix_typography(val)
        elif isinstance(val, list):
            fm[key] = [fix_typography(v) if isinstance(v, str) else v for v in val]

    fm["author"] = author
    if "tags" not in fm or fm["tags"] is None:
        fm["tags"] = []
    if image_path:
        fm["image"] = image_path
    # Astro: usuń pola Hugo-specific
    for k in ("draft", "categories", "toc", "faq", "image_alt", "main_keyword", "description"):
        fm.pop(k, None)

    body = fix_typography(body)
    body = clean_body(body)
    body = ensure_body_starts_with_h2(body)
    return fm, body, errors
