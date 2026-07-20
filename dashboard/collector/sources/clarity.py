"""Microsoft Clarity – placeholder do czasu podpięcia Data Export API.

Docelowo: GET https://www.clarity.ms/export-data/api/v1/project-live-insights
(Bearer CLARITY_API_TOKEN z panelu Clarity). Po dostarczeniu tokenu:
zaimplementować fetch + ustawić clarity.enabled: true w domains.yaml.
"""
from . import SourceError


def fetch(cfg: dict, env: dict) -> dict:
    raise SourceError("not_configured", "clarity: integracja czeka na CLARITY_API_TOKEN")
