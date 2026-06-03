import smoother


def test_split_frontmatter_separates_block_and_body():
    text = "---\ntitle: 'X'\ndate: 2026-05-22\n---\nTreść akapitu.\n"
    fm, body = smoother.split_frontmatter(text)
    assert fm == "---\ntitle: 'X'\ndate: 2026-05-22\n---\n"
    assert body == "Treść akapitu.\n"


def test_split_frontmatter_no_frontmatter_returns_empty_and_full_text():
    text = "Bez frontmattera, sam tekst.\n"
    fm, body = smoother.split_frontmatter(text)
    assert fm == ""
    assert body == text


def test_split_then_reattach_is_lossless():
    text = "---\ntitle: 'X'\n---\nAkapit.\n"
    fm, body = smoother.split_frontmatter(text)
    assert fm + body == text


def test_protect_restore_roundtrip_is_identity():
    body = (
        "Zobacz [przewodnik](https://x.pl/a) oraz `kod inline`.\n\n"
        "## Nagłówek z liczbą 3.5\n\n"
        "```python\nx = 1\n```\n\n"
        "{{% youtube id=\"abc\" %}}\n\n"
        "Goły URL: https://y.pl/b koniec.\n"
    )
    protected, store = smoother.protect(body)
    assert smoother.restore(protected, store) == body


def test_protect_hides_frozen_constructs_from_model():
    body = "## Tytuł 4.7\n\nProza z [link](https://z.pl) i `code`.\n"
    protected, store = smoother.protect(body)
    # Nagłówek, cel linku, URL i kod nie mogą być widoczne jako goły tekst
    assert "## Tytuł 4.7" not in protected
    assert "https://z.pl" not in protected
    assert "`code`" not in protected
    # W store siedzą oryginały
    assert any(v == "## Tytuł 4.7" for v in store.values())


def test_protect_tokens_are_unique():
    body = "## A\n\n## B\n\nProza.\n"
    protected, store = smoother.protect(body)
    assert len(store) == len(set(store.keys()))


from collections import Counter


def test_extract_facts_collects_numbers_as_multiset():
    nums, _ = smoother.extract_facts("Cena $1,50 za 1M tokenów, wynik 87,6%.")
    assert nums == Counter(["1,50", "1", "87,6"])


def test_extract_facts_collects_model_mentions():
    _, models = smoother.extract_facts(
        "Porównujemy GPT-5.5, Gemini 3.5 oraz Claude Opus 4.7."
    )
    assert models == Counter(["GPT-5.5", "Gemini 3.5", "Claude Opus 4.7"])


def test_extract_facts_ignores_plain_prose():
    nums, models = smoother.extract_facts("To jest zwykłe zdanie bez danych.")
    assert nums == Counter()
    assert models == Counter()


def test_diff_guard_passes_when_only_prose_changed():
    before = "Model §HEADING_0§ kosztuje 1,50 za 1M. GPT-5.5 jest szybki."
    after = "Model §HEADING_0§ kosztuje 1,50 za 1M. GPT-5.5 działa błyskawicznie."
    store = {"§HEADING_0§": "## X"}
    assert smoother.diff_guard(before, after, store) == []


def test_diff_guard_rejects_changed_number():
    before = "Okno 65k tokenów."
    after = "Okno 8k tokenów."
    assert smoother.diff_guard(before, after, {}) != []


def test_diff_guard_rejects_changed_model_version():
    before = "To Gemini 3.5."
    after = "To Gemini 1.5."
    assert smoother.diff_guard(before, after, {}) != []


def test_diff_guard_rejects_lost_placeholder_token():
    before = "Sekcja §HEADING_0§ i proza."
    after = "Sekcja i proza."  # token zniknął
    store = {"§HEADING_0§": "## Tytuł"}
    viol = smoother.diff_guard(before, after, store)
    assert any("token" in v.lower() for v in viol)


def test_clean_model_output_strips_markdown_fence():
    raw = "```markdown\nTreść wygładzona.\n```"
    assert smoother.clean_model_output(raw) == "Treść wygładzona."


def test_clean_model_output_passes_clean_text():
    assert smoother.clean_model_output("Czysta treść.") == "Czysta treść."


def test_build_payload_uses_gemini_and_low_temperature():
    payload = smoother.build_payload("Proza §HEADING_0§.", rules="REGUŁY")
    assert payload["model"] == "google/gemini-3.1-pro-preview"
    assert payload["temperature"] <= 0.4
    msgs = payload["messages"]
    assert msgs[0]["role"] == "system"
    assert "NIE zmieniaj" in msgs[0]["content"]  # twarde zakazy w systemce
    assert "Proza §HEADING_0§." in msgs[1]["content"]
    assert "REGUŁY" in msgs[1]["content"]


RULES = ""


def test_process_text_smoothes_body_and_keeps_frontmatter():
    text = "---\ntitle: 'X'\n---\nTen tekst jest dedykowany dla 65k tokenów.\n"

    def fake_call(protected_body, rules):
        # model wygładza prozę, zostawia tokeny i liczby
        return protected_body.replace("dedykowany dla", "przeznaczony dla")

    out = smoother.process_text(text, RULES, fake_call)
    assert out["status"] == "smoothed"
    assert out["text"].startswith("---\ntitle: 'X'\n---\n")
    assert "przeznaczony dla 65k tokenów" in out["text"]


def test_process_text_rejects_when_model_changes_number():
    text = "---\ntitle: 'X'\n---\nOkno 65k tokenów.\n"

    def bad_call(protected_body, rules):
        return protected_body.replace("65k", "8k")

    out = smoother.process_text(text, RULES, bad_call)
    assert out["status"] == "rejected"
    assert "liczby" in out["detail"]
    assert out["text"] == text  # oryginał nietknięty


def test_process_text_unchanged_when_model_returns_same():
    text = "---\ntitle: 'X'\n---\nProza bez zmian.\n"
    out = smoother.process_text(text, RULES, lambda b, r: b)
    assert out["status"] == "unchanged"


def test_process_text_error_when_call_raises():
    text = "---\ntitle: 'X'\n---\nProza.\n"

    def boom(b, r):
        raise RuntimeError("timeout")

    out = smoother.process_text(text, RULES, boom)
    assert out["status"] == "error"
    assert out["text"] == text
