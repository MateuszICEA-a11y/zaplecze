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
