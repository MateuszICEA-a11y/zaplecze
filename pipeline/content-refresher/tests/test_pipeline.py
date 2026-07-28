"""Testy pipeline'u reoptymalizacji – bez sieci i bez kluczy API.

Uruchomienie: python -m unittest discover -s pipeline/content-refresher/tests
"""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import extract  # noqa: E402
import llm  # noqa: E402
import research  # noqa: E402
import sections as sec  # noqa: E402
from budget import Budget, BudgetExceeded  # noqa: E402
from client import DashboardClient  # noqa: E402

ACF = {
    "page_title_h2_1": "Czym jest błąd 403",
    "page_text_1": "<p>Serwer odmawia dostępu do zasobu.</p>",
    "page_title_h2_2": "Jak go naprawić",
    "page_text_2": "<p>Sprawdź uprawnienia plików.</p>",
    "page_title_h2_5": "Podsumowanie",
    "page_text_5": "<p>Najczęściej wystarczy poprawić uprawnienia.</p>",
}


class TestSections(unittest.TestCase):
    def test_zajete_i_wolne_sloty(self):
        self.assertEqual(sec.occupied_slots(ACF), [1, 2, 5])
        self.assertEqual(sec.free_slots(ACF)[:3], [3, 4, 6])

    def test_snapshot_ma_hash_per_sekcja(self):
        snapshot = sec.snapshot(ACF)
        self.assertEqual(len(snapshot), 3)
        self.assertEqual(snapshot[0]["title_field"], "page_title_h2_1")
        self.assertEqual(snapshot[0]["text_field"], "page_text_1")
        self.assertTrue(snapshot[0]["hash"])

    def test_diff_pokazuje_dodane_slowa(self):
        opcodes = sec.diff_tokens("<p>Serwer odmawia dostępu.</p>",
                                  "<p>Serwer odmawia dostępu do zasobu.</p>")
        stats = sec.diff_stats(opcodes)
        self.assertGreater(stats["added"], 0)
        self.assertEqual(stats["removed"], 0)

    def test_flaga_gdy_model_wycial_wiecej_niz_dopisal(self):
        long_text = " ".join(f"zdanie numer {i} o błędzie 403." for i in range(60))
        opcodes = sec.diff_tokens(long_text, "Krótkie podsumowanie sekcji.")
        self.assertTrue(sec.diff_stats(opcodes)["shrunk"])
        # Drobna korekta nie może wywoływać ostrzeżenia.
        small = sec.diff_tokens("<p>Serwer odmawia dostępu.</p>", "<p>Serwer odmawia dostępu do zasobu.</p>")
        self.assertFalse(sec.diff_stats(small)["shrunk"])

    def test_sekcje_bez_zmian_sa_pomijane(self):
        rows = sec.build_sections(sec.snapshot(ACF), {
            1: {"title": "Czym jest błąd 403", "text": "<p>Serwer odmawia dostępu do zasobu.</p>"},
            2: {"title": "Jak go naprawić", "text": "<p>Sprawdź uprawnienia plików i konfigurację serwera.</p>"},
        })
        self.assertEqual([row["slot"] for row in rows], [2])
        self.assertEqual(rows[0]["operation"], "update")

    def test_nowa_sekcja_dostaje_operation_insert(self):
        rows = sec.build_sections(sec.snapshot(ACF), {3: {"title": "Nowy wątek", "text": "<p>Treść.</p>"}})
        self.assertEqual(rows[0]["operation"], "insert")
        self.assertEqual(rows[0]["text_before"], "")

    def test_konflikt_gdy_tresc_zmienila_sie_w_cms(self):
        rows = sec.build_sections(sec.snapshot(ACF), {
            2: {"title": "Jak go naprawić", "text": "<p>Nowa, dłuższa treść sekcji.</p>"},
        })
        # Bez zmian w CMS-ie konfliktu nie ma…
        self.assertEqual(sec.detect_conflicts(rows, ACF), [])
        # …a po edycji tej samej sekcji w WordPressie – jest.
        edited = {**ACF, "page_text_2": "<p>Ktoś poprawił to ręcznie.</p>"}
        self.assertEqual(sec.detect_conflicts(rows, edited), [{"slot": 2, "reason": "changed_in_cms"}])

    def test_konflikt_gdy_slot_zajety_przez_redakcje(self):
        rows = sec.build_sections(sec.snapshot(ACF), {3: {"title": "Nowy wątek", "text": "<p>Treść.</p>"}})
        taken = {**ACF, "page_text_3": "<p>Redakcja zdążyła wypełnić ten slot.</p>"}
        self.assertEqual(sec.detect_conflicts(rows, taken), [{"slot": 3, "reason": "slot_taken"}])


