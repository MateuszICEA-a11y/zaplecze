"""Testy Content Writera – bez sieci i bez kluczy API.

Uruchomienie: python -m pytest pipeline/content-writer-wp/tests
"""
import json
import re
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

HERE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(HERE))

import write  # noqa: E402  (ustawia sys.path na content-refresher)
import llm  # noqa: E402
import writer_config  # noqa: E402

REPO = HERE.parents[1]

BRIEF = {
    "main_keyword": "audyt seo",
    "title": "Audyt SEO – jak go przeprowadzić krok po kroku",
    "target_words": 1200,
    "outline": [
        {"heading": "Czym jest audyt SEO", "points": ["definicja"], "keywords": ["audyt seo"], "words": 300,
         "basis": "PAA"},
        {"heading": "Etapy audytu strony", "points": ["crawl", "indeksacja"], "keywords": ["audyt strony"],
         "words": 500, "basis": "konkurent 1"},
    ],
    "faq": [{"question": "Ile trwa audyt SEO?", "basis": "PAA"}],
    "keywords_to_cover": [{"keyword": "audyt strony", "volume": 320, "where": "Etapy audytu strony"}],
}

RESEARCH = {
    "main_keyword": "audyt seo",
    "competitors": [{"url": "https://rywal.pl/audyt-seo/", "title": "Audyt SEO", "position": 1,
                     "headings": [{"level": 2, "text": "Co to jest"}], "words": 1400}],
    "serp": {"ai_overview": None, "people_also_ask": ["Ile trwa audyt SEO?"], "related_searches": []},
    "keywords_competitors": [{"keyword": "audyt strony", "position": 3, "searches": 320}],
    "rivals": {"facts": [{"fact": "Audyt obejmuje crawl całej strony.", "source": "https://rywal.pl/audyt-seo/"}],
               "topics": [], "median_words": 1400},
    "gap": {"keywords": [{"keyword": "audyt strony", "status": "missing"}]},
}


def fake_llm(responses):
    """Odpowiedzi modelu dobierane po fragmencie promptu – kolejność kroków bez znaczenia."""
    calls = []

    def call_json(model, prompt, **kwargs):
        calls.append(prompt)
        for needle, data in responses:
            if needle in prompt:
                return {"data": data, "usage": {"tokens_in": 10, "tokens_out": 10}, "model": model,
                        "text": json.dumps(data), "finish_reason": "stop"}
        return {"data": {}, "usage": {"tokens_in": 1, "tokens_out": 1}, "model": model, "text": "{}",
                "finish_reason": "stop"}

    return call_json, calls


def run_stage(stage, research, responses, extra_args=()):
    with tempfile.TemporaryDirectory() as tmp:
        fixture = Path(tmp) / "research.json"
        fixture.write_text(json.dumps(research, ensure_ascii=False), encoding="utf-8")
        args = write.parse_args([
            "--job", "job-1", "--domain", "grupa-icea.pl", "--stage", stage,
            "--keyword", "audyt seo", "--dry-run", "--research-file", str(fixture), *extra_args,
        ])
        call_json, calls = fake_llm(responses)
        with mock.patch.object(llm, "call_json", call_json):
            pipeline = write.WriterPipeline(args)
            code = pipeline.run()
        return code, pipeline, calls


class TestBriefStage(unittest.TestCase):
    def test_brief_z_researchu_trafia_do_kroku_i_konczy_przebieg(self):
        brief = {**BRIEF, "angle": "Praktyczny plan — bez teorii"}
        code, pipeline, calls = run_stage("brief", RESEARCH, [("brief NOWEGO artykułu", brief)])
        self.assertEqual(code, 0)
        steps = {row["step"]["name"]: row["step"] for row in pipeline.client.sent if row.get("step")
                 and row["step"].get("status") == "done"}
        self.assertEqual(steps["brief"]["payload"]["outline"][0]["heading"], "Czym jest audyt SEO")
        # Myślnik em z odpowiedzi modelu zamieniony na półpauzę.
        self.assertEqual(steps["brief"]["payload"]["angle"], "Praktyczny plan – bez teorii")
        self.assertEqual(pipeline.client.sent[-1]["status"], "done")
        prompt = calls[0]
        self.assertIn("Ile trwa audyt SEO?", prompt)  # PAA idzie do briefu
        self.assertIn("Audyt obejmuje crawl całej strony.", prompt)  # fakty konkurencji
        self.assertIn("audyt strony", prompt)  # lista obowiązkowa z edytora
        self.assertIn("Pisanie nowego artykułu", prompt)  # reguły Content Writera

    def test_brief_przycina_plan_do_limitu(self):
        outline = [{"heading": f"H2 {n}", "basis": "x"} for n in range(writer_config.MAX_OUTLINE + 4)]
        code, pipeline, _ = run_stage("brief", RESEARCH, [("brief NOWEGO artykułu", {**BRIEF, "outline": outline})])
        self.assertEqual(code, 0)
        self.assertEqual(len(pipeline.context["brief"]["outline"]), writer_config.MAX_OUTLINE)

    def test_odmowa_modelu_to_poprawny_brief(self):
        code, pipeline, _ = run_stage("brief", RESEARCH,
                                      [("brief NOWEGO artykułu", {"skip": True, "reason": "fraza brandowa"})])
        self.assertEqual(code, 0)
        self.assertTrue(pipeline.context["brief"]["skip"])


