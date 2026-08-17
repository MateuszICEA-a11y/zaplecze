"""Testy pipeline'u reoptymalizacji – bez sieci i bez kluczy API.

Uruchomienie: python -m unittest discover -s pipeline/content-refresher/tests
"""
import http.client
import io
import json
import os
import sys
import unittest
import urllib.error
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import extract  # noqa: E402
import matching  # noqa: E402
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


class TestRenumeracja(unittest.TestCase):
    """Nowa sekcja wchodzi za kotwicę (after_slot), dalsze sekcje jadą w dół
    jako `move` – zamiast lądować po „Podsumowaniu" w pierwszym wolnym slocie."""

    ACF_CIAGLE = {
        "page_title_h2_1": "Czym jest błąd 403", "page_text_1": "<p>Serwer odmawia dostępu.</p>",
        "page_title_h2_2": "Jak go naprawić", "page_text_2": "<p>Sprawdź uprawnienia.</p>",
        "page_title_h2_3": "Podsumowanie", "page_text_3": "<p>Wystarczy poprawić uprawnienia.</p>",
    }

    def test_nowa_sekcja_wchodzi_za_kotwice_a_reszta_jedzie_w_dol(self):
        snapshot = sec.snapshot(self.ACF_CIAGLE)
        proposals, moves, inserted = sec.renumber(snapshot, {
            4: {"title": "Błąd 403 w Search Console", "text": "<p>Nowa.</p>", "after_slot": 1},
        })
        self.assertEqual(proposals[2]["title"], "Błąd 403 w Search Console")
        self.assertEqual(moves, {3: 2, 4: 3})
        self.assertEqual(inserted, {2})
        self.assertEqual(proposals[3]["title"], "Jak go naprawić")
        self.assertEqual(proposals[4]["title"], "Podsumowanie")

    def test_dziura_w_slotach_wchlania_przesuniecie(self):
        # Zajęte 1,2,5 – nowa sekcja za slotem 2 wchodzi w wolny slot 3 bez ruszania 5.
        proposals, moves, inserted = sec.renumber(sec.snapshot(ACF), {
            6: {"title": "Nowy wątek", "text": "<p>Treść.</p>", "after_slot": 2},
        })
        self.assertEqual(list(proposals), [3])
        self.assertEqual(moves, {})
        self.assertEqual(inserted, {3})

    def test_bez_kotwicy_zostaje_na_koncu(self):
        proposals, moves, inserted = sec.renumber(sec.snapshot(ACF), {
            6: {"title": "Nowy wątek", "text": "<p>Treść.</p>"},
        })
        self.assertEqual(list(proposals), [6])
        self.assertEqual(moves, {})
        self.assertEqual(inserted, {6})

    def test_przesuniecie_zachowuje_propozycje_rewrite_dla_sekcji(self):
        snapshot = sec.snapshot(self.ACF_CIAGLE)
        proposals, moves, _ = sec.renumber(snapshot, {
            2: {"title": "Jak naprawić błąd 403 krok po kroku", "text": "<p>Rozbudowana.</p>"},
            4: {"title": "Nowa", "text": "<p>N.</p>", "after_slot": 1},
        })
        # Sekcja 2 przesunięta do 3 razem ze swoją przepisaną treścią.
        self.assertEqual(proposals[3], {"title": "Jak naprawić błąd 403 krok po kroku",
                                        "text": "<p>Rozbudowana.</p>"})
        self.assertEqual(moves[3], 2)

    def test_wiersze_insert_i_move_po_renumeracji(self):
        snapshot = sec.snapshot(self.ACF_CIAGLE)
        proposals, moves, inserted = sec.renumber(snapshot, {
            4: {"title": "Nowa", "text": "<p>N.</p>", "after_slot": 1},
        })
        rows = {row["slot"]: row for row in sec.build_sections(snapshot, proposals, moves, inserted)}
        # Nowa sekcja w zajętym dziś slocie 2: insert bez „przed" (diff od zera),
        # ale z hashem nadpisywanej treści – konflikt-detekcja wie, co znika.
        self.assertEqual(rows[2]["operation"], "insert")
        self.assertEqual(rows[2]["text_before"], "")
        self.assertEqual(rows[2]["title_before"], "")
        self.assertEqual(rows[2]["text_hash_before"],
                         sec.content_hash(self.ACF_CIAGLE["page_text_2"]))
        # Move 2→3: diff liczony względem treści źródłowej (brak zmian treści)…
        self.assertEqual(rows[3]["operation"], "move")
        self.assertEqual(rows[3]["moved_from"], 2)
        self.assertEqual(rows[3]["diff"]["stats"]["added"], 0)
        # …a hash konfliktowy z celu (slot 3 = stare „Podsumowanie").
        self.assertEqual(rows[3]["text_hash_before"],
                         sec.content_hash(self.ACF_CIAGLE["page_text_3"]))
        # Move 3→4 w dotąd wolny slot: hash None → sprawdzany jak insert.
        self.assertIsNone(rows[4]["text_hash_before"])
        self.assertEqual(sec.detect_conflicts(list(rows.values()), self.ACF_CIAGLE), [])
        taken = {**self.ACF_CIAGLE, "page_text_4": "<p>Redakcja coś dopisała.</p>"}
        self.assertIn({"slot": 4, "reason": "slot_taken"},
                      sec.detect_conflicts(list(rows.values()), taken))
        edited = {**self.ACF_CIAGLE, "page_text_2": "<p>Ktoś poprawił slot 2.</p>"}
        self.assertIn({"slot": 2, "reason": "changed_in_cms"},
                      sec.detect_conflicts(list(rows.values()), edited))

    def test_brak_miejsca_wraca_do_starego_ukladu(self):
        acf = {f"page_title_h2_{n}": f"S{n}" for n in range(1, 31)} | \
              {f"page_text_{n}": f"<p>t{n}</p>" for n in range(1, 31)}
        original = {31: {"title": "Nowa", "text": "<p>N.</p>", "after_slot": 1}}
        proposals, moves, inserted = sec.renumber(sec.snapshot(acf), original)
        self.assertEqual(proposals, original)
        self.assertEqual(moves, {})
        self.assertEqual(inserted, {31})


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


