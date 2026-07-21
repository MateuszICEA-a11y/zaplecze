"""Cloudflare AI Crawl Control – requesty crawlerów AI z GraphQL Analytics API.

Auth: Bearer CLOUDFLARE_ANALYTICS_TOKEN (Zone:Read + Analytics:Read na zonie).
Free plan: okno zapytania max 1 dzień, filtr po user-agencie (bez botDetectionIds,
które wymagają Bot Managementu). Collector pyta o pełną wczorajszą dobę UTC.
Summary: łączna liczba requestów + liczba aktywnych botów; details: rozbicie
per bot i top crawlowane ścieżki.
"""
import json
from datetime import datetime, timedelta, timezone

from . import SourceError
from ._http import classify_http_error, request_json

API_URL = "https://api.cloudflare.com/client/v4"
GRAPHQL_URL = f"{API_URL}/graphql"

# Znane crawlery AI (developers.cloudflare.com/ai-crawl-control/reference/bots/).
# Kolejność ma znaczenie przy mapowaniu UA → nazwa (pierwsze trafienie wygrywa,
# np. "Claude-SearchBot" przed "ClaudeBot" nie jest potrzebne – tokeny są rozłączne).
AI_BOTS = [
    "GPTBot", "ChatGPT-User", "OAI-SearchBot",
    "ClaudeBot", "Claude-User", "Claude-SearchBot",
    "PerplexityBot", "Perplexity-User",
    "Google-Extended", "Bytespider", "CCBot",
    "Meta-ExternalAgent", "Meta-ExternalFetcher",
    "Amazonbot", "Applebot", "DuckAssistBot",
    "MistralAI-User", "cohere-ai", "Timpibot", "YouBot",
]
TOP_PATHS = 15


def _bot_name(user_agent: str) -> str:
    for bot in AI_BOTS:
        if bot.lower() in user_agent.lower():
            return bot
    return "inny"


def _graphql(token: str, query: str) -> dict:
    try:
        resp = request_json(GRAPHQL_URL, data=json.dumps({"query": query}).encode(),
                            headers={"Authorization": f"Bearer {token}",
                                     "Content-Type": "application/json"})
    except Exception as err:  # noqa: BLE001
        raise classify_http_error(err, "cloudflare_ai") from err
    if resp.get("errors"):
        raise SourceError("error", f"cloudflare_ai: {resp['errors'][0].get('message')}")
    return resp["data"]


def _zone_id(token: str, domain: str) -> str:
    try:
        resp = request_json(f"{API_URL}/zones?name={domain}",
                            headers={"Authorization": f"Bearer {token}"})
    except Exception as err:  # noqa: BLE001
        raise classify_http_error(err, "cloudflare_ai") from err
    result = resp.get("result") or []
    if not resp.get("success") or not result:
        raise SourceError("error", f"cloudflare_ai: brak zony {domain} dla tego tokenu")
    return result[0]["id"]


def fetch(cfg: dict, env: dict) -> dict:
    token_env = cfg.get("token_env", "CLOUDFLARE_ANALYTICS_TOKEN")
    token = env.get(token_env, "").strip()
    if not token:
        raise SourceError("not_configured", f"cloudflare_ai: brak {token_env} w env")

    zone_id = _zone_id(token, cfg.get("zone") or cfg.get("domain"))

    day = (datetime.now(timezone.utc) - timedelta(days=1)).date()
    start = f"{day}T00:00:00Z"
    end = f"{day + timedelta(days=1)}T00:00:00Z"
    ua_filter = ", ".join(f'{{userAgent_like: "%{bot}%"}}' for bot in AI_BOTS)
    base_filter = (f'datetime_geq: "{start}", datetime_lt: "{end}", '
                   f'requestSource: "eyeball", OR: [{ua_filter}]')

    data = _graphql(token, f"""{{ viewer {{ zones(filter: {{zoneTag: "{zone_id}"}}) {{
      byUa: httpRequestsAdaptiveGroups(limit: 100, filter: {{{base_filter}}}) {{
        count dimensions {{ userAgent }} }}
      byPath: httpRequestsAdaptiveGroups(limit: {TOP_PATHS}, filter: {{{base_filter}}},
        orderBy: [count_DESC]) {{
        count dimensions {{ clientRequestPath }} }}
    }} }} }}""")

    zones = (data.get("viewer") or {}).get("zones") or []
    if not zones:
        raise SourceError("error", "cloudflare_ai: pusta odpowiedź GraphQL (brak zony)")

    by_bot: dict[str, int] = {}
    for group in zones[0].get("byUa") or []:
        name = _bot_name(group["dimensions"]["userAgent"])
        by_bot[name] = by_bot.get(name, 0) + group["count"]
    bots = [{"bot": name, "requests": count}
            for name, count in sorted(by_bot.items(), key=lambda kv: -kv[1])]
    paths = [{"path": g["dimensions"]["clientRequestPath"], "requests": g["count"]}
             for g in zones[0].get("byPath") or []]

    summary = {
        "data_date": str(day),
        "requests": sum(by_bot.values()),
        "bots": len(by_bot),
        "top_bot": bots[0]["bot"] if bots else None,
    }
    return {"summary": summary, "details": {"bots": bots, "paths": paths}}
