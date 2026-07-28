"""Wywołania modeli przez OpenRouter.

Wzorzec wyszukiwania w sieci przeniesiony z działającego narzędzia
`portals/widocznosc.ai/functions/api/tools/brand-check.ts` – narzędzie
`openrouter:web_search`. Modele Perplexity mają wyszukiwanie wbudowane, więc
nie dostają tego narzędzia (i nie obsługują `response_format`).

Prompty leżą w `prompts/` i są wersjonowane – numer wersji trafia do kroku
zadania razem z nazwą modelu.
"""
import json
import os
import re
import urllib.error
import urllib.request
from pathlib import Path

from config import MODEL_FALLBACK

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
PROMPTS_DIR = Path(__file__).resolve().parent / "prompts"
TIMEOUT_S = 240


class LlmError(RuntimeError):
    pass


def load_prompt(name: str) -> tuple[str, str]:
    """Zwraca (treść promptu, wersja). Wersja z nagłówka `<!-- version: X -->`."""
    path = PROMPTS_DIR / f"{name}.md"
    text = path.read_text(encoding="utf-8")
    match = re.search(r"<!--\s*version:\s*([\w.\-]+)\s*-->", text)
    return text, (match.group(1) if match else "0")


def render(template: str, **values) -> str:
    """Podstawienie `{{ klucz }}` – bez silnika szablonów, prompty są proste."""
    out = template
    for key, value in values.items():
        rendered = value if isinstance(value, str) else json.dumps(value, ensure_ascii=False, indent=1)
        out = out.replace(f"{{{{ {key} }}}}", rendered)
    return re.sub(r"<!--.*?-->", "", out, flags=re.S).strip()


def call(model: str, prompt: str, *, system: str = "", web_search: bool = False,
         json_mode: bool = False, temperature: float = 0.3, max_tokens: int = 8000) -> dict:
    """Jedno wywołanie modelu. Zwraca {text, usage, model}."""
    api_key = os.environ.get("OPENROUTER_API_KEY", "").strip()
    if not api_key:
        raise LlmError("brak OPENROUTER_API_KEY")

    is_perplexity = model.startswith("perplexity/")
    payload = {
        "model": model,
        "messages": ([{"role": "system", "content": system}] if system else [])
        + [{"role": "user", "content": prompt}],
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    if web_search and not is_perplexity:
        payload["tools"] = [{
            "type": "openrouter:web_search",
            "parameters": {"max_results": 6, "search_context_size": "medium"},
        }]
    if json_mode and not is_perplexity:
        payload["response_format"] = {"type": "json_object"}

    request = urllib.request.Request(
        OPENROUTER_URL,
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        method="POST",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://zaplecze-dashboard.m-wisniewski.workers.dev",
            # Nagłówki HTTP w urllib idą jako latin-1 – bez polskich znaków.
            "X-Title": "Content Watcher - reoptymalizacja",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=TIMEOUT_S) as response:
            data = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as err:
        raise LlmError(f"openrouter HTTP {err.code}: {err.read().decode('utf-8', 'replace')[:300]}") from err
    except Exception as err:  # noqa: BLE001
        raise LlmError(f"openrouter: {err}") from err

    choices = data.get("choices") or []
    if not choices:
        raise LlmError(f"openrouter: pusta odpowiedź ({data.get('error') or 'brak szczegółów'})")
    usage = data.get("usage") or {}
    return {
        "text": (choices[0].get("message") or {}).get("content") or "",
        "usage": {
            "tokens_in": usage.get("prompt_tokens") or 0,
            "tokens_out": usage.get("completion_tokens") or 0,
        },
        "model": data.get("model") or model,
    }


def call_json(model: str, prompt: str, **kwargs) -> dict:
    """Wywołanie z oczekiwaniem JSON-a. Model bywa gadatliwy, więc wyłuskujemy
    obiekt z odpowiedzi; przy porażce próbujemy raz modelu zapasowego."""
    result = call(model, prompt, json_mode=True, **kwargs)
    parsed = _extract_json(result["text"])
    if parsed is None and model != MODEL_FALLBACK:
        result = call(MODEL_FALLBACK, prompt, json_mode=True, **kwargs)
        parsed = _extract_json(result["text"])
    if parsed is None:
        raise LlmError("model nie zwrócił poprawnego JSON-a")
    return {**result, "data": parsed}


def _extract_json(text: str):
    text = (text or "").strip()
    fence = re.search(r"```(?:json)?\s*(.+?)```", text, re.S)
    if fence:
        text = fence.group(1).strip()
    start = min((i for i in (text.find("{"), text.find("[")) if i >= 0), default=-1)
    if start < 0:
        return None
    for end in range(len(text), start, -1):
        try:
            return json.loads(text[start:end])
        except json.JSONDecodeError:
            continue
    return None
