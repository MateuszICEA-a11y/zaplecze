"""Testy pipeline'u reoptymalizacji – bez sieci i bez kluczy API.

Uruchomienie: python -m unittest discover -s pipeline/content-refresher/tests
"""
import json
import os
import sys
import unittest
from pathlib import Path
from unittest import mock

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
    """Mapowanie odpowiedzi Senuto i SerpData – bez sieci, na zapisanych kształtach."""

    SERP_RESPONSE = {
        "data": {"results": {
            "organic_results": [
                {"pos": 1, "url": "https://pomoc.home.pl/baza-wiedzy/blad-403", "domain": "pomoc.home.pl",
                 "title": "Błąd 403", "description": "opis"},
                {"pos": 2, "url": "https://www.grupa-icea.pl/blog/blad-403-jak-naprawic-co-oznacza/",
                 "domain": "www.grupa-icea.pl", "title": "nasz wpis"},
                {"pos": 3, "url": "https://pomoc.home.pl/inna-podstrona", "domain": "pomoc.home.pl",
                 "title": "druga strona tej samej domeny"},
                {"pos": 4, "url": "https://verseo.pl/blad-403/", "domain": "verseo.pl", "title": "Verseo"},
            ],
            "snippets": {
                "ai_overview": {"text": "Błąd 403 oznacza brak uprawnień.",
                                "sources": [{"url": "https://developer.mozilla.org/403", "title": "MDN"}]},
                "people_also_ask": {"questions": [{"text": "Jak naprawić błąd 403?"}]},
                "related_searches": {"queries": [{"query": "403 forbidden"}]},
            },
        }},
    }

    KEYWORDS_RESPONSE = {
        "success": True,
        "data": [
            {"keyword": "błąd 403 co oznacza", "searches": 170, "cpc": 0.07, "words_count": 4,
             "statistics": {"snippets": {"current": ["people_also_ask", "people_also_ask", "direct_answer"]}}},
            {"keyword": "kod chyby 403", "searches": 0, "cpc": 0, "words_count": 3,
             "statistics": {"snippets": {"current": []}}},
        ],
    }

    def test_serp_pomija_wlasna_domene_i_duplikaty_hostow(self):
        with mock.patch.object(research, "_request", return_value=self.SERP_RESPONSE), \
             mock.patch.dict(os.environ, {"SERPDATA_API_KEY": "x"}):
            result = research.serp("błąd 403", "www.grupa-icea.pl")
        self.assertEqual([row["url"] for row in result["competitors"]],
                         ["https://pomoc.home.pl/baza-wiedzy/blad-403", "https://verseo.pl/blad-403/"])

    def test_serp_zwraca_ai_overview_paa_i_powiazane(self):
        with mock.patch.object(research, "_request", return_value=self.SERP_RESPONSE), \
             mock.patch.dict(os.environ, {"SERPDATA_API_KEY": "x"}):
            result = research.serp("błąd 403", "www.grupa-icea.pl")
        self.assertIn("brak uprawnień", result["ai_overview"]["text"])
        self.assertEqual(result["ai_overview"]["sources"][0]["url"], "https://developer.mozilla.org/403")
        self.assertEqual(result["people_also_ask"], ["Jak naprawić błąd 403?"])
        self.assertEqual(result["related_searches"], ["403 forbidden"])

    def test_serp_bez_klucza_nie_udaje_ze_dziala(self):
        with mock.patch.dict(os.environ, {"SERPDATA_API_KEY": ""}), \
             self.assertRaises(research.ResearchError):
            research.serp("błąd 403", "www.grupa-icea.pl")

    def test_frazy_z_senuto_sortowane_po_wolumenie_bez_powtorzen_snippetow(self):
        with mock.patch.object(research, "_request", return_value=self.KEYWORDS_RESPONSE) as request, \
             mock.patch.dict(os.environ, {"SENUTO_API_KEY": "x"}):
            rows = research.keywords_for_urls(["https://a.pl/x/", "https://b.pl/y/"])
        self.assertEqual([row["keyword"] for row in rows], ["błąd 403 co oznacza", "kod chyby 403"])
        self.assertEqual(rows[0]["volume"], 170)
        self.assertEqual(rows[0]["snippets"], ["direct_answer", "people_also_ask"])
        # Komplet adresów idzie w jednym wywołaniu – to cała oszczędność zmiany.
        self.assertEqual(request.call_count, 1)
        body = json.loads(request.call_args.kwargs["data"].decode())
        self.assertEqual(body["parameters"][0]["value"], ["https://a.pl/x/", "https://b.pl/y/"])
        self.assertEqual(body["country_id"], 1)  # Baza Słów Kluczowych nie zna bazy 2.0

    def test_pusta_lista_adresow_nie_woła_api(self):
        with mock.patch.object(research, "_request") as request:
            self.assertEqual(research.keywords_for_urls([]), [])
        request.assert_not_called()


class TestBudget(unittest.TestCase):
    def test_przekroczenie_limitu_zapytan_serp(self):
        budget = Budget(serp_requests=2, tokens=1000)
        budget.add_serp()
        budget.check("serp_requests", estimate=1)
        budget.add_serp()
        with self.assertRaises(BudgetExceeded):
            budget.check("serp_requests", estimate=1)

    def test_zapytania_senuto_sa_liczone_ale_nie_limitowane(self):
        budget = Budget(serp_requests=1, tokens=1000)
        for _ in range(50):
            budget.add_senuto()
        budget.check("serp_requests", estimate=1)
        self.assertEqual(budget.snapshot()["senuto_requests"], 50)

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