class TestJinaExtract(unittest.TestCase):
    MARKDOWN = """# Analiza nagrań w badaniach UX

## Po co nagrywać sesje

Nagrania pokazują, gdzie użytkownik się gubi i czego nie znajduje na stronie sklepu.

[a](https://x.pl) [b](https://y.pl) [c](https://z.pl) [d](https://w.pl)

### Jak analizować

Zacznij od sesji zakończonych porzuceniem koszyka, potem przejdź do ścieżek wyszukiwania w sklepie.
"""

    def test_naglowki_i_slowa_z_markdownu(self):
        headings = extract.markdown_headings(self.MARKDOWN)
        self.assertEqual(headings[0], {"level": 1, "text": "Analiza nagrań w badaniach UX"})
        self.assertEqual([h["level"] for h in headings], [1, 2, 3])
        words = extract.markdown_words(self.MARKDOWN)
        # Dwa akapity i trzy nagłówki; linia z samych linków odpada.
        self.assertGreater(words, 25)
        self.assertLess(words, 50)
        self.assertEqual(extract.markdown_words("[a](https://x.pl) [b](https://y.pl) [c](https://z.pl) [d](https://w.pl)"), 0)

    def test_extract_many_uzywa_jina_z_fallbackiem(self):
        pages_jina = {"https://a.pl/x/": {"url": "https://a.pl/x/", "engine": "jina", "quality": "ok",
                                          "words": 500, "headings": [], "text": "md"}}

        def fake_jina(url, key):
            if url in pages_jina:
                return pages_jina[url]
            raise extract.FetchError("Jina Reader HTTP 422")

        with mock.patch.object(extract, "jina_extract", side_effect=fake_jina), \
             mock.patch.object(extract, "robots_allows", return_value=True), \
             mock.patch.object(extract, "extract", return_value={"url": "https://b.pl/y/", "engine": "trafilatura",
                                                                 "quality": "ok", "words": 300, "headings": [], "text": "t"}):
            results = extract.extract_many(["https://a.pl/x/", "https://b.pl/y/"], jina_key="k")
        self.assertEqual([row["engine"] for row in results], ["jina", "trafilatura"])

    def test_bez_klucza_stara_sciezka(self):
        with mock.patch.object(extract, "jina_extract") as jina, \
             mock.patch.object(extract, "robots_allows", return_value=True), \
             mock.patch.object(extract, "extract", return_value={"url": "u", "quality": "ok", "words": 1,
                                                                 "headings": [], "text": "t"}):
            extract.extract_many(["https://a.pl/"], jina_key="")
        jina.assert_not_called()


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

    POSITIONS_RESPONSE = {
        "success": True,
        "data": [
            {"keyword": "zlecę pozycjonowanie", "statistics": {
                "position": {"current": 9}, "searches": {"current": 40}}},
            {"keyword": "agencja seo poznań", "statistics": {
                "position": {"current": 31}, "searches": {"current": 390}}},
        ],
    }

    def test_frazy_konkurentow_z_pozycjami_bez_stron_glownych(self):
        """Pozycja rywala decyduje o kolejności, strona główna wypada z pytania.

        Wcześniej szła tu Baza Słów Kluczowych bez pozycji – dla adresu, który
        SERP oddał jako stronę główną agencji, brief dostawał jej frazy
        brandowe („semcore", „seo poznań") zamiast fraz o temacie wpisu.
        """
        with mock.patch.object(research, "_request", return_value=self.POSITIONS_RESPONSE) as request, \
             mock.patch.dict(os.environ, {"SENUTO_API_KEY": "x"}):
            result = research.competitor_keywords(
                ["https://semcore.pl/", "https://verseo.pl/zlece-pozycjonowanie/"])
        self.assertEqual(result["urls"], ["https://verseo.pl/zlece-pozycjonowanie/"])
        self.assertEqual([row["keyword"] for row in result["keywords"]], ["zlecę pozycjonowanie"])
        self.assertEqual(result["keywords"][0]["position"], 9)
        self.assertEqual(result["keywords"][0]["host"], "verseo.pl")
        body = json.loads(request.call_args.kwargs["data"].decode())
        self.assertEqual(body["fetch_mode"], "url")
        self.assertEqual(body["domain"], "verseo.pl/zlece-pozycjonowanie/")
        self.assertEqual(body["country_id"], 200)  # Analiza Widoczności = baza 2.0


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


