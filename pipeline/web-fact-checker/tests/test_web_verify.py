from scripts.web_verify import normalize_value


def test_normalize_strips_currency_percent_and_case():
    assert normalize_value("$5/$25") == "5/25"
    assert normalize_value("88,6%") == "88.6"
    assert normalize_value("GPT-5.5") == "gpt-5.5"
    assert normalize_value("  1 mln tokenów ") == "1mlntokenow"
    assert normalize_value(None) == ""
