"""Web Fact-Checker – czyste funkcje weryfikacji + wywołanie GPT-5.5 (Responses API)."""
from __future__ import annotations
import json
import os
import re
import sys
import urllib.request

GPT_MODEL = "gpt-5.5"
REQUIRED_VERDICT_FIELDS = ("claim_id", "status")


def normalize_value(value: str | None) -> str:
    """Sprowadza wartość do porównywalnej formy: lower, bez walut/%/spacji/diakrytyków."""
    if not value:
        return ""
    s = value.strip().lower()
    s = s.replace(",", ".")
    diac = str.maketrans("ąćęłńóśźż", "acelnoszz")
    s = s.translate(diac)
    s = re.sub(r"(?<![a-z])(usd|eur|pln|zl)(?![a-z])", "", s)  # waluty słowne
    s = re.sub(r"[\s$€£¥%]", "", s)
    return s


def _decision(claim_id, action, value, reason, sources):
    return {"claim_id": claim_id, "action": action, "value": value,
            "reason": reason, "sources": [s for s in sources if s]}


def reconcile(a: dict, b: dict | None) -> dict:
    """Łączy werdykt A (WebSearch) i B (GPT-5.5). Apply tylko przy pełnej zgodzie."""
    cid = a["claim_id"]
    if b is None:
        if a["status"] in ("stale", "wrong") and a.get("correct_value") \
           and a.get("source_url") and a.get("classification") == "current":
            return _decision(cid, "apply", a["correct_value"],
                             f"single-engine: {a['status']} -> {a['correct_value']}", [a.get("source_url")])
        if a["status"] == "current":
            return _decision(cid, "leave", None, "single-engine: aktualne", [])
        return _decision(cid, "flag", None, "single-engine: brak twardego źródła lub niejednoznaczne", [a.get("source_url")])
    if a["status"] == "current" and b["status"] == "current":
        return _decision(cid, "leave", None, "A i B: aktualne", [])
    if a.get("classification") != b.get("classification"):
        return _decision(cid, "flag", None, "rozbieżna klasyfikacja historyczne/aktualne", [a.get("source_url"), b.get("source_url")])
    if "ambiguous" in (a["status"], b["status"]):
        return _decision(cid, "flag", None, "co najmniej jeden silnik: niejednoznaczne", [a.get("source_url"), b.get("source_url")])
    a_bad = a["status"] in ("stale", "wrong")
    b_bad = b["status"] in ("stale", "wrong")
    if a_bad and b_bad:
        if normalize_value(a.get("correct_value")) == normalize_value(b.get("correct_value")) and a.get("correct_value") \
           and a.get("classification") == "current" and b.get("classification") == "current":
            return _decision(cid, "apply", a["correct_value"],
                             f"A i B zgodne: A={a['status']} B={b['status']} -> {a['correct_value']}", [a.get("source_url"), b.get("source_url")])
        return _decision(cid, "flag", None, "A i B: różne wartości poprawne", [a.get("source_url"), b.get("source_url")])
    return _decision(cid, "flag", None, "A i B: rozbieżny status (current vs stale)", [a.get("source_url"), b.get("source_url")])


_SYS_PROMPT_B = (
    "Jesteś niezależnym fact-checkerem treści o modelach AI. Dla KAŻDEGO podanego twierdzenia "
    "użyj narzędzia web_search i ustal, czy jest AKTUALNE na dziś. Zwróć WYŁĄCZNIE JSON: tablicę "
    "obiektów {claim_id, status, correct_value, source_url, as_of, classification}. "
    "status: current|stale|wrong|ambiguous. "
    "classification: 'current' jeśli twierdzenie jest podane jako stan bieżący; "
    "'historical' jeśli świadomie opisuje przeszłość (np. nasycony benchmark, 'poprzedni model'). "
    "Jeśli twierdzenie jest historyczne i poprawne w swoim kontekście -> status=current, classification=historical. "
    "correct_value tylko gdy stale/wrong i MUSI być zwięzłą wartością zastępczą w tym samym formacie co twierdzenie "
    "(np. 'GPT-5.5', '$5/$25', '500 000 tokenów', 'grudzień 2025') – sama wartość do podstawienia, BEZ zdań, "
    "wyjaśnień czy uzasadnień. Uzasadnienie pomiń. Zawsze podawaj source_url z wyszukiwania. Bez komentarzy poza JSON."
)