class TestKotwicaNowychSekcji(unittest.TestCase):
    """Nowa sekcja ma stanąć przy sąsiedzie tematycznym, nie za zakończeniem."""

    BRIEF = {"structure": [
        {"action": "add", "slot": 7, "after_slot": 3, "heading": "Jak zamieniać ruch w leady?"},
        {"action": "add", "slot": 8, "after_slot": 99, "heading": "Kotwica poza zakresem"},
    ]}
    SNAPSHOT = [
        {"slot": 1, "title": "Czym jest SEO", "text": "<p>a</p>"},
        {"slot": 3, "title": "Jak prowadzić SEO", "text": "<p>b</p>"},
        {"slot": 6, "title": "Samodzielnie czy z agencją", "text": "<p>c</p>"},
    ]

    def _pipeline(self):
        import run as run_module

        args = type("Args", (), {
            "job": "t", "dry_run": True, "improvements": [], "research_file": "",
            "model_research": "", "model_writer": "",
        })()
        pipeline = run_module.Pipeline(args)
        pipeline.context = {"brief": self.BRIEF, "snapshot": self.SNAPSHOT, "free_slots": [7, 8]}
        return pipeline

    def test_kotwica_z_briefu_trafia_do_zadan(self):
        tasks = {task["slot"]: task for task in self._pipeline()._structure_tasks()}
        self.assertEqual(tasks[7]["after_slot"], 3)
        # Slot spoza szablonu nie jest kotwicą.
        self.assertNotIn("after_slot", tasks[8])

    def test_brak_kotwicy_od_modelu_uzupelnia_brief(self):
        pipeline = self._pipeline()
        answer = {"data": {"sections": [
            # Model podał treść, ale kotwicy nie – bez uzupełnienia sekcja
            # wylądowałaby na końcu artykułu.
            {"slot": 7, "title": "Jak zamieniać ruch w leady?", "text": "<p>nowa</p>"},
        ]}, "model": "m", "usage": {"tokens_in": 1, "tokens_out": 1}}
        with mock.patch.object(pipeline, "_ask", return_value=(answer, "1.9.0")):
            payload = pipeline.step_rewrite()["payload"]
        self.assertEqual(pipeline.context["proposals"][7]["after_slot"], 3)
        self.assertEqual(payload["anchors"], {"7": 3})

    def test_kotwica_modelu_ma_pierwszenstwo(self):
        pipeline = self._pipeline()
        answer = {"data": {"sections": [
            {"slot": 7, "after_slot": 1, "title": "Jak zamieniać ruch w leady?", "text": "<p>nowa</p>"},
        ]}, "model": "m", "usage": {"tokens_in": 1, "tokens_out": 1}}
        with mock.patch.object(pipeline, "_ask", return_value=(answer, "1.9.0")):
            pipeline.step_rewrite()
        self.assertEqual(pipeline.context["proposals"][7]["after_slot"], 1)


class TestNormalizacjaFraz(unittest.TestCase):
    """Warianty fleksyjne tej samej frazy nie są lukami."""

    def test_odmiana_i_kolejnosc_daja_te_sama_forme(self):
        import run as run_module
        norm = run_module.normalize_phrase
        self.assertEqual(norm("agencja seo"), norm("agencje seo"))
        self.assertEqual(norm("pozycjonowanie stron"), norm("pozycjonowania stron"))
        self.assertEqual(norm("seo agencja"), norm("agencja seo"))
        self.assertNotEqual(norm("agencja seo"), norm("agencja sem"))
        # Krótkie słowa zostają w spokoju – „seo" nie traci „o".
        self.assertEqual(norm("seo"), "seo")


class TestCytatEksperta(unittest.TestCase):
    def test_cytat_wchodzi_po_pierwszym_akapicie(self):
        import run as run_module

        args = type("Args", (), {
            "job": "t", "dry_run": True, "improvements": [], "research_file": "",
            "model_research": "", "model_writer": "", "author": "", "title": "",
        })()
        pipeline = run_module.Pipeline(args)
        pipeline.context = {
            "title": "T",
            "snapshot": [{"slot": 2, "title": "S", "text": "<p>Pierwszy.</p><p>Drugi.</p><ul><li>x</li></ul>"}],
            "proposals": {},
        }
        answer = {"data": {"quote": "Cytat.", "slot": 2, "expert": "Magdalena Antoń", "role": "specjalistka"},
                  "model": "m", "usage": {"tokens_in": 1, "tokens_out": 1}}
        with mock.patch.object(pipeline, "_ask", return_value=(answer, "1.0.0")):
            pipeline.step_expert()
        text = pipeline.context["proposals"][2]["text"]
        self.assertLess(text.index("blockquote"), text.index("<p>Drugi.</p>"))
        self.assertTrue(text.strip().endswith("</ul>"))


