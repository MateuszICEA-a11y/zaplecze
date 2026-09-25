"""Śledzenie treści konkurencji – adresy wpisów z ich sitemap.

Codziennie czyta sitemapy wskazane w domains.yaml (także indeksy sitemap),
zostawia adresy pasujące do wzorców ścieżek (blog, słownik) i zapisuje je
w `data/<domena>/competitors.json` razem z datą pierwszego zobaczenia.

Tytuł:
- ze sluga zawsze („co-to-jest-adres-url" → „co to jest adres url") – bge-m3
  porównuje go z naszymi tytułami bez polskich znaków bez problemu,
- z `<title>` strony tylko dla NOWYCH adresów (limit na przebieg): slugi bywają
  ucięte albo mają identyfikatory, a nowe wpisy to kilka–kilkanaście dziennie.

Pierwszy przebieg dla konkurenta to punkt odniesienia: wszystkie adresy
dostają `baseline: true` i nie są pokazywane jako „nowe” – trafiają tylko do
mapy tematów, których nie mamy. Porównanie z naszymi wpisami (embeddingi)
robi Worker (cw-competitors.js), nie collector.
"""
import gzip
import html
import json
import re
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

from . import SourceError
from ._http import DEFAULT_HEADERS

DATA_DIR = Path(__file__).resolve().parents[2] / "data"
TIMEOUT_S = 30
MAX_SITEMAPS = 40  # bezpiecznik na indeksy sitemap
MAX_URLS_PER_SITE = 6000
TITLE_FETCH_LIMIT = 40  # nowe adresy z prawdziwym <title> na przebieg
# Typowe śmieci w sitemapach wpisów – niezależnie od wzorców konkurenta.
NOISE = re.compile(r"/(page|tag|tagi|kategoria|category|autor|author|feed)/|/wp-content/|\?", re.I)
TITLE_SUFFIX = re.compile(r"\s*[|–—-]\s*[^|–—-]{2,40}$")


def _get(url: str) -> bytes:
    req = urllib.request.Request(url, headers={**DEFAULT_HEADERS, "Accept": "application/xml,text/xml,text/html,*/*"})
    with urllib.request.urlopen(req, timeout=TIMEOUT_S) as resp:
        body = resp.read()
    if body[:2] == b"\x1f\x8b":
        body = gzip.decompress(body)
    return body


def _locs(xml: bytes) -> tuple[list[dict], list[str]]:
    """(adresy stron z lastmod, adresy pod-sitemap) z jednego pliku sitemapy."""
    root = ET.fromstring(xml)
    pages, children = [], []
    for node in root:
        tag = node.tag.rsplit("}", 1)[-1]
        loc = lastmod = None
        for child in node:
            name = child.tag.rsplit("}", 1)[-1]
            if name == "loc":
                loc = (child.text or "").strip()
            elif name == "lastmod":
                lastmod = (child.text or "").strip() or None
        if not loc:
            continue
        if tag == "sitemap":
            children.append(loc)
        elif tag == "url":
            pages.append({"url": loc, "lastmod": lastmod})
    return pages, children


def sitemap_urls(sitemaps: list[str]) -> list[dict]:
    """Wszystkie adresy z listy sitemap, z rozwinięciem indeksów."""
    queue, seen, out = list(sitemaps), set(), {}
    while queue and len(seen) < MAX_SITEMAPS:
        url = queue.pop(0)
        if url in seen:
            continue
        seen.add(url)
        pages, children = _locs(_get(url))
        queue.extend(children)
        for page in pages:
            out.setdefault(page["url"], page)
    return list(out.values())


def path_of(url: str) -> str:
    return urllib.parse.urlsplit(url).path or "/"


def keep(path: str, include: list[str], exclude: list[str]) -> bool:
    if NOISE.search(path):
        return False
    if include and not any(re.search(pattern, path) for pattern in include):
        return False
    return not any(re.search(pattern, path) for pattern in exclude)


