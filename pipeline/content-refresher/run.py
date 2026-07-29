"""Pipeline reoptymalizacji treści – wejście CLI.

Uruchomienie z GitHub Actions (repository_dispatch) albo lokalnie:

    python run.py --job <id> --domain grupa-icea.pl --post-id 41675 \
        --url https://www.grupa-icea.pl/blog/... --dry-run

Kroki raportują postęp do dashboardu podpisanymi callbackami. Pipeline NIGDY
nie zapisuje niczego do WordPressa – kończy się propozycją i diffem.
"""
import argparse
import json
import os
import re
import sys
import traceback
import urllib.parse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import apply  # noqa: E402
import extract  # noqa: E402
import llm  # noqa: E402
import research  # noqa: E402
import sections as sec  # noqa: E402
import wp  # noqa: E402
from budget import Budget, BudgetExceeded  # noqa: E402
from client import CallbackError, client_from_env  # noqa: E402
from config import (  # noqa: E402
    COMPETITOR_LIMIT,
    EDITORIAL_RULES,
    MODEL_RESEARCH,
    MODEL_WRITER,
    PIPELINE_VERSION,
)

MAX_PROMPT_CONTENT = 24000  # znaków treści artykułu w promptach

_SUFFIXES = ("ami", "ach", "om", "ów", "y", "i", "e", "a", "ę", "ą")


def normalize_phrase(phrase: str) -> str:
    """Zgrubna normalizacja frazy pod porównanie luk: bez odmiany i kolejności.

    „agencja seo" i „agencje seo" to ta sama luka – porównanie po dokładnym
    stringu zostawiało w briefie stosy wariantów fleksyjnych. Odcinamy typowe
    końcówki i sortujemy słowa; to heurystyka do WYKLUCZANIA kandydatów, więc
    sporadyczne sklejenie dwóch różnych fraz kosztuje mniej niż szum.
    """
    words = []
    for word in re.findall(r"\w+", (phrase or "").lower(), flags=re.UNICODE):
        for suffix in _SUFFIXES:
            if len(word) > 4 and word.endswith(suffix):
                word = word[: -len(suffix)]
                break
        words.append(word)
    return " ".join(sorted(words))


EXPERTS = [
    "Mateusz Wiśniewski – ekspert SEO i AI Search",
    "Magdalena Antoń – specjalistka ds. treści",
    "Karolina Goćkowska – specjalistka SEO",
    "Dorota Prokopiak – specjalistka ds. marketingu",
]
MAX_NEW_SECTIONS = 3
MAX_INTERNAL_LINKS = 5


