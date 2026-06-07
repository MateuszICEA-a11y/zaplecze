import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import smoother_bridge


def test_news_rules_keeps_prose_drops_structure():
    rules = smoother_bridge.news_rules()
    # proza – zostaje
    assert "kalki ZAKAZANE" in rules
    assert "blacklista" in rules.lower()
    assert "fleksja" in rules.lower()
    # struktura/linkowanie bloga – wycięte
    assert "Struktura artykułu" not in rules
    assert "Wikipedia" not in rules


def test_smooth_news_without_key_returns_original(monkeypatch):
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
    text = "Akapit newsa bez zmian.\n"
    assert smooth_news_out(text) == text


def smooth_news_out(text, call_fn=None):
    return smoother_bridge.smooth_news(text, call_fn=call_fn)


def test_smooth_news_rejected_returns_original():
    # call_fn rusza liczbę -> diff-guard odrzuca -> oryginał
    text = "Model kosztuje 100 zł miesięcznie.\n"
    out = smooth_news_out(text, call_fn=lambda pb, r: pb.replace("100", "999"))
    assert out == text
    assert "100" in out and "999" not in out


def test_smooth_news_smoothed_returns_model_text():
    # call_fn poprawia prozę, nie rusza liczb/modeli/tokenów -> smoothed
    text = "To zdanie jest źle napisane.\n"
    out = smooth_news_out(text, call_fn=lambda pb, r: pb.replace("źle", "dobrze"))
    assert "dobrze" in out
    assert out != text
