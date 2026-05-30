import json
import pathlib

from scripts.web_verify import normalize_value, reconcile, build_gpt5_request, parse_gpt5_response

FIX = pathlib.Path(__file__).parent / "fixtures" / "gpt5_response_sample.json"


def test_normalize_strips_currency_percent_and_case():
    assert normalize_value("$5/$25") == "5/25"
    assert normalize_value("88,6%") == "88.6"
    assert normalize_value("GPT-5.5") == "gpt-5.5"
    assert normalize_value("  1 mln tokenów ") == "1mlntokenow"
    assert normalize_value(None) == ""


# --- reconcile() tests ---

def _a(status, val=None, cls="current", url="https://x", as_of="2026-05"):
    return {"claim_id": "f.md:1", "status": status, "correct_value": val,
            "source_url": url, "as_of": as_of, "classification": cls}


def test_both_current_leave():
    assert reconcile(_a("current"), _a("current"))["action"] == "leave"


def test_both_stale_same_value_apply():
    d = reconcile(_a("stale", "GPT-5.5"), _a("stale", "GPT-5.5"))
    assert d["action"] == "apply" and d["value"] == "GPT-5.5" and "https://x" in d["sources"]


def test_both_stale_different_value_flag():
    assert reconcile(_a("stale", "GPT-5.5"), _a("stale", "GPT-5.4"))["action"] == "flag"


def test_classification_dispute_flag():
    d = reconcile(_a("current", cls="current"), _a("stale", "X", cls="historical"))
    assert d["action"] == "flag" and "klasyfikacj" in d["reason"].lower()


def test_one_current_one_stale_flag():
    assert reconcile(_a("current"), _a("stale", "X"))["action"] == "flag"


def test_ambiguous_flag():
    assert reconcile(_a("ambiguous"), _a("stale", "X"))["action"] == "flag"


def test_single_engine_apply_when_a_solid():
    d = reconcile(_a("stale", "GPT-5.5", url="https://x"), None)
    assert d["action"] == "apply" and "single-engine" in d["reason"]


def test_single_engine_flag_when_no_source():
    assert reconcile(_a("stale", "GPT-5.5", url=None), None)["action"] == "flag"


def test_apply_requires_both_classification_current():
    assert reconcile(_a("stale", "X", cls="current"), _a("stale", "X", cls="historical"))["action"] == "flag"


# --- build_gpt5_request() tests ---

def test_build_request_has_model_tool_and_claims():
    claims = [{"id": "f.md:1", "type": "price", "quote": "GPT-4o", "current_value": "GPT-4o"}]
    req = build_gpt5_request(claims)
    assert req["model"] == "gpt-5.5"
    assert {"type": "web_search"} in req["tools"]
    user_msg = req["input"][-1]["content"]
    assert "f.md:1" in user_msg and "GPT-4o" in user_msg
    sys_msg = req["input"][0]["content"]
    assert "JSON" in sys_msg and "historical" in sys_msg


# --- parse_gpt5_response() tests ---

def test_parse_extracts_verdicts_and_strips_fence():
    v = parse_gpt5_response(json.loads(FIX.read_text()))
    assert len(v) == 1 and v[0]["claim_id"] == "f.md:1" and v[0]["status"] == "stale" and v[0]["correct_value"] == "GPT-5.5"


def test_parse_handles_empty_or_malformed():
    assert parse_gpt5_response({"output": []}) == []
    assert parse_gpt5_response({"output": [{"type": "message", "content": [{"type": "output_text", "text": "nie-json"}]}]}) == []