class Pipeline:
    def __init__(self, args):
        self.args = args
        self.client = client_from_env(args.job, dry_run=args.dry_run)
        self.budget = Budget()
        self.improvements = set(args.improvements)
        # Modele wybrane w dashboardzie (OpenRouter) – puste = defaulty z config.
        self.model_research = args.model_research or MODEL_RESEARCH
        self.model_writer = args.model_writer or MODEL_WRITER
        self.state = {"job": args.job, "pipeline_version": PIPELINE_VERSION, "steps": {}}
        # Odtworzenie przejazdu z zapisanych danych researchu: pozwala testować
        # prompty i diff bez palenia jednostek Ahrefs (i bez klucza lokalnie).
        self.fixtures = json.loads(Path(args.research_file).read_text(encoding="utf-8")) \
            if args.research_file else None

    # --- pomocnicze ---

    def _run_step(self, name: str, fn):
        """Uruchamia krok z raportowaniem i kontrolą budżetu.

        Zwraca (wynik, ok). Błąd kroku opcjonalnego nie przerywa zadania –
        research bez jednego źródła jest gorszy, ale wciąż użyteczny.
        """
        self.client.step_start(name)
        try:
            result = fn()
        except BudgetExceeded as err:
            self.client.step_failed(name, str(err))
            raise
        except Exception as err:  # noqa: BLE001
            print(f"  [{name}] błąd: {err}", file=sys.stderr)
            self.client.step_failed(name, str(err))
            return None, False
        payload = result.get("payload") if isinstance(result, dict) else None
        self.client.step_done(
            name,
            payload=payload,
            cost=result.get("cost") if isinstance(result, dict) else None,
            model=result.get("model") if isinstance(result, dict) else None,
            prompt_version=result.get("prompt_version") if isinstance(result, dict) else None,
        )
        self.state["steps"][name] = payload
        return result, True

    def _ask(self, prompt_name: str, model: str, *, web_search=False, **values):
        template, version = llm.load_prompt(prompt_name)
        prompt = llm.render(template, editorial_rules=EDITORIAL_RULES, **values)
        self.budget.check("tokens", estimate=len(prompt) // 3)
        result = llm.call_json(model, prompt, web_search=web_search)
        self.budget.add_tokens(result["usage"]["tokens_in"], result["usage"]["tokens_out"])
        return result, version

    # --- kroki ---

    def step_fetch(self):
        config = wp.domain_config(self.args.domain)
        wp_cfg = config.get("wordpress") or {}
        base_url = wp_cfg.get("base_url") or f"https://{self.args.domain}"
        fields = (wp_cfg.get("content_fields") or {}).get(self.args.post_type) or []
        post = wp.fetch_post(base_url, self.args.post_type, self.args.post_id)
        acf = post.get("acf") if isinstance(post.get("acf"), dict) else {}
        content = wp.post_content(post, fields)
        self.context = {
            "config": config,
            "acf": acf,
            "post": post,
            "content": content,
            "snapshot": sec.snapshot(acf),
            "free_slots": sec.free_slots(acf),
            "title": (post.get("title") or {}).get("rendered") or self.args.title,
            "url": post.get("link") or self.args.url,
        }
        return {"payload": {
            "title": self.context["title"],
            "mode": content["mode"],
            "words": len(content["text"].split()),
            "sections": len(self.context["snapshot"]),
            "free_slots": self.context["free_slots"][:5],
            "hash": content["hash"],
        }}

    def step_keywords_own(self):
        url = self.context["url"]
        if self.fixtures is not None:
            self.context["keywords_own"] = self.fixtures.get("keywords_own") or []
            self.context["senuto"] = self.fixtures.get("senuto") or []
            self.context["gsc"] = self.fixtures.get("gsc") or []
            return {"payload": {"source": "fixtures", "keywords": self.context["keywords_own"][:20]}}
        keywords = research.own_keywords(url)
        self.budget.add_senuto()
        senuto = research.senuto_positions(self.args.domain, url)
        self.budget.add_senuto()
        gsc_site = ((self.context["config"].get("gsc") or {}).get("site")) or ""
        gsc = research.gsc_queries(gsc_site, url) if gsc_site else []
        self.context["keywords_own"] = keywords
        self.context["senuto"] = senuto
        self.context["gsc"] = gsc
        return {"payload": {"keywords": keywords[:20], "positions": senuto[:20], "gsc": gsc[:20]},
                "cost": {"senuto_requests": 2}}

    def step_serp(self):
        """SERP pytany dwa razy: tematem wpisu i naszą dzisiejszą frazą.

        Wpis potrafi rankować na frazy peryferyjne, a temat trzymać w SERP-ie
        ktoś inny. Pytanie wyłącznie naszą najlepszą frazą prowadziło research
        w bok – dlatego bazą jest tytuł, a fraza własna dokłada obraz tego,
        z kim konkurujemy dziś. Hosty obecne tylko w SERP-ie tytułu to rozjazd
        („rankujemy obok tematu") i trafiają do briefu.
        """
        topic = research.title_query(self.context["title"]) or self.context["title"]
        own = (
            (self.context.get("keywords_own") or [{}])[0].get("keyword")
            or (self.context.get("gsc") or [{}])[0].get("query")
            or ""
        )
        if self.fixtures is not None:
            self.context["main_keyword"] = self.fixtures.get("main_keyword") or topic
            self.context["competitors"] = self.fixtures.get("competitors") or []
            self.context["serp"] = self.fixtures.get("serp") or {}
            self.context["serp_drift"] = self.fixtures.get("serp_drift") or []
            if not self.context["competitors"]:
                raise RuntimeError("plik z danymi researchu nie zawiera konkurentów")
            return {"payload": {"source": "fixtures", "keyword": self.context["main_keyword"],
                                "competitors": self.context["competitors"]}}

        queries = [("title", topic)]
        # Drugie zapytanie tylko wtedy, gdy fraza własna faktycznie różni się od
        # tytułu – inaczej płacilibyśmy dwa razy za ten sam SERP.
        if own and own.strip().lower() != topic.strip().lower():
            queries.append(("own", own))

        results: dict[str, dict] = {}
        for kind, keyword in queries:
            self.budget.check("serp_requests", estimate=1)
            results[kind] = research.serp(keyword, self.args.domain, limit=COMPETITOR_LIMIT)
            self.budget.add_serp()

        competitors = []
        seen_hosts = set()
        for kind, _ in queries:
            for row in results[kind]["competitors"]:
                host = urllib.parse.urlparse(row["url"]).netloc.removeprefix("www.")
                if host in seen_hosts:
                    continue
                seen_hosts.add(host)
                competitors.append({**row, "from_query": kind})
        if not competitors:
            raise RuntimeError(f"brak wyników organicznych dla frazy „{topic}”")

        title_hosts = {urllib.parse.urlparse(row["url"]).netloc.removeprefix("www.")
                       for row in results["title"]["competitors"]}
        own_hosts = {urllib.parse.urlparse(row["url"]).netloc.removeprefix("www.")
                     for row in results.get("own", {}).get("competitors", [])}
        drift = sorted(title_hosts - own_hosts) if own_hosts else []

        base = results["title"]
        self.context["main_keyword"] = topic
        self.context["own_keyword"] = own or None
        self.context["competitors"] = competitors[:COMPETITOR_LIMIT]
        self.context["serp_drift"] = drift
        # AI Overview, PAA i frazy powiązane idą do briefu: pokazują, na jakie
        # pytania odpowiada dziś SERP, a nie tylko kto w nim stoi.
        self.context["serp"] = {
            "ai_overview": base["ai_overview"],
            "people_also_ask": base["people_also_ask"],
            "related_searches": base["related_searches"],
        }
        return {"payload": {
            "keyword": topic,
            "queries": [{"kind": kind, "keyword": keyword} for kind, keyword in queries],
            "competitors": self.context["competitors"],
            "drift": drift,
            "ai_overview": bool(base["ai_overview"]),
            "people_also_ask": base["people_also_ask"],
            "related_searches": base["related_searches"],
        }, "cost": {"serp_requests": len(queries)}}

    def step_competitors(self):
        urls = [row["url"] for row in self.context.get("competitors") or []]
        pages = extract.extract_many(urls)
        for page, row in zip(pages, self.context.get("competitors") or []):
            row["headings"] = page.get("headings") or []
            row["words"] = page.get("words")
            row["quality"] = page.get("quality")
        usable = [page for page in pages if page.get("quality") == "ok"]
        return {"payload": {
            "pages": [{k: v for k, v in page.items() if k != "text"} for page in pages],
            "usable": len(usable),
        }}

    def step_keywords_competitors(self):
        """Frazy konkurencji – jedno wywołanie Senuto na komplet adresów.

        Senuto zwraca wspólną pulę fraz dla podanych URL-i, bez rozbicia na
        poszczególne strony. Do wykrywania luk to właściwy poziom: pytamy, czego
        brakuje nam wobec całego zestawu konkurentów.
        """
        if self.fixtures is not None:
            self.context["keywords_competitors"] = self.fixtures.get("keywords_competitors") or []
            return {"payload": {"source": "fixtures",
                                "keywords": self.context["keywords_competitors"][:20]}}
        urls = [row["url"] for row in self.context.get("competitors") or []]
        result = research.competitor_keywords(urls)
        self.budget.add_senuto()
        own = {normalize_phrase(row.get("keyword")) for row in self.context.get("keywords_own") or []}
        own |= {normalize_phrase(row.get("query")) for row in self.context.get("gsc") or []}
        keywords = result["keywords"]
        self.context["keywords_competitors"] = keywords
        # Luka = fraza konkurencji, której nie mamy ani w Senuto, ani w GSC.
        # Porównanie po formie znormalizowanej – warianty fleksyjne to nie luki.
        self.context["keywords_gap"] = [
            row for row in keywords if normalize_phrase(row.get("keyword")) not in own
        ]
        return {"payload": {
            "urls": result["urls"],
            "keywords": keywords[:30],
            "gap": len(self.context["keywords_gap"]),
        }, "cost": {"senuto_requests": 1}}

    def _rivals_facts(self):
        """Fakty z analizy treści konkurencji (edytor, Jina Reader).

        Idą z Workera przez `client_payload.rivals` → env RIVALS_JSON – to już
        opłacony research na pełnych tekstach, szkoda go pomijać w briefie.
        `toJSON` w workflow daje literalne "null", gdy analizy nie było.
        """
        if self.fixtures is not None and "rivals" in self.fixtures:
            return self.fixtures.get("rivals")
        raw = os.environ.get("RIVALS_JSON", "").strip()
        if not raw or raw == "null":
            return None
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            return None
        return data if isinstance(data, dict) and (data.get("facts") or data.get("topics")) else None

    def step_brief(self):
        context = self.context
        outline = "\n".join(
            f"{item['slot']}. {item['title'] or '(bez nagłówka)'}" for item in context["snapshot"]
        )
        result, version = self._ask(
            "brief", self.model_research, web_search=True,
            title=context["title"], url=context["url"],
            published_at=self.args.published_at or "—",
            changed_at=self.args.changed_at or "—",
            outline=outline,
            content=context["content"]["text"][:MAX_PROMPT_CONTENT],
            own_keywords=context.get("keywords_own") or [],
            senuto=context.get("senuto") or [],
            gsc=context.get("gsc") or [],
            competitor_keywords=(context.get("keywords_gap") or context.get("keywords_competitors") or [])[:40],
            ai_overview=(context.get("serp") or {}).get("ai_overview") or "—",
            people_also_ask=(context.get("serp") or {}).get("people_also_ask") or [],
            related_searches=(context.get("serp") or {}).get("related_searches") or [],
            competitors=[{k: v for k, v in row.items() if k != "text"} for row in context.get("competitors") or []],
            serp_drift=context.get("serp_drift") or [],
            rivals=self._rivals_facts(),
            free_slots=context["free_slots"][:MAX_NEW_SECTIONS],
            max_new_sections=str(MAX_NEW_SECTIONS),
        )
        self.context["brief"] = result["data"]
        payload = result["data"]
        if len(context["content"]["text"]) > MAX_PROMPT_CONTENT:
            # Widoczne w edytorze: brief powstał na uciętym tekście, końcowe
            # sekcje długiego wpisu mogły nie wejść do analizy.
            payload = {**payload, "content_truncated": True}
        return {"payload": payload, "model": result["model"], "prompt_version": version,
                "cost": result["usage"]}

    def _structure_tasks(self) -> list[dict]:
        """Zalecenia `structure` z briefu jako jawna lista zadań dla rewrite.

        Brief podany jako jeden blob rozmywał sygnał – model dopisywał treść,
        a zalecane zmiany nagłówków przechodziły bez echa.
        """
        tasks = []
        for row in (self.context.get("brief") or {}).get("structure") or []:
            if not isinstance(row, dict):
                continue
            action = str(row.get("action") or "").strip().lower()
            try:
                slot = int(row.get("slot") or 0)
            except (TypeError, ValueError):
                continue
            if action not in ("rewrite", "add") or not 1 <= slot <= 30:
                continue
            tasks.append({
                "action": action,
                "slot": slot,
                "heading": str(row.get("heading") or "").strip(),
                "note": str(row.get("note") or "").strip(),
            })
        return tasks

    @staticmethod
    def _missed_headings(tasks: list[dict], snapshot: list[dict], proposals: dict[int, dict]) -> list[dict]:
        """Sloty, w których brief zalecał nowy nagłówek, a rewrite go nie zmienił.

        Trafiają do payloadu kroku, żeby w edytorze było widać pominięte
        zalecenia zamiast cichego pozostawienia generycznego H2.
        """
        before = {item["slot"]: (item.get("title") or "").strip() for item in snapshot}
        missed = []
        for task in tasks:
            heading, slot = task["heading"], task["slot"]
            old = before.get(slot, "")
            if not heading or heading.strip().lower() == old.lower():
                continue
            proposed = ((proposals.get(slot) or {}).get("title") or "").strip()
            if not proposed or proposed.lower() == old.lower():
                missed.append({"slot": slot, "recommended": heading, "current": old})
        return missed

    def step_rewrite(self):
        context = self.context
        payload_sections = [
            {"slot": item["slot"], "title": item["title"], "text": item["text"]}
            for item in context["snapshot"]
        ]
        tasks = self._structure_tasks()
        result, version = self._ask(
            "rewrite", self.model_writer,
            brief=context.get("brief") or {},
            structure_tasks=tasks or "brak – kieruj się wytycznymi z analizy",
            sections=payload_sections,
            free_slots=context["free_slots"][:MAX_NEW_SECTIONS],
        )
        snapshot_slots = {item["slot"] for item in context["snapshot"]}
        proposals = {}
        for row in (result["data"].get("sections") or []):
            slot = int(row.get("slot") or 0)
            if not (1 <= slot <= 30 and (row.get("text") or "").strip()):
                continue
            proposals[slot] = {"title": row.get("title"), "text": row.get("text")}
            if slot not in snapshot_slots:
                # Kotwica pozycji nowej sekcji – finalny numer nada renumeracja
                # w kroku diff, po wszystkich ulepszeniach.
                try:
                    after = int(row.get("after_slot") or 0)
                except (TypeError, ValueError):
                    after = 0
                if after in snapshot_slots:
                    proposals[slot]["after_slot"] = after
        self.context["proposals"] = proposals
        return {"payload": {
            "changed_slots": sorted(proposals),
            "notes": [
                row.get("change") for row in (result["data"].get("sections") or []) if row.get("change")
            ],
            "headings_missed": self._missed_headings(tasks, context["snapshot"], proposals),
        }, "model": result["model"], "prompt_version": version, "cost": result["usage"]}

    def _current_text(self, slot: int) -> str:
        """Treść sekcji po dotychczasowych krokach – kolejne ulepszenia pracują
        na już zoptymalizowanym tekście, nie na oryginale."""
        proposals = self.context.get("proposals") or {}
        if slot in proposals:
            return proposals[slot].get("text") or ""
        for item in self.context["snapshot"]:
            if item["slot"] == slot:
                return item["text"]
        return ""

    def _section_texts(self) -> dict[int, str]:
        """Aktualna treść wszystkich sekcji (po dotychczasowych krokach)."""
        slots = {item["slot"] for item in self.context["snapshot"]} | set(self.context.get("proposals") or {})
        return {slot: self._current_text(slot) for slot in sorted(slots)}

    def _store_section_texts(self, texts: dict[int, str]) -> None:
        """Zapisuje zmienione sekcje jako propozycje – tylko te, które faktycznie
        różnią się od dotychczasowej treści."""
        proposals = self.context.setdefault("proposals", {})
        titles = self.context.get("new_titles") or {}
        for slot, text in texts.items():
            if text and text != self._current_text(slot):
                # {**...} zachowuje np. `after_slot` nowej sekcji z kroku rewrite.
                proposals[slot] = {
                    **proposals.get(slot, {}),
                    "title": proposals.get(slot, {}).get("title") or titles.get(slot),
                    "text": text,
                }

    def _take_free_slot(self) -> int | None:
        """Rezerwuje pierwszy wolny slot ACF (np. na sekcję „Źródła")."""
        free = [slot for slot in self.context.get("free_slots") or []
                if slot not in (self.context.get("proposals") or {})]
        if not free:
            return None
        slot = free[0]
        self.context["free_slots"] = [item for item in self.context["free_slots"] if item != slot]
        return slot

    def _return_free_slot(self, slot: int | None) -> None:
        if slot and slot not in (self.context.get("free_slots") or []):
            self.context["free_slots"] = sorted([*self.context.get("free_slots", []), slot])

    def _merged_content(self) -> str:
        parts = []
        slots = {item["slot"] for item in self.context["snapshot"]} | set(self.context.get("proposals") or {})
        for slot in sorted(slots):
            text = self._current_text(slot)
            if text:
                parts.append(f"[sekcja {slot}]\n{extract.strip_html(text)}")
        merged = "\n\n".join(parts)
        # Flaga do payloadów kroków pracujących na złączonej treści: przy uciętym
        # tekście końcowe sekcje nie dostaną przypisów ani linków.
        self.context["merged_truncated"] = len(merged) > MAX_PROMPT_CONTENT
        return merged[:MAX_PROMPT_CONTENT]

    def step_expert(self):
        result, version = self._ask(
            "expert", self.model_writer,
            title=self.context["title"],
            content=self._merged_content(),
            author=self.args.author or "nieznany",
            experts=[name for name in EXPERTS if not self.args.author or not name.startswith(self.args.author)],
        )
        data = result["data"]
        quote = (data.get("quote") or "").strip()
        slot = int(data.get("slot") or 0)
        if quote and 1 <= slot <= 30:
            block = (
                f'<blockquote class="expert"><p>{quote}</p>'
                f'<footer>{data.get("expert", "")}{", " + data["role"] if data.get("role") else ""}</footer>'
                f"</blockquote>"
            )
            proposals = self.context.setdefault("proposals", {})
            base = self._current_text(slot)
            # Cytat po pierwszym akapicie sekcji, nie na doczepkę na końcu –
            # tam często stoi lista albo wniosek, do którego cytat nie pasuje.
            if "</p>" in base:
                text = base.replace("</p>", f"</p>\n{block}", 1)
            else:
                text = f"{base}\n{block}"
            proposals[slot] = {**proposals.get(slot, {}), "text": text}
        return {"payload": data, "model": result["model"], "prompt_version": version, "cost": result["usage"]}

    def step_sources(self):
        result, version = self._ask(
            "sources", self.model_research, web_search=True,
            title=self.context["title"],
            content=self._merged_content(),
        )
        data = result["data"]
        # Propozycje wstawiamy w treść – lista adresów obok artykułu nie ma
        # wartości, dopóki ktoś nie przepisze jej ręcznie do CMS-a.
        texts = self._section_texts()
        sources_slot = self._take_free_slot()
        texts, definitions = apply.apply_definitions(texts, data.get("definitions") or [])
        texts, citations = apply.apply_citations(texts, data.get("citations") or [], sources_slot)
        if citations.get("sources_slot"):
            self.context.setdefault("new_titles", {})[citations["sources_slot"]] = "Źródła"
        else:
            self._return_free_slot(sources_slot)
        self._store_section_texts(texts)
        self.context["citations"] = data
        return {"payload": {
            "citations_applied": len(citations["applied"]),
            "definitions_applied": len(definitions["applied"]),
            "skipped": citations["skipped"] + definitions["skipped"],
            "unsupported": data.get("unsupported") or [],
            "sources_slot": citations.get("sources_slot"),
            "content_truncated": bool(self.context.get("merged_truncated")),
        }, "model": result["model"], "prompt_version": version, "cost": result["usage"]}

    def step_internal_links(self):
        catalog = wp.catalog(self.args.domain, exclude_url=self.context["url"])
        listing = "\n".join(
            f"{i + 1} | {row['title']} | {row['url']} | {row.get('pillar', '')} | {row.get('words', 0)}"
            for i, row in enumerate(catalog[:200])
        )
        result, version = self._ask(
            "internal_links", self.model_writer,
            title=self.context["title"], url=self.context["url"],
            content=self._merged_content(),
            catalog=listing,
            max_links=str(MAX_INTERNAL_LINKS),
        )
        texts, report = apply.apply_internal_links(self._section_texts(), result["data"].get("links") or [])
        self._store_section_texts(texts)
        self.context["internal_links"] = result["data"]
        return {"payload": {
            "applied": report["applied"],
            "skipped": report["skipped"],
            "content_truncated": bool(self.context.get("merged_truncated")),
        }, "model": result["model"], "prompt_version": version, "cost": result["usage"]}

    def step_diff(self):
        proposals, moves = sec.renumber(self.context["snapshot"], self.context.get("proposals") or {})
        rows = sec.build_sections(self.context["snapshot"], proposals, moves)
        self.context["sections"] = rows
        return {"payload": {
            "changed": len(rows),
            "moves": {str(target): source for target, source in moves.items()},
            "stats": {row["slot"]: row["diff"]["stats"] for row in rows},
        }}

    # --- orkiestracja ---

    def run(self) -> int:
        order = [
            ("fetch", self.step_fetch, None),
            ("keywords_own", self.step_keywords_own, None),
            ("serp", self.step_serp, None),
            ("competitors", self.step_competitors, None),
            ("keywords_competitors", self.step_keywords_competitors, None),
            ("brief", self.step_brief, None),
            ("rewrite", self.step_rewrite, "gaps"),
            ("expert", self.step_expert, "expert"),
            ("sources", self.step_sources, "sources"),
            ("internal_links", self.step_internal_links, "internal_links"),
            ("diff", self.step_diff, None),
        ]
        required = {"fetch", "serp", "brief"}
        try:
            for name, fn, improvement in order:
                if improvement and improvement not in self.improvements:
                    self.client.step_skipped(name, "poza wybranym pakietem ulepszeń")
                    continue
                print(f"[{name}]")
                _, ok = self._run_step(name, fn)
                if not ok and name in required:
                    self.client.finish("failed", cost=self.budget.snapshot(),
                                       error=f"Krok „{name}” nie powiódł się – zadanie przerwane.")
                    return 1
        except BudgetExceeded as err:
            self.client.finish("budget_exceeded", sections=self.context.get("sections"),
                               cost=self.budget.snapshot(), error=str(err))
            return 2
        except CallbackError as err:
            # Dashboard odrzucił callback: zadanie anulowane albo przejęte.
            print(f"przerwane: {err}", file=sys.stderr)
            return 3

        self.client.finish(
            "done",
            sections=self.context.get("sections"),
            cost=self.budget.snapshot(),
            snapshot_hash=self.context["content"]["hash"],
        )
        if self.args.out:
            Path(self.args.out).write_text(
                json.dumps({
                    "job": self.args.job,
                    "pipeline_version": PIPELINE_VERSION,
                    "steps": self.state["steps"],
                    "sections": self.context.get("sections"),
                    "cost": self.budget.snapshot(),
                }, ensure_ascii=False, indent=1),
                encoding="utf-8",
            )
            print(f"wynik zapisany: {self.args.out}")
        return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Pipeline reoptymalizacji treści (Content Watcher)")
    parser.add_argument("--job", required=True)
    parser.add_argument("--domain", required=True)
    parser.add_argument("--post-id", type=int, required=True)
    parser.add_argument("--post-type", default="posts")
    parser.add_argument("--url", default="")
    parser.add_argument("--title", default="")
    parser.add_argument("--author", default="")
    parser.add_argument("--published-at", default="")
    parser.add_argument("--changed-at", default="")
    parser.add_argument("--improvements", default="gaps,expert,sources,internal_links")
    parser.add_argument("--model-research", default="",
                        help="model OpenRouter dla kroków z websearchem (puste = config)")
    parser.add_argument("--model-writer", default="",
                        help="model OpenRouter dla kroków piszących (puste = config)")
    parser.add_argument("--dry-run", action="store_true", help="bez callbacków do dashboardu")
    parser.add_argument("--research-file", default="",
                        help="JSON z gotowymi danymi researchu zamiast wywołań Ahrefs")
    parser.add_argument("--out", default="", help="zapis pełnego wyniku do pliku JSON")
    args = parser.parse_args()
    args.improvements = [item.strip() for item in args.improvements.split(",") if item.strip()]

    pipeline = Pipeline(args)
    try:
        return pipeline.run()
    except Exception as err:  # noqa: BLE001 – ostatnia siatka: zadanie nie może zostać „running"
        traceback.print_exc()
        try:
            pipeline.client.finish("failed", cost=pipeline.budget.snapshot(), error=str(err))
        except Exception:  # noqa: BLE001
            pass
        return 1


if __name__ == "__main__":
    sys.exit(main())