class TestWriteStage(unittest.TestCase):
    RESPONSES = [
        ("Piszesz NOWY artykuł", {
            "title": "Audyt SEO – jak go przeprowadzić",
            "lead": "<p>Audyt SEO to przegląd strony — od techniki po treść.</p>",
            "sections": [
                {"title": "Czym jest audyt SEO", "text": "<p>Audyt SEO to diagnoza strony.</p>"},
                {"title": "Etapy audytu", "text": "<p>Najpierw crawl, potem indeksacja.</p>"},
                {"title": "", "text": "<p>bez nagłówka – odpada</p>"},
            ],
            "faq": [{"question": "Ile trwa audyt SEO?", "answer": "<p>Zwykle od tygodnia do dwóch.</p>"}],
            "unsupported": ["koszt audytu"],
        }),
    ]

    def research(self):
        return {"brief": BRIEF, "rivals": RESEARCH["rivals"], "gap": RESEARCH["gap"]}

    def test_sekcje_po_kolei_faq_od_101_same_inserty(self):
        code, pipeline, _ = run_stage("write", self.research(), self.RESPONSES)
        self.assertEqual(code, 0)
        final = pipeline.client.sent[-1]
        self.assertEqual(final["status"], "done")
        rows = {row["slot"]: row for row in final["sections"]}
        self.assertEqual(sorted(rows), [1, 2, 101])
        self.assertEqual(rows[1]["title_field"], "page_title_h2_1")
        self.assertEqual(rows[101]["title_field"], "page_faq_question_1")
        self.assertEqual(rows[101]["text_field"], "page_faq_answer_1")
        self.assertTrue(all(row["operation"] == "insert" and row["text_before"] is None for row in rows.values()))

    def test_wstep_i_tytul_w_kroku_write(self):
        _, pipeline, _ = run_stage("write", self.research(), self.RESPONSES)
        steps = {row["step"]["name"]: row["step"] for row in pipeline.client.sent
                 if row.get("step") and row["step"].get("status") == "done"}
        self.assertEqual(steps["write"]["payload"]["lead"], "<p>Audyt SEO to przegląd strony – od techniki po treść.</p>")
        self.assertEqual(steps["write"]["payload"]["unsupported"], ["koszt audytu"])
        # Zatwierdzony brief zapisany jako krok – z niego korzysta ekspert w Workerze.
        self.assertEqual(steps["brief"]["payload"]["outline"][1]["heading"], "Etapy audytu strony")

    def test_bramka_pokrycia_mierzy_frazy_z_edytora(self):
        _, pipeline, calls = run_stage("write", self.research(), self.RESPONSES)
        steps = {row["step"]["name"]: row["step"] for row in pipeline.client.sent
                 if row.get("step") and row["step"].get("status") == "done"}
        self.assertIn("audyt strony", steps["coverage"]["payload"]["targets"])
        # „audyt strony" nie padło w tekście – krok coverage poprosił model o poprawkę.
        self.assertTrue(any("audyt strony" in prompt and "Piszesz NOWY artykuł" not in prompt for prompt in calls))

    def test_zrodla_do_slotu_200(self):
        responses = [*self.RESPONSES, ("Jesteś researcherem.", {
            "citations": [{"source_url": "https://developers.google.com/search", "source_title": "Google Search Central"}],
        })]
        code, pipeline, _ = run_stage("write", self.research(), responses)
        self.assertEqual(code, 0)
        rows = {row["slot"]: row for row in pipeline.client.sent[-1]["sections"]}
        self.assertIn(200, rows)
        self.assertEqual(rows[200]["text_field"], "page_sources_text")
        self.assertIn('rel="nofollow noopener"', rows[200]["text_after"])

    def test_bez_briefu_przebieg_pada(self):
        code, pipeline, _ = run_stage("write", {"brief": {}}, self.RESPONSES)
        self.assertEqual(code, 1)
        self.assertEqual(pipeline.client.sent[-1]["status"], "failed")


class TestHelpers(unittest.TestCase):
    def test_powiazane_wpisy_po_rdzeniach(self):
        catalog = [
            {"title": "Audyty SEO – co sprawdzamy", "url": "https://x/1", "words": 900},
            {"title": "Jak pisać meta description", "url": "https://x/2", "words": 1500},
        ]
        self.assertEqual([row["url"] for row in write.related_articles(catalog, "audyt seo")], ["https://x/1"])

    def test_limity_lustrem_workera(self):
        """Brief przycina Worker i pipeline – te same liczby po obu stronach."""
        source = (REPO / "dashboard" / "app" / "cw-writer.js").read_text(encoding="utf-8")
        for name in ("MAX_OUTLINE", "MAX_FAQ"):
            match = re.search(rf"export const {name} = (\d+);", source)
            self.assertIsNotNone(match, name)
            self.assertEqual(int(match.group(1)), getattr(writer_config, name), name)

    def test_workflow_nie_wkleja_payloadu_w_skrypt(self):
        """Tytuł i fraza pochodzą od użytkownika – `${{ }}` w `run:` to wstrzyknięcie."""
        import yaml

        workflow = yaml.safe_load((REPO / ".github" / "workflows" / "content-writer-wp.yml").read_text(encoding="utf-8"))
        for job in workflow["jobs"].values():
            for step in job["steps"]:
                self.assertNotIn("${{", step.get("run", ""), step.get("name"))


if __name__ == "__main__":
    unittest.main()
