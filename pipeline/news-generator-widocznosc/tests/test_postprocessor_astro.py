import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from postprocessor import postprocess, generate_slug, build_markdown


def test_astro_frontmatter_fields():
    fm = {
        "title": "Google rozszerza AI Overviews",
        "lead": "Krótki lead.",
        "date": "2026-05-29",
        "sourceName": "Search Engine Land",
        "sourceUrl": "https://searchengineland.com/x",
        "tags": ["AI Overviews"],
    }
    body = "## Co się wydarzyło\n\nTreść."
    out_fm, out_body, errors = postprocess(fm, body, image_path="../../assets/images/news-x.webp")
    assert errors == []
    assert out_fm["author"] == "Redakcja widocznosc.ai"
    assert out_fm["image"] == "../../assets/images/news-x.webp"
    assert "draft" not in out_fm and "categories" not in out_fm and "toc" not in out_fm
    assert out_fm["sourceName"] == "Search Engine Land"


def test_slug_polish():
    assert generate_slug("Świeżość treści w AI") == "swiezosc-tresci-w-ai"
