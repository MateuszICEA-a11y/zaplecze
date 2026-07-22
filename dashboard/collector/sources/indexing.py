"""Indeksacja stron z sitemapy – GSC URL Inspection API (panel „Matrix").

Auth: service account jak GSC (scope webmasters). Pełny raport Index Coverage
nie ma API, więc odpytujemy per URL: wszystkie adresy z sitemapy (index + podmapy)
przez urlInspection/index:inspect + metryki searchanalytics (30 dni) dla całości.
Kwoty: 2000 inspekcji/dzień/property (widocznosc.ai ~135, grupa-icea.pl ~834 URL
– mieści się z zapasem), 600/min. Czas: ~0,5-0,7 s/URL, dla większej domeny ~10 min.

Summary: liczba stron w sitemapie / sprawdzonych / zaindeksowanych / nie.
Details: per URL – werdykt, coverage state, ostatni crawl + kliknięcia/wyświetlenia/
CTR/pozycja z GSC (okno 30 dni).
"""
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone

from . import SourceError
from ._http import classify_http_error, request_json

SEARCH_API = "https://searchconsole.googleapis.com/webmasters/v3/sites"
INSPECT_API = "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect"
SCOPE = "https://www.googleapis.com/auth/webmasters"
DATA_LAG_DAYS = 3
WINDOW_DAYS = 30
MAX_INSPECTIONS = 1900  # bezpiecznik pod dzienną kwotę 2000/property
SLEEP_S = 0.1  # kwota 600/min = 10/s; latencja requestu i tak dominuje


TOKEN_REFRESH_S = 45 * 60  # token SA żyje ~1 h; przy 834 URL-ach pętla trwa dłużej


class _TokenProvider:
    """Token service account odświeżany w trakcie długiej pętli inspekcji.

    Jednorazowy token wygasał w środku przejazdu grupa-icea.pl (~834 URL ×
    kilka sekund latencji URL Inspection > 1 h) → HTTP 401 i utrata całego
    źródła. Odświeżamy proaktywnie co TOKEN_REFRESH_S.
    """

    def __init__(self, sa_json: str):
        from google.oauth2 import service_account

        info = json.loads(sa_json)
        self._creds = service_account.Credentials.from_service_account_info(
            info, scopes=[SCOPE])
        # None = jeszcze nie odświeżony; NIE 0.0 – monotonic() to czas od bootu
        # i na świeżym runnerze CI bywa mniejszy niż próg (token nigdy by nie powstał).
        self._refreshed_at: float | None = None

    def headers(self) -> dict:
        if self._refreshed_at is None or time.monotonic() - self._refreshed_at > TOKEN_REFRESH_S:
            from google.auth.transport.requests import Request

            self._creds.refresh(Request())
            self._refreshed_at = time.monotonic()
        return {"Authorization": f"Bearer {self._creds.token}",
                "Content-Type": "application/json"}


def _sitemap_urls(sitemap_url: str) -> list[str]:
    """Wszystkie adresy stron z sitemapy (rekurencyjnie przez podmapy)."""
    def fetch(url: str) -> list[str]:
        # UA przeglądarkowy: WAF seohost ubijał timeoutem „botowe" UA z runnerów CI
        # (lokalnie te same requesty przechodziły w ~1 s).
        req = urllib.request.Request(url, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                          "(KHTML, like Gecko) Chrome/126.0 Safari/537.36",
            "Accept": "text/xml,application/xml;q=0.9,*/*;q=0.8",
        })
        # Retry: pojedynczy timeout z runnera CI ubijał cały przejazd (2026-07-22).
        for attempt in range(3):
            try:
                with urllib.request.urlopen(req, timeout=60) as resp:
                    return re.findall(r"<loc>\s*([^<\s]+)", resp.read().decode("utf-8", "replace"))
            except (TimeoutError, urllib.error.URLError):
                if attempt == 2:
                    raise
                time.sleep(5 * (attempt + 1))
        return []

    urls: list[str] = []
    seen: set[str] = set()
    for loc in fetch(sitemap_url):
        if loc.endswith(".xml"):
            for sub in fetch(loc):
                if not sub.endswith(".xml") and sub not in seen:
                    seen.add(sub)
                    urls.append(sub)
        elif loc not in seen:
            seen.add(loc)
            urls.append(loc)
    return urls


