"""Tests for post-processor."""

from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent.parent))

from postprocessor import fix_typography, validate_frontmatter, clean_body, build_markdown, generate_slug


class TestFixTypography:
    def test_replaces_em_dash_with_en_dash(self):
        assert fix_typography("test — value") == "test – value"

    def test_preserves_existing_en_dash(self):
        assert fix_typography("test – value") == "test – value"

    def test_preserves_hyphens(self):
        assert fix_typography("BusManiak.pl - news") == "BusManiak.pl - news"


class TestValidateFrontmatter:
    def test_passes_with_all_required_fields(self):
        fm = {
            "title": "Test",
            "date": "2026-04-03",
            "description": "Desc",
            "draft": False,
            "main_keyword": "test",
            "lead": "Lead text.",
        }
        errors = validate_frontmatter(fm)
        assert errors == []

    def test_fails_on_missing_title(self):
        fm = {"date": "2026-04-03", "description": "Desc", "draft": False, "main_keyword": "kw", "lead": "L"}
        errors = validate_frontmatter(fm)
        assert "title" in errors[0]


class TestCleanBody:
    def test_removes_nonexistent_shortcodes(self):
        body = '## Title\n\n{{< image src="test.jpg" >}}\n\nText here.'
        cleaned = clean_body(body)
        assert "{{<" not in cleaned
        assert "## Title" in cleaned
        assert "Text here." in cleaned

    def test_preserves_youtube_shortcode(self):
        body = '## Title\n\n{{% youtube "abc123" %}}\n\nText.'
        cleaned = clean_body(body)
        assert "{{% youtube" in cleaned


class TestBuildMarkdown:
    def test_combines_frontmatter_and_body(self):
        fm = {
            "title": "Test News",
            "date": "2026-04-03",
            "description": "Description",
            "draft": False,
            "main_keyword": "test",
            "lead": "Lead.",
        }
        body = "## Section\n\nContent."
        result = build_markdown(fm, body)
        assert result.startswith("---\n")
        assert "## Section" in result
        assert result.endswith("Content.\n")


class TestGenerateSlug:
    def test_basic_slug(self):
        assert generate_slug("Nowy Fiat Ducato 2027") == "nowy-fiat-ducato-2027"

    def test_polish_characters(self):
        assert generate_slug("Żółty łódź ćma") == "zolty-lodz-cma"

    def test_strips_special_characters(self):
        assert generate_slug("Test: news! (2026)") == "test-news-2026"

    def test_max_length(self):
        long_title = "A" * 100
        slug = generate_slug(long_title)
        assert len(slug) <= 80

    def test_truncates_at_word_boundary(self):
        title = "Kamper zamiast kredytu hipotecznego Coraz więcej Polaków rozważa życie na kółkach"
        slug = generate_slug(title)
        assert len(slug) <= 80
        assert not slug.endswith("-")
        assert slug == "kamper-zamiast-kredytu-hipotecznego-coraz-wiecej-polakow-rozwaza-zycie-na"
