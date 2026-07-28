"""Odczyt pojedynczego wpisu z WordPressa (te same reguły co w collectorze)."""
import json
import os
import sys
import urllib.parse
import urllib.request
from pathlib import Path

COLLECTOR = Path(__file__).resolve().parents[2] / "dashboard" / "collector"
sys.path.insert(0, str(COLLECTOR))
from sources.wordpress import build_body, content_hash, strip_html  # noqa: E402

DATA_DIR = Path(__file__).resolve().parents[2] / "dashboard" / "data"


class WordPressError(RuntimeError):
    pass


def _auth_header() -> dict:
    """Application Password, jeśli jest. Odczyt działa też anonimowo."""
    import base64

    user = os.environ.get("WP_APP_USER", "").strip()
    password = os.environ.get("WP_APP_PASSWORD", "").strip()
    if not user or not password:
        return {}
    token = base64.b64encode(f"{user}:{password}".encode()).decode()
    return {"Authorization": f"Basic {token}"}


def fetch_post(base_url: str, post_type: str, post_id: int) -> dict:
    """Wpis z REST. Uwaga: końcowy ukośnik po typie jest obowiązkowy (301)."""
    url = f"{base_url.rstrip('/')}/wp-json/wp/v2/{post_type}/{post_id}/"
    request = urllib.request.Request(url)
    for key, value in {
        "Accept": "application/json",
        "User-Agent": "content-refresher",
        **_auth_header(),
    }.items():
        request.add_header(key, value)
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.loads(response.read().decode("utf-8"))
    except Exception as err:  # noqa: BLE001
        raise WordPressError(f"nie udało się pobrać wpisu {post_id}: {err}") from err


def post_content(post: dict, content_fields: list[str] | None = None) -> dict:
    """Treść wpisu w formie używanej przez pipeline (maper z collectora)."""
    body, headings, mode = build_body(post, content_fields or [])
    return {
        "html": body,
        "text": strip_html(body),
        "mode": mode,
        "headings": headings,
        "hash": content_hash(body),
    }


def catalog(domain: str, exclude_url: str = "", limit: int = 400) -> list[dict]:
    """Katalog treści domeny z details.json – baza do linkowania wewnętrznego."""
    path = DATA_DIR / domain / "details.json"
    if not path.is_file():
        return []
    try:
        payload = json.loads(path.read_text())
    except json.JSONDecodeError:
        return []
    items = ((payload.get("sources") or {}).get("wordpress") or {}).get("items") or []
    rows = [{
        "title": item.get("title"),
        "url": item.get("url"),
        "pillar": item.get("pillar"),
        "words": item.get("word_count"),
    } for item in items if item.get("url") and item.get("url") != exclude_url]
    rows.sort(key=lambda row: -(row.get("words") or 0))
    return rows[:limit]


def domain_config(domain: str) -> dict:
    """Wpis domeny z domains.yaml – base_url, pola treści CPT, property GSC."""
    import yaml

    config = yaml.safe_load((COLLECTOR.parent / "domains.yaml").read_text())
    for entry in config.get("domains") or []:
        if entry.get("id") == domain:
            return entry
    raise WordPressError(f"domena {domain} nie istnieje w domains.yaml")
