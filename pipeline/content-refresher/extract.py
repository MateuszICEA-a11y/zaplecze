"""Pobieranie i ekstrakcja głównej treści stron konkurencji.

Regexy z mapera WordPressa tu nie wystarczą: na obcej stronie wciągnęłyby menu,
stopkę i baner zgód. Kolejność prób:

1. Jina Reader (`r.jina.ai`) – jeśli jest JINA_API_KEY; renderuje strony
   JS-owe, na których lokalna ekstrakcja widzi pustkę (quality `js`),
2. `trafilatura` – jeśli zainstalowana (wymieniona w requirements.txt),
3. fallback: usunięcie bloków nawigacyjnych i wybór najgęstszego kontenera.

Twarde limity chronią runnera i drugą stronę: timeout, rozmiar, przekierowania,
jawny User-Agent i poszanowanie `robots.txt` (także przed Jina – to my
zlecamy odczyt). Porażka jednego konkurenta obniża jakość researchu, ale nie
wywraca zadania – każdy wynik ma ocenę jakości.
"""
import html
import json
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


JINA_READER = "https://r.jina.ai/"
JINA_TIMEOUT_S = 60
# Lustro REMOVE_SELECTOR z dashboard/app/cw-rivals.js – celowo bez selektorów
# typu [class*="content"], które trafiają w kontener właściwego tekstu.
JINA_REMOVE_SELECTOR = (
    'nav,header,footer,aside,form,[id*="ookie"],[class*="ookie"],'
    '[class*="onsent"],[class*="newsletter"]'
)


def markdown_headings(markdown: str) -> list[dict]:
    """Nagłówki H1–H4 z markdownu Jina – ten sam kształt co `headings()`."""
    out = []
    for raw in (markdown or "").splitlines():
        match = re.match(r"^(#{1,4})\s+(\S.*)$", raw.strip())
        if not match:
            continue
        text = re.sub(r"[*_`]", "", match.group(2)).strip()
        if text:
            out.append({"level": len(match.group(1)), "text": text[:200]})
    return out[:40]


def markdown_words(markdown: str) -> int:
    """Słowa „prozy" w markdownie – port `proseWords` z cw-rivals.js.

    Reader oddaje stronę razem z okruszkami i menu; linia krótsza niż 8 słów
    albo w ponad 40% złożona z tekstu linków nie jest zdaniem artykułu.
    """
    total = 0
    for raw in (markdown or "").splitlines():
        line = raw.strip()
        if not line:
            continue
        if line.startswith("#"):
            total += len(re.sub(r"[#*_`]", " ", line).split())
            continue
        without_images = re.sub(r"!\[[^\]]*\]\([^)]*\)", " ", line)
        link_words = sum(
            len(match.group(1).split())
            for match in re.finditer(r"\[([^\]]*)\]\([^)]*\)", without_images)
        )
        text = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", without_images)
        words = len(re.sub(r"[*_`>#|-]", " ", text).split())
        if words < 8 or link_words / max(words, 1) > 0.4:
            continue
        total += words
    return total


def jina_extract(url: str, api_key: str) -> dict:
    """Jedna strona przez Jina Reader – markdown zamiast surowego HTML."""
    request = urllib.request.Request(
        f"{JINA_READER}{url}",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Accept": "application/json",
            "X-Remove-Selector": JINA_REMOVE_SELECTOR,
            "X-Retain-Images": "none",
            # Cloudflare przed r.jina.ai odrzuca domyślne "Python-urllib" kodem
            # 403 – ten sam gotcha co przy API dashboardu.
            "User-Agent": USER_AGENT,
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=JINA_TIMEOUT_S) as response:
            data = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as err:
        raise FetchError(f"Jina Reader HTTP {err.code}") from err
    except Exception as err:  # noqa: BLE001
        raise FetchError(f"Jina Reader: {err}") from err
    content = str(((data.get("data") or {}).get("content")) or "")
    if not content.strip():
        raise FetchError("Jina Reader: pusta treść")
    words = markdown_words(content)
    return {
        "url": url,
        "engine": "jina",
        "quality": "ok" if words >= 120 else "thin",
        "words": words,
        "headings": markdown_headings(content),
        "text": content[:FETCH_MAX_BYTES],
    }


def extract_many(urls: list[str], respect_robots: bool = True, jina_key: str = "") -> list[dict]:
    """Ekstrakcja wielu stron. Błąd jednej nie przerywa pozostałych.

    Z kluczem Jina najpierw Reader (radzi sobie z JS-em), przy jego błędzie
    lokalna ścieżka – dwa różne silniki to lepsza szansa na komplet researchu.
    """
    results = []
    for url in urls:
        if respect_robots and not robots_allows(url):
            results.append({"url": url, "quality": "blocked", "error": "robots.txt nie zezwala", "words": 0,
                            "headings": [], "text": ""})
            continue
        if jina_key:
            try:
                results.append(jina_extract(url, jina_key))
                continue
            except FetchError:
                pass  # lokalna ścieżka poniżej
        try:
            results.append(extract(url))
        except FetchError as err:
            results.append({"url": url, "quality": "error", "error": str(err), "words": 0,
                            "headings": [], "text": ""})
    return results
