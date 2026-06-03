#!/usr/bin/env python3
"""Manifest idempotencji dla widocznosc-blog-polish."""
from __future__ import annotations
import hashlib
import json
import os


def content_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def load_state(path: str) -> dict:
    if not os.path.exists(path):
        return {}
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_state(path: str, st: dict) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump(st, f, ensure_ascii=False, indent=2)


def should_skip(st: dict, file: str, text: str) -> bool:
    """Pomiń, jeśli plik jest w manifeście i jego treść się nie zmieniła."""
    entry = st.get(file)
    return bool(entry) and entry.get("hash") == content_hash(text)
