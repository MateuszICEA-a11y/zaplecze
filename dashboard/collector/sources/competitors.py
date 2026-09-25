"""Śledzenie treści konkurencji – adresy wpisów z ich sitemap.

Codziennie czyta sitemapy wskazane w domains.yaml (także indeksy sitemap),
zostawia adresy pasujące do wzorców ścieżek (blog, słownik) i zapisuje je
w `data/<domena>/competitors.json` razem z datą pierwszego zobaczenia.

Tytuł:
- ze sluga zawsze („co-to-jest-adres-url" → „co to jest adres url") – bge-m3
  porównuje go z naszymi tytułami bez polskich znaków bez problemu,
- prawdziwy tytuł strony (og:title → <title> → <h1>) dociągany porcjami:
  najpierw nowe adresy, potem zaległe (limit per host na przebieg, tempo wg
  Crawl-delay z robots.txt). Jednorazowe dociągnięcie całości robi
  competitor_titles.py.

Pierwszy przebieg dla konkurenta to punkt odniesienia: wszystkie adresy
dostają `baseline: true` i nie są pokazywane jako „nowe” – trafiają tylko do
mapy tematów, których nie mamy. Porównanie z naszymi wpisami (embeddingi)
robi Worker (cw-competitors.js), nie collector.
"""
import gzip
import html
import json
import re
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
import urllib.robotparser
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from pathlib import Path

from . import SourceError, competitor_kind
from ._http import DEFAULT_HEADERS

DATA_DIR = Path(__file__).resolve().parents[2] / "data"
TIMEOUT_S = 30
MAX_SITEMAPS = 40  # bezpiecznik na indeksy sitemap
MAX_URLS_PER_SITE = 6000
TITLE_FETCH_PER_HOST = 30  # tytuły stron na hosta na przebieg collectora
KIND_LIMIT = 400  # stron do klasyfikacji typu na przebieg (paczki po 40)
TITLE_RETRY_DAYS = 7  # po błędzie pobrania próbujemy ponownie po tygodniu
HEAD_MAX_BYTES = 64 * 1024
MIN_INTERVAL_S = 0.5  # max 2 żądania/s na hosta, chyba że robots.txt każe wolniej
# Typowe śmieci w sitemapach wpisów – niezależnie od wzorców konkurenta.
NOISE = re.compile(r"/(page|tag|tagi|kategoria|category|autor|author|feed)/|/wp-content/|\?", re.I)
# Doklejona nazwa serwisu – per host, bo ogólna reguła „ostatni człon po
# myślniku” ucinała też prawdziwe podtytuły („SEO – poradnik”).
SITE_SUFFIX = {
    "widoczni.com": re.compile(r"\s*[|–—-]\s*widoczni(\.com)?\s*$", re.I),
    "delante.pl": re.compile(r"\s*[|–—-]\s*(blog\s+|agencja\s+seo\s*/\s*sem:\s*)?delante(\.pl)?\s*$", re.I),
    "traffictrends.pl": re.compile(r"\s*[|–—-]\s*traffic\s*trends(\.pl)?\s*$", re.I),
}


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


def _head_html(url: str) -> str:
    """Początek strony do `</head>` (max 64 KB) – tytuł jest zawsze w nagłówku."""
    req = urllib.request.Request(url, headers={**DEFAULT_HEADERS, "Accept": "text/html,*/*"})
    with urllib.request.urlopen(req, timeout=TIMEOUT_S) as resp:
        charset = resp.headers.get_content_charset() or "utf-8"
        chunks, size = [], 0
        while size < HEAD_MAX_BYTES:
            chunk = resp.read(8192)
            if not chunk:
                break
            chunks.append(chunk)
            size += len(chunk)
            if b"</head>" in chunk.lower():
                break
    return b"".join(chunks)[:HEAD_MAX_BYTES].decode(charset, errors="replace")


def _clean(text: str) -> str:
    text = re.sub(r"<[^>]+>", " ", text)
    return re.sub(r"\s+", " ", html.unescape(text)).strip()