def fetch(cfg: dict, env: dict) -> dict:
    sa_json = env.get("GSC_SERVICE_ACCOUNT_JSON", "").strip()
    if not sa_json:
        raise SourceError("not_configured", "indexing: brak GSC_SERVICE_ACCOUNT_JSON w env")
    site = cfg.get("site")
    sitemap = cfg.get("sitemap")
    if not site or not sitemap:
        raise SourceError("not_configured", "indexing: brak site/sitemap w domains.yaml")

    try:
        tokens = _TokenProvider(sa_json)
        headers = tokens.headers()
    except Exception as err:  # noqa: BLE001
        raise SourceError("token_expired",
                          f"indexing: autoryzacja service account nie powiodła się ({err})") from err

    try:
        urls = _sitemap_urls(sitemap)
    except Exception as err:  # noqa: BLE001
        raise SourceError("error", f"indexing: nie udało się pobrać sitemapy ({err})") from err
    if not urls:
        raise SourceError("error", f"indexing: sitemapa {sitemap} bez adresów")

    # Metryki GSC (30 dni) dla wszystkich stron – jeden request, mapowanie po URL.
    end = (datetime.now(timezone.utc) - timedelta(days=DATA_LAG_DAYS)).strftime("%Y-%m-%d")
    start = (datetime.now(timezone.utc)
             - timedelta(days=DATA_LAG_DAYS + WINDOW_DAYS - 1)).strftime("%Y-%m-%d")
    endpoint = f"{SEARCH_API}/{urllib.parse.quote(site, safe='')}/searchAnalytics/query"
    metrics: dict[str, dict] = {}
    try:
        resp = request_json(endpoint, data=json.dumps({
            "startDate": start,
            "endDate": end,
            "dimensions": ["page"],
            "rowLimit": 25000,
        }).encode(), headers=headers)
        for row in resp.get("rows") or []:
            url = (row.get("keys") or [None])[0]
            if not url:
                continue
            ctr = row.get("ctr")
            position = row.get("position")
            metrics[url] = {
                "clicks": row.get("clicks", 0),
                "impressions": row.get("impressions", 0),
                "ctr": round(ctr * 100, 2) if isinstance(ctr, (int, float)) else None,
                "position": round(position, 1) if isinstance(position, (int, float)) else None,
            }
    except Exception as err:  # noqa: BLE001
        # Metryki searchanalytics są dodatkiem do inspekcji – 429 (kwota
        # krótkoterminowa GSC po wielu przebiegach) nie może zabić źródła.
        print(f"  indexing: metryki GSC niedostępne ({err}) – kontynuuję bez nich",
              file=sys.stderr)
        metrics = {}

    rows = []
    indexed = 0
    errors = 0
    aborted: str | None = None
    for url in urls[:MAX_INSPECTIONS]:
        try:
            result = request_json(INSPECT_API, data=json.dumps({
                "inspectionUrl": url,
                "siteUrl": site,
            }).encode(), headers=tokens.headers(), timeout=30)
            errors = 0
        except Exception as err:  # noqa: BLE001
            # Pojedynczy błąd (timeout, 5xx) nie może zabić całego przejazdu –
            # pomiń URL; dopiero seria błędów (np. 429 po kwocie) przerywa.
            errors += 1
            if errors >= 5:
                if len(rows) >= 50:  # częściowy przejazd > brak danych
                    aborted = str(classify_http_error(err, "indexing"))
                    break
                raise classify_http_error(err, "indexing") from err
            continue
        status = ((result.get("inspectionResult") or {}).get("indexStatusResult") or {})
        verdict = status.get("verdict")
        is_indexed = verdict == "PASS"
        indexed += 1 if is_indexed else 0
        m = metrics.get(url) or {}
        rows.append({
            "url": url,
            "clicks": m.get("clicks", 0),
            "impressions": m.get("impressions", 0),
            "ctr": m.get("ctr"),
            "position": m.get("position"),
            "indexed": is_indexed,
            "verdict": verdict,
            "coverage_state": status.get("coverageState"),
            "last_crawl": (status.get("lastCrawlTime") or "")[:10] or None,
        })
        time.sleep(SLEEP_S)

    summary = {
        "window": {"start": start, "end": end},
        "sitemap_urls": len(urls),
        "pages_checked": len(rows),
        "indexed": indexed,
        "not_indexed": len(rows) - indexed,
    }
    if aborted:
        summary["aborted"] = aborted  # przejazd częściowy (np. kwota) – reszta jutro
    return {"summary": summary, "details": {"window": {"start": start, "end": end}, "rows": rows}}
