"""Źródło `competitors`: filtr ścieżek, tytuły (slug i strona), punkt odniesienia i nowe adresy.

Uruchomienie: python -m pytest dashboard/collector/tests
"""
import json
import sys
from pathlib import Path
from datetime import datetime, timezone
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sources import competitor_kind, competitors  # noqa: E402


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


def test_extract_title_kolejnosc_i_sufiksy():
    e = competitors.extract_title
    assert e('<meta property="og:title" content="A &amp; B - widoczni"><title>X</title>', "widoczni.com") == "A & B"
    assert e("<title>Relacja: Delante 2026: AI | Agencja SEO / SEM: Delante</title>", "delante.pl") == "Relacja: Delante 2026: AI"
    assert e("<title>Sukcesy Delante w branży - Blog Delante</title>", "delante.pl") == "Sukcesy Delante w branży"
    assert e("<title>SEO – poradnik</title>", "rywal.pl") == "SEO – poradnik"  # obcy host: bez obcinania
    assert e("<title>widoczni</title><h1>Słow<b>nik</b></h1>", "widoczni.com") == "Słow nik"
    assert e("<p>bez tytułu</p>", "rywal.pl") is None


def test_needs_title_ponawia_blad_po_tygodniu():
    now = datetime(2026, 9, 25, tzinfo=timezone.utc)
    assert competitors.needs_title({}, now)
    assert not competitors.needs_title({"title": "T"}, now)
    assert not competitors.needs_title({"title_error": "HTTP 404", "title_fetched_at": "2026-09-20T00:00:00Z"}, now)
    assert competitors.needs_title({"title_error": "HTTP 404", "title_fetched_at": "2026-09-17T00:00:00Z"}, now)


def run(tmp_path, pages, previous=None):
    domain_dir = tmp_path / "grupa-icea.pl"
    domain_dir.mkdir(parents=True, exist_ok=True)
    if previous is not None:
        (domain_dir / "competitors.json").write_text(json.dumps(previous), encoding="utf-8")
    cfg = {"domain": "grupa-icea.pl", "sites": [{"host": "rywal.pl", "sitemaps": ["x"], "include": [r"^/blog/"]}]}
    with mock.patch.object(competitors, "DATA_DIR", tmp_path), \
            mock.patch.object(competitors, "sitemap_urls", return_value=pages), \
            mock.patch.object(competitors, "_robots", return_value=None),             mock.patch.object(competitors, "MIN_INTERVAL_S", 0),             mock.patch.object(competitors, "page_title", return_value=("Prawdziwy tytuł", None)):
        summary = competitors.fetch(cfg, {})["summary"]
    return summary, json.loads((domain_dir / "competitors.json").read_text(encoding="utf-8"))


def test_pierwszy_odczyt_to_punkt_odniesienia(tmp_path):
    pages = [{"url": "https://rywal.pl/blog/a/", "lastmod": None}]
    summary, data = run(tmp_path, pages)
    assert summary["new_today"] == 0
    assert data["items"][0]["baseline"] is True
    # Punkt odniesienia nie jest „nowy”, ale tytuł i tak dociągamy (zaległe).
    assert data["items"][0]["title"] == "Prawdziwy tytuł"
    assert summary["titles_missing"] == 0


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
            mock.patch.object(competitors, "sitemap_urls", side_effect=OSError("403")),             mock.patch.object(competitors, "_robots", return_value=None),             mock.patch.object(competitors, "page_title", return_value=(None, "HTTP 403")):
        try:
            competitors.fetch(cfg, {})
        except competitors.SourceError:
            pass
    data = json.loads((domain_dir / "competitors.json").read_text(encoding="utf-8"))
    assert [item["url"] for item in data["items"]] == ["https://rywal.pl/blog/a/"]
    assert data["sites"][0]["status"] == "error"


def test_limit_per_host_i_blad_zapisany(tmp_path):
    items = [{"url": f"https://rywal.pl/blog/{n}/", "host": "rywal.pl"} for n in range(5)]
    with mock.patch.object(competitors, "_robots", return_value=None),             mock.patch.object(competitors, "MIN_INTERVAL_S", 0),             mock.patch.object(competitors, "page_title", return_value=(None, "HTTP 404")):
        stats = competitors.fetch_titles(items, per_host=2)
    assert stats["rywal.pl"]["error"] == 2
    assert [bool(item.get("title_error")) for item in items] == [True, True, False, False, False]


