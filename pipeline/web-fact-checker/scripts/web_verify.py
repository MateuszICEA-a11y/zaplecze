"""Web Fact-Checker – czyste funkcje weryfikacji + wywołanie GPT-5.5 (Responses API)."""
from __future__ import annotations
import json
import os
import re
import sys
import urllib.request

GPT_MODEL = "gpt-5.5"


def normalize_value(value: str | None) -> str:
    """Sprowadza wartość do porównywalnej formy: lower, bez walut/%/spacji/diakrytyków."""
    if not value:
        return ""
    s = value.strip().lower()
    s = s.replace(",", ".")
    diac = str.maketrans("ąćęłńóśźż", "acelnoszz")
    s = s.translate(diac)
    s = re.sub(r"[\s$%]", "", s)
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
                             f"A i B zgodne: {a['status']} -> {a['correct_value']}", [a.get("source_url"), b.get("source_url")])
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
    "correct_value tylko gdy stale/wrong; zawsze podawaj source_url z wyszukiwania. Bez komentarzy poza JSON."
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
