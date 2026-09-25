"""Content Writer – nowy artykuł dla grupa-icea.pl (wejście CLI).

Dwa etapy, każdy to osobny przebieg z dashboardu (repository_dispatch):

    brief – SERP (SerpData), treści i frazy konkurencji (Jina, Senuto),
            brief z planem sekcji do akceptacji redaktora,
    write – tekst według zatwierdzonego briefu: sekcje ACF (1..30), FAQ (101+),
            bramka pokrycia fraz, Źródła (slot 200), linki wewnętrzne.

    python write.py --job <id> --domain grupa-icea.pl --stage brief \
        --keyword "audyt seo" --dry-run

Silnik jest wspólny z pipeline/content-refresher: klasa `Pipeline` daje kroki
researchu, bramkę pokrycia, Źródła i linki wewnętrzne – tu dochodzi tylko to,
czego odświeżanie nie ma (brief od zera, pisanie, wiersze sekcji bez „przed").
Pipeline NIGDY nie zapisuje niczego do WordPressa – szkic zakłada dashboard.
"""
import argparse
import json
import os
import re
import sys
import traceback
from pathlib import Path

HERE = Path(__file__).resolve().parent
REFRESHER = HERE.parent / "content-refresher"
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(REFRESHER))

import extract  # noqa: E402
import llm  # noqa: E402
import matching  # noqa: E402
import run as refresher  # noqa: E402
import sections as sec  # noqa: E402
import wp  # noqa: E402
from budget import BudgetExceeded  # noqa: E402
from client import CallbackError  # noqa: E402
from config import ACF_SLOTS, EDITORIAL_RULES, FAQ_SLOT_BASE, SOURCES_SLOT  # noqa: E402
from writer_config import MAX_FAQ, MAX_OUTLINE, PIPELINE_VERSION, RELATED_ARTICLES, WRITER_RULES  # noqa: E402

PROMPTS = HERE / "prompts"
EM_DASH = re.compile("—")


def dashes(value):
    """Typografia repo: półpauza zamiast myślnika em – deterministycznie,
    bo modele wstawiają „—" mimo instrukcji."""
    if isinstance(value, str):
        return EM_DASH.sub("–", value)
    if isinstance(value, list):
        return [dashes(item) for item in value]
    if isinstance(value, dict):
        return {key: dashes(item) for key, item in value.items()}
    return value


def related_articles(catalog: list[dict], keyword: str, limit: int = RELATED_ARTICLES) -> list[dict]:
    """Wpisy z katalogu, które dzielą z frazą co najmniej jedno słowo znaczące.

    Brief ma je widzieć, żeby nie zaplanować drugiego tekstu na ten sam temat.
    Porównanie po rdzeniach z matchera edytora (odmiana się nie liczy).
    """
    words = {token["stem"] for token in matching.tokens(keyword)
             if token["stem"] not in matching.PHRASE_FILLERS and len(token["stem"]) >= 3}
    if not words:
        return []
    scored = []
    for row in catalog:
        stems = {token["stem"] for token in matching.tokens(row.get("title") or "")}
        shared = len(words & stems)
        if shared:
            scored.append((shared, row))
    scored.sort(key=lambda item: (-item[0], -(item[1].get("words") or 0)))
    return [{"title": row["title"], "url": row["url"]} for _, row in scored[:limit]]


