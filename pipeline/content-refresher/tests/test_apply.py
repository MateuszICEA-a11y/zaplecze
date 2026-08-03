"""Testy wstawiania ulepszeń w treść sekcji."""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import apply  # noqa: E402


class TestReplaceOutsideTags(unittest.TestCase):
    def test_podmienia_tekst_a_nie_atrybuty(self):
        html = '<p class="adres ip">Sprawdź adres IP serwera.</p>'
        out, count = apply.replace_outside_tags(html, "adres IP", '<a href="/x/">{}</a>')
        self.assertEqual(count, 1)
        self.assertIn('<a href="/x/">adres IP</a>', out)
        self.assertIn('class="adres ip"', out)  # atrybut nietknięty

    def test_nie_zagniezdza_linkow(self):
        html = '<p>Zobacz <a href="/stary/">plik .htaccess</a> i konfigurację.</p>'
        out, count = apply.replace_outside_tags(html, "plik .htaccess", '<a href="/nowy/">{}</a>')
        self.assertEqual(count, 0)
        self.assertEqual(out, html)

    def test_podmienia_tylko_pierwsze_wystapienie(self):
        html = "<p>Błąd 403 i znowu błąd 403.</p>"
        out, count = apply.replace_outside_tags(html, "błąd 403", "<b>{}</b>")
        self.assertEqual(count, 1)
        self.assertEqual(out.count("<b>"), 1)

    def test_zachowuje_oryginalna_wielkosc_liter(self):
        out, _ = apply.replace_outside_tags("<p>Błąd 403 boli.</p>", "błąd 403", '<a href="/x/">{}</a>')
        self.assertIn(">Błąd 403</a>", out)


class TestInternalLinks(unittest.TestCase):
    SECTIONS = {1: "<p>Sprawdź plik .htaccess oraz adres IP.</p>", 2: "<p>Konfiguracja serwera.</p>"}

    def test_wstawia_linki_i_raportuje_pominiete(self):
        result, report = apply.apply_internal_links(self.SECTIONS, [
            {"slot": 1, "anchor": "plik .htaccess", "target_url": "https://x.pl/htaccess/"},
            {"slot": 2, "anchor": "nieistniejąca frazа", "target_url": "https://x.pl/inne/"},
        ])
        self.assertIn('href="https://x.pl/htaccess/"', result[1])
        self.assertEqual(len(report["applied"]), 1)
        self.assertEqual(report["skipped"][0]["reason"], "anchor nie występuje w treści sekcji")

    def test_jeden_link_na_adres_docelowy(self):
        result, report = apply.apply_internal_links(self.SECTIONS, [
            {"slot": 1, "anchor": "plik .htaccess", "target_url": "https://x.pl/a/"},
            {"slot": 1, "anchor": "adres IP", "target_url": "https://x.pl/a/"},
        ])
        self.assertEqual(len(report["applied"]), 1)
        self.assertEqual(result[1].count("<a "), 1)


class TestCitations(unittest.TestCase):
    SECTIONS = {1: "<p>Serwer zwraca kod 403 przy braku uprawnień.</p>"}

    def test_sekcja_zrodel_bez_znacznikow_w_tresci(self):
        result, report = apply.apply_citations(
            self.SECTIONS,
            [{"slot": 1, "anchor": "kod 403", "source_url": "https://developer.mozilla.org/403",
              "source_title": "403 Forbidden", "publisher": "MDN"}],
            sources_slot=6,
        )
        # Decyzja redakcyjna: bibliografia tylko na końcu, treść bez [n].
        self.assertEqual(result[1], self.SECTIONS[1])
        self.assertNotIn("<sup", result[1])
        self.assertIn("403 Forbidden", result[6])
        self.assertIn("nofollow", result[6])
        self.assertEqual(report["sources_slot"], 6)

    def test_bez_wolnego_slotu_nie_gubimy_informacji(self):
        _, report = apply.apply_citations(
            self.SECTIONS,
            [{"slot": 1, "anchor": "kod 403", "source_url": "https://x.pl/a"}],
            sources_slot=None,
        )
        self.assertIsNone(report["sources_slot"])
        self.assertTrue(any("brak wolnego slotu" in str(row.get("reason", "")) for row in report["skipped"]))

    def test_zrodlo_bez_adresu_wraca_na_skipped(self):
        result, report = apply.apply_citations(
            self.SECTIONS,
            [{"slot": 1, "source_url": "ftp://x.pl/a", "source_title": "zły protokół"}],
            sources_slot=6,
        )
        self.assertNotIn(6, result)
        self.assertEqual(len(report["applied"]), 0)
        self.assertEqual(report["skipped"][0]["reason"], "brak adresu źródła")

    def test_limit_przypisow(self):
        citations = [{"slot": 1, "anchor": "kod 403", "source_url": f"https://x.pl/{i}"} for i in range(20)]
        _, report = apply.apply_citations(self.SECTIONS, citations, sources_slot=6)
        self.assertLessEqual(len(report["applied"]), apply.MAX_CITATIONS)


class TestDefinitions(unittest.TestCase):
    def test_jedna_definicja_na_artykul(self):
        sections = {1: "<p>Ustaw CHMOD katalogu na serwerze FTP.</p>"}
        result, report = apply.apply_definitions(sections, [
            {"slot": 1, "term": "CHMOD", "anchor": "CHMOD", "url": "https://pl.wikipedia.org/wiki/Chmod"},
            {"slot": 1, "term": "FTP", "anchor": "FTP", "url": "https://pl.wikipedia.org/wiki/File_Transfer_Protocol"},
        ])
        self.assertEqual(len(report["applied"]), 1)
        self.assertEqual(result[1].count("<a "), 1)

    def test_anchor_nie_moze_byc_fraza_glowna(self):
        sections = {1: "<p>Skuteczne pozycjonowanie branży fotowoltaicznej wymaga SEO.</p>"}
        result, report = apply.apply_definitions(sections, [
            {"slot": 1, "term": "SEO", "anchor": "pozycjonowanie branży fotowoltaicznej",
             "url": "https://pl.wikipedia.org/wiki/Optymalizacja_dla_wyszukiwarek_internetowych"},
        ], banned_phrases=["pozycjonowanie branży fotowoltaicznej"])
        self.assertNotIn("<a ", result[1])
        self.assertEqual(report["skipped"][0]["reason"], "anchor pokrywa się z frazą główną wpisu")

    def test_anchor_zdaniowy_odpada(self):
        sections = {1: "<p>Optymalizacja techniczna strony pod wyszukiwarki to podstawa.</p>"}
        result, report = apply.apply_definitions(sections, [
            {"slot": 1, "anchor": "optymalizacja techniczna strony pod wyszukiwarki",
             "url": "https://pl.wikipedia.org/wiki/Optymalizacja_dla_wyszukiwarek_internetowych"},
        ])
        self.assertNotIn("<a ", result[1])
        self.assertEqual(report["skipped"][0]["reason"], "anchor za długi jak na definicję pojęcia")

    def test_tylko_wikipedia(self):
        sections = {1: "<p>Ustaw CHMOD katalogu.</p>"}
        result, report = apply.apply_definitions(sections, [
            {"slot": 1, "term": "CHMOD", "anchor": "CHMOD", "url": "https://konkurencja.pl/chmod"},
        ])
        self.assertNotIn("konkurencja.pl", result[1])
        self.assertEqual(len(report["applied"]), 0)
        self.assertEqual(report["skipped"][0]["reason"], "brak sekcji albo adres spoza Wikipedii")


if __name__ == "__main__":
    unittest.main()
