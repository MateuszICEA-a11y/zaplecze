"""Wspólny helper HTTP dla źródeł (stdlib urllib, jak w pipeline/)."""
import json
import urllib.error
import urllib.request


# Przeglądarkowy UA – Senuto (WAF) odpowiada 418 na domyślny Python-urllib z IP
# runnerów GitHub Actions.
DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Accept": "application/json",
}


def request_json(url: str, *, headers: dict, data: bytes | None = None,
                 method: str | None = None, timeout: int = 20) -> dict:
    """GET/POST z parsowaniem JSON. HTTPError propagowany do wołającego."""
    req = urllib.request.Request(url, data=data, method=method)
    for key, value in {**DEFAULT_HEADERS, **headers}.items():
        req.add_header(key, value)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def classify_http_error(err: Exception, source: str):
    """Mapuje wyjątek HTTP na SourceError (401/403 = wygasły/zły token)."""
    from . import SourceError

    if isinstance(err, urllib.error.HTTPError):
        if err.code in (401, 403):
            return SourceError("token_expired", f"{source}: HTTP {err.code} – token wygasł lub jest nieprawidłowy")
        return SourceError("error", f"{source}: HTTP {err.code}")
    return SourceError("error", f"{source}: {err}")