def slug_title(path: str) -> str:
    """Ostatni segment ścieżki jako tekst: „/blog/co-to-jest-adres-url/" → „co to jest adres url"."""
    segment = [part for part in path.split("/") if part][-1:] or [""]
    text = urllib.parse.unquote(segment[0])
    text = re.sub(r"\.(html?|php)$", "", text)
    text = re.sub(r"[-_]+", " ", text)
    text = re.sub(r"\b\d{5,}\b", " ", text)  # identyfikatory w slugach
    return re.sub(r"\s+", " ", text).strip()


def page_title(url: str) -> str | None:
    """<title> (albo og:title) strony, bez doklejonej nazwy serwisu."""
    try:
        body = _get(url)[:200_000].decode("utf-8", errors="replace")
    except Exception:  # noqa: BLE001 – brak tytułu nie przerywa przebiegu
        return None
    match = re.search(r'<meta[^>]+property=["\']og:title["\'][^>]+content=["\']([^"\']+)', body, re.I) \
        or re.search(r"<title[^>]*>(.*?)</title>", body, re.I | re.S)
    if not match:
        return None
    title = html.unescape(re.sub(r"\s+", " ", match.group(1))).strip()
    title = TITLE_SUFFIX.sub("", title).strip()
    return title[:200] or None


def fetch(cfg: dict, env: dict) -> dict:
    domain = cfg["domain"]
    sites = cfg.get("sites") or []
    if not sites:
        raise SourceError("not_configured", "competitors: brak listy konkurentów (sites) w domains.yaml")

    path = DATA_DIR / domain / "competitors.json"
    previous = json.loads(path.read_text(encoding="utf-8")) if path.is_file() else {}
    known = {item["url"]: item for item in previous.get("items", [])}
    known_hosts = {row["host"] for row in previous.get("sites", []) if row.get("status") == "ok"}
    now = datetime.now(timezone.utc)
    today = now.strftime("%Y-%m-%d")

    items, site_rows, fresh = [], [], []
    for site in sites:
        host = site["host"]
        try:
            pages = sitemap_urls(site["sitemaps"])
        except Exception as err:  # noqa: BLE001 – jeden konkurent nie wywraca reszty
            # Wczorajsze adresy zostają – chwilowy WAF nie czyści listy.
            items.extend(item for item in known.values() if item["host"] == host)
            site_rows.append({"host": host, "status": "error", "error": str(err)[:200],
                              "count": sum(1 for item in known.values() if item["host"] == host)})
            continue
        baseline = host not in known_hosts
        kept = 0
        for page in pages:
            url = page["url"]
            page_path = path_of(url)
            if urllib.parse.urlsplit(url).netloc.removeprefix("www.") != host.removeprefix("www."):
                continue
            if not keep(page_path, site.get("include") or [], site.get("exclude") or []):
                continue
            if kept >= MAX_URLS_PER_SITE:
                break
            kept += 1
            old = known.get(url)
            item = {
                "url": url,
                "host": host,
                "path": page_path,
                "slug_title": slug_title(page_path),
                "title": old.get("title") if old else None,
                "lastmod": page.get("lastmod"),
                "first_seen": old["first_seen"] if old else today,
                "baseline": old["baseline"] if old else baseline,
            }
            if not old and not baseline:
                fresh.append(item)
            items.append(item)
        site_rows.append({"host": host, "status": "ok", "count": kept, "baseline": baseline})

    # Prawdziwe tytuły dla nowych adresów (najświeższe pierwsze, z limitem).
    fetched = 0
    for item in sorted(fresh, key=lambda row: row.get("lastmod") or "", reverse=True)[:TITLE_FETCH_LIMIT]:
        title = page_title(item["url"])
        if title:
            item["title"] = title
            fetched += 1

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps({
        "generated_at": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "sites": site_rows,
        "items": items,
    }, ensure_ascii=False, indent=0) + "\n", encoding="utf-8")

    if all(row["status"] != "ok" for row in site_rows):
        raise SourceError("error", "competitors: żadna sitemapa nie odpowiedziała – " +
                          "; ".join(f"{row['host']}: {row.get('error')}" for row in site_rows))
    return {
        "summary": {
            "sites": len(site_rows),
            "sites_ok": sum(1 for row in site_rows if row["status"] == "ok"),
            "urls": len(items),
            "new_today": len(fresh),
            "titles_fetched": fetched,
        },
        "details": None,
    }
