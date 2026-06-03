import state


def test_content_hash_stable_and_sensitive():
    assert state.content_hash("abc") == state.content_hash("abc")
    assert state.content_hash("abc") != state.content_hash("abd")


def test_should_skip_true_when_hash_matches_done(tmp_path):
    st = {"a.md": {"hash": state.content_hash("treść"), "status": "smoothed"}}
    assert state.should_skip(st, "a.md", "treść") is True


def test_should_skip_false_when_content_changed():
    st = {"a.md": {"hash": state.content_hash("stare"), "status": "smoothed"}}
    assert state.should_skip(st, "a.md", "nowe") is False


def test_should_skip_false_when_not_in_state():
    assert state.should_skip({}, "a.md", "treść") is False


def test_load_save_roundtrip(tmp_path):
    path = tmp_path / "manifest.json"
    st = {"a.md": {"hash": "h", "status": "smoothed"}}
    state.save_state(str(path), st)
    assert state.load_state(str(path)) == st


def test_load_missing_returns_empty(tmp_path):
    assert state.load_state(str(tmp_path / "nope.json")) == {}
