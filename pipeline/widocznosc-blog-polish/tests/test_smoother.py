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
