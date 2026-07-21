"""Rejestr źródeł danych dashboardu.

Każde źródło eksportuje fetch(cfg: dict, env: dict) -> dict (payload "data")
i sygnalizuje problemy przez SourceError.
"""


class SourceError(Exception):
    """Błąd źródła z klasyfikacją statusu do snapshotu.

    kind: "error" | "token_expired" | "not_configured"
    """

    def __init__(self, kind: str, message: str):
        super().__init__(message)
        self.kind = kind
        self.message = message


from . import senuto, dataforseo_backlinks, ahrefs, gsc, ga4, bing, smsapi, openrouter, clarity, leads, cloudflare_ai  # noqa: E402

# Źródła per domena (klucz = sekcja w domains.yaml i w snapshotcie)
DOMAIN_SOURCES = {
    "senuto": senuto.fetch,
    "gsc": gsc.fetch,
    "ga4": ga4.fetch,
    "bing": bing.fetch,
    "ahrefs": ahrefs.fetch,
    "backlinks": dataforseo_backlinks.fetch,
    "clarity": clarity.fetch,
    "cloudflare_ai": cloudflare_ai.fetch,
    "leads": leads.fetch,
}

# Źródła per konto (sekcja `global` w domains.yaml, zapis do data/_global/)
GLOBAL_SOURCES = {
    "smsapi": smsapi.fetch,
    "openrouter": openrouter.fetch,
}
