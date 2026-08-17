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
import matching  # noqa: E402
import research  # noqa: E402
import sections as sec  # noqa: E402
import wp  # noqa: E402
from budget import Budget, BudgetExceeded  # noqa: E402
from client import CallbackError, client_from_env  # noqa: E402
from config import (  # noqa: E402
    COMPETITOR_LIMIT,
    EDITORIAL_RULES,
    EXPERTS,
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


MAX_NEW_SECTIONS = 3
MAX_NEW_FAQ = 3
MAX_INTERNAL_LINKS = 5
# Domykanie pokrycia fraz: ile razy wolno odesłać tekst do poprawki. Jeden
# przebieg zwykle wystarcza; drugi łapie frazy, które model wplótł niegramatycznie
# albo przymiotnikiem („w branży fotowoltaicznej" zamiast „na fotowoltaikę").
COVERAGE_ROUNDS = 2

# Wygląd karty cytatu niesiony w atrybutach `style` – do CSS motywu WordPressa
# nie mamy dostępu. Świadomy duplikat: EXPERT_STYLE w dashboard/app/cw-expert.js
# i w edytorze (edytor.astro). Trzy ścieżki (pipeline, Worker, „kopiuj cytat")
# muszą dawać ten sam HTML.
EXPERT_STYLE = {
    "quote": "margin:28px 0;padding:24px 28px;background:#eef0ff;border:1px solid #dfe2fb;"
             "border-left:4px solid #5768ff;border-radius:12px;box-shadow:0 1px 2px #00062314",
    "row": "display:flex;gap:18px;align-items:flex-start",
    "avatar": "flex:0 0 56px;width:56px;height:56px;border-radius:50%;background:#5768ff;"
              "color:#ffffff;font-size:18px;font-weight:700;display:flex;align-items:center;"
              "justify-content:center",
    "body": "flex:1 1 auto;min-width:0",
    "label": "display:block;margin-bottom:10px;color:#5768ff;font-size:12px;"
             "font-weight:700;letter-spacing:.08em;text-transform:uppercase",
    "text": "margin:0 0 14px;color:#000623;font-size:17px;line-height:1.7;font-style:italic",
    # Motyw stylizuje `blockquote footer` ciemnym tłem – bez jawnego zerowania
    # podpis wychodzi czarnym paskiem, w którym ginie nazwisko.
    "footer": "margin:0;padding:0;border:0;background:transparent;color:#6e7181;"
              "font-size:14px;font-style:normal",
    "name": "color:#000623;font-weight:600",
}


def expert_blockquote(quote: str, expert: str, role: str) -> str:
    """Karta cytatu eksperta – awatar z inicjałów, cytat kursywą, podpis."""
    name = (expert or "").strip()
    initials = "".join(word[0].upper() for word in name.split()[:2])
    sign = ", ".join(part for part in [(role or "").strip(), "ICEA"] if part)
    face = (f'<div style="{EXPERT_STYLE["avatar"]}">{initials}</div>' if initials else "")
    return (
        f'<blockquote class="expert" style="{EXPERT_STYLE["quote"]}">'
        f'<div style="{EXPERT_STYLE["row"]}">{face}'
        f'<div style="{EXPERT_STYLE["body"]}">'
        f'<span style="{EXPERT_STYLE["label"]}">Zdaniem eksperta</span>'
        f'<p style="{EXPERT_STYLE["text"]}">{quote}</p>'
        f'<footer style="{EXPERT_STYLE["footer"]}">'
        + (f'<span style="{EXPERT_STYLE["name"]}">{name}</span>' if name else "")
        + (f" · {sign}" if name and sign else sign)
        + "</footer></div></div></blockquote>"
    )


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
        except BudgetExceeded:
            # Stan kroku raportuje `run()`: dla obowiązkowego to porażka, dla
            # dokładki – pominięcie, więc tutaj nie przesądzamy.
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

    def _ask(self, prompt_name: str, model: str, *, web_search=False, max_tokens=8000, **values):
        template, version = llm.load_prompt(prompt_name)
        prompt = llm.render(template, editorial_rules=EDITORIAL_RULES, **values)
        self.budget.check("tokens", estimate=len(prompt) // 3)
        result = llm.call_json(model, prompt, web_search=web_search, max_tokens=max_tokens)
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
            "free_faq_slots": sec.free_faq_slots(acf),
            "title": (post.get("title") or {}).get("rendered") or self.args.title,
            "url": post.get("link") or self.args.url,
        }
        return {"payload": {
            "title": self.context["title"],
            "mode": content["mode"],
            "words": len(content["text"].split()),
            "sections": sum(1 for item in self.context["snapshot"] if item.get("kind", "section") == "section"),
            "faq": sum(1 for item in self.context["snapshot"] if item.get("kind") == "faq"),
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
        pages = extract.extract_many(urls, jina_key=os.environ.get("JINA_API_KEY", "").strip())
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
            editor_gap=self._editor_gap() or "brak – analiza SERP nie była jeszcze uruchomiona w edytorze",
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
            for item in context["snapshot"] if item.get("kind", "section") == "section"
        ]
        # FAQ idzie osobną listą: to pary pytanie/odpowiedź spod artykułu,
        # renderowane jako schema.org/FAQPage. Wrzucone między sekcje model
        # traktował jak zwykłe H2 i próbował je rozbudowywać w akapity.
        faq_rows = [
            {"slot": item["slot"], "question": item["title"], "answer": item["text"]}
            for item in context["snapshot"] if item.get("kind") == "faq"
        ]
        tasks = self._structure_tasks()
        result, version = self._ask(
            "rewrite", self.model_writer,
            # Przepisany artykuł w JSON-ie nie mieści się w domyślnych 8k –
            # ucięta odpowiedź strącała rewrite na model zapasowy.
            max_tokens=24000,
            brief=context.get("brief") or {},
            structure_tasks=tasks or "brak – kieruj się wytycznymi z analizy",
            sections=payload_sections,
            faq=faq_rows or "brak – ten wpis nie ma bloku FAQ",
            free_slots=context["free_slots"][:MAX_NEW_SECTIONS],
            free_faq_slots=context.get("free_faq_slots", [])[:MAX_NEW_FAQ],
        )
        snapshot_slots = {item["slot"] for item in context["snapshot"]}
        allowed_faq = set(context.get("free_faq_slots", [])[:MAX_NEW_FAQ]) | {
            item["slot"] for item in context["snapshot"] if item.get("kind") == "faq"
        }
        proposals = {}
        for row in (result["data"].get("sections") or []):
            slot = int(row.get("slot") or 0)
            if not (row.get("text") or "").strip():
                continue
            if sec.is_faq(slot):
                # Nowe pytanie tylko w wolnej parze pól – slot spoza puli
                # nadpisałby cudzy wpis w CMS-ie.
                if slot not in allowed_faq:
                    continue
            elif not 1 <= slot <= 30:
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
        payload = {
            "changed_slots": sorted(slot for slot in proposals if not sec.is_faq(slot)),
            "changed_faq": sorted(slot for slot in proposals if sec.is_faq(slot)),
            "notes": [
                row.get("change") for row in (result["data"].get("sections") or []) if row.get("change")
            ],
            "headings_missed": self._missed_headings(tasks, context["snapshot"], proposals),
        }
        if result.get("fallback_from"):
            payload["fallback_from"] = result["fallback_from"]
        return {"payload": payload, "model": result["model"], "prompt_version": version,
                "cost": result["usage"]}

    # --- pokrycie fraz ---

    def _editor_gap(self):
        """Frazy z panelu „Frazy do pokrycia" w edytorze (SERP-gap z Workera).

        Idą z `client_payload.gap` → env GAP_JSON. To po nich edytor liczy ocenę
        pokrycia, więc pipeline musi celować dokładnie w nie – wcześniej model
        dostawał tylko własną listę z briefu i najłatwiejsze frazy („gdzie szukać
        klientów na fotowoltaikę") przechodziły przez cały przejazd nietknięte.
        """
        if self.fixtures is not None and "gap" in self.fixtures:
            data = self.fixtures.get("gap")
        else:
            raw = os.environ.get("GAP_JSON", "").strip()
            if not raw or raw == "null":
                return []
            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                return []
        rows = (data or {}).get("keywords") if isinstance(data, dict) else data
        return [row for row in (rows or []) if isinstance(row, dict) and (row.get("keyword") or "").strip()]

    def _coverage_targets(self) -> list[dict]:
        """Frazy, po których oceniamy propozycję: lista z edytora + wytyczne.

        Frazy odrzucone przez brief (`keywords_rejected`) zostają w wyniku, ale
        z powodem – „nie da się jej użyć" to informacja dla redaktora, a nie
        cichy brak.
        """
        brief = self.context.get("brief") or {}
        where = {}
        for row in brief.get("keywords_to_cover") or []:
            if isinstance(row, dict) and (row.get("keyword") or "").strip():
                where[normalize_phrase(row["keyword"])] = row
        rejected = {
            normalize_phrase(row.get("keyword") or ""): (row.get("why") or "").strip()
            for row in brief.get("keywords_rejected") or []
            if isinstance(row, dict) and (row.get("keyword") or "").strip()
        }
        out, seen = [], set()
        for row in [*self._editor_gap(), *(brief.get("keywords_to_cover") or [])]:
            keyword = (row.get("keyword") or "").strip()
            key = normalize_phrase(keyword)
            if not key or key in seen:
                continue
            seen.add(key)
            hint = where.get(key) or {}
            out.append({
                "keyword": keyword,
                "searches": row.get("searches") or row.get("volume"),
                "where": (hint.get("where") or "").strip(),
                "rejected": rejected.get(key) or "",
            })
        return out

    def _titles(self) -> dict[int, str]:
        """Nagłówki bloków po dotychczasowych krokach – dla sekcji H2, dla FAQ pytanie."""
        titles = {item["slot"]: item.get("title") or "" for item in self.context["snapshot"]}
        titles.update({
            slot: (row.get("title") or titles.get(slot) or "")
            for slot, row in (self.context.get("proposals") or {}).items()
        })
        return titles

    def _coverage_text(self) -> str:
        """Tekst propozycji tak, jak zobaczy go edytor: nagłówki i treść sekcji.

        Nagłówek liczy się tak samo jak akapit, więc musi wejść do porównania –
        inaczej fraza wpleciona w H2 wychodziłaby jako niepokryta.
        """
        titles = self._titles()
        parts = []
        for slot, text in self._section_texts().items():
            parts.append(titles.get(slot, ""))
            parts.append(extract.strip_html(text))
        return "\n".join(part for part in parts if part)

    def _free_faq_for_coverage(self) -> list[int]:
        """Wolne pary FAQ, w których krok coverage może zadać nowe pytanie.

        Budżet nowych pytań (`MAX_NEW_FAQ`) jest wspólny z krokiem rewrite –
        inaczej blok FAQ puchłby o listę fraz zamiast o pytania, które ktoś
        naprawdę zadaje.
        """
        taken = {item["slot"] for item in self.context["snapshot"]}
        proposals = self.context.get("proposals") or {}
        added = sum(1 for slot in proposals if sec.is_faq(slot) and slot not in taken)
        budget = MAX_NEW_FAQ - added
        if budget <= 0:
            return []
        free = [slot for slot in (self.context.get("free_faq_slots") or [])
                if slot not in taken and slot not in proposals]
        return free[:budget]

    def step_coverage(self):
        """Bramka jakości: propozycja nie wychodzi z pipeline'u z frazami, które
        dało się wpleść jednym zdaniem, a nie zostały wplecione.

        Bez tego przejazd potrafił podnieść ocenę treści o kilka punktów i uznać
        robotę za zrobioną, zostawiając najprostsze frazy z listy nietknięte.
        """
        targets = self._coverage_targets()
        pending = [row for row in targets if not row["rejected"]]
        if not pending:
            return {"payload": {"targets": len(targets), "note": "brak fraz do sprawdzenia"}}

        text = self._coverage_text()
        before = matching.coverage(text, [row["keyword"] for row in pending])
        rounds, skipped, cost = [], {row["keyword"]: row["rejected"] for row in targets if row["rejected"]}, None
        result = None

        for attempt in range(1, COVERAGE_ROUNDS + 1):
            missing = [row for row in pending
                       if row["keyword"] in before["missing"] and row["keyword"] not in skipped]
            if not missing:
                break
            titles = self._titles()
            free_faq = self._free_faq_for_coverage()
            result, version = self._ask(
                "coverage", self.model_writer, max_tokens=24000,
                missing=[{"keyword": row["keyword"], "searches": row["searches"], "where": row["where"]}
                         for row in missing],
                sections=[{"slot": slot, "kind": "faq" if sec.is_faq(slot) else "sekcja",
                           "title": titles.get(slot, ""), "text": text_html}
                          for slot, text_html in self._section_texts().items() if text_html],
                free_faq_slots=free_faq or "brak – wszystkie pary FAQ są zajęte",
            )
            cost = result["usage"]
            texts = self._section_texts()
            headings, new_faq = {}, {}
            for row in (result["data"].get("sections") or []):
                try:
                    slot = int(row.get("slot") or 0)
                except (TypeError, ValueError):
                    continue
                if slot in texts and (row.get("text") or "").strip():
                    texts[slot] = row["text"]
                    if (row.get("title") or "").strip():
                        headings[slot] = row["title"].strip()
                elif slot in free_faq and (row.get("text") or "").strip() and (row.get("title") or "").strip():
                    # Fraza, która nie mieści się w żadnym akapicie, dostaje własne
                    # pytanie FAQ zamiast wylądować w `skipped`. Slot musi być
                    # z puli wolnych par – cudzy wpis w CMS-ie nadpisany nie będzie.
                    new_faq[slot] = {"title": row["title"].strip(), "text": row["text"]}
                    free_faq = [free for free in free_faq if free != slot]
            self._store_section_texts(texts)
            if new_faq:
                self.context.setdefault("proposals", {}).update(new_faq)
            # Fraza wpleciona w nagłówek liczy się tak samo jak w akapicie, więc
            # nowy H2 musi trafić do propozycji – także gdy treść sekcji została
            # bez zmian i `_store_section_texts` jej nie zapisało.
            proposals = self.context.setdefault("proposals", {})
            for slot, heading in headings.items():
                if heading != titles.get(slot, ""):
                    proposals[slot] = {**proposals.get(slot, {}), "title": heading,
                                       "text": proposals.get(slot, {}).get("text") or texts.get(slot, "")}
            for row in (result["data"].get("skipped") or []):
                if isinstance(row, dict) and (row.get("keyword") or "").strip():
                    skipped[row["keyword"].strip()] = (row.get("why") or "bez podanego powodu").strip()
            after = matching.coverage(self._coverage_text(), [row["keyword"] for row in pending])
            rounds.append({
                "round": attempt,
                "asked": [row["keyword"] for row in missing],
                "gained": [word for word in after["covered"] if word in before["missing"]],
                "new_faq": sorted(new_faq),
                "prompt_version": version,
                "model": result["model"],
            })
            before = after

        payload = {
            "targets": [row["keyword"] for row in targets],
            "covered": before["covered"],
            "variants": before["variants"],
            "missing": [word for word in before["missing"] if word not in skipped],
            "skipped": [{"keyword": word, "why": why} for word, why in skipped.items()],
            "ratio": round(before["ratio"], 3),
            "rounds": rounds,
        }
        step = {"payload": payload}
        if result is not None:
            step.update({"model": result["model"], "cost": cost})
        return step

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

    def _section_texts(self, *, faq: bool = True) -> dict[int, str]:
        """Aktualna treść bloków (po dotychczasowych krokach).

        `faq=False` zostawia same sekcje treści – przypisy i linkowanie
        wewnętrzne nie mają czego szukać w odpowiedziach FAQ, które mają być
        krótkie i samodzielne (idą do schema.org/FAQPage).
        """
        slots = {item["slot"] for item in self.context["snapshot"]} | set(self.context.get("proposals") or {})
        return {slot: self._current_text(slot) for slot in sorted(slots)
                if faq or not sec.is_faq(slot)}

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
        titles = self._titles()
        slots = {item["slot"] for item in self.context["snapshot"]} | set(self.context.get("proposals") or {})
        for slot in sorted(slots):
            text = self._current_text(slot)
            if text:
                # FAQ oznaczamy pytaniem, nie numerem sekcji – model ma widzieć,
                # że to gotowa para pytanie/odpowiedź, a nie akapit do rozbudowy.
                label = f"[FAQ: {titles.get(slot, '')}]" if sec.is_faq(slot) else f"[sekcja {slot}]"
                parts.append(f"{label}\n{extract.strip_html(text)}")
        merged = "\n\n".join(parts)
        # Flaga do payloadów kroków pracujących na złączonej treści: przy uciętym
        # tekście końcowe sekcje nie dostaną przypisów ani linków.
        self.context["merged_truncated"] = len(merged) > MAX_PROMPT_CONTENT
        return merged[:MAX_PROMPT_CONTENT]

    def _expert_candidates(self) -> list[dict]:
        """Eksperci, którym wolno przypisać cytat w tym wpisie.

        Autor wpisu odpada – cytowanie samego siebie to reguła redakcyjna,
        nie preferencja. Porównanie po nazwisku i bez wielkości liter, bo
        autor z katalogu bywa zapisany z tytułem albo inaczej sformatowany.
        """
        author = (self.args.author or "").strip().lower()
        out = [row for row in EXPERTS if not author or row["name"].lower() not in author
               and author not in row["name"].lower()]
        # Autor spoza zespołu nie może wyczyścić całej listy – wtedy zostaje komplet.
        return out or list(EXPERTS)

    def step_expert(self):
        candidates = self._expert_candidates()
        result, version = self._ask(
            "expert", self.model_writer,
            title=self.context["title"],
            content=self._merged_content(),
            author=self.args.author or "nieznany",
            experts=[{"name": row["name"], "role": row["role"], "obszar": row["topics"]}
                     for row in candidates],
        )
        data = result["data"]
        quote = (data.get("quote") or "").strip()
        slot = int(data.get("slot") or 0)

        # Osobę i stanowisko bierzemy z NASZEJ listy, nie z odpowiedzi modelu:
        # cytat podpisany zmyślonym nazwiskiem albo autorem wpisu jest gorszy
        # niż brak cytatu. Model wybiera tylko, KTÓRY z kandydatów pasuje.
        picked = (data.get("expert") or "").strip().lower()
        chosen = next((row for row in candidates if row["name"].lower() in picked
                       or picked in row["name"].lower()), None)
        if chosen is None:
            chosen = candidates[0]
            data["expert_replaced"] = data.get("expert") or "(brak)"
        data["expert"], data["role"] = chosen["name"], chosen["role"]

        if quote and 1 <= slot <= 30:
            block = expert_blockquote(quote, data["expert"], data["role"])
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
        texts = self._section_texts(faq=False)
        # Wpis po wcześniejszym przejeździe ma już sekcję „Źródła" – nową listę
        # wstawiamy w jej slot (nadpisanie), inaczej każdy przejazd dokładałby
        # kolejną bibliografię na końcu artykułu.
        existing_sources = next(
            (item["slot"] for item in self.context["snapshot"]
             if item.get("kind", "section") == "section"
             and item["title"].strip().lower() in ("źródła", "zrodla", "bibliografia")),
            None,
        )
        sources_slot = existing_sources or self._take_free_slot()
        texts, definitions = apply.apply_definitions(
            texts, data.get("definitions") or [],
            banned_phrases=[self.context.get("main_keyword") or "",
                            self.context.get("own_keyword") or "",
                            self.context.get("title") or ""],
        )
        texts, citations = apply.apply_citations(texts, data.get("citations") or [], sources_slot)
        if citations.get("sources_slot"):
            self.context.setdefault("new_titles", {})[citations["sources_slot"]] = "Źródła"
        elif not existing_sources:
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
        texts, report = apply.apply_internal_links(self._section_texts(faq=False), result["data"].get("links") or [])
        self._store_section_texts(texts)
        self.context["internal_links"] = result["data"]
        return {"payload": {
            "applied": report["applied"],
            "skipped": report["skipped"],
            "content_truncated": bool(self.context.get("merged_truncated")),
        }, "model": result["model"], "prompt_version": version, "cost": result["usage"]}

    def step_diff(self):
        proposals, moves, inserted = sec.renumber(self.context["snapshot"], self.context.get("proposals") or {})
        rows = sec.build_sections(self.context["snapshot"], proposals, moves, inserted)
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
            ("coverage", self.step_coverage, "gaps"),
            ("expert", self.step_expert, "expert"),
            ("sources", self.step_sources, "sources"),
            ("internal_links", self.step_internal_links, "internal_links"),
            ("diff", self.step_diff, None),
        ]
        required = {"fetch", "serp", "brief", "diff"}
        # Wyczerpany budżet w kroku opcjonalnym nie może kasować całej roboty:
        # przepisane sekcje są już gotowe, więc pomijamy resztę dokładek
        # i kończymy przejazd normalnie, z powodem widocznym przy krokach.
        budget_stop = None
        try:
            for name, fn, improvement in order:
                if improvement and improvement not in self.improvements:
                    self.client.step_skipped(name, "poza wybranym pakietem ulepszeń")
                    continue
                if budget_stop and name not in required:
                    self.client.step_skipped(name, budget_stop)
                    continue
                print(f"[{name}]")
                try:
                    _, ok = self._run_step(name, fn)
                except BudgetExceeded as err:
                    if name in required:
                        raise
                    print(f"  [{name}] {err}", file=sys.stderr)
                    self.client.step_skipped(name, str(err))
                    budget_stop = str(err)
                    continue
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