class TestRivalsFacts(unittest.TestCase):
    """Fakty z analizy konkurencji (Jina) – z env RIVALS_JSON albo z fixtures."""

    @staticmethod
    def _pipeline(fixtures=None):
        import run as run_module

        args = type("Args", (), {
            "job": "t", "dry_run": True, "improvements": [], "research_file": "",
            "model_research": "", "model_writer": "",
        })()
        pipeline = run_module.Pipeline(args)
        pipeline.fixtures = fixtures
        return pipeline

    def test_poprawny_json_z_env(self):
        payload = {"facts": [{"fact": "Limit to 2 MB", "source": "https://a.pl"}], "topics": []}
        with mock.patch.dict(os.environ, {"RIVALS_JSON": json.dumps(payload)}):
            self.assertEqual(self._pipeline()._rivals_facts(), payload)

    def test_null_brak_i_smieci_daja_none(self):
        for value in ("null", "", "nie-json", '{"facts": [], "topics": []}'):
            with mock.patch.dict(os.environ, {"RIVALS_JSON": value}):
                self.assertIsNone(self._pipeline()._rivals_facts(), value)

    def test_fixtures_maja_pierwszenstwo(self):
        with mock.patch.dict(os.environ, {"RIVALS_JSON": '{"facts": [{"fact": "z env"}]}'}):
            self.assertIsNone(self._pipeline(fixtures={"rivals": None})._rivals_facts())


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


class TestBudzetNieKasujeRoboty(unittest.TestCase):
    """Wyczerpany budżet w dokładce nie może przekreślać przepisanych sekcji."""

    class _Client:
        def __init__(self):
            self.events = []

        def step_start(self, name):
            self.events.append(("start", name, None))

        def step_done(self, name, **kwargs):
            self.events.append(("done", name, None))

        def step_failed(self, name, error):
            self.events.append(("failed", name, error))

        def step_skipped(self, name, reason):
            self.events.append(("skipped", name, reason))

        def finish(self, status, **kwargs):
            self.events.append(("finish", status, kwargs.get("error")))

    def _pipeline(self, failing_step):
        import run as run_module

        args = type("Args", (), {
            "job": "t", "dry_run": True, "improvements": ["gaps", "sources", "internal_links"],
            "research_file": "", "model_research": "", "model_writer": "",
            "domain": "www.grupa-icea.pl", "published_at": "", "changed_at": "", "out": "",
        })()
        pipeline = run_module.Pipeline(args)
        pipeline.client = self._Client()
        pipeline.context = {"sections": [{"slot": 1}], "content": {"hash": "abc"}}
        pipeline.state = {"steps": {}}

        def step(name):
            if name == failing_step:
                raise BudgetExceeded("tokens", 669288, 400000)
            return {"payload": {"step": name}}

        for name in ("fetch", "keywords_own", "serp", "competitors", "keywords_competitors",
                     "brief", "rewrite", "expert", "sources", "internal_links", "diff"):
            setattr(pipeline, f"step_{name}", (lambda captured: lambda: step(captured))(name))
        return pipeline

    def test_dokladka_ponad_budzet_konczy_przejazd_normalnie(self):
        pipeline = self._pipeline("sources")
        self.assertEqual(pipeline.run(), 0)
        events = pipeline.client.events
        skipped = {name: reason for kind, name, reason in events if kind == "skipped"}
        # „Źródła" i wszystko po nich odpada z podanym powodem…
        self.assertIn("Budżet wyczerpany", skipped["sources"])
        self.assertIn("Budżet wyczerpany", skipped["internal_links"])
        # …ale diff się wykonuje, więc sekcje trafiają do edytora.
        self.assertIn(("done", "diff", None), events)
        self.assertEqual([status for kind, status, _ in events if kind == "finish"], ["done"])

    def test_krok_obowiazkowy_ponad_budzet_nadal_przerywa(self):
        pipeline = self._pipeline("brief")
        self.assertEqual(pipeline.run(), 2)
        self.assertEqual(
            [status for kind, status, _ in pipeline.client.events if kind == "finish"],
            ["budget_exceeded"],
        )


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


class TestOpenRouterPonowienia(unittest.TestCase):
    """Zerwane połączenie to nie odmowa modelu – krok nie może przez nie paść."""

    class _Response:
        def __init__(self, payload):
            self.payload = payload

        def read(self):
            return json.dumps(self.payload).encode()

        def __enter__(self):
            return self

        def __exit__(self, *args):
            return False

    def test_incomplete_read_ponawiany_az_do_skutku(self):
        attempts = []

        def fake_urlopen(request, timeout=None):
            attempts.append(1)
            if len(attempts) < 3:
                raise http.client.IncompleteRead(b"1903 bytes")
            return self._Response({"choices": [{"message": {"content": "ok"}}]})

        with mock.patch.object(llm.urllib.request, "urlopen", fake_urlopen):
            data = llm._post_with_retries(object(), sleep=lambda _: None)
        self.assertEqual(len(attempts), 3)
        self.assertEqual(data["choices"][0]["message"]["content"], "ok")

    def test_blad_zadania_nie_jest_ponawiany(self):
        attempts = []

        def fake_urlopen(request, timeout=None):
            attempts.append(1)
            raise urllib.error.HTTPError("url", 400, "Bad Request", {}, io.BytesIO(b"zle dane"))

        with mock.patch.object(llm.urllib.request, "urlopen", fake_urlopen), \
             self.assertRaises(llm.LlmError):
            llm._post_with_retries(object(), sleep=lambda _: None)
        self.assertEqual(len(attempts), 1)

    def test_po_wyczerpaniu_prob_leci_ostatni_blad(self):
        def fake_urlopen(request, timeout=None):
            raise http.client.IncompleteRead(b"x")

        with mock.patch.object(llm.urllib.request, "urlopen", fake_urlopen), \
             self.assertRaises(llm.LlmError) as caught:
            llm._post_with_retries(object(), retries=2, sleep=lambda _: None)
        self.assertIn("openrouter:", str(caught.exception))


