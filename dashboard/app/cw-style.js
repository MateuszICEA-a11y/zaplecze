/**
 * Content Watcher – etap „styl i fleksja" (przejazd redaktorski).
 *
 * Uruchamiany PO zakończeniu pipeline'u, na treści, którą redaktor ma już
 * przed sobą: gotowe propozycje + sekcje, których pipeline nie ruszył. Jedno
 * wywołanie modelu na CAŁY wpis – prompt wymaga spójności terminologii
 * („jeden termin dla jednego pojęcia w całym tekście"), a przejazd sekcja po
 * sekcji tę regułę wyłącza.
 *
 * Wynik NIE nadpisuje treści: ląduje w tabeli `job_style` jako propozycja
 * z diffem i decyzją ✓/✕ per sekcja (migracja 0009). Dopiero akceptacja pisze
 * do `job_sections.text_after`, skąd bierze ją podgląd, „kopiuj treść"
 * i zapis do WordPressa – bez zmian w cw-wp.js.
 *
 * Świadome duplikaty (komentarze krzyżowe):
 * - prompt: pipeline/news-generator-widocznosc/smoother_bridge.py
 *   (REVIEW_SYSTEM_PROMPT – wersja dla newsów, bez człowieka w pętli, więc
 *   z twardym zakazem ruszania liczb; tutaj liczby wolno poprawiać, bo każdą
 *   zmianę zatwierdza redaktor),
 * - straż zmian: `styleGuard` niżej vs diff_guard w widocznosc-blog-polish.
 */

import { contentDomains, mapAcfFaq, mapAcfSections, sanitizeSectionHtml } from './cw-api.js';
import { extractJson } from './cw-expert.js';
import { contentHash, postUrl, wpFetch } from './cw-wp.js';

export const STYLE_PROMPT_VERSION = '1.0.0';

/** Model przejazdu redaktorskiego. `:online` daje web search – bez niego
    weryfikacja faktów (punkt 2 promptu) jest ślepa na premiery z ostatnich
    tygodni, a w tej branży dane starzeją się właśnie w tygodnie.
    Nadpisanie: zmienna Workera CW_STYLE_MODEL. */
export const STYLE_MODEL = 'google/gemini-3.7-flash:online';

const TIMEOUT_MS = 120_000;
/** Limit wejścia. Świadomie ODRZUCAMY za długi wpis, zamiast przyciąć tekst:
    ucięcie po cichu zgubiłoby końcowe sekcje, a redaktor zobaczyłby „brak
    uwag" tam, gdzie model w ogóle nie dostał treści. */
export const STYLE_MAX_CHARS = 50_000;

