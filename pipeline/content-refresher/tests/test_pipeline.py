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


class TestSerpDwaZapytania(unittest.TestCase):
    """SERP pytany tematem wpisu i naszą frazą – tytuł jest bazą, nie fallbackiem."""

    @staticmethod
    def _pipeline(title, keywords_own):
        import run as run_module

        args = type("Args", (), {
            "job": "t", "dry_run": True, "improvements": [], "research_file": "",
            "model_research": "", "model_writer": "", "domain": "www.grupa-icea.pl",
        })()
        pipeline = run_module.Pipeline(args)
        pipeline.context = {"title": title, "keywords_own": keywords_own, "gsc": []}
        return pipeline

    @staticmethod
    def _serp(hosts, keyword):
        return {
            "keyword": keyword,
            "competitors": [{"position": i + 1, "url": f"https://{h}/x", "title": h} for i, h in enumerate(hosts)],
            "ai_overview": None, "people_also_ask": [], "related_searches": [],
        }

    def test_tytul_jest_baza_a_fraza_wlasna_dokladana(self):
        pipeline = self._pipeline("Błąd 403 – jak naprawić? Co oznacza?", [{"keyword": "kod 403 apache"}])
        asked = []

        def fake_serp(keyword, domain, limit=5):
            asked.append(keyword)
            return self._serp(["temat-a.pl"] if keyword == "Błąd 403" else ["inna.pl"], keyword)

        with mock.patch.object(research, "serp", side_effect=fake_serp):
            payload = pipeline.step_serp()
        self.assertEqual(asked, ["Błąd 403", "kod 403 apache"])
        self.assertEqual(payload["cost"]["serp_requests"], 2)
        self.assertEqual(pipeline.context["main_keyword"], "Błąd 403")

    def test_rozjazd_to_hosty_z_tematu_nieobecne_na_naszej_frazie(self):
        pipeline = self._pipeline("Looker Studio", [{"keyword": "looker studio cennik"}])

        def fake_serp(keyword, domain, limit=5):
            return self._serp(["temat-a.pl", "temat-b.pl"] if keyword == "Looker Studio" else ["temat-b.pl"], keyword)

        with mock.patch.object(research, "serp", side_effect=fake_serp):
            payload = pipeline.step_serp()
        self.assertEqual(payload["payload"]["drift"], ["temat-a.pl"])
        self.assertEqual(pipeline.context["serp_drift"], ["temat-a.pl"])

    def test_fraza_rowna_tytulowi_nie_placi_za_drugi_serp(self):
        pipeline = self._pipeline("Looker Studio", [{"keyword": "looker studio"}])
        asked = []

        def fake_serp(keyword, domain, limit=5):
            asked.append(keyword)
            return self._serp(["temat-a.pl"], keyword)

        with mock.patch.object(research, "serp", side_effect=fake_serp):
            payload = pipeline.step_serp()
        self.assertEqual(len(asked), 1)
        self.assertEqual(payload["cost"]["serp_requests"], 1)
        self.assertEqual(payload["payload"]["drift"], [])

    def test_title_query_zdejmuje_ozdobniki(self):
        self.assertEqual(research.title_query("Błąd 403 – jak naprawić? Co oznacza?"), "Błąd 403")
        self.assertEqual(research.title_query("Czym jest Looker Studio"), "Czym jest Looker Studio")


class TestModelOverride(unittest.TestCase):
    """Wybór modeli z dashboardu: --model-* nadpisuje config, puste = defaulty."""

    @staticmethod
    def _pipeline(model_research="", model_writer=""):
        import run as run_module

        args = type("Args", (), {
            "job": "t", "dry_run": True, "improvements": [], "research_file": "",
            "model_research": model_research, "model_writer": model_writer,
        })()
        return run_module.Pipeline(args)

    def test_puste_argumenty_daja_defaulty_z_configu(self):
        import config
        pipeline = self._pipeline()
        self.assertEqual(pipeline.model_research, config.MODEL_RESEARCH)
        self.assertEqual(pipeline.model_writer, config.MODEL_WRITER)

    def test_argumenty_nadpisuja_config(self):
        pipeline = self._pipeline("perplexity/sonar-reasoning-pro", "google/gemini-3.1-pro")
        self.assertEqual(pipeline.model_research, "perplexity/sonar-reasoning-pro")
        self.assertEqual(pipeline.model_writer, "google/gemini-3.1-pro")


