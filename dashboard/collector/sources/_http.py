"""Wspólny helper HTTP dla źródeł (stdlib urllib, jak w pipeline/)."""
import json
import urllib.error
import urllib.request


def request_json(url: str, *, headers: dict, data: bytes | None = None,
                 method: str | None = None, timeout: int = 20) -> dict:
    """GET/POST z parsowaniem JSON. HTTPError propagowany do wołającego."""
    req = urllib.request.Request(url, data=data, method=method)
    for key, value in headers.items():
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