class TestExtract(unittest.TestCase):
    HTML = """
    <html><body>
      <nav><a href="/">Strona główna</a><a href="/blog">Blog</a></nav>
      <div class="cookie-banner">Używamy ciasteczek, aby ulepszać serwis. Akceptuj wszystkie.</div>
      <article>
        <h1>Analiza nagrań w badaniach UX</h1>
        <h2>Po co nagrywać sesje</h2>
        <p>Nagrania pokazują, gdzie użytkownik się gubi i czego nie znajduje na stronie sklepu.</p>
        <h2>Jak analizować</h2>
        <p>Zacznij od sesji zakończonych porzuceniem koszyka, potem przejdź do ścieżek wyszukiwania.</p>
      </article>
      <footer>Wszelkie prawa zastrzeżone. Polityka prywatności.</footer>
    </body></html>
    """

    def test_wyciaga_tresc_bez_nawigacji_i_stopki(self):
        result = extract.extract("https://przyklad.pl/artykul/", raw_html=self.HTML)
        self.assertIn("Nagrania pokazują", result["text"])
        self.assertNotIn("Polityka prywatności", result["text"])
        self.assertNotIn("Strona główna", result["text"])

    def test_naglowki_z_poziomami(self):
        result = extract.extract("https://przyklad.pl/artykul/", raw_html=self.HTML)
        self.assertEqual(result["headings"][0], {"level": 1, "text": "Analiza nagrań w badaniach UX"})
        self.assertEqual(len([h for h in result["headings"] if h["level"] == 2]), 2)

    def test_krotka_strona_dostaje_ocene_thin(self):
        result = extract.extract("https://przyklad.pl/x/", raw_html="<html><body><p>Krótko.</p></body></html>")
        self.assertEqual(result["quality"], "thin")

    def test_strona_renderowana_js_em_jest_rozpoznana(self):
        html = '<html><body><div data-reactroot=""></div><script>window.__NUXT__={}</script></body></html>'
        self.assertEqual(extract.extract("https://przyklad.pl/x/", raw_html=html)["quality"], "js")


class TestResearch(unittest.TestCase):
    def test_kanoniczny_url_dostaje_ukosnik(self):
        # Gotcha Ahrefs: bez końcowego ukośnika API zwraca pustą listę fraz.
        self.assertEqual(
            research.canonical("https://www.grupa-icea.pl/blog/blad-403"),
            "https://www.grupa-icea.pl/blog/blad-403/",
        )
        self.assertEqual(
            research.canonical("https://www.grupa-icea.pl/blog/blad-403/"),
            "https://www.grupa-icea.pl/blog/blad-403/",
        )

    def test_pliku_z_rozszerzeniem_nie_zmieniamy(self):
        self.assertEqual(research.canonical("https://x.pl/raport.pdf"), "https://x.pl/raport.pdf")


class TestBudget(unittest.TestCase):
    def test_przekroczenie_limitu_jednostek(self):
        budget = Budget(ahrefs_units=100, tokens=1000)
        budget.add_ahrefs(90)
        budget.check("ahrefs_units", estimate=5)
        with self.assertRaises(BudgetExceeded):
            budget.check("ahrefs_units", estimate=50)

    def test_tokeny_sumuja_wejscie_i_wyjscie(self):
        budget = Budget(tokens=100)
        budget.add_tokens(60, 30)
        self.assertEqual(budget.tokens, 90)
        with self.assertRaises(BudgetExceeded):
            budget.check("tokens", estimate=20)


class TestClient(unittest.TestCase):
    def test_podpis_zgodny_z_implementacja_workera(self):
        client = DashboardClient("https://dash", "sekret", "job-1", "555", 1)
        # Ta sama konstrukcja co w cw-api.js: HMAC-SHA256 z "<timestamp>.<body>".
        self.assertEqual(
            client._sign("1700000000", '{"a":1}'),
            __import__("hmac").new(b"sekret", b'1700000000.{"a":1}',
                                   __import__("hashlib").sha256).hexdigest(),
        )

    def test_dry_run_nie_wysyla_nic_do_sieci(self):
        client = DashboardClient("", "", "job-1", "555", 1, dry_run=True)
        client.step_start("fetch")
        client.finish("done")
        self.assertEqual(len(client.sent), 2)
        self.assertEqual(client.sent[0]["step"]["name"], "fetch")


class TestPrompts(unittest.TestCase):
    def test_kazdy_prompt_ma_wersje(self):
        for name in ("brief", "rewrite", "expert", "sources", "internal_links"):
            _, version = llm.load_prompt(name)
            self.assertRegex(version, r"^\d+\.\d+\.\d+$", f"prompt {name} bez wersji")

    def test_render_podstawia_zmienne_i_usuwa_komentarze(self):
        rendered = llm.render("<!-- version: 1.0.0 -->\nTytuł: {{ title }}\nDane: {{ rows }}",
                              title="Test", rows=[{"a": 1}])
        self.assertIn("Tytuł: Test", rendered)
        self.assertIn('"a": 1', rendered)
        self.assertNotIn("version:", rendered)

    def test_wyluskanie_json_z_gadatliwej_odpowiedzi(self):
        self.assertEqual(llm._extract_json('Oto wynik:\n```json\n{"ok": true}\n```'), {"ok": True})
        self.assertEqual(llm._extract_json('{"a": 1} i komentarz na końcu'), {"a": 1})
        self.assertIsNone(llm._extract_json("bez JSON-a"))


if __name__ == "__main__":
    unittest.main()