def test_tytul_wspolny_dla_wielu_stron_wraca_do_sluga():
    items = [{"url": f"https://rywal.pl/blog/{n}/", "host": "rywal.pl", "title": "Rywal – Zwiększamy przychody"} for n in range(3)]
    # Przekierowania na jeden wpis: powtórzony tytuł bez marki zostaje.
    items += [{"url": f"https://rywal.pl/blog/stary-{n}/", "host": "rywal.pl", "title": "Jak pisać opisy"} for n in range(3)]
    assert competitors.drop_generic_titles(items) == 3
    assert [item["title"] for item in items] == [None, None, None, "Jak pisać opisy", "Jak pisać opisy", "Jak pisać opisy"]
    now = datetime(2026, 9, 25, tzinfo=timezone.utc)
    assert not competitors.needs_title({**items[0], "title_fetched_at": "2020-01-01T00:00:00Z"}, now)


def test_needs_kind_czeka_na_tytul_i_ocenia_ponownie_po_zmianie():
    assert not competitor_kind.needs_kind({"path": "/blog/seo/", "slug_title": "seo"})  # tytuł jeszcze niepobrany
    assert competitor_kind.needs_kind({"path": "/blog/seo/", "slug_title": "seo", "title_error": "HTTP 404"})
    done = {"path": "/blog/seo/", "slug_title": "seo", "title": "SEO", "kind": "poradnik", "kind_title": "SEO"}
    assert not competitor_kind.needs_kind(done)
    assert competitor_kind.needs_kind({**done, "title": "SEO – nowy tytuł"})


def test_zla_paczka_idzie_polowkami():
    batch = [{"path": f"/blog/{n}/", "title": f"T{n}"} for n in range(4)]
    calls = []

    def fake(api_key, rows):
        calls.append(len(rows))
        if len(rows) == 4:
            raise ValueError("Unterminated string")
        return {index: {"kind": "poradnik", "basis": ""} for index in range(1, len(rows) + 1)}

    with mock.patch.object(competitor_kind, "_call", side_effect=fake):
        result = competitor_kind._call_split("k", batch)
    assert calls == [4, 2, 2]
    assert sorted(result) == [1, 2, 3, 4]


def test_reguly_z_adresu():
    rule = competitor_kind.rule_kind
    assert rule("/slownik-pojec/html/")[0] == "slownik"
    assert rule("/tygodniowy-przeglad-nowinek-ppc-3-wrzesien-2024/")[0] == "news"
    assert rule("/brighton-seo-kwiecien-2024-podsumowanie-konferencji/")[0] == "firmowe"  # nie news mimo daty
    assert rule("/blog/case-study-branza-odziezowa/")[0] == "case_study"
    assert rule("/seo-wynagrodzenia-w-europie-porownanie-2025/") is None  # „wynagrodzenia” ≠ nagroda
    assert rule("/blog/jak-pisac-opisy-produktow/") is None


def test_reguly_nie_ida_do_modelu():
    items = [
        {"path": "/slownik-pojec/html/", "slug_title": "html"},  # bez tytułu – reguła i tak działa
        {"path": "/blog/jak-pisac/", "slug_title": "jak pisac", "title": "Jak pisać?"},
    ]
    with mock.patch.object(competitor_kind, "_call", return_value={1: {"kind": "poradnik", "basis": "b"}}) as call:
        stats = competitor_kind.classify(items, "k")
    assert stats["rules"] == 1 and stats["classified"] == 1
    assert items[0]["kind"] == "slownik" and items[0]["kind_source"] == "rule"
    assert items[1]["kind_source"] == "llm"
    assert len(call.call_args[0][1]) == 1  # do modelu poszła tylko jedna strona


def test_429_zwalnia_tempo():
    items = [{"url": f"https://rywal.pl/blog/{n}/", "host": "rywal.pl"} for n in range(3)]
    with mock.patch.object(competitors, "_robots", return_value=None),             mock.patch.object(competitors, "MIN_INTERVAL_S", 0.001),             mock.patch.object(competitors, "page_title", return_value=(None, "HTTP 429")):
        stats = competitors.fetch_titles(items, per_host=None, workers_per_host=1)
    assert stats["rywal.pl"]["delay_s"] == 0.008  # 0,001 × 2 × 2 × 2


def test_typ_strony_przechodzi_miedzy_przebiegami(tmp_path):
    _, first = run(tmp_path, [{"url": "https://rywal.pl/blog/a/", "lastmod": None}])
    first["items"][0].update({"kind": "news", "kind_basis": "b", "kind_title": "Prawdziwy tytuł", "kind_source": "llm"})
    _, data = run(tmp_path, [{"url": "https://rywal.pl/blog/a/", "lastmod": None}], first)
    item = data["items"][0]
    assert (item["kind"], item["kind_source"], item["kind_title"]) == ("news", "llm", "Prawdziwy tytuł")
