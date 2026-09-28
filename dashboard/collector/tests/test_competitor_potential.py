from datetime import datetime, timezone
from unittest import mock

from sources import competitor_potential as cp

NOW = datetime(2026, 9, 28, tzinfo=timezone.utc)


def row(keyword, position, searches, visibility, url):
    return {"keyword": keyword, "position": position, "searches": searches, "visibility": visibility, "url": url}


def test_klucz_adresu_laczy_sitemape_z_senuto():
    assert cp.url_key("https://www.widoczni.com/blog/audyt-seo/") == "widoczni.com/blog/audyt-seo"
    assert cp.url_key("widoczni.com/blog/audyt-seo") == "widoczni.com/blog/audyt-seo"
    assert cp.url_key("https://traffictrends.pl/blog/a?utm=x") == "traffictrends.pl/blog/a"
    # breadcrumb zamiast adresu – nie zgadujemy
    assert cp.url_key("delante.pl › Blog › Audyt") is None
    assert cp.url_key("") is None


def test_agregacja_per_adres():
    rows = [
        row("link", 10, 22200, 341.9, "traffictrends.pl/blog/link"),
        row("link zewnętrzny", 3, 300, 30.1, "traffictrends.pl/blog/link"),
        row("co to link", 40, 50, 0, "https://traffictrends.pl/blog/link/"),
        row("inne", 5, 10, 1, "traffictrends.pl › blog › inne"),
    ]
    ranked = cp.aggregate(rows)
    assert list(ranked) == ["traffictrends.pl/blog/link"]
    rank = ranked["traffictrends.pl/blog/link"]
    assert rank == {"traffic": 372.0, "keywords": 3, "top10": 2, "keyword": "link", "position": 10, "demand": 22500}


def test_ranking_tylko_raz_w_tygodniu():
    assert cp.rankings_due(None, NOW)
    assert not cp.rankings_due({"fetched_at": "2026-09-25"}, NOW)
    assert cp.rankings_due({"fetched_at": "2026-09-21"}, NOW)


def test_ranking_przypisuje_zera_i_zachowuje_dane_przy_bledzie():
    items = [
        {"url": "https://rywal.pl/blog/a/", "host": "rywal.pl"},
        {"url": "https://rywal.pl/blog/b/", "host": "rywal.pl"},
        {"url": "https://inny.pl/blog/c/", "host": "inny.pl", "rank": {"traffic": 5}},
    ]
    sites = [{"host": "rywal.pl"}, {"host": "inny.pl", "senuto": "inny.pl/blog"}]

    def fake(scope, mode, token):
        if scope == "inny.pl/blog":
            assert mode == "catalog"
            raise ValueError("HTTP 404")
        return [row("fraza", 2, 100, 20, "rywal.pl/blog/a")]

    with mock.patch.object(cp, "positions", side_effect=fake):
        status = cp.refresh_rankings(items, sites, "t", NOW, log=lambda *_: None)
    assert items[0]["rank"]["traffic"] == 20 and items[0]["rank"]["at"] == "2026-09-28"
    assert items[1]["rank"] == {"traffic": 0, "keywords": 0, "top10": 0, "demand": 0, "at": "2026-09-28"}
    assert items[2]["rank"] == {"traffic": 5}
    assert status["rywal.pl"] == {"status": "ok", "urls": 1, "matched": 1}
    assert status["inny.pl"]["status"] == "error"


def test_szacunek_tylko_dla_mlodych_bez_top10():
    young = {"published": "2026-09-01"}
    assert cp.needs_estimate(young, NOW)
    assert not cp.needs_estimate({"published": "2025-01-01"}, NOW)
    assert not cp.needs_estimate({**young, "rank": {"top10": 2}}, NOW)
    assert cp.needs_estimate({**young, "rank": {"top10": 0, "keywords": 3}}, NOW)
    assert not cp.needs_estimate({**young, "estimate": {"phrase": "x"}}, NOW)
    assert not cp.needs_estimate({**young, "kind": "news"}, NOW)
    # bez daty publikacji: nowy adres z sitemapy tak, punkt odniesienia nie
    assert cp.needs_estimate({"first_seen": "2026-09-20", "baseline": False}, NOW)
    assert not cp.needs_estimate({"first_seen": "2026-09-20", "baseline": True}, NOW)


def test_szacunek_z_frazy_glownej():
    items = [{"title": "AI Content Gap – jak sprawdzić", "published": "2026-09-20"},
             {"title": "Bez frazy", "published": "2026-09-20"}]
    senuto = {"data": [{"keyword": "content gap", "searches": 90}, {"keyword": "content gap analysis", "searches": 30},
                       {"keyword": "gap", "searches": 50000}]}  # narrow Senuto dokłada niepowiązane
    with mock.patch.object(cp, "phrases", return_value={1: ["content gap", "analiza konkurencji"]}), \
            mock.patch.object(cp, "_post", return_value=senuto), mock.patch.object(cp.time, "sleep"):
        stats = cp.estimate_young(items, "t", "k", NOW, log=lambda *_: None)
    assert items[0]["estimate"] == {"phrase": "content gap", "searches": 90, "demand": 120, "related": 2, "at": "2026-09-28"}
    assert "estimate" not in items[1]
    assert stats == {"todo": 2, "estimated": 1, "failed": 1}


def test_bez_tokenu_nic_nie_robi():
    meta, stats = cp.update([], [], {"fetched_at": "x"}, {}, NOW)
    assert meta == {"fetched_at": "x"} and "skipped" in stats


def test_szersza_fraza_gdy_waska_bez_danych():
    items = [{"title": "5 działań SEO na sierpień", "published": "2026-09-20"}]
    answers = {"letnie działania seo": {"data": []},
               "seo": {"data": [{"keyword": "seo", "searches": 9900}, {"keyword": "audyt seo", "searches": 1600}]}}
    with mock.patch.object(cp, "phrases", return_value={1: ["letnie działania seo", "seo"]}), \
            mock.patch.object(cp, "_post", side_effect=lambda url, body, token: answers[body["parameters"][0]["value"][0]]), \
            mock.patch.object(cp.time, "sleep"):
        cp.estimate_young(items, "t", "k", NOW, log=lambda *_: None)
    assert items[0]["estimate"]["phrase"] == "seo" and items[0]["estimate"]["demand"] == 11500


def test_powiazana_fraza_zawiera_slowa():
    assert cp.related("zwiększenie sprzedaży w sklepie", "zwiększenie sprzedaży w sklepie internetowym")
    assert cp.related("platforma b2b", "platforma b2b dla hurtowni")
    assert not cp.related("qwen max", "max")
    assert not cp.related("q4 e-commerce", "e-commerce")