class TestCallJsonUcieta(unittest.TestCase):
    """Ucięta odpowiedź (finish_reason=length) nie może strącać kroku na model
    zapasowy – najpierw ponowienie na tym samym modelu z większym limitem."""

    def test_ponowienie_na_tym_samym_modelu_z_wiekszym_limitem(self):
        calls = []

        def fake_call(model, prompt, *, json_mode=False, max_tokens=8000, **kwargs):
            calls.append((model, max_tokens))
            if len(calls) == 1:
                return {"text": '{"sections": [', "finish_reason": "length",
                        "usage": {"tokens_in": 1, "tokens_out": 1}, "model": model}
            return {"text": '{"ok": true}', "finish_reason": "stop",
                    "usage": {"tokens_in": 1, "tokens_out": 1}, "model": model}

        with mock.patch.object(llm, "call", fake_call):
            result = llm.call_json("anthropic/claude-sonnet-5", "prompt", max_tokens=24000)
        self.assertEqual(calls, [("anthropic/claude-sonnet-5", 24000),
                                 ("anthropic/claude-sonnet-5", 48000)])
        self.assertEqual(result["data"], {"ok": True})
        self.assertNotIn("fallback_from", result)

    def test_fallback_oznaczony_w_wyniku(self):
        def fake_call(model, prompt, *, json_mode=False, max_tokens=8000, **kwargs):
            if model == "anthropic/claude-sonnet-5":
                return {"text": "bez JSON-a", "finish_reason": "stop",
                        "usage": {"tokens_in": 1, "tokens_out": 1}, "model": model}
            return {"text": '{"ok": true}', "finish_reason": "stop",
                    "usage": {"tokens_in": 1, "tokens_out": 1}, "model": model}

        with mock.patch.object(llm, "call", fake_call):
            result = llm.call_json("anthropic/claude-sonnet-5", "prompt")
        self.assertEqual(result["fallback_from"], "anthropic/claude-sonnet-5")
        self.assertEqual(result["model"], llm.MODEL_FALLBACK)


if __name__ == "__main__":
    unittest.main()