class TestRewriteNaglowki(unittest.TestCase):
    """Zalecenia struktury idą do rewrite jako lista zadań, a pominięte
    zmiany nagłówków wracają w payloadzie kroku."""

    @staticmethod
    def _pipeline(brief, snapshot):
        import run as run_module

        args = type("Args", (), {
            "job": "t", "dry_run": True, "improvements": [], "research_file": "",
            "model_research": "", "model_writer": "",
        })()
        pipeline = run_module.Pipeline(args)
        pipeline.context = {"brief": brief, "snapshot": snapshot, "free_slots": [3, 4, 6]}
        return pipeline

    BRIEF = {"structure": [
        {"action": "keep", "slot": 1, "heading": "Czym jest błąd 403"},
        {"action": "rewrite", "slot": 5, "heading": "Błąd 403 – co robić, gdy wraca?", "note": "generyczny H2"},
        {"action": "add", "slot": 3, "heading": "Błąd 403 w Search Console"},
        {"action": "rewrite", "slot": "zły", "heading": "odpada – slot nie jest liczbą"},
    ]}
    SNAPSHOT = [
        {"slot": 1, "title": "Czym jest błąd 403", "text": "<p>a</p>"},
        {"slot": 5, "title": "Podsumowanie", "text": "<p>b</p>"},
    ]

    def test_lista_zadan_tylko_rewrite_i_add(self):
        tasks = self._pipeline(self.BRIEF, self.SNAPSHOT)._structure_tasks()
        self.assertEqual([(t["action"], t["slot"]) for t in tasks], [("rewrite", 5), ("add", 3)])

    def test_pominieta_zmiana_naglowka_jest_raportowana(self):
        pipeline = self._pipeline(self.BRIEF, self.SNAPSHOT)
        answer = {"data": {"sections": [
            # Model dopisał treść w slocie 5, ale zostawił „Podsumowanie".
            {"slot": 5, "title": "Podsumowanie", "text": "<p>b plus</p>", "change": "dopisano"},
        ]}, "model": "m", "usage": {"tokens_in": 1, "tokens_out": 1}}
        with mock.patch.object(pipeline, "_ask", return_value=(answer, "1.2.0")) as ask:
            payload = pipeline.step_rewrite()["payload"]
        self.assertEqual(payload["headings_missed"], [
            {"slot": 5, "recommended": "Błąd 403 – co robić, gdy wraca?", "current": "Podsumowanie"},
            {"slot": 3, "recommended": "Błąd 403 w Search Console", "current": ""},
        ])
        # Zadania strukturalne trafiają do promptu jako osobna zmienna.
        self.assertEqual(len(ask.call_args.kwargs["structure_tasks"]), 2)

    def test_wykonane_zalecenia_nie_generuja_raportu(self):
        pipeline = self._pipeline(self.BRIEF, self.SNAPSHOT)
        answer = {"data": {"sections": [
            {"slot": 5, "title": "Błąd 403 – co robić, gdy wraca?", "text": "<p>b plus</p>"},
            {"slot": 3, "title": "Błąd 403 w Search Console", "text": "<p>nowa</p>"},
        ]}, "model": "m", "usage": {"tokens_in": 1, "tokens_out": 1}}
        with mock.patch.object(pipeline, "_ask", return_value=(answer, "1.2.0")):
            payload = pipeline.step_rewrite()["payload"]
        self.assertEqual(payload["headings_missed"], [])

    def test_zmiana_samego_naglowka_liczy_sie_jako_wykonana(self):
        pipeline = self._pipeline(self.BRIEF, self.SNAPSHOT)
        answer = {"data": {"sections": [
            {"slot": 5, "title": "Błąd 403 – co robić, gdy wraca?", "text": "<p>b</p>"},
        ]}, "model": "m", "usage": {"tokens_in": 1, "tokens_out": 1}}
        with mock.patch.object(pipeline, "_ask", return_value=(answer, "1.2.0")):
            payload = pipeline.step_rewrite()["payload"]
        self.assertEqual([row["slot"] for row in payload["headings_missed"]], [3])


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
