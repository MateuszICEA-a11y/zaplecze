"""WordPress REST – katalog treści dla Content Watchera (start: grupa-icea.pl).

Czyta `/wp-json/wp/v2/<typ>/` stronami po 100 i buduje katalog: metadane,
zrekonstruowaną treść i hash. Uwierzytelnienie przez Application Password jest
opcjonalne (WP_APP_USER + WP_APP_PASSWORD) – dopóki REST odpowiada anonimowo,
źródło działa bez sekretów, ale nagłówek dokładamy od razu, gdy sekrety są.

Gotcha tej instalacji (sonda 2026-07-27, potwierdzona 2026-07-28):

- `content.rendered` zawiera wyłącznie lead. Pełny tekst leży w polach ACF
  `page_title_h2_1..30` / `page_text_1..30`; starsze wpisy używają
  `page_content_no_section`, a najstarsze – samego `content.rendered`.
  Kolejność fallbacku jest właśnie taka.
- `wordCount` w schemie Yoasta liczy tylko lead – nie używamy go w ogóle.
- URL bez końcowego ukośnika robi 301 na wariant z ukośnikiem: `/posts/`, nie
  `/posts`.
- `modified` podnosi się przy każdym zapisie (także masowej akcji wtyczki), więc
  świeżość liczymy z hasha znormalizowanej treści: `content_changed_at` zmienia
  się tylko wtedy, gdy zmienił się tekst.
"""
import base64
import hashlib
import html
import json
import re
import urllib.parse
from datetime import datetime, timezone
from pathlib import Path

from . import SourceError
from ._http import classify_http_error, request_json

DATA_DIR = Path(__file__).resolve().parents[2] / "data"
PER_PAGE = 100
MAX_PAGES = 40  # bezpiecznik: 4000 wpisów na typ
ACF_SECTIONS = 30  # liczba par page_title_h2_N / page_text_N w grupie pól
FIELDS = "id,date,modified,slug,link,title,content,author,categories,acf,yoast_head_json"
STALE_DAYS = 365
THIN_WORDS = 400


def _auth_header(env: dict) -> dict:
    user = (env.get("WP_APP_USER") or "").strip()
    password = (env.get("WP_APP_PASSWORD") or "").strip()
    if not user or not password:
        return {}
    token = base64.b64encode(f"{user}:{password}".encode()).decode()
    return {"Authorization": f"Basic {token}"}


def _get(url: str, headers: dict):
    try:
        return request_json(url, headers=headers, timeout=30)
    except Exception as err:  # noqa: BLE001
        raise classify_http_error(err, "wordpress") from err


def _fetch_type(base: str, post_type: str, headers: dict) -> list[dict]:
    """Wszystkie opublikowane wpisy danego typu (stronicowanie po 100)."""
    items: list[dict] = []
    for page in range(1, MAX_PAGES + 1):
        query = urllib.parse.urlencode(
            {"per_page": PER_PAGE, "page": page, "_fields": FIELDS, "status": "publish"}
        )
        batch = _get(f"{base}/wp-json/wp/v2/{post_type}/?{query}", headers)
        if not isinstance(batch, list):
            raise SourceError("error", f"wordpress: nieoczekiwany format dla typu {post_type}")
        items.extend(batch)
        if len(batch) < PER_PAGE:
            break
    return items


def _categories(base: str, headers: dict) -> dict[int, str]:
    """Mapa id → slug kategorii; pusta, gdy endpoint niedostępny (nie blokuje katalogu)."""
    try:
        query = urllib.parse.urlencode({"per_page": PER_PAGE, "_fields": "id,slug"})
        rows = _get(f"{base}/wp-json/wp/v2/categories/?{query}", headers)
    except SourceError:
        return {}
    return {row["id"]: row["slug"] for row in rows if isinstance(row, dict) and row.get("id")}


_TAG_RE = re.compile(r"<[^>]+>")
_SCRIPT_RE = re.compile(r"<(script|style)[^>]*>.*?</\1>", re.I | re.S)
_HREF_RE = re.compile(r"""<a\b[^>]*\bhref\s*=\s*["']([^"']+)["']""", re.I)
_HEADING_RE = re.compile(r"<h([2-6])\b", re.I)


def _text(raw: str) -> str:
    return html.unescape(_TAG_RE.sub(" ", _SCRIPT_RE.sub(" ", raw or "")))


def _words(text: str) -> int:
    return len([token for token in re.split(r"\s+", text) if token.strip()])


def _sections(acf: dict) -> list[tuple[str, str]]:
    """Wypełnione pary (H2, tekst) z grupy ACF, w kolejności szablonu."""
    out = []
    for i in range(1, ACF_SECTIONS + 1):
        title = (acf.get(f"page_title_h2_{i}") or "").strip()
        text = (acf.get(f"page_text_{i}") or "").strip()
        if title or text:
            out.append((title, text))
    return out


def _body(post: dict, custom_fields: list[str]) -> tuple[str, int, str]:
    """(HTML pełnej treści, liczba H2 z ACF, tryb odczytu).

    Tryby: `acf` – sekcje szablonu bloga, `no_section` – wpis bez sekcji,
    `fields` – pola wskazane w `content_fields` (CPT mają własne, np. Słownik
    trzyma treść w `dictionary_text_hero` + `dictionary_text` i w ogóle nie
    wystawia `content` w REST), `content` – całość w content.rendered.
    """
    acf = post.get("acf") if isinstance(post.get("acf"), dict) else {}
    lead = ((post.get("content") or {}).get("rendered") or "").strip()
    sections = _sections(acf)
    if sections:
        body = "\n".join(f"<h2>{title}</h2>\n{text}" for title, text in sections)
        return f"{lead}\n{body}", sum(1 for title, _ in sections if title), "acf"
    no_section = (acf.get("page_content_no_section") or "").strip()
    if no_section:
        return f"{lead}\n{no_section}", 0, "no_section"
    custom = "\n".join(part for part in ((acf.get(field) or "").strip() for field in custom_fields) if part)
    if custom:
        return f"{lead}\n{custom}", 0, "fields"
    return lead, 0, "content"