class TestCoverageGate(unittest.TestCase):
    """Bramka pokrycia fraz: propozycja wraca do poprawki, dopóki frazy z panelu
    edytora nie padną w treści albo model nie uzasadni, dlaczego się nie da."""

    GAP = {"keywords": [
        {"keyword": "leady fotowoltaika", "searches": 140, "status": "missing"},
        {"keyword": "gdzie szukać klientów na fotowoltaikę", "searches": 10, "status": "missing"},
        {"keyword": "audyt techniczny sklepu", "searches": 30, "status": "missing"},
    ]}
    BRIEF = {
        "keywords_to_cover": [{"keyword": "gdzie szukać klientów na fotowoltaikę", "where": "sekcja 2"}],
        "keywords_rejected": [{"keyword": "audyt techniczny sklepu", "why": "inna usługa niż temat wpisu"}],
    }
    SNAPSHOT = [
        {"slot": 1, "title": "Rynek fotowoltaiki", "text": "<p>Branża rośnie.</p>"},
        {"slot": 2, "title": "Skąd brać zapytania", "text": "<p>Najlepiej z wyszukiwarki.</p>"},
    ]

    def _pipeline(self):
        import run as run_module

        args = type("Args", (), {
            "job": "t", "dry_run": True, "improvements": ["gaps"], "research_file": "",
            "model_research": "", "model_writer": "",
        })()
        pipeline = run_module.Pipeline(args)
        pipeline.fixtures = {"gap": self.GAP}
        pipeline.context = {"brief": self.BRIEF, "snapshot": self.SNAPSHOT,
                            "free_slots": [3], "proposals": {}}
        return pipeline

    def test_lista_celow_laczy_edytor_z_briefem_i_zna_odrzucone(self):
        targets = self._pipeline()._coverage_targets()
        self.assertEqual([row["keyword"] for row in targets],
                         [row["keyword"] for row in self.GAP["keywords"]])
        self.assertEqual(targets[1]["where"], "sekcja 2")
        self.assertEqual(targets[2]["rejected"], "inna usługa niż temat wpisu")

    def test_brakujaca_fraza_wraca_do_modelu_i_konczy_jako_pokryta(self):
        pipeline = self._pipeline()
        asked = []

        def fake_ask(prompt_name, model, **values):
            asked.append(values["missing"])
            return ({
                "data": {"sections": [{
                    "slot": 2, "title": "Gdzie szukać klientów na fotowoltaikę",
                    "text": "<p>Leady na fotowoltaikę biorą się z wyszukiwarki.</p>",
                }]},
                "model": "test/model", "usage": {"tokens_in": 1, "tokens_out": 1},
            }, "1.0.0")

        with mock.patch.object(pipeline, "_ask", side_effect=fake_ask):
            payload = pipeline.step_coverage()["payload"]

        # Jedna runda wystarczyła – druga nie została uruchomiona.
        self.assertEqual(len(asked), 1)
        self.assertEqual({row["keyword"] for row in asked[0]},
                         {"leady fotowoltaika", "gdzie szukać klientów na fotowoltaikę"})
        self.assertEqual(payload["missing"], [])
        self.assertEqual(payload["ratio"], 1.0)
        # Fraza z nagłówka liczy się jak z akapitu – nowy H2 trafia do propozycji.
        self.assertEqual(pipeline.context["proposals"][2]["title"],
                         "Gdzie szukać klientów na fotowoltaikę")
        self.assertEqual(payload["skipped"],
                         [{"keyword": "audyt techniczny sklepu", "why": "inna usługa niż temat wpisu"}])

    def test_fraza_odrzucona_przez_model_nie_wraca_w_drugiej_rundzie(self):
        pipeline = self._pipeline()
        rounds = []

        def fake_ask(prompt_name, model, **values):
            rounds.append([row["keyword"] for row in values["missing"]])
            return ({
                "data": {"sections": [], "skipped": [
                    {"keyword": "leady fotowoltaika", "why": "wpis nie sprzedaje leadów"},
                ]},
                "model": "test/model", "usage": {"tokens_in": 1, "tokens_out": 1},
            }, "1.0.0")

        with mock.patch.object(pipeline, "_ask", side_effect=fake_ask):
            payload = pipeline.step_coverage()["payload"]

        self.assertEqual(len(rounds), 2)  # druga runda pyta już tylko o resztę
        self.assertNotIn("leady fotowoltaika", rounds[1])
        self.assertEqual(payload["missing"], ["gdzie szukać klientów na fotowoltaikę"])
        self.assertIn({"keyword": "leady fotowoltaika", "why": "wpis nie sprzedaje leadów"},
                      payload["skipped"])

    def test_fraza_bez_miejsca_w_tresci_wchodzi_jako_nowe_pytanie_faq(self):
        pipeline = self._pipeline()
        pipeline.context["free_faq_slots"] = [104, 105]
        seen = []

        def fake_ask(prompt_name, model, **values):
            seen.append(values["free_faq_slots"])
            return ({
                "data": {"sections": [
                    {"slot": 104, "title": "Gdzie szukać klientów na fotowoltaikę?",
                     "text": "<p>Leady na fotowoltaikę biorą się z wyszukiwarki.</p>"},
                    # Slot spoza puli wolnych par nie może nadpisać cudzego wpisu.
                    {"slot": 120, "title": "Nie wolno", "text": "<p>…</p>"},
                ]},
                "model": "test/model", "usage": {"tokens_in": 1, "tokens_out": 1},
            }, "1.1.0")

        with mock.patch.object(pipeline, "_ask", side_effect=fake_ask):
            payload = pipeline.step_coverage()["payload"]

        proposals = pipeline.context["proposals"]
        self.assertEqual(proposals[104]["title"], "Gdzie szukać klientów na fotowoltaikę?")
        self.assertNotIn(120, proposals)
        self.assertEqual(seen[0], [104, 105])
        # Pytanie FAQ liczy się do pokrycia tak samo jak akapit.
        self.assertNotIn("gdzie szukać klientów na fotowoltaikę", payload["missing"])
        self.assertEqual(payload["rounds"][0]["new_faq"], [104])

    def test_budzet_nowych_faq_jest_wspolny_z_krokiem_rewrite(self):
        pipeline = self._pipeline()
        pipeline.context["free_faq_slots"] = [103, 104, 105, 106]
        # Rewrite dopisał już trzy pytania – limit MAX_NEW_FAQ wyczerpany.
        pipeline.context["proposals"] = {
            103: {"title": "P1", "text": "<p>…</p>"},
            104: {"title": "P2", "text": "<p>…</p>"},
            105: {"title": "P3", "text": "<p>…</p>"},
        }
        self.assertEqual(pipeline._free_faq_for_coverage(), [])


class TestSerpSameDomeny(unittest.TestCase):
    """SERP potrafi oddać adresy obcięte do domen. Strony główne odrzucamy
    świadomie, ale przejazd nie może wtedy wyglądać na udany."""

    def _pipeline(self):
        import run as run_module

        args = type("Args", (), {
            "job": "t", "dry_run": True, "improvements": ["gaps"], "research_file": "",
            "model_research": "", "model_writer": "", "domain": "grupa-icea.pl",
        })()
        pipeline = run_module.Pipeline(args)
        pipeline.fixtures = None
        pipeline.context = {"competitors": [{"url": "https://www.proformat.pl/"},
                                            {"url": "https://delante.pl/"}]}
        return pipeline

    def test_same_strony_glowne_daja_ostrzezenie(self):
        import research
        import run as run_module

        pipeline = self._pipeline()
        with mock.patch.object(research, "competitor_keywords",
                               return_value={"keywords": [], "urls": []}), \
             mock.patch.object(pipeline.budget, "add_senuto"):
            payload = pipeline.step_keywords_competitors()["payload"]
        self.assertIn("strony główne", payload["warning"])

    def test_przy_normalnych_adresach_ostrzezenia_nie_ma(self):
        import research

        pipeline = self._pipeline()
        rows = [{"keyword": "leady fotowoltaika", "position": 3}]
        with mock.patch.object(research, "competitor_keywords",
                               return_value={"keywords": rows, "urls": ["https://delante.pl/a/"]}), \
             mock.patch.object(pipeline.budget, "add_senuto"):
            payload = pipeline.step_keywords_competitors()["payload"]
        self.assertNotIn("warning", payload)