class WriterPipeline(refresher.Pipeline):
    def __init__(self, args):
        super().__init__(args)
        self.state["pipeline_version"] = PIPELINE_VERSION

    # --- pomocnicze ---

    def _ask(self, prompt_name: str, model: str, *, web_search=False, max_tokens=8000, **values):
        """Prompty Content Writera leżą obok tego pliku; reszta (coverage,
        sources, internal_links) przychodzi z content-refresher bez zmian."""
        if not (PROMPTS / f"{prompt_name}.md").is_file():
            return super()._ask(prompt_name, model, web_search=web_search, max_tokens=max_tokens, **values)
        template, version = llm.load_prompt(prompt_name, PROMPTS)
        prompt = llm.render(template, editorial_rules=f"{EDITORIAL_RULES}\n\n{WRITER_RULES}", **values)
        self.budget.check("tokens", estimate=len(prompt) // 3)
        result = llm.call_json(model, prompt, web_search=web_search, max_tokens=max_tokens)
        self.budget.add_tokens(result["usage"]["tokens_in"], result["usage"]["tokens_out"])
        return result, version

    def _accepted_brief(self) -> dict:
        """Brief zatwierdzony w dashboardzie (client_payload.brief → BRIEF_JSON)."""
        if self.fixtures is not None and "brief" in self.fixtures:
            return self.fixtures["brief"] or {}
        raw = os.environ.get("BRIEF_JSON", "").strip()
        if not raw or raw == "null":
            return {}
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            return {}
        return data if isinstance(data, dict) else {}

    def _free_faq_for_coverage(self) -> list[int]:
        """Nowy artykuł nie ma pytań w CMS-ie – budżet FAQ to MAX_FAQ na cały
        tekst, a nie „najwyżej trzy nowe" jak przy odświeżaniu."""
        proposals = self.context.get("proposals") or {}
        used = sum(1 for slot in proposals if sec.is_faq(slot))
        free = [slot for slot in self.context.get("free_faq_slots") or [] if slot not in proposals]
        return free[:max(0, MAX_FAQ - used)]

    # --- kroki ---

    def step_setup(self):
        config = wp.domain_config(self.args.domain)
        base_url = ((config.get("wordpress") or {}).get("base_url") or f"https://{self.args.domain}").rstrip("/")
        keyword = self.args.keyword.strip()
        self.context = {
            "config": config,
            "snapshot": [],
            "proposals": {},
            "free_slots": list(range(1, ACF_SLOTS + 1)),
            "free_faq_slots": [FAQ_SLOT_BASE + n for n in range(1, MAX_FAQ + 1)],
            # Research pyta SERP frazą – tytuł roboczy jeszcze nie istnieje albo
            # jest dłuższy niż zapytanie, które wpisuje użytkownik.
            "title": keyword,
            "article_title": (self.args.title or "").strip() or keyword,
            "url": f"{base_url}/",
            "main_keyword": keyword,
            "keywords_own": [],
            "gsc": [],
            "content": {"hash": "", "text": ""},
        }
        return {"payload": {"keyword": keyword, "stage": self.args.stage, "project_id": self.args.project_id}}

    def step_competitors(self):
        # Odtworzenie z pliku researchu nie może sięgać do sieci po treści.
        if self.fixtures is not None:
            return {"payload": {"source": "fixtures"}}
        return super().step_competitors()

    def step_brief(self):
        catalog = wp.catalog(self.args.domain)
        serp = self.context.get("serp") or {}
        result, version = self._ask(
            "brief_new", self.model_research, web_search=True, max_tokens=12000,
            keyword=self.context["main_keyword"],
            competitors=[{k: v for k, v in row.items() if k != "text"} for row in self.context.get("competitors") or []],
            ai_overview=serp.get("ai_overview") or "—",
            people_also_ask=serp.get("people_also_ask") or [],
            related_searches=serp.get("related_searches") or [],
            competitor_keywords=(self.context.get("keywords_gap") or self.context.get("keywords_competitors") or [])[:40],
            editor_gap=self._editor_gap() or "brak – analiza SERP nie była uruchomiona w dashboardzie",
            rivals=self._rivals_facts(),
            related_articles=related_articles(catalog, self.context["main_keyword"]) or "brak",
            max_outline=str(MAX_OUTLINE),
            max_faq=str(MAX_FAQ),
        )
        data = dashes(result["data"])
        if not data.get("skip"):
            data["outline"] = (data.get("outline") or [])[:MAX_OUTLINE]
            data["faq"] = (data.get("faq") or [])[:MAX_FAQ]
        self.context["brief"] = data
        return {"payload": data, "model": result["model"], "prompt_version": version, "cost": result["usage"]}

    def step_brief_input(self):
        """Zatwierdzony brief jako krok przebiegu – z niego korzysta też etap
        eksperta w Workerze (materiał, na którym stoi cytat)."""
        brief = self._accepted_brief()
        if not brief.get("outline"):
            raise RuntimeError("brak zatwierdzonego planu artykułu (brief bez sekcji)")
        self.context["brief"] = brief
        if brief.get("title") and not (self.args.title or "").strip():
            self.context["article_title"] = brief["title"]
        return {"payload": brief}

    def step_write(self):
        brief = self.context["brief"]
        result, version = self._ask(
            "write", self.model_writer, max_tokens=32000,
            keyword=self.context["main_keyword"],
            title=self.context["article_title"],
            brief=brief,
            rivals=self._rivals_facts(),
            editor_gap=self._editor_gap() or "brak – obowiązują frazy z `keywords_to_cover` w briefie",
            max_faq=str(MAX_FAQ),
        )
        data = dashes(result["data"])
        if data.get("skip"):
            raise RuntimeError(f"model odmówił napisania tekstu: {data.get('reason') or 'bez powodu'}")

        proposals = {}
        # Numer slotu = miejsce w artykule: nowy wpis zapełnia pola po kolei,
        # więc kolejność z odpowiedzi modelu jest kolejnością na stronie.
        rows = [row for row in data.get("sections") or []
                if (row.get("title") or "").strip() and (row.get("text") or "").strip()]
        for slot, row in enumerate(rows[:ACF_SLOTS], start=1):
            proposals[slot] = {"title": row["title"].strip(), "text": row["text"].strip()}
        faq = [row for row in data.get("faq") or []
               if (row.get("question") or "").strip() and (row.get("answer") or "").strip()]
        for index, row in enumerate(faq[:MAX_FAQ], start=1):
            proposals[FAQ_SLOT_BASE + index] = {"title": row["question"].strip(), "text": row["answer"].strip()}
        if not any(not sec.is_faq(slot) for slot in proposals):
            raise RuntimeError("model nie oddał żadnej sekcji z treścią")

        self.context["proposals"] = proposals
        self.context["free_slots"] = [slot for slot in range(1, ACF_SLOTS + 1) if slot not in proposals]
        lead = (data.get("lead") or "").strip()
        title = (data.get("title") or "").strip() or self.context["article_title"]
        self.context["lead"], self.context["article_title"] = lead, title
        # Kolejne kroki (Źródła, linki wewnętrzne) pracują już na tytule tekstu.
        self.context["title"] = title
        words = len(" ".join(extract.strip_html(row["text"]) for row in proposals.values()).split())
        return {"payload": {
            "title": title,
            "lead": lead,
            "sections": sum(1 for slot in proposals if not sec.is_faq(slot)),
            "faq": sum(1 for slot in proposals if sec.is_faq(slot)),
            "words": words + len(extract.strip_html(lead).split()),
            "target_words": brief.get("target_words"),
            "unsupported": data.get("unsupported") or [],
            "notes": data.get("notes") or "",
        }, "model": result["model"], "prompt_version": version, "cost": result["usage"]}

    def step_sections(self):
        """Wiersze job_sections: każda sekcja to `insert` bez stanu „przed"."""
        titles = self.context.get("new_titles") or {}
        rows = []
        for slot in sorted(self.context.get("proposals") or {}):
            proposal = self.context["proposals"][slot]
            text = dashes(proposal.get("text") or "")
            if not text.strip():
                continue
            title_field, text_field = sec.fields_for(slot)
            rows.append({
                "slot": slot,
                "title_field": title_field,
                "text_field": text_field,
                "operation": "insert",
                "title_before": None,
                "title_after": dashes(proposal.get("title") or titles.get(slot) or ""),
                "text_before": None,
                "text_after": text,
                "text_hash_before": None,
                "diff": None,
            })
        self.context["sections"] = rows
        return {"payload": {
            "sections": [row["slot"] for row in rows],
            "sources": any(row["slot"] == SOURCES_SLOT for row in rows),
        }}

    # --- orkiestracja ---

    def order(self):
        if self.args.stage == "brief":
            return [
                ("setup", self.step_setup),
                ("serp", self.step_serp),
                ("competitors", self.step_competitors),
                ("keywords_competitors", self.step_keywords_competitors),
                ("brief", self.step_brief),
            ], {"setup", "serp", "brief"}
        return [
            ("setup", self.step_setup),
            ("brief", self.step_brief_input),
            ("write", self.step_write),
            ("coverage", self.step_coverage),
            ("sources", self.step_sources),
            ("internal_links", self.step_internal_links),
            ("sections", self.step_sections),
        ], {"setup", "brief", "write", "sections"}

    def run(self) -> int:
        order, required = self.order()
        budget_stop = None
        try:
            for name, fn in order:
                if budget_stop and name not in required:
                    self.client.step_skipped(name, budget_stop)
                    continue
                print(f"[{name}]")
                try:
                    _, ok = self._run_step(name, fn)
                except BudgetExceeded as err:
                    if name in required:
                        raise
                    self.client.step_skipped(name, str(err))
                    budget_stop = str(err)
                    continue
                if not ok and name in required:
                    self.client.finish("failed", cost=self.budget.snapshot(),
                                       error=f"Krok „{name}” nie powiódł się – przebieg przerwany.")
                    return 1
        except BudgetExceeded as err:
            self.client.finish("budget_exceeded", sections=self.context.get("sections"),
                               cost=self.budget.snapshot(), error=str(err))
            return 2
        except CallbackError as err:
            print(f"przerwane: {err}", file=sys.stderr)
            return 3

        self.client.finish("done", sections=self.context.get("sections"), cost=self.budget.snapshot())
        if self.args.out:
            Path(self.args.out).write_text(json.dumps({
                "job": self.args.job,
                "stage": self.args.stage,
                "pipeline_version": PIPELINE_VERSION,
                "steps": self.state["steps"],
                "sections": self.context.get("sections"),
                "cost": self.budget.snapshot(),
            }, ensure_ascii=False, indent=1), encoding="utf-8")
        return 0


def parse_args(argv=None):
    parser = argparse.ArgumentParser(description="Content Writer – nowy artykuł (grupa-icea.pl)")
    parser.add_argument("--job", required=True)
    parser.add_argument("--domain", required=True)
    parser.add_argument("--stage", choices=["brief", "write"], required=True)
    parser.add_argument("--project-id", default="")
    parser.add_argument("--keyword", required=True)
    parser.add_argument("--title", default="")
    parser.add_argument("--author", default="")
    parser.add_argument("--model-research", default="")
    parser.add_argument("--model-writer", default="")
    parser.add_argument("--dry-run", action="store_true", help="bez callbacków do dashboardu")
    parser.add_argument("--research-file", default="",
                        help="JSON z gotowym researchem (serp, competitors, keywords_competitors, brief)")
    parser.add_argument("--out", default="", help="zapis pełnego wyniku do pliku JSON")
    args = parser.parse_args(argv)
    # Pola, których oczekuje konstruktor Pipeline z content-refresher.
    args.improvements = ["gaps", "sources", "internal_links"]
    args.post_id = 0
    args.post_type = "posts"
    args.url = ""
    args.published_at = ""
    args.changed_at = ""
    return args


def main(argv=None) -> int:
    args = parse_args(argv)
    pipeline = WriterPipeline(args)
    try:
        return pipeline.run()
    except Exception as err:  # noqa: BLE001 – przebieg nie może zostać „running"
        traceback.print_exc()
        try:
            pipeline.client.finish("failed", cost=pipeline.budget.snapshot(), error=str(err))
        except Exception:  # noqa: BLE001
            pass
        return 1


if __name__ == "__main__":
    sys.exit(main())