def extract_title(page: str, host: str) -> str | None:
    """og:title → <title> → <h1>, bez doklejonej nazwy serwisu."""
    host = host.removeprefix("www.")
    suffix = SITE_SUFFIX.get(host)
    site_name = re.sub(r"[^a-z]", "", host.split(".")[0].lower())
    patterns = (
        r'<meta[^>]+property=["\']og:title["\'][^>]+content=["\']([^"\']+)',
        r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:title["\']',
        r"<title[^>]*>(.*?)</title>",
        r"<h1[^>]*>(.*?)</h1>",
    )
    for pattern in patterns:
        match = re.search(pattern, page, re.I | re.S)
        if not match:
            continue
        title = _clean(match.group(1))
        if suffix:
            title = suffix.sub("", title).strip()
        # Sama nazwa serwisu (strona bez własnego tytułu) – szukamy dalej.
        if title and re.sub(r"[^a-z]", "", title.lower()) != site_name:
            return title[:200]
    return None


def page_title(url: str, host: str) -> tuple[str | None, str | None]:
    """(tytuł, błąd) jednej strony."""
    try:
        title = extract_title(_head_html(url), host)
    except urllib.error.HTTPError as err:
        return None, f"HTTP {err.code}"
    except Exception as err:  # noqa: BLE001 – brak tytułu nie przerywa przebiegu
        return None, str(err)[:120] or type(err).__name__
    return (title, None) if title else (None, "brak tytułu")


def _robots(host: str) -> urllib.robotparser.RobotFileParser | None:
    parser = urllib.robotparser.RobotFileParser()
    try:
        req = urllib.request.Request(f"https://{host}/robots.txt", headers=DEFAULT_HEADERS)
        with urllib.request.urlopen(req, timeout=TIMEOUT_S) as resp:
            parser.parse(resp.read().decode("utf-8", errors="replace").splitlines())
    except Exception:  # noqa: BLE001 – brak robots.txt = brak ograniczeń
        return None
    return parser


GENERIC_TITLE_MIN = 3  # ten sam tytuł na tylu stronach hosta = tytuł serwisu, nie wpisu
GENERIC_ERROR = "tytuł wspólny dla wielu stron"


def drop_generic_titles(items: list[dict]) -> int:
    """Część stron (traffictrends.pl) ma w <title>/og:title nazwę i hasło serwisu
    zamiast tytułu wpisu. Taki tytuł porównany z naszymi wpisami to szum –
    wracamy do sluga i nie pobieramy go ponownie. Zwraca liczbę odrzuconych."""
    seen: dict[tuple[str, str], int] = {}
    for item in items:
        if item.get("title"):
            key = (item["host"], item["title"].strip().lower())
            seen[key] = seen.get(key, 0) + 1
    dropped = 0
    for item in items:
        if item.get("title") and seen[(item["host"], item["title"].strip().lower())] >= GENERIC_TITLE_MIN:
            item["title"] = None
            item["title_error"] = GENERIC_ERROR
            dropped += 1
    return dropped


def needs_title(item: dict, now: datetime) -> bool:
    if item.get("title"):
        return False
    if not item.get("title_error"):
        return True
    if item["title_error"] == GENERIC_ERROR:
        return False
    try:
        at = datetime.strptime(item.get("title_fetched_at") or "", "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)
    except ValueError:
        return True
    return now - at >= timedelta(days=TITLE_RETRY_DAYS)


def fetch_titles(items: list[dict], per_host: int | None, deadline: float | None = None,
                 workers_per_host: int = 3, log=None) -> dict:
    """Uzupełnia `title`/`title_error`/`title_fetched_at` w miejscu.

    Hosty idą równolegle, w obrębie hosta kilka wątków pod wspólnym limiterem
    (odstęp między startami żądań = max(0,5 s, Crawl-delay)). `deadline`
    (time.monotonic()) przerywa pracę – niepobrane adresy zostają na kolejny raz.
    Zwraca liczniki per host.
    """
    by_host: dict[str, list[dict]] = {}
    for item in items:
        by_host.setdefault(item["host"], []).append(item)

    def run_host(host: str, queue: list[dict]) -> tuple[str, dict]:
        robots = _robots(host.removeprefix("www."))
        agent = DEFAULT_HEADERS["User-Agent"]
        delay = max(MIN_INTERVAL_S, float(robots.crawl_delay(agent) or 0) if robots else 0)
        queue = queue[:per_host] if per_host else queue
        lock, next_at = threading.Lock(), [time.monotonic()]
        stats = {"ok": 0, "error": 0, "robots": 0, "skipped": 0, "delay_s": delay}

        def one(item: dict) -> None:
            if robots and not robots.can_fetch(agent, item["url"]):
                with lock:
                    stats["robots"] += 1
                return
            with lock:
                start = max(next_at[0], time.monotonic())
                if deadline and start > deadline:
                    stats["skipped"] += 1
                    return
                next_at[0] = start + delay
            time.sleep(max(0.0, start - time.monotonic()))
            title, error = page_title(item["url"], host)
            item["title_fetched_at"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
            with lock:
                if title:
                    item["title"] = title
                    item.pop("title_error", None)
                    stats["ok"] += 1
                else:
                    item["title_error"] = error
                    stats["error"] += 1
                done = stats["ok"] + stats["error"]
            if log and done % 100 == 0:
                log(f"{host}: {stats['ok']} ok, {stats['error']} błędów")

        with ThreadPoolExecutor(max_workers=workers_per_host) as pool:
            list(pool.map(one, queue))
        return host, stats

    with ThreadPoolExecutor(max_workers=max(1, len(by_host))) as pool:
        return dict(pool.map(lambda pair: run_host(*pair), by_host.items()))


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
            old = known.get(url) or {}
            item = {
                "url": url,
                "host": host,
                "path": page_path,
                "slug_title": slug_title(page_path),
                "title": old.get("title"),
                "lastmod": page.get("lastmod"),
                "first_seen": old.get("first_seen") or today,
                "baseline": old["baseline"] if old else baseline,
            }
            for key in ("title_fetched_at", "title_error"):
                if old.get(key):
                    item[key] = old[key]
            if not old and not baseline:
                fresh.append(item)
            items.append(item)
        site_rows.append({"host": host, "status": "ok", "count": kept, "baseline": baseline})

    # Prawdziwe tytuły: nowe adresy pierwsze, potem zaległe (limit per host).
    todo = sorted((item for item in items if needs_title(item, now)),
                  key=lambda row: (row["first_seen"], row.get("lastmod") or ""), reverse=True)
    title_stats = fetch_titles(todo, TITLE_FETCH_PER_HOST, deadline=time.monotonic() + 8 * 60)
    drop_generic_titles(items)

    # Typ strony (poradnik / news / firmowe…) – tylko z kluczem, porcja na przebieg.
    kind_stats = {"classified": 0, "failed": 0, "todo": 0}
    api_key = (env or {}).get("OPENROUTER_API_KEY")
    if api_key:
        kind_stats = competitor_kind.classify(items, api_key, limit=KIND_LIMIT)

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
            "titles_fetched": sum(row["ok"] for row in title_stats.values()),
            "titles_missing": sum(1 for item in items if not item.get("title")),
            "kinds_classified": kind_stats["classified"],
            "kinds_missing": sum(1 for item in items if not item.get("kind")),
        },
        "details": None,
    }