const stripTags = (html) =>
  String(html ?? '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * Dokument wejściowy: stan, który redaktor widzi w „podglądzie całości".
 * Sekcje z propozycją (nieodrzuconą) idą w brzmieniu po optymalizacji, reszta
 * prosto z CMS-a – łącznie z blokiem FAQ (sloty 101+).
 *
 * Treść bierzemy z WordPressa w Workerze, nie z przeglądarki: to, co pojedzie
 * do modelu i wróci jako propozycja zapisu, nie może być tekstem podanym
 * z zewnątrz.
 */
export async function styleDocument(env, job, sections, fetchImpl = fetch) {
  const base = contentDomains(env).get(String(job.domain).toLowerCase());
  if (!base) return { error: 'Edytor nie obsługuje tej domeny.', status: 400 };

  const post = await wpFetch(
    env,
    `${postUrl(base, job.post_type, job.post_id)}?acf_format=standard&_fields=id,acf`,
    {},
    fetchImpl,
  );
  if (!post.ok) {
    return { error: `Nie udało się pobrać treści wpisu (HTTP ${post.status}).`, status: 502 };
  }
  const acf = post.data?.acf && typeof post.data.acf === 'object' ? post.data.acf : {};
  const live = new Map();
  for (const row of mapAcfSections(acf).sections) live.set(row.slot, row);
  for (const row of mapAcfFaq(acf).items) live.set(row.slot, row);

  const proposals = new Map((sections ?? []).map((row) => [row.slot, row]));
  const slots = [...new Set([...live.keys(), ...proposals.keys()])].sort((a, b) => a - b);

  const rows = [];
  for (const slot of slots) {
    const proposal = proposals.get(slot);
    const cms = live.get(slot);
    // Odrzucona propozycja nie istnieje – redaktor zostaje przy brzmieniu z CMS-a.
    const usePipeline = proposal
      && proposal.decision !== 'rejected'
      && (typeof proposal.text_after === 'string' || typeof proposal.title_after === 'string');
    const title = usePipeline ? (proposal.title_after ?? cms?.title ?? '') : (cms?.title ?? '');
    const text = usePipeline ? (proposal.text_after ?? cms?.text ?? '') : (cms?.text ?? '');
    if (!stripTags(text) && !title.trim()) continue;
    rows.push({
      slot,
      title,
      text,
      title_field: proposal?.title_field ?? cms?.title_field ?? '',
      text_field: proposal?.text_field ?? cms?.text_field ?? '',
      source: usePipeline ? 'job' : 'cms',
      // Sekcja bez propozycji pipeline'u nie ma jeszcze wiersza w job_sections –
      // akceptacja poprawki stylistycznej go zakłada.
      has_row: Boolean(proposal),
    });
  }
  return { rows };
}

export function buildStylePrompt({ title, rows }) {
  const body = rows
    .map((row) => `[sekcja ${row.slot}] ${row.title || '(bez nagłówka)'}\n${row.text}`)
    .join('\n\n');

  return `Wciel się w doświadczonego polskiego redaktora językowego i dziennikarza technologicznego specjalizującego się w SEO, AI search, GEO (Generative Engine Optimization) i dużych modelach językowych. Sprawdź poniższy tekst pod kątem poprawności polszczyzny, fleksji i faktów.

Zwróć szczególną uwagę na:

* kalki językowe i złe kolokacje – dosłowne tłumaczenia z angielskiego („dostarczać wartość", „adresować problem", „lewarować dane", „dedykowany artykuł", „rankować na frazę"); zamieniaj je na naturalne polskie frazy („dawać realną wartość", „odpowiadać na problem", „wykorzystywać dane", „osobny artykuł", „zajmować pozycję na frazę"); tęp też marketingową nowomowę („rewolucyjny", „game changer", „w dzisiejszym dynamicznym świecie"),
* żargon branżowy – poprawne polskie nazewnictwo pojęć (okno kontekstowe, dane treningowe, data odcięcia wiedzy, halucynacje, cytowania w odpowiedziach AI, wzmianki marki, dane strukturalne, generowanie wspomagane wyszukiwaniem); przyjęte anglicyzmy zostaw, jeśli brzmią naturalnie (prompt, crawler, snippet, embedding, fine-tuning, RAG); pilnuj konsekwencji – jeden termin dla jednego pojęcia w całym tekście, bez mieszania „AI Overviews" z „przeglądami AI" w co drugim akapicie,
* odmianę nazw własnych – modeli, narzędzi i firm (z Claude'em, w Perplexity, o Gemini, z ChatGPT – konsekwentnie: albo odmieniamy, albo nie, bez wariacji w obrębie tekstu) – oraz poprawne nazwy produktów i funkcji (AI Overviews, AI Mode, ChatGPT Search, Microsoft Copilot) i skrótowce z poprawną odmianą (LLM-y, LLM-ów, w SGE),
* zgrabność i logikę zdań – popraw opisy mechanizmów, które po zwizualizowaniu nie mają sensu technicznego (mylenie treningu modelu z retrievalem, indeksowania z cytowaniem, RAG z fine-tuningiem, „model przeszukał internet" tam, gdzie chodzi o dane treningowe).

Bądź bezlitosny dla stylu.

## Artykuł

Tytuł wpisu: ${title}

${body}

## Zadanie

Zwróć WYŁĄCZNIE JSON w tej strukturze:

{
  "sections": [
    { "slot": 3, "title": "poprawiony nagłówek", "text": "<p>poprawiona treść sekcji</p>", "issues": ["kalka: „dostarczać wartość" → „dawać realną wartość""] }
  ],
  "facts": [
    { "claim": "twierdzenie z tekstu", "status": "wątpliwe", "note": "co konkretnie budzi wątpliwość i jak jest naprawdę", "slot": 3 }
  ],
  "additions": [
    { "slot": 3, "fact": "fakt do dopisania, którego jesteś pewien", "certain": true }
  ]
}

Zasady odpowiedzi:
- W "sections" zwróć TYLKO sekcje, w których coś zmieniasz. Sekcję bez uwag pomiń całkowicie – jej brak znaczy „nie mam zastrzeżeń".
- Numer w "slot" przepisz dokładnie taki, jaki stoi w nagłówku „[sekcja N]".
- "text" to PEŁNA treść sekcji po poprawkach, nie sam fragment. Zachowaj znaczniki HTML 1:1 – te same tagi, w tej samej kolejności, z tymi samymi adresami w <a href>. Nie dodawaj i nie usuwaj akapitów, list ani linków.
- "title" podaj tylko wtedy, gdy poprawiasz nagłówek; inaczej pomiń pole.
- W "issues" wypisz konkretne poprawki tej sekcji (po jednej na wpis, z formą przed i po) – to lista dla redaktora, nie streszczenie.
- W "facts" wskaż twierdzenia wątpliwe: nazwy i wersje modeli, daty premier, funkcje produktów, statystyki, wyniki badań. W tej branży dane starzeją się w tygodnie, więc każdą liczbę i datę traktuj podejrzliwie. Pole "status" przyjmuje: "wątpliwe", "nieaktualne", "błędne", "potwierdzone".
- Fakty, których nie potrafisz potwierdzić, opisz w "facts" i oznacz w "note" wstawką [DO WERYFIKACJI]. Nie wpisuj do "text" twierdzeń, których nie jesteś pewien – niczego nie zmyślaj.
- "additions" to propozycje uzupełnień wyłącznie o fakty pewne. Nie wstawiaj ich samodzielnie do "text" – decyduje redaktor.
- Zachowaj polską interpunkcję i pełne znaki diakrytyczne. Półpauza (–), nigdy myślnik em (—).
- Cytaty w cudzysłowie zostaw dosłownie.
- Nie zmieniaj sensu zdań, które są poprawne merytorycznie.`;
}

/* ---------- straż zmian ----------
   Model wolno poprawia fakty (redaktor ma diff i decyzję ✓/✕), ale zmiana
   liczby albo zniknięcie linku nie może przejść niezauważona – to najdroższe
   pomyłki w tekście SEO. Straż nie blokuje propozycji, tylko wiesza na niej
   ostrzeżenie, po którym wzrok trafia w odpowiednie miejsce. */

const numbers = (html) => stripTags(html).match(/\d[\d %.,–-]*\d|\d/g)?.map((n) => n.trim()) ?? [];
const hrefs = (html) =>
  [...String(html ?? '').matchAll(/<a\s[^>]*href\s*=\s*["']([^"']+)["']/gi)].map((m) => m[1]);
const tagNames = (html) =>
  [...String(html ?? '').matchAll(/<([a-z0-9]+)(?:\s[^>]*)?>/gi)].map((m) => m[1].toLowerCase());

const sameMultiset = (a, b) => {
  if (a.length !== b.length) return false;
  const left = [...a].sort();
  const right = [...b].sort();
  return left.every((value, index) => value === right[index]);
};

/** Ostrzeżenia dla jednej sekcji. Puste = poprawka czysto redakcyjna. */
export function styleGuard(before, after) {
  const warnings = [];

  const numsBefore = numbers(before);
  const numsAfter = numbers(after);
  if (!sameMultiset(numsBefore, numsAfter)) {
    const gone = numsBefore.filter((n) => !numsAfter.includes(n));
    const added = numsAfter.filter((n) => !numsBefore.includes(n));
    warnings.push({
      kind: 'numbers',
      label: gone.length && added.length
        ? `zmieniona liczba: ${gone.slice(0, 3).join(', ')} → ${added.slice(0, 3).join(', ')}`
        : (gone.length ? `zniknęła liczba: ${gone.slice(0, 3).join(', ')}` : `doszła liczba: ${added.slice(0, 3).join(', ')}`),
    });
  }

  const linksBefore = hrefs(before);
  const linksAfter = hrefs(after);
  const lost = linksBefore.filter((href) => !linksAfter.includes(href));
  if (lost.length) {
    warnings.push({
      kind: 'links',
      label: lost.length === 1 ? 'zniknął 1 link' : `zniknęły ${lost.length} linki`,
    });
  }

  if (!sameMultiset(tagNames(before), tagNames(after))) {
    warnings.push({ kind: 'markup', label: 'zmieniona struktura HTML' });
  }

  const lengthBefore = stripTags(before).length;
  const lengthAfter = stripTags(after).length;
  if (lengthBefore > 200 && (lengthAfter < lengthBefore * 0.7 || lengthAfter > lengthBefore * 1.4)) {
    warnings.push({
      kind: 'length',
      label: `objętość ${lengthAfter < lengthBefore ? 'spadła' : 'wzrosła'} o ${Math.round(Math.abs(lengthAfter - lengthBefore) / lengthBefore * 100)}%`,
    });
  }
  return warnings;
}

/* ---------- wywołanie modelu ---------- */

/**
 * Jedno wywołanie OpenRoutera na cały wpis. Zwraca {ok, data:{sections,
 * facts, additions}, model, cost} albo {ok:false, error}.
 */
export async function runStylePass(env, job, rows, { fetchImpl = fetch, model = null } = {}) {
  const apiKey = (env.OPENROUTER_API_KEY || '').trim();
  if (!apiKey) return { ok: false, error: 'Brak sekretu OPENROUTER_API_KEY w Workerze.' };
  if (!rows?.length) return { ok: false, error: 'Wpis nie ma treści do redakcji.' };

  const prompt = buildStylePrompt({ title: job.title, rows });
  if (prompt.length > STYLE_MAX_CHARS) {
    return {
      ok: false,
      error: `Wpis jest za długi na jeden przejazd redaktorski (${prompt.length} znaków, limit ${STYLE_MAX_CHARS}).`,
    };
  }
  const chosen = model || (env.CW_STYLE_MODEL || '').trim() || STYLE_MODEL;

  let response;
  try {
    response = await fetchImpl('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://zaplecze-dashboard.m-wisniewski.workers.dev',
        'X-Title': 'Content Watcher - styl i fleksja',
      },
      body: JSON.stringify({
        model: chosen,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 16_000,
        // Warianty `:online` dokładają wynik wyszukiwania do kontekstu i przy
        // wymuszonym JSON-ie potrafią oddać pustkę – tam ufamy extractJson.
        ...(chosen.includes(':online') || chosen.startsWith('perplexity/')
          ? {}
          : { response_format: { type: 'json_object' } }),
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    return { ok: false, error: `Brak odpowiedzi od OpenRouter: ${err instanceof Error ? err.message : err}` };
  }
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    console.error('cw style openrouter', response.status, detail.slice(0, 300));
    return { ok: false, error: `Błąd usługi OpenRouter: ${response.status}.` };
  }
  const payload = await response.json().catch(() => null);
  const data = extractJson(payload?.choices?.[0]?.message?.content ?? '');
  if (!data || !Array.isArray(data.sections)) {
    return { ok: false, error: 'Model nie zwrócił poprawnej listy poprawek.' };
  }

  const bySlot = new Map(rows.map((row) => [row.slot, row]));
  const sections = [];
  for (const item of data.sections) {
    const slot = Number.parseInt(item?.slot, 10);
    const source = bySlot.get(slot);
    if (!source) continue; // slot spoza dokumentu – model zmyślił numer
    const text = sanitizeSectionHtml(String(item?.text ?? '').trim());
    if (!stripTags(text)) continue;
    const title = typeof item?.title === 'string' ? item.title.trim().slice(0, 300) : '';
    // Sekcja bez realnej zmiany nie jest propozycją – model bywa gadatliwy
    // i zwraca ją „dla porządku".
    if (text === source.text && (!title || title === source.title)) continue;
    sections.push({
      slot,
      title: title && title !== source.title ? title : null,
      text,
      text_before: source.text,
      title_before: source.title,
      issues: Array.isArray(item?.issues) ? item.issues.map((row) => String(row).slice(0, 400)).slice(0, 20) : [],
      warnings: styleGuard(source.text, text),
      source: source.source,
      has_row: source.has_row,
      title_field: source.title_field,
      text_field: source.text_field,
    });
  }

  const facts = (Array.isArray(data.facts) ? data.facts : []).slice(0, 40).map((row) => ({
    claim: String(row?.claim ?? '').slice(0, 500),
    status: ['wątpliwe', 'nieaktualne', 'błędne', 'potwierdzone'].includes(row?.status) ? row.status : 'wątpliwe',
    note: String(row?.note ?? '').slice(0, 800),
    slot: Number.isFinite(Number.parseInt(row?.slot, 10)) ? Number.parseInt(row.slot, 10) : null,
  })).filter((row) => row.claim);

  const additions = (Array.isArray(data.additions) ? data.additions : []).slice(0, 20).map((row) => ({
    slot: Number.isFinite(Number.parseInt(row?.slot, 10)) ? Number.parseInt(row.slot, 10) : null,
    fact: String(row?.fact ?? '').slice(0, 800),
    certain: row?.certain !== false,
  })).filter((row) => row.fact);

  return {
    ok: true,
    data: { sections, facts, additions },
    model: payload?.model ?? chosen,
    cost: {
      tokens_in: payload?.usage?.prompt_tokens ?? 0,
      tokens_out: payload?.usage?.completion_tokens ?? 0,
    },
  };
}

/* ---------- utrwalenie propozycji ---------- */

const nowIso = () => new Date().toISOString();

/** Nowy przejazd ZASTĘPUJE poprzednie propozycje stylu: liczymy je z aktualnej
    treści, więc stare wiersze opisywałyby stan, którego już nie ma. Poprawki
    wcześniej zatwierdzone zostają w `job_sections` – to one są teraz treścią. */
export async function saveStyleRows(env, jobId, sections) {
  await env.CW_DB.prepare('DELETE FROM job_style WHERE job_id = ?').bind(jobId).run();
  if (!sections.length) return;
  const stamp = nowIso();
  const statements = sections.map((row) =>
    env.CW_DB
      .prepare(
        `INSERT INTO job_style
           (job_id, slot, title_field, text_field, title_before, title_after,
            text_before, text_after, issues, warnings, decision, created_section, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 0, ?)`,
      )
      .bind(
        jobId,
        row.slot,
        row.title_field ?? '',
        row.text_field ?? '',
        row.title_before ?? '',
        row.title,
        row.text_before ?? '',
        row.text,
        JSON.stringify(row.issues ?? []),
        JSON.stringify(row.warnings ?? []),
        stamp,
      ));
  await env.CW_DB.batch(statements);
}