class TestFaq(unittest.TestCase):
    """FAQ jako pseudo-sekcje: własna przestrzeń slotów (101+), własne pola ACF,
    poza renumeracją sekcji i poza przypisami/linkowaniem."""

    ACF_FAQ = {
        **ACF,
        "page_faq_title": "FAQ o błędzie 403",
        "page_faq_question_1": "Czym jest błąd 403?",
        "page_faq_answer_1": "<p>To odmowa dostępu do zasobu.</p>",
        "page_faq_question_2": "",
        "page_faq_answer_2": "",
    }

    def test_snapshot_ma_faq_pod_wlasnymi_slotami(self):
        rows = {item["slot"]: item for item in sec.snapshot(self.ACF_FAQ)}
        self.assertEqual([slot for slot in rows if slot > 100], [101])
        faq = rows[101]
        self.assertEqual(faq["kind"], "faq")
        self.assertEqual(faq["title_field"], "page_faq_question_1")
        self.assertEqual(faq["text_field"], "page_faq_answer_1")
        self.assertEqual(rows[1]["kind"], "section")

    def test_wolne_sloty_faq_nie_mieszaja_sie_z_sekcjami(self):
        self.assertEqual(sec.free_faq_slots(self.ACF_FAQ)[:2], [102, 103])
        self.assertNotIn(101, sec.free_slots(self.ACF_FAQ))
        self.assertTrue(sec.is_faq(101) and sec.is_faq(118))
        self.assertFalse(sec.is_faq(100) or sec.is_faq(119) or sec.is_faq(30))

    def test_renumeracja_nie_rusza_faq(self):
        """Nowa sekcja przesuwa sekcje treści; pytanie FAQ zostaje w swoim slocie."""
        snapshot = sec.snapshot(self.ACF_FAQ)
        proposals = {
            3: {"title": "Nowa sekcja", "text": "<p>nowa</p>", "after_slot": 1},
            101: {"title": "Co oznacza błąd 403?", "text": "<p>Odmowa dostępu.</p>"},
        }
        out, moves, inserted = sec.renumber(snapshot, proposals)
        self.assertIn(101, out)
        self.assertEqual(out[101]["title"], "Co oznacza błąd 403?")
        self.assertNotIn(101, moves.values())
        self.assertNotIn(101, inserted)

    def test_wiersze_diffa_maja_pola_faq_a_nie_page_text(self):
        snapshot = sec.snapshot(self.ACF_FAQ)
        proposals = {
            101: {"title": "Co oznacza błąd 403?", "text": "<p>Serwer odmawia dostępu.</p>"},
            102: {"title": "Jak naprawić 403?", "text": "<p>Sprawdź uprawnienia.</p>"},
        }
        rows = {row["slot"]: row for row in sec.build_sections(snapshot, proposals)}
        self.assertEqual(rows[101]["text_field"], "page_faq_answer_1")
        self.assertEqual(rows[101]["operation"], "update")
        self.assertEqual(rows[102]["title_field"], "page_faq_question_2")
        self.assertEqual(rows[102]["operation"], "insert")
        self.assertEqual(rows[101]["kind"], "faq")

    def test_konflikt_liczony_z_pola_faq(self):
        snapshot = sec.snapshot(self.ACF_FAQ)
        rows = sec.build_sections(snapshot, {101: {"title": "Co to 403?", "text": "<p>Nowa odpowiedź.</p>"}})
        self.assertEqual(sec.detect_conflicts(rows, self.ACF_FAQ), [])
        # Redakcja zmieniła odpowiedź w CMS-ie po snapshocie.
        changed = {**self.ACF_FAQ, "page_faq_answer_1": "<p>Zupełnie inna treść.</p>"}
        self.assertEqual(sec.detect_conflicts(rows, changed), [{"slot": 101, "reason": "changed_in_cms"}])


class TestFaqWPipeline(unittest.TestCase):
    """FAQ w kontekście przejazdu: liczy się do pokrycia fraz, ale nie dostaje
    przypisów ani linków wewnętrznych."""

    def _pipeline(self):
        import run as run_module

        args = type("Args", (), {
            "job": "t", "dry_run": True, "improvements": [], "research_file": "",
            "model_research": "", "model_writer": "",
        })()
        pipeline = run_module.Pipeline(args)
        pipeline.context = {
            "snapshot": [
                {"slot": 1, "kind": "section", "title": "Leady", "text": "<p>Treść sekcji.</p>"},
                {"slot": 101, "kind": "faq", "title": "Skąd brać leady na fotowoltaikę?",
                 "text": "<p>Z wyszukiwarki.</p>"},
            ],
            "proposals": {}, "free_slots": [2], "free_faq_slots": [102],
        }
        return pipeline

    def test_faq_liczy_sie_do_pokrycia_fraz(self):
        text = self._pipeline()._coverage_text()
        self.assertIn("Skąd brać leady na fotowoltaikę?", text)
        self.assertTrue(matching.has_phrase(text, "leady fotowoltaika"))

    def test_przypisy_i_linki_omijaja_faq(self):
        pipeline = self._pipeline()
        self.assertEqual(sorted(pipeline._section_texts()), [1, 101])
        self.assertEqual(sorted(pipeline._section_texts(faq=False)), [1])

    def test_zlaczona_tresc_oznacza_faq_pytaniem(self):
        merged = self._pipeline()._merged_content()
        self.assertIn("[FAQ: Skąd brać leady na fotowoltaikę?]", merged)
        self.assertIn("[sekcja 1]", merged)


