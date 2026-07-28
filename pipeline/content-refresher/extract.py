"""Pobieranie i ekstrakcja głównej treści stron konkurencji.

Regexy z mapera WordPressa tu nie wystarczą: na obcej stronie wciągnęłyby menu,
stopkę i baner zgód. Kolejność prób:

1. `trafilatura` – jeśli zainstalowana (wymieniona w requirements.txt),
2. fallback: usunięcie bloków nawigacyjnych i wybór najgęstszego kontenera.

Twarde limity chronią runnera i drugą stronę: timeout, rozmiar, przekierowania,
jawny User-Agent i poszanowanie `robots.txt`. Porażka jednego konkurenta obniża
jakość researchu, ale nie wywraca zadania – każdy wynik ma ocenę jakości.
"""
import html
import re
import urllib.error
import urllib.parse
import urllib.request
import urllib.robotparser

from config import FETCH_MAX_BYTES, FETCH_MAX_REDIRECTS, FETCH_TIMEOUT_S, USER_AGENT

_SCRIPT_RE = re.compile(r"<(script|style|noscript|svg)[^>]*>.*?</\1>", re.I | re.S)
_CHROME_RE = re.compile(
    r"<(nav|header|footer|aside|form)[^>]*>.*?</\1>", re.I | re.S
)
_COOKIE_RE = re.compile(
    r"<div[^>]*(?:cookie|consent|newsletter|popup|modal)[^>]*>.*?</div>", re.I | re.S
)
_TAG_RE = re.compile(r"<[^>]+>")
_HEADING_RE = re.compile(r"<h([1-6])[^>]*>(.*?)</h\1>", re.I | re.S)
_ARTICLE_RE = re.compile(r"<(article|main)[^>]*>(.*?)</\1>", re.I | re.S)
_JS_MARKERS = ("__NEXT_DATA__", "window.__NUXT__", "data-reactroot")


class FetchError(RuntimeError):
    pass


def _clean(text: str) -> str:
    return re.sub(r"[ \t]+", " ", re.sub(r"\n{3,}", "\n\n", text)).strip()


def strip_html(raw: str) -> str:
    return _clean(html.unescape(_TAG_RE.sub(" ", raw or "")))


def robots_allows(url: str, timeout: int = 5) -> bool:
    """Sprawdza robots.txt hosta. Niedostępny plik = brak zakazu."""
    try:
        parts = urllib.parse.urlparse(url)
        parser = urllib.robotparser.RobotFileParser()
        parser.set_url(f"{parts.scheme}://{parts.netloc}/robots.txt")
        opener = urllib.request.build_opener()
        opener.addheaders = [("User-Agent", USER_AGENT)]
        with opener.open(f"{parts.scheme}://{parts.netloc}/robots.txt", timeout=timeout) as response:
            parser.parse(response.read().decode("utf-8", "replace").splitlines())
        return parser.can_fetch(USER_AGENT, url)
    except Exception:  # noqa: BLE001 – brak robots.txt nie jest zakazem
        return True


class _LimitedRedirects(urllib.request.HTTPRedirectHandler):
    max_repeats = FETCH_MAX_REDIRECTS
    max_redirections = FETCH_MAX_REDIRECTS


def fetch_html(url: str) -> str:
    """Pobiera stronę z limitem czasu, rozmiaru i przekierowań."""
    if not re.match(r"^https?://", url, re.I):
        raise FetchError("adres musi być http(s)")
    opener = urllib.request.build_opener(_LimitedRedirects)
    opener.addheaders = [
        ("User-Agent", USER_AGENT),
        ("Accept", "text/html,application/xhtml+xml"),
        ("Accept-Language", "pl,en;q=0.8"),
    ]
    try:
        with opener.open(url, timeout=FETCH_TIMEOUT_S) as response:
            content_type = (response.headers.get("Content-Type") or "").lower()
            if "html" not in content_type:
                raise FetchError(f"nieobsługiwany typ treści: {content_type or 'brak'}")
            raw = response.read(FETCH_MAX_BYTES + 1)
    except FetchError:
        raise
    except urllib.error.HTTPError as err:
        raise FetchError(f"HTTP {err.code}") from err
    except Exception as err:  # noqa: BLE001
        raise FetchError(str(err)) from err
    if len(raw) > FETCH_MAX_BYTES:
        raise FetchError("strona przekracza limit 2 MB")
    charset = "utf-8"
    match = re.search(r"charset=([\w-]+)", content_type)
    if match:
        charset = match.group(1)
    return raw.decode(charset, "replace")


def headings(raw_html: str) -> list[dict]:
    """Nagłówki H1–H4 w kolejności wystąpienia – szkielet tematyczny strony."""
    out = []
    for level, text in _HEADING_RE.findall(raw_html):
        clean = strip_html(text)
        if clean and int(level) <= 4:
            out.append({"level": int(level), "text": clean[:200]})
    return out


def _fallback_extract(raw_html: str) -> str:
    body = _COOKIE_RE.sub(" ", _CHROME_RE.sub(" ", _SCRIPT_RE.sub(" ", raw_html)))
    candidates = [content for _, content in _ARTICLE_RE.findall(body)]
    best = max(candidates, key=len) if candidates else body
    return strip_html(best)


def extract(url: str, raw_html: str | None = None) -> dict:
    """Zwraca treść, nagłówki i ocenę jakości ekstrakcji.

    `quality`: `ok` (dużo tekstu), `thin` (mało tekstu – możliwy paywall lub
    strona renderowana JS-em), `js` (wykryty framework bez treści w HTML).
    """
    document = raw_html if raw_html is not None else fetch_html(url)
    text = ""
    engine = "fallback"
    try:
        import trafilatura  # noqa: PLC0415 – opcjonalna zależność

        extracted = trafilatura.extract(document, include_comments=False, include_tables=True)
        if extracted:
            text, engine = _clean(extracted), "trafilatura"
    except ImportError:
        pass
    if not text:
        text = _fallback_extract(document)

    words = len([token for token in re.split(r"\s+", text) if token.strip()])
    quality = "ok"
    if words < 120:
        quality = "js" if any(marker in document for marker in _JS_MARKERS) else "thin"

    return {
        "url": url,
        "engine": engine,
        "quality": quality,
        "words": words,
        "headings": headings(document),
        "text": text,
    }


def extract_many(urls: list[str], respect_robots: bool = True) -> list[dict]:
    """Ekstrakcja wielu stron. Błąd jednej nie przerywa pozostałych."""
    results = []
    for url in urls:
        if respect_robots and not robots_allows(url):
            results.append({"url": url, "quality": "blocked", "error": "robots.txt nie zezwala", "words": 0,
                            "headings": [], "text": ""})
            continue
        try:
            results.append(extract(url))
        except FetchError as err:
            results.append({"url": url, "quality": "error", "error": str(err), "words": 0,
                            "headings": [], "text": ""})
    return results
