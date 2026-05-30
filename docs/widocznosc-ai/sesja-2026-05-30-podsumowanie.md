# Sesja 2026-05-30 – podsumowanie

**Zakres:** budowa skilla `web-fact-checker` + fact-check całego bloga widocznosc.ai.
**Branch:** main (deploy z main → Cloudflare Pages). HEAD: `a1047ac`. ~38 commitów w sesji.

---

## 1. Punkt wyjścia

User zauważył, że wpis `/modele-llm/chatgpt/` (data 2026) opisuje przestarzałe modele (GPT-4o, o1, DALL-E). Diagnoza: treść pisana na starym researchu, podbita tylko data we frontmatter. Stąd cała sesja: najpierw ręczne poprawki, potem zbudowanie powtarzalnego narzędzia, a na końcu przejazd po całym blogu.

Kontekst rynkowy ustalony w sesji (stan maj 2026, zweryfikowany web):
- **Claude Opus 4.8** – flagowiec, wydany 28.05.2026; SWE-bench Verified 88,6%, Pro 69,2%; ceny API $5/$25 (bez zmian vs 4.7); okno 500K czat / 1M API+Code; cutoff: 4.4=sierpień 2025, 4.5/5.5... (Opus 4.8 nast.).
- **GPT-5.5** – flagowiec OpenAI (23.04.2026), $5/$30; GPT-5.5 Instant domyślny w ChatGPT od 05.05.2026; GPT-5.4 $2,50/$15, 5.4 Mini $0,75/$4,50; cutoff 5.4=sierpień 2025, 5.5=grudzień 2025.
- **Gemini 3.1 Pro** (flagowiec, SWE-bench ~80,6%, $2/$12 ≤200K), Gemini 3.5 Flash (19.05.2026, $1,50/$9).
- **AI Act**: termin dla systemów wysokiego ryzyka (Annex III) przesunięty **sierpień 2026 → 2 grudnia 2027** (Digital Omnibus, porozumienie 7.05.2026). Kary: 35M/7% = praktyki zakazane; wysokie ryzyko = 15M/3%.
- **Sora** zamknięta: web/app 26.04.2026 (ogłoszenie 24.03), API 24.09.2026. DALL-E → GPT Image (koniec 2025).

---

## 2. Zbudowany skill: `web-fact-checker`

Dwusilnikowy fact-checker treści o szybko starzejących się faktach AI.

- **Slash:** `/web-fact-check <ścieżka|katalog|glob>`
- **Silniki:** A = WebSearch (Claude), B = GPT-5.5 z `web_search` (OpenAI Responses API) → deterministyczny `reconcile()` → auto-apply tylko przy zgodzie A∧B.
- **Pliki:** `pipeline/web-fact-checker/SKILL.md`, `scripts/web_verify.py` (18 testów pytest), `.claude/commands/web-fact-check.md`. Spec + plan: `docs/superpowers/{specs,plans}/2026-05-29-web-fact-checker*`.
- **Klucz silnika B:** gitignored `pipeline/web-fact-checker/.env` (`export OPENAI_API_KEY=sk-...`); ładowany `set -a; . pipeline/web-fact-checker/.env; set +a`. Bez klucza → degradacja do single-engine.
- **Proces budowy:** superpowers brainstorming → spec → plan → subagent-driven (implementer + spec review + code review + fix) → acceptance → merge.

**Charakter w praktyce:** wysokoprecyzyjny FLAGGER, nie auto-korektor – restrykcyjny reconcile sprawia, że większość trafia do flag; poprawki nanosi się ręcznie po weryfikacji slam-dunków. Bramka A∧B kilkukrotnie zablokowała halucynacje silnika B (kredyty Copilota, okno GPT-5.5, ceny) – ochroniła oryginał.

**Gotcha:** silniki często mylą okno/limit modelu w czacie vs API; zawsze czytać KONTEKST zdania przed apply – etykieta „HIGH" od subagenta bywa myląca.

---

## 3. Fact-check całego bloga (46 wpisów)

Przepuszczone dwusilnikowo, falami subagentów (tryb raport+źródła), slam-dunki nanoszone ręcznie po triage:

| Sekcja | Wpisy | Status |
|--------|-------|--------|
| modele-llm | 11 | ✅ |
| geo | 16 | ✅ |
| ai-w-biznesie | 12 | ✅ |
| rag + agenci-ai + prompty | 7 | ✅ |

**Naniesione klasy poprawek (~28 commitów):** nazwy/ceny/okna modeli (GPT-4o→GPT-5.x, Opus 4.7→4.8, Sonnet/Gemini/Llama wersje); AI Act high-risk sierpień 2026→grudzień 2027 (wiele wpisów) + tier kar + status KRiBSI; boty AI (anthropic-ai/Claude-Web wycofane→Claude-User/SearchBot); Sora zamknięta; schema JSON-LD tylko Gemini; błędna atrybucja Google AGREE; importy langchain_text_splitters; BGE okno 8192; błędne CVE-2026-25253; statystyki (McKinsey 88%, ChatGPT 900M WAU, Indig 46%, GPQA 94,3%).

---

## 4. Stan otwarty (do decyzji usera)

Wszystkie pozostałe flagi edytorskie (niepoprawione automatycznie – decyzje redakcyjne, sprzeczne źródła, dane własne ICEA) zrzucone do:
**`portals/widocznosc.ai/podstrony-review/blog-flagi-edytorskie-2026-05-30.md`**

Priorytet 🔴 (nieuźródłowione/zmyślone atrybucje do weryfikacji): „konsorcjum Data World" (schema-org), „Stanford University 2025" (chunking), „Badanie Gemini 2024" (audyt), CSA 76% (etyka), ROI 12,8× (roi-z-geo), ARR Perplexity 500M.

Wzorce przekrojowe: (1) % z papieru Princeton GEO jako zakresy vs wartości; (2) dane ICEA bez atrybucji; (3) ceny narzędzi SEO/AEO (przepuszczać co kwartał); (4) atrybucje 🔴.

---

## 5. Niezależne TODO (z wcześniejszej części sesji)

- Regeneracja infografiki SWE-bench `infographic-modele-llm-claude-vs-chatgpt-programowanie.png` (pokazuje słupki Opus 4.7; alt-tekst celowo zsynchronizowany z obrazkiem).
