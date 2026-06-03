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
