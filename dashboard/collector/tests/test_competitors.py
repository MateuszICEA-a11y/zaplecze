"""Źródło `competitors`: filtr ścieżek, tytuł ze sluga, punkt odniesienia i nowe adresy.

Uruchomienie: python -m pytest dashboard/collector/tests
"""
import json
import sys
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sources import competitors  # noqa: E402


def test_slug_title_zamienia_slug_na_slowa():
    assert competitors.slug_title("/blog/co-to-jest-adres-url/") == "co to jest adres url"
    assert competitors.slug_title("/artykuly/url-dobry-adres-0AgVEA-12345678") == "url dobry adres 0AgVEA"
    assert competitors.slug_title("/poradnik.html") == "poradnik"


def test_keep_wzorce_i_szum():
    include, exclude = [r"^/blog/[^/]+/?$"], [r"^/blog/praca"]
    assert competitors.keep("/blog/co-to-jest-seo/", include, exclude)
    assert not competitors.keep("/blog/", include, exclude)
    assert not competitors.keep("/blog/page/2/", include, exclude)
    assert not competitors.keep("/blog/praca-seo/", include, exclude)
    assert not competitors.keep("/oferta/seo/", include, exclude)


def run(tmp_path, pages, previous=None):
    domain_dir = tmp_path / "grupa-icea.pl"
    domain_dir.mkdir(parents=True, exist_ok=True)
    if previous is not None:
        (domain_dir / "competitors.json").write_text(json.dumps(previous), encoding="utf-8")
    cfg = {"domain": "grupa-icea.pl", "sites": [{"host": "rywal.pl", "sitemaps": ["x"], "include": [r"^/blog/"]}]}
    with mock.patch.object(competitors, "DATA_DIR", tmp_path), \
            mock.patch.object(competitors, "sitemap_urls", return_value=pages), \
            mock.patch.object(competitors, "page_title", return_value="Prawdziwy tytuł"):
        summary = competitors.fetch(cfg, {})["summary"]
    return summary, json.loads((domain_dir / "competitors.json").read_text(encoding="utf-8"))


def test_pierwszy_odczyt_to_punkt_odniesienia(tmp_path):
    pages = [{"url": "https://rywal.pl/blog/a/", "lastmod": None}]
    summary, data = run(tmp_path, pages)
    assert summary["new_today"] == 0
    assert data["items"][0]["baseline"] is True
    assert data["items"][0]["title"] is None  # bez pobierania stron przy punkcie odniesienia


def test_kolejny_odczyt_oznacza_nowe_i_pobiera_tytul(tmp_path):
    _, first = run(tmp_path, [{"url": "https://rywal.pl/blog/a/", "lastmod": None}])
    pages = [{"url": "https://rywal.pl/blog/a/", "lastmod": None}, {"url": "https://rywal.pl/blog/b/", "lastmod": "2026-09-26"}]
    summary, data = run(tmp_path, pages, first)
    by_url = {item["url"]: item for item in data["items"]}
    assert summary["new_today"] == 1
    assert by_url["https://rywal.pl/blog/b/"]["baseline"] is False
    assert by_url["https://rywal.pl/blog/b/"]["title"] == "Prawdziwy tytuł"
    assert by_url["https://rywal.pl/blog/a/"]["baseline"] is True


def test_awaria_sitemapy_zachowuje_wczorajsze_adresy(tmp_path):
    _, first = run(tmp_path, [{"url": "https://rywal.pl/blog/a/", "lastmod": None}])
    domain_dir = tmp_path / "grupa-icea.pl"
    cfg = {"domain": "grupa-icea.pl", "sites": [{"host": "rywal.pl", "sitemaps": ["x"]}]}
    with mock.patch.object(competitors, "DATA_DIR", tmp_path), \
            mock.patch.object(competitors, "sitemap_urls", side_effect=OSError("403")):
        try:
            competitors.fetch(cfg, {})
        except competitors.SourceError:
            pass
    data = json.loads((domain_dir / "competitors.json").read_text(encoding="utf-8"))
    assert [item["url"] for item in data["items"]] == ["https://rywal.pl/blog/a/"]
    assert data["sites"][0]["status"] == "error"