def build_gpt5_request(claims: list[dict]) -> dict:
    return {
        "model": GPT_MODEL,
        "tools": [{"type": "web_search"}],
        "input": [
            {"role": "system", "content": _SYS_PROMPT_B},
            {"role": "user", "content": "TWIERDZENIA DO WERYFIKACJI:\n" + json.dumps(claims, ensure_ascii=False)},
        ],
    }


def parse_gpt5_response(resp: dict) -> list[dict]:
    """Wyciąga tablicę werdyktów z output_text odpowiedzi Responses API. Tolerancyjny na ```json fence i śmieci."""
    text = ""
    for item in resp.get("output", []):
        if item.get("type") == "message":
            for part in item.get("content", []):
                if part.get("type") == "output_text":
                    text += part.get("text", "")
    if not text.strip():
        return []
    m = re.search(r"```(?:json)?\s*(.*?)```", text, re.DOTALL)
    payload = m.group(1) if m else text
    try:
        data = json.loads(payload.strip())
    except json.JSONDecodeError:
        return []
    if not isinstance(data, list):
        return []
    return [it for it in data
            if isinstance(it, dict) and all(f in it for f in REQUIRED_VERDICT_FIELDS)]


def format_report(filename: str, claims_by_id: dict, decisions: list[dict]) -> str:
    """claims_by_id: dict {claim_id: {line, quote, type}}. Raport per plik (apply/flag pogrupowane)."""
    applied = [d for d in decisions if d["action"] == "apply"]
    flagged = [d for d in decisions if d["action"] == "flag"]
    left = len([d for d in decisions if d["action"] == "leave"])
    lines = [f"📄 {filename}  · {len(claims_by_id)} twierdzeń · {len(decisions)} werdyktów · {left} bez zmian"]
    lines.append(f"🔧 Poprawiono {len(applied)}:")
    for d in applied:
        c = claims_by_id.get(d["claim_id"], {})
        src = f"  [{'; '.join(d['sources'])}]" if d["sources"] else ""
        lines.append(f"  L{c.get('line', '?')} {c.get('quote', '')} -> {d['value']}{src}")
    lines.append(f"🚩 Do decyzji {len(flagged)}:")
    for d in flagged:
        c = claims_by_id.get(d["claim_id"], {})
        lines.append(f"  L{c.get('line', '?')} {c.get('quote', '')} – {d['reason']}")
    return "\n".join(lines)


def call_gpt5(claims: list[dict]) -> list[dict]:
    """Wywołuje OpenAI Responses API z web_search. Zwraca [] przy braku klucza/błędzie (degradacja do single-engine)."""
    key = os.environ.get("OPENAI_API_KEY")
    if not key:
        sys.stderr.write("⚠️ OPENAI_API_KEY brak – silnik B pominięty (single-engine)\n")
        return []
    body = json.dumps(build_gpt5_request(claims)).encode()
    req = urllib.request.Request(
        "https://api.openai.com/v1/responses", data=body,
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            return parse_gpt5_response(json.loads(r.read()))
    except Exception as e:  # noqa: BLE001 – degradacja, nie wywalaj skilla
        sys.stderr.write(f"⚠️ GPT-5.5 błąd: {e} – silnik B pominięty\n")
        return []


def main():
    """stdin: {'claims':[...], 'verdicts_a':[...]} → stdout: {'decisions':[...], 'verdicts_b':[...]}"""
    payload = json.load(sys.stdin)
    claims = payload["claims"]
    verdicts_a = {v["claim_id"]: v for v in payload["verdicts_a"]}
    verdicts_b = {v["claim_id"]: v for v in call_gpt5(claims)}
    decisions = []
    for c in claims:
        cid = c["id"]
        if cid in verdicts_a:
            decisions.append(reconcile(verdicts_a[cid], verdicts_b.get(cid)))
        else:
            decisions.append({"claim_id": cid, "action": "flag", "value": None,
                              "reason": "silnik A nie zwrócił werdyktu", "sources": []})
    json.dump({"decisions": decisions, "verdicts_b": list(verdicts_b.values())},
              sys.stdout, ensure_ascii=False)


if __name__ == "__main__":
    main()