def _normalize(text: str) -> str:
    """Tekst do hasha – bez HTML, encji i różnic w białych znakach.

    Dzięki temu zapis w CMS bez zmiany treści (albo masowa akcja wtyczki) nie
    wygląda jak odświeżenie artykułu.
    """
    return re.sub(r"\s+", " ", _text(text)).strip().lower()


def _links(body: str, host: str) -> tuple[int, int]:
    internal = external = 0
    for href in _HREF_RE.findall(body):
        href = href.strip()
        if href.startswith("#") or href.startswith("mailto:") or href.startswith("tel:"):
            continue
        if href.startswith("/") or host in href.split("/")[:3]:
            internal += 1
        elif re.match(r"^https?://", href, re.I):
            external += 1
    return internal, external


def _iso_date(value) -> str | None:
    match = re.match(r"(\d{4}-\d{2}-\d{2})", str(value or ""))
    return match.group(1) if match else None


def _previous_items(domain_id: str) -> dict[str, dict]:
    """Poprzedni katalog z details.json – nośnik historii hashy między przejazdami."""
    path = DATA_DIR / domain_id / "details.json"
    if not path.is_file():
        return {}
    try:
        payload = json.loads(path.read_text())
    except json.JSONDecodeError:
        return {}
    items = ((payload.get("sources") or {}).get("wordpress") or {}).get("items") or []
    return {str(item.get("id")): item for item in items if item.get("id") is not None}


def fetch(cfg: dict, env: dict) -> dict:
    base = (cfg.get("base_url") or "").rstrip("/")
    if not base:
        raise SourceError("not_configured", "wordpress: brak base_url w domains.yaml")
    host = urllib.parse.urlparse(base).netloc
    post_types = cfg.get("post_types") or ["posts"]
    content_fields = cfg.get("content_fields") or {}
    headers = _auth_header(env)
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    previous = _previous_items(cfg.get("domain") or "")
    categories = _categories(base, headers)

    items: list[dict] = []
    for post_type in post_types:
        for post in _fetch_type(base, post_type, headers):
            body, headings, mode = _body(post, content_fields.get(post_type) or [])
            text = _text(body)
            content_hash = hashlib.sha256(_normalize(body).encode("utf-8")).hexdigest()[:16]
            internal, external = _links(body, host)
            published = _iso_date(post.get("date"))
            modified = _iso_date(post.get("modified"))
            yoast = post.get("yoast_head_json") or {}
            prior = previous.get(str(post.get("id")))
            if prior and prior.get("content_hash") == content_hash:
                changed_at = prior.get("content_changed_at") or modified
                baseline = bool(prior.get("hash_baseline"))
            elif prior:
                changed_at, baseline = today, False
            else:
                # Pierwsze spotkanie wpisu – nie wiemy, kiedy treść naprawdę się
                # zmieniła, więc bierzemy `modified` i oznaczamy to jako punkt
                # odniesienia, żeby nie udawać pewności.
                changed_at, baseline = modified, True
            slugs = [categories.get(cid) for cid in (post.get("categories") or [])]
            slugs = [slug for slug in slugs if slug]
            items.append({
                "id": post.get("id"),
                "type": post_type,
                "url": post.get("link"),
                "slug": post.get("slug"),
                "title": html.unescape((post.get("title") or {}).get("rendered") or ""),
                "author": yoast.get("author") or "—",
                "categories": slugs,
                "pillar": slugs[0] if slugs else post_type,
                "published_at": published,
                "modified_at": modified,
                "content_changed_at": changed_at,
                "hash_baseline": baseline,
                "content_hash": content_hash,
                "content_mode": mode,
                "word_count": _words(text),
                "headings": headings or len(_HEADING_RE.findall(body)),
                "sections": len(_sections(post.get("acf") or {})),
                "internal_links": internal,
                "external_links": external,
                "meta_title": yoast.get("title"),
                "meta_description": yoast.get("description"),
                "robots_index": ((yoast.get("robots") or {}).get("index")) or None,
                "canonical": yoast.get("canonical"),
            })

    if not items:
        raise SourceError("error", "wordpress: REST nie zwrócił żadnych wpisów")

    items.sort(key=lambda item: item.get("published_at") or "", reverse=True)
    changed = [item for item in items if item["content_changed_at"] == today and not item["hash_baseline"]]
    stale = [item for item in items
             if item["content_changed_at"] and
             (datetime.strptime(today, "%Y-%m-%d") - datetime.strptime(item["content_changed_at"], "%Y-%m-%d")).days
             >= STALE_DAYS]
    words = [item["word_count"] for item in items]
    summary = {
        "posts": len(items),
        "post_types": post_types,
        "authenticated": bool(headers),
        "words_median": sorted(words)[len(words) // 2] if words else 0,
        "thin": sum(1 for value in words if value < THIN_WORDS),
        "stale_365d": len(stale),
        "changed_today": len(changed),
        "baseline": sum(1 for item in items if item["hash_baseline"]),
        "no_acf": sum(1 for item in items if item["content_mode"] == "content"),
    }
    return {"summary": summary, "details": {"base_url": base, "items": items}}