class TestExpertDobor(unittest.TestCase):
    """Cytat trafia do realnej osoby z zespołu, dobranej do tematu i nigdy
    do autora wpisu."""

    def _pipeline(self, author):
        import run as run_module

        args = type("Args", (), {
            "job": "t", "dry_run": True, "improvements": [], "research_file": "",
            "model_research": "", "model_writer": "", "author": author,
        })()
        return run_module.Pipeline(args)

    def test_autor_wypada_z_kandydatow(self):
        import config
        names = [row["name"] for row in self._pipeline("Magdalena Antoń")._expert_candidates()]
        self.assertNotIn("Magdalena Antoń", names)
        self.assertEqual(len(names), len(config.EXPERTS) - 1)

    def test_autor_spoza_zespolu_zostawia_pelna_liste(self):
        import config
        names = [row["name"] for row in self._pipeline("Jan Kowalski")._expert_candidates()]
        self.assertEqual(len(names), len(config.EXPERTS))

    def test_ekspert_spoza_listy_zostaje_podmieniony(self):
        """Model bywa kreatywny – nazwisko spoza zespołu nie może wejść do treści."""
        pipeline = self._pipeline("Magdalena Antoń")
        pipeline.context = {"title": "Pozycjonowanie", "snapshot": [
            {"slot": 1, "kind": "section", "title": "A", "text": "<p>Tekst sekcji.</p>"}], "proposals": {}}

        def fake_ask(prompt_name, model, **values):
            return ({"data": {"slot": 1, "expert": "Anna Nowak", "role": "dyrektor",
                              "quote": "Z praktyki wiem, że liczy się konsekwencja."},
                     "model": "test/model", "usage": {"tokens_in": 1, "tokens_out": 1}}, "1.1.0")

        with mock.patch.object(pipeline, "_ask", side_effect=fake_ask):
            payload = pipeline.step_expert()["payload"]

        self.assertIn(payload["expert"], [row["name"] for row in pipeline._expert_candidates()])
        self.assertEqual(payload["expert_replaced"], "Anna Nowak")
        # Stanowisko pochodzi z naszej listy, nie z odpowiedzi modelu.
        self.assertNotEqual(payload["role"], "dyrektor")
        block = pipeline.context["proposals"][1]["text"]
        self.assertIn(f'{payload["expert"]}</span> · {payload["role"]}, ICEA', block)
        # Podpis nie może wejść w ciemne tło `blockquote footer` z motywu.
        self.assertIn("background:transparent", block)


class TestKolektorFaq(unittest.TestCase):
    """FAQ liczy się do treści w katalogu, ale zmiana metody liczenia nie może
    udawać, że redakcja ruszyła wpis."""

    POST = {
        "id": 20811,
        "content": {"rendered": "<p>Lead.</p>"},
        "acf": {
            "page_title_h2_1": "Na czym polega", "page_text_1": "<p>Treść sekcji.</p>",
            "page_faq_question_1": "Ile trwa pozycjonowanie?",
            "page_faq_answer_1": "<p>Od kilku do kilkunastu miesięcy.</p>",
        },
    }

    def test_faq_wchodzi_do_tresci_i_liczby_naglowkow(self):
        from sources.wordpress import _body

        body, headings, mode = _body(self.POST, [])
        self.assertEqual(mode, "acf")
        self.assertIn("Ile trwa pozycjonowanie?", body)
        self.assertEqual(headings, 2)  # H2 sekcji + H3 pytania

    def test_wpis_bez_faq_liczy_sie_jak_dotad(self):
        from sources.wordpress import _body

        post = {**self.POST, "acf": {k: v for k, v in self.POST["acf"].items() if "faq" not in k}}
        body, headings, _ = _body(post, [])
        self.assertEqual(headings, 1)
        self.assertNotIn("<h3>", body)

    def test_zmiana_metody_liczenia_nie_zeruje_wieku_wpisu(self):
        """Hash policzony bez FAQ różni się od nowego – to nasza zmiana, nie
        edycja redakcji. Data zmiany treści (bramka w scoringu) ma zostać."""
        from sources.wordpress import BODY_VERSION, change_state

        stary = {"content_hash": "aaa", "content_changed_at": "2022-11-18", "body_version": 1}
        self.assertEqual(change_state(stary, "bbb", "2026-01-01", "2026-08-06"),
                         ("2022-11-18", True))

        # Ta sama metoda, inny hash – redakcja naprawdę ruszyła treść.
        biezacy = {**stary, "body_version": BODY_VERSION, "hash_baseline": False}
        self.assertEqual(change_state(biezacy, "bbb", "2026-01-01", "2026-08-06"),
                         ("2026-08-06", False))

        # Hash bez zmian – stan zostaje nietknięty.
        self.assertEqual(change_state(biezacy, "aaa", "2026-01-01", "2026-08-06"),
                         ("2022-11-18", False))

        # Wpis widziany pierwszy raz – data z `modified`, oznaczona jako baseline.
        self.assertEqual(change_state(None, "aaa", "2026-01-01", "2026-08-06"),
                         ("2026-01-01", True))
