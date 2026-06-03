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
