/**
 * Content Watcher – API kolejki reoptymalizacji (Cloudflare D1).
 *
 * Podział odpowiedzialności:
 * - dashboard (Basic Auth) kolejkuje zadania, czyta stan i akceptuje sekcje,
 * - pipeline w GitHub Actions raportuje postęp przez `/api/cw/callback`.
 *
 * Callback NIE MOŻE iść przez Basic Auth: `worker.js` sprawdza hasło dla całego
 * ruchu na nagłówku `Authorization`, a runner nie ma jak podać jednocześnie
 * hasła dashboardu i własnego tokenu. Dlatego callback jest obsługiwany przed
 * bramką hasła i uwierzytelniony podpisem HMAC ciała żądania
 * (`X-CW-Timestamp` + `X-CW-Signature`, sekret `CW_CALLBACK_SECRET`).
 */

import { expertPhoto, generateExpertQuote, hasResearch, wpAuthors } from './cw-expert.js';
import { handleInfographic } from './cw-infographic.js';
import { handleRivals, rivalsSummary } from './cw-rivals.js';
import { gapSummary, handleSerpGap } from './cw-serp.js';
import { runStylePass, saveStyleRows, STYLE_PROMPT_VERSION, styleDocument } from './cw-style.js';
import { handleUsage } from './cw-usage.js';
import { ACF_FIELD, contentHash, handleWpApply, handleWpDraft, wpAuth } from './cw-wp.js';

export const COOLDOWN_DAYS = 30; // ten sam wpis nie wraca do kolejki częściej
export const MAX_ACTIVE_PER_DOMAIN = 3;
export const MAX_JOBS_PER_DAY = 20;
export const LEASE_MINUTES = 15; // brak heartbeatu przez ten czas = zadanie „stale”
export const SIGNATURE_WINDOW_S = 300;
export const MAX_CALLBACK_BYTES = 512 * 1024;

// „expert" wypadł z pakietu startowego – porada eksperta to finalny etap
// uruchamiany po `done` (POST /api/cw/jobs/:id/expert), nie decyzja z góry.
// Pipeline (run.py) nadal obsługuje `expert` w --improvements dla ręcznego
// workflow_dispatch.
export const IMPROVEMENTS = ['gaps', 'sources', 'internal_links'];

/** Modele domyślne pipeline'u (lustro config.py – MODEL_RESEARCH/MODEL_WRITER).
    Lista dostępnych modeli jest dynamiczna (frontend zaciąga ją z API
    OpenRoutera), więc walidujemy tylko FORMAT identyfikatora, nie whitelistę. */
export const DEFAULT_MODELS = { research: 'perplexity/sonar-pro', writer: 'anthropic/claude-sonnet-5' };
const MODEL_ID = /^[a-z0-9-]+\/[a-z0-9.:_-]{1,60}$/i;

const ACTIVE = ['queued', 'dispatching', 'running'];
const FINAL = ['done', 'failed', 'cancelled', 'budget_exceeded'];

/** Dozwolone przejścia stanów. Cokolwiek spoza tej mapy jest odrzucane –
    spóźniony callback nie może „ożywić" zamkniętego zadania. */
export const TRANSITIONS = {
  queued: ['dispatching', 'running', 'cancelled', 'failed'],
  dispatching: ['running', 'failed', 'cancelled', 'stale'],
  running: ['running', 'done', 'failed', 'cancelled', 'budget_exceeded', 'stale'],
  stale: ['queued', 'running', 'cancelled'],
  done: [],
  failed: ['queued'],
  cancelled: [],
  budget_exceeded: ['queued'],
};

export function canTransition(from, to) {
  return (TRANSITIONS[from] ?? []).includes(to);
}

export const isActive = (status) => ACTIVE.includes(status);
export const isFinal = (status) => FINAL.includes(status);

const json = (value, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

const nowIso = () => new Date().toISOString();
const plusMinutes = (minutes) => new Date(Date.now() + minutes * 60_000).toISOString();

/* ---------- podpis callbacku ---------- */

const toHex = (buffer) =>
  [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('');

export async function signPayload(secret, timestamp, body) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestamp}.${body}`));
  return toHex(signature);
}

/** Porównanie w stałym czasie – zwykłe `===` na sekrecie przecieka informację
    o tym, ile pierwszych znaków się zgadza. */
export function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Weryfikacja podpisu: zgodność HMAC + okno czasowe. Ochrona przed replayem
    (zużyte podpisy) jest osobno, bo wymaga bazy. */
export async function verifySignature({ secret, timestamp, signature, body, now = Date.now() }) {
  if (!secret) return { ok: false, reason: 'no_secret' };
  if (!timestamp || !signature) return { ok: false, reason: 'missing_headers' };
  const stamp = Number.parseInt(timestamp, 10);
  if (!Number.isFinite(stamp)) return { ok: false, reason: 'bad_timestamp' };
  if (Math.abs(Math.floor(now / 1000) - stamp) > SIGNATURE_WINDOW_S) return { ok: false, reason: 'expired' };
  const expected = await signPayload(secret, timestamp, body);
  return timingSafeEqual(expected, signature) ? { ok: true } : { ok: false, reason: 'mismatch' };
}

/* ---------- walidacja wejścia ---------- */

export function parseJobRequest(input) {
  const errors = [];
  const domain = typeof input?.domain === 'string' ? input.domain.trim() : '';
  if (!/^[a-z0-9.-]{1,253}$/i.test(domain)) errors.push('domain');

  const postId = Number.parseInt(input?.post_id, 10);
  if (!Number.isFinite(postId) || postId <= 0) errors.push('post_id');

  const postType = typeof input?.post_type === 'string' && input.post_type ? input.post_type : 'posts';
  if (!/^[a-z0-9_-]{1,40}$/i.test(postType)) errors.push('post_type');

  const url = typeof input?.url === 'string' ? input.url.trim() : '';
  if (!/^https:\/\/[^\s]+$/i.test(url)) errors.push('url');

  const title = typeof input?.title === 'string' ? input.title.trim().slice(0, 300) : '';
  if (!title) errors.push('title');

  const raw = Array.isArray(input?.improvements) ? input.improvements : IMPROVEMENTS;
  const improvements = IMPROVEMENTS.filter((key) => raw.includes(key));
  if (!improvements.length) errors.push('improvements');

  const author = typeof input?.author === 'string' ? input.author.trim().slice(0, 120) : '';

  // Modele opcjonalne – brak pola oznacza defaulty pipeline'u (config.py).
  let models = null;
  if (input?.models !== undefined && input?.models !== null) {
    const research = typeof input.models?.research === 'string' ? input.models.research.trim() : '';
    const writer = typeof input.models?.writer === 'string' ? input.models.writer.trim() : '';
    if ((research && !MODEL_ID.test(research)) || (writer && !MODEL_ID.test(writer))) {
      errors.push('models');
    } else if (research || writer) {
      models = {
        research: research || DEFAULT_MODELS.research,
        writer: writer || DEFAULT_MODELS.writer,
      };
    }
  }

  if (errors.length) return { ok: false, errors };
  return { ok: true, job: { domain, post_id: postId, post_type: postType, url, title, author, improvements, models } };
}

/** Callback z pipeline'u: postęp kroku albo zmiana stanu zadania. */
export function parseCallback(input) {
  const errors = [];
  const jobId = typeof input?.job_id === 'string' ? input.job_id : '';
  if (!/^[a-z0-9-]{8,64}$/i.test(jobId)) errors.push('job_id');
  const runId = typeof input?.run_id === 'string' || typeof input?.run_id === 'number' ? String(input.run_id) : '';
  if (!runId) errors.push('run_id');
  const runAttempt = Number.parseInt(input?.run_attempt ?? 1, 10);
  if (!Number.isFinite(runAttempt)) errors.push('run_attempt');

  const status = typeof input?.status === 'string' ? input.status : '';
  if (status && !Object.keys(TRANSITIONS).includes(status)) errors.push('status');

  const step = input?.step;
  if (step !== undefined && (typeof step?.name !== 'string' || !step.name)) errors.push('step');

  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    callback: {
      job_id: jobId,
      run_id: runId,
      run_attempt: runAttempt,
      status: status || null,
      step: step ?? null,
      sections: Array.isArray(input?.sections) ? input.sections : null,
      cost: input?.cost ?? null,
      error: typeof input?.error === 'string' ? input.error.slice(0, 2000) : null,
      pipeline_version: typeof input?.pipeline_version === 'string' ? input.pipeline_version : null,
      snapshot_hash: typeof input?.snapshot_hash === 'string' ? input.snapshot_hash : null,
    },
  };
}

/* ---------- sanityzacja HTML (edycja sekcji) ---------- */

export const MAX_SECTION_BYTES = 64 * 1024;

// Ta sama whitelista co sanitizeInto w edytor.astro (komentarz krzyżowy).
const SANITIZE_ALLOWED = new Set(['p', 'br', 'ul', 'ol', 'li', 'strong', 'b', 'em', 'i', 'a',
  'h2', 'h3', 'h4', 'blockquote', 'footer', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span',
  // `figure`/`figcaption` niosą infografikę wstawioną do sekcji (cw-infographic.js).
  'figure', 'figcaption',
  // `div` niesie układ karty eksperta (awatar obok treści) – akapit w środku
  // `span` byłby niepoprawnym HTML-em i przeglądarka rozbiłaby układ.
  // `img` to zdjęcie eksperta z konta WordPressa (adres i tak zawężamy do https).
  'div', 'img']);

// Cytat eksperta niesie wygląd w atrybucie `style` – do CSS motywu WordPressa
// nie mamy dostępu. Przepuszczamy tylko deklaracje bez funkcji CSS: brak
// nawiasów wyklucza `url(...)` i `expression(...)`, czyli jedyne miejsca,
// w których w stylu dałoby się przemycić zasób albo kod.
const STYLE_TAGS = new Set(['blockquote', 'p', 'footer', 'span', 'div', 'img', 'figure', 'figcaption']);
const STYLE_SAFE = /^[a-z0-9 .,:;%#\/-]+$/i;

const safeStyle = (tag, attrs) => {
  if (!STYLE_TAGS.has(tag)) return '';
  const match = /style\s*=\s*"([^"]*)"|style\s*=\s*'([^']*)'/i.exec(attrs ?? '');
  const value = match?.[1] ?? match?.[2] ?? '';
  return value && STYLE_SAFE.test(value) ? ` style="${value}"` : '';
};

/** Defense-in-depth dla ręcznych poprawek: frontend renderuje wyłącznie przez
    własną sanityzację DOM-ową, ale to, co ląduje w D1, też nie może przenosić
    skryptów. Worker nie ma DOMParsera, więc czyszczenie jest regexowe:
    tagi spoza whitelisty znikają (treść zostaje), atrybuty są zdejmowane
    poza https-owym href, class="expert" na blockquote i bezpiecznym `style`. */
export function sanitizeSectionHtml(html) {
  let out = String(html ?? '');
  out = out.replace(/<(script|style|iframe|object|embed|form)\b[\s\S]*?(<\/\1\s*>|$)/gi, '');
  out = out.replace(/<\/?([a-z0-9]+)((?:\s[^<>]*)?)\/?>/gi, (match, tag, attrs) => {
    tag = tag.toLowerCase();
    if (!SANITIZE_ALLOWED.has(tag)) return '';
    if (match.startsWith('</')) return `</${tag}>`;
    if (tag === 'a') {
      const href = /href\s*=\s*["']?(https?:\/\/[^"'\s>]+)/i.exec(attrs)?.[1];
      return href ? `<a href="${href}" target="_blank" rel="noopener nofollow">` : '<a>';
    }
    if (tag === 'img') {
      // Zdjęcie eksperta: tylko https, tylko `src`/`alt`/`style` – żadnych
      // atrybutów zdarzeń ani adresów `data:`.
      const src = /src\s*=\s*["']?(https:\/\/[^"'\s>]+)/i.exec(attrs)?.[1];
      if (!src) return '';
      const alt = /alt\s*=\s*"([^"<>]*)"/i.exec(attrs)?.[1] ?? '';
      return `<img src="${src}" alt="${alt}"${safeStyle(tag, attrs)} />`;
    }
    const style = safeStyle(tag, attrs);
    if (tag === 'blockquote' && /class\s*=\s*["']?[^"'>]*\bexpert\b/i.test(attrs)) {
      return `<blockquote class="expert"${style}>`;
    }
    return `<${tag}${style}>`;
  });
  return out;
}

/**
 * GET /api/cw/authors/:domain – autorzy portalu do wyboru w polu „ekspert".
 * Lista pochodzi z WordPressa (nie ze stałej w kodzie), więc nowa osoba
 * w redakcji pojawia się w edytorze bez wdrożenia. Cache 10 minut – skład
 * zespołu zmienia się rzadziej niż odświeżenia strony.
 */
export async function handleAuthors(request, env, domain, { fetchImpl = fetch } = {}) {
  const base = contentDomains(env).get(domain.toLowerCase());
  if (!base) return json({ error: 'Edytor nie obsługuje tej domeny.' }, 404);
  const cacheKey = new Request(`https://cw-authors.internal/${domain}`);
  const cache = typeof caches !== 'undefined' ? caches.default : null;
  const cached = await cache?.match(cacheKey);
  if (cached) return cached;
  let authors;
  try {
    authors = await wpAuthors(base, fetchImpl, wpAuth(env) ?? '');
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Nie udało się pobrać autorów.' }, 502);
  }
  const response = new Response(JSON.stringify({ authors }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'max-age=600' },
  });
  if (cache) await cache.put(cacheKey, response.clone());
  return response;
}

/* ---------- ochrona przed CSRF ---------- */

/** Basic Auth leci z przeglądarki automatycznie, więc mutacje trzeba osłonić.
    Własny nagłówek wymusza preflight CORS (formularz cross-site go nie wyśle),
    a `Origin` musi zgadzać się z hostem dashboardu, jeśli w ogóle przyszedł. */
export function checkMutationOrigin(request) {
  if (request.headers.get('X-CW-Request') !== '1') return false;
  const origin = request.headers.get('Origin');
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

/* ---------- warstwa D1 ---------- */

const db = (env) => env.CW_DB;

async function audit(env, action, jobId, detail) {
  await db(env)
    .prepare('INSERT INTO audit_log (at, actor, action, job_id, detail) VALUES (?, ?, ?, ?, ?)')
    .bind(nowIso(), 'dashboard', action, jobId ?? null, detail ? JSON.stringify(detail) : null)
    .run();
}

/** Wstawienie zadania jednym warunkowym INSERT-em – limity i cooldown są
    sprawdzane w tym samym zapytaniu, więc dwa równoległe kliknięcia nie
    przepchną dwóch zadań na ten sam wpis. */
async function insertJob(env, job, id, cooldownFrom, dayFrom) {
  const result = await db(env)
    .prepare(
      `INSERT INTO jobs (id, domain, post_id, post_type, url, title, author, status, improvements, models, created_at, updated_at, created_by)
       SELECT ?1, ?2, ?3, ?4, ?5, ?6, ?13, 'queued', ?7, ?14, ?8, ?8, 'dashboard'
       WHERE (SELECT COUNT(*) FROM jobs WHERE domain = ?2 AND status IN ('queued','dispatching','running')) < ?9
         AND (SELECT COUNT(*) FROM jobs WHERE created_at >= ?10) < ?11
         AND NOT EXISTS (
           SELECT 1 FROM jobs
           WHERE domain = ?2 AND post_id = ?3
             AND (status IN ('queued','dispatching','running')
                  OR (created_at >= ?12 AND status NOT IN ('failed','cancelled','stale')))
         )`,
    )
    .bind(
      id, job.domain, job.post_id, job.post_type, job.url, job.title,
      JSON.stringify(job.improvements), nowIso(),
      MAX_ACTIVE_PER_DOMAIN, dayFrom, MAX_JOBS_PER_DAY, cooldownFrom,
      job.author || null, job.models ? JSON.stringify(job.models) : null,
    )
    .run();
  return (result.meta?.changes ?? 0) > 0;
}

/** Po odrzuceniu INSERT-a ustalamy powód – wyłącznie dla komunikatu w UI. */
async function rejectionReason(env, job, cooldownFrom, dayFrom) {
  const existing = await db(env)
    .prepare(
      // Cooldown liczą wyłącznie zadania, które faktycznie coś zrobiły.
      // Zadanie, które nie wystartowało (błąd dispatchu) albo zostało
      // anulowane, nie może blokować wpisu na 30 dni.
      `SELECT id, status, created_at FROM jobs
       WHERE domain = ? AND post_id = ?
         AND (status IN ('queued','dispatching','running')
              OR (created_at >= ? AND status NOT IN ('failed','cancelled','stale')))
       ORDER BY created_at DESC LIMIT 1`,
    )
    .bind(job.domain, job.post_id, cooldownFrom)
    .first();
  if (existing) {
    return isActive(existing.status)
      ? { code: 'already_running', message: 'Ten wpis ma już zadanie w toku.', job_id: existing.id }
      : {
          code: 'cooldown',
          message: `Ten wpis był już optymalizowany ${existing.created_at.slice(0, 10)}. Kolejna analiza będzie możliwa za ${COOLDOWN_DAYS} dni.`,
          job_id: existing.id,
        };
  }
  const active = await db(env)
    .prepare("SELECT COUNT(*) AS n FROM jobs WHERE domain = ? AND status IN ('queued','dispatching','running')")
    .bind(job.domain)
    .first();
  if ((active?.n ?? 0) >= MAX_ACTIVE_PER_DOMAIN) {
    return { code: 'too_many_active', message: `Osiągnięto limit ${MAX_ACTIVE_PER_DOMAIN} jednoczesnych zadań dla tej domeny.` };
  }
  const today = await db(env).prepare('SELECT COUNT(*) AS n FROM jobs WHERE created_at >= ?').bind(dayFrom).first();
  if ((today?.n ?? 0) >= MAX_JOBS_PER_DAY) {
    return { code: 'daily_limit', message: `Dzienny limit ${MAX_JOBS_PER_DAY} zadań wyczerpany.` };
  }
  return { code: 'rejected', message: 'Nie udało się dodać zadania do kolejki.' };
}

/** repository_dispatch – uruchomienie workflow w GitHub Actions.
    Szczegóły błędu GitHuba zostają w logach Workera, do przeglądarki idzie
    komunikat ogólny. */
async function dispatchWorkflow(env, job) {
  const token = (env.GH_DISPATCH_TOKEN || '').trim();
  const repo = (env.GH_REPO || '').trim();
  if (!token || !repo) return { ok: false, reason: 'not_configured' };
  const response = await fetch(`https://api.github.com/repos/${repo}/dispatches`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'zaplecze-dashboard',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      event_type: 'content-refresh',
      client_payload: {
        job_id: job.id,
        domain: job.domain,
        post_id: job.post_id,
        post_type: job.post_type,
        url: job.url,
        // Workflow czyta też title/author (ekspert nie może cytować autora
        // wpisu) – wcześniej ich brakowało w payloadzie.
        title: job.title,
        author: job.author || '',
        improvements: job.improvements,
        models: job.models ?? null,
        // Wyniki researchu z edytora idą JEDNYM polem, bo `client_payload`
        // przyjmuje najwyżej 10 właściwości najwyższego poziomu – jedenasta
        // wywala dispatch błędem 422 i zadanie ginie przed startem runnera.
        research: {
          // Fakty z analizy treści konkurencji (Jina) – najmocniejszy, już
          // opłacony sygnał luk; brief dostaje je zamiast zgadywać z nagłówków.
          rivals: await rivalsSummary(env, job.domain, job.post_id).catch(() => null),
          // Frazy z panelu „Frazy do pokrycia" – ta sama lista, po której edytor
          // liczy ocenę treści. Bez niej pipeline pisze pod frazy z briefu,
          // a użytkownik ocenia wynik po frazach z SERP-gapu.
          gap: await gapSummary(env, job.domain, job.post_id).catch(() => null),
        },
      },
    }),
  });
  if (!response.ok) {
    console.error('repository_dispatch', response.status, await response.text());
    return { ok: false, reason: `http_${response.status}` };
  }
  return { ok: true };
}

/* ---------- treść wpisu (proxy WP REST) ---------- */

const ACF_SLOTS = 30; // lustro config.py (ACF_SLOTS) – szablon ma 30 par pól
// FAQ: osobna grupa pól ACF renderowana jako schema.org/FAQPage. Sloty z własnej
// przestrzeni (101+), żeby diff, decyzje i zapis szły tą samą ścieżką co sekcje.
// Lustro config.py (FAQ_SLOTS, FAQ_SLOT_BASE).
const FAQ_SLOTS = 18;
const FAQ_SLOT_BASE = 100;
/** Slot sekcji (1..30) albo pary FAQ (101..118) – lustro sections.py. */
export const isKnownSlot = (slot) =>
  Number.isFinite(slot)
  && ((slot >= 1 && slot <= ACF_SLOTS)
    || (slot > FAQ_SLOT_BASE && slot <= FAQ_SLOT_BASE + FAQ_SLOTS));

const MAX_WP_BYTES = 2 * 1024 * 1024; // jak FETCH_MAX_BYTES w pipeline
const CONTENT_CACHE_S = 60;

/** Domeny z włączonym edytorem: CSV w [vars] CW_DOMAINS, wpis `domena` albo
    `domena=https://www.domena` (kanoniczny host z www – jak w domains.yaml). */
export function contentDomains(env) {
  const out = new Map();
  for (const entry of String(env.CW_DOMAINS || '').split(',')) {
    const [domain, base] = entry.split('=').map((part) => part?.trim());
    if (domain) out.set(domain.toLowerCase(), base || `https://${domain}`);
  }
  return out;
}

/** Port `sections.snapshot()` + `free_slots()` z Pythona: sekcja to para pól
    `page_title_h2_N` / `page_text_N`, istnieje gdy cokolwiek w niej stoi. */
export function mapAcfSections(acf) {
  const sections = [];
  const free = [];
  for (let slot = 1; slot <= ACF_SLOTS; slot++) {
    const title = String(acf?.[`page_title_h2_${slot}`] ?? '').trim();
    const text = String(acf?.[`page_text_${slot}`] ?? '').trim();
    if (title || text) {
      sections.push({ slot, title_field: `page_title_h2_${slot}`, text_field: `page_text_${slot}`, title, text });
    } else {
      free.push(slot);
    }
  }
  return { sections, free_slots: free };
}

/** Pary pytanie–odpowiedź z bloku FAQ jako pseudo-sekcje ze slotami 101+. */
export function mapAcfFaq(acf) {
  const items = [];
  const free = [];
  for (let n = 1; n <= FAQ_SLOTS; n++) {
    const slot = FAQ_SLOT_BASE + n;
    const question = String(acf?.[`page_faq_question_${n}`] ?? '').trim();
    const answer = String(acf?.[`page_faq_answer_${n}`] ?? '').trim();
    if (question || answer) {
      items.push({
        slot,
        title_field: `page_faq_question_${n}`,
        text_field: `page_faq_answer_${n}`,
        title: question,
        text: answer,
      });
    } else {
      free.push(slot);
    }
  }
  return {
    items,
    free_slots: free,
    title: String(acf?.page_faq_title ?? '').trim(),
    // „tak" = blok wystawia mikrodane FAQPage; bez tego pytania są zwykłą treścią.
    schema: String(acf?.page_faq_schema ?? '').trim().toLowerCase() === 'tak',
  };
}

export async function fetchPostContent(request, env, domain, postType, postId, fetchImpl = fetch) {
  const base = contentDomains(env).get(domain.toLowerCase());
  if (!base) return json({ error: 'Edytor nie obsługuje tej domeny.' }, 404);
  if (!/^[a-z0-9_-]{1,40}$/i.test(postType) || !Number.isFinite(postId) || postId <= 0) {
    return json({ error: 'Nieprawidłowy adres wpisu.' }, 400);
  }

  // Cache 60 s: odświeżenie strony edytora nie młóci WordPressa.
  const cacheKey = new Request(`https://cw-content.internal/${domain}/${postType}/${postId}`);
  const cache = typeof caches !== 'undefined' ? caches.default : null;
  const cached = await cache?.match(cacheKey);
  if (cached) return cached;

  // Końcowy ukośnik po ID jest obowiązkowy (WP robi 301) – jak w wp.py.
  // `content` to na blogu ICEA sam wstęp przed pierwszym H2 (reszta siedzi
  // w ACF) – bez niego dokument w edytorze zaczynałby się od nagłówka.
  const wpUrl = `${base.replace(/\/$/, '')}/wp-json/wp/v2/${postType}/${postId}/?acf_format=standard&_fields=id,link,title,content,acf`;
  let upstream;
  try {
    upstream = await fetchImpl(wpUrl, {
      redirect: 'follow',
      headers: {
        Accept: 'application/json',
        // WAF na seohost tnie anonimowe UA – przedstawiamy się jak pipeline.
        'User-Agent': 'content-refresher',
      },
      signal: AbortSignal.timeout(15_000),
    });
  } catch (err) {
    console.error('cw content fetch', domain, postId, err);
    return json({ error: 'Nie udało się pobrać treści.' }, 502);
  }
  if (!upstream.ok) {
    return json({ error: `Serwer WordPress zwrócił błąd ${upstream.status}.` }, upstream.status === 404 ? 404 : 502);
  }
  const raw = await upstream.text();
  if (raw.length > MAX_WP_BYTES) return json({ error: 'Treść wpisu jest za duża.' }, 502);
  let post;
  try {
    post = JSON.parse(raw);
  } catch {
    return json({ error: 'Serwer WordPress zwrócił nieprawidłową odpowiedź.' }, 502);
  }

  const acf = post?.acf && typeof post.acf === 'object' ? post.acf : {};
  const { sections, free_slots: freeSlots } = mapAcfSections(acf);
  const faq = mapAcfFaq(acf);
  // Wpisy bez sekcji ACF trzymają całość w `content` albo w
  // `page_content_no_section` – edytor i tak ma pokazać pełną treść.
  const lead = String(post?.content?.rendered ?? '').trim();
  const noSection = String(acf?.page_content_no_section ?? '').trim();
  const response = json({
    post_id: post?.id ?? postId,
    title: post?.title?.rendered ?? '',
    url: post?.link ?? '',
    lead,
    no_section: sections.length ? '' : noSection,
    sections,
    free_slots: freeSlots,
    faq,
  });
  response.headers.set('Cache-Control', `private, max-age=${CONTENT_CACHE_S}`);
  if (cache) {
    // caches.default ignoruje `private` – sterujemy TTL jawnie przez s-maxage.
    const copy = new Response(response.clone().body, response);
    copy.headers.set('Cache-Control', `s-maxage=${CONTENT_CACHE_S}`);
    await cache.put(cacheKey, copy);
  }
  return response;
}

/* ---------- handlery ---------- */

async function createJob(request, env) {
  if (!checkMutationOrigin(request)) return json({ error: 'Żądanie odrzucone.' }, 403);
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Przekazano nieprawidłowe dane (błąd formatu lub zbyt duży rozmiar).' }, 400);
  }
  const parsed = parseJobRequest(body);
  if (!parsed.ok) return json({ error: 'Nieprawidłowe dane zadania.', fields: parsed.errors }, 400);

  const id = crypto.randomUUID();
  // `force=1` (świadome ponowienie z edytora) omija wyłącznie cooldown –
  // limit dzienny i limit równoległych zadań zostają nietknięte, bo to one
  // pilnują budżetu. Data w przyszłości = puste okno cooldownu.
  const force = new URL(request.url).searchParams.get('force') === '1';
  const cooldownFrom = force
    ? new Date(Date.now() + 86_400_000).toISOString()
    : new Date(Date.now() - COOLDOWN_DAYS * 86_400_000).toISOString();
  const dayFrom = new Date(Date.now() - 86_400_000).toISOString();

  if (!(await insertJob(env, parsed.job, id, cooldownFrom, dayFrom))) {
    const reason = await rejectionReason(env, parsed.job, cooldownFrom, dayFrom);
    return json({ error: reason.message, code: reason.code, job_id: reason.job_id ?? null }, 409);
  }
  await audit(env, 'job.create', id, {
    post_id: parsed.job.post_id, improvements: parsed.job.improvements, ...(force ? { force: true } : {}),
  });

  const dispatch = await dispatchWorkflow(env, { id, ...parsed.job });
  if (!dispatch.ok) {
    // Zadanie zostaje w bazie ze stanem `failed` – widać, że dispatch nie
    // wyszedł, i można je ponowić, zamiast czekać na runner, który nie ruszył.
    await db(env)
      .prepare("UPDATE jobs SET status = 'failed', error = ?, updated_at = ?, finished_at = ? WHERE id = ?")
      .bind(
        dispatch.reason === 'not_configured'
          ? 'Brak konfiguracji GH_DISPATCH_TOKEN / GH_REPO w Workerze.'
          : 'Nie udało się uruchomić procesu optymalizacji.',
        nowIso(), nowIso(), id,
      )
      .run();
    return json({ error: 'Nie udało się uruchomić procesu optymalizacji.', job_id: id }, 502);
  }
  await db(env)
    .prepare("UPDATE jobs SET status = 'dispatching', updated_at = ?, lease_expires_at = ? WHERE id = ?")
    .bind(nowIso(), plusMinutes(LEASE_MINUTES), id)
    .run();

  return json({ job: await readJob(env, id) }, 201);
}

async function readJob(env, id) {
  const job = await db(env).prepare('SELECT * FROM jobs WHERE id = ?').bind(id).first();
  if (!job) return null;
  const steps = await db(env)
    .prepare('SELECT step, status, started_at, finished_at, payload, cost, model, prompt_version, error FROM job_steps WHERE job_id = ? ORDER BY started_at')
    .bind(id)
    .all();
  const sections = await db(env)
    .prepare('SELECT slot, title_field, text_field, operation, moved_from, title_before, title_after, text_before, text_after, text_hash_before, diff, accepted, decision, edited FROM job_sections WHERE job_id = ? ORDER BY slot')
    .bind(id)
    .all();
  // Infografiki per sekcja: stan zlecenia u kie.ai i adres w bibliotece mediów.
  const images = await db(env)
    .prepare('SELECT slot, status, brief, alt, caption, image_url, media_id, media_url, credits, error, updated_at FROM job_images WHERE job_id = ? ORDER BY slot')
    .bind(id)
    .all();
  // Propozycje przejazdu redaktorskiego – druga warstwa nad sekcjami. Diff
  // liczy przeglądarka (ma oba brzmienia), Worker oddaje same teksty i uwagi.
  const styleRows = await db(env)
    .prepare('SELECT slot, title_before, title_after, text_before, text_after, issues, warnings, decision, applied_at FROM job_style WHERE job_id = ? ORDER BY slot')
    .bind(id)
    .all();
  const parse = (value, fallback) => {
    try {
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  };
  return {
    ...job,
    // Link do przebiegu w GitHub Actions – przy błędzie to jedyne miejsce
    // z pełnym logiem, a przeglądarka nie zna nazwy repozytorium.
    run_url: job.run_id && env.GH_REPO ? `https://github.com/${env.GH_REPO}/actions/runs/${job.run_id}` : null,
    improvements: parse(job.improvements, []),
    models: parse(job.models, null),
    expert: parse(job.expert, null),
    style: parse(job.style, null),
    images: images.results ?? [],
    style_sections: (styleRows.results ?? []).map((row) => ({
      ...row,
      issues: parse(row.issues, []),
      warnings: parse(row.warnings, []),
      decision: row.decision ?? null,
    })),
    cost: parse(job.cost, {}),
    steps: (steps.results ?? []).map((step) => ({ ...step, payload: parse(step.payload, null), cost: parse(step.cost, null) })),
    sections: (sections.results ?? []).map((section) => ({
      ...section,
      diff: parse(section.diff, null),
      accepted: section.accepted === 1,
      // NULL = redaktor jeszcze nie zdecydował; 'accepted' | 'rejected' po decyzji.
      decision: section.decision ?? null,
      edited: section.edited === 1,
    })),
  };
}

async function listJobs(env, url) {
  const domain = url.searchParams.get('domain');
  const limit = Math.min(100, Math.max(1, Number.parseInt(url.searchParams.get('limit') ?? '50', 10) || 50));
  const query = domain
    ? db(env)
        .prepare('SELECT id, domain, post_id, url, title, status, created_at, updated_at, finished_at FROM jobs WHERE domain = ? ORDER BY created_at DESC LIMIT ?')
        .bind(domain, limit)
    : db(env)
        .prepare('SELECT id, domain, post_id, url, title, status, created_at, updated_at, finished_at FROM jobs ORDER BY created_at DESC LIMIT ?')
        .bind(limit);
  const rows = await query.all();
  return json({ jobs: rows.results ?? [] });
}

/** PATCH sekcji: flaga akceptacji i/lub ręczna poprawka treści „po". */
async function patchSection(request, env, id, slot) {
  if (!checkMutationOrigin(request)) return json({ error: 'Żądanie odrzucone.' }, 403);
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Przekazano nieprawidłowe dane (błąd formatu lub zbyt duży rozmiar).' }, 400);
  }

  if (typeof body?.text_after === 'string') {
    if (body.text_after.length > MAX_SECTION_BYTES) {
      return json({ error: 'Poprawiona treść jest za duża.' }, 413);
    }
    const clean = sanitizeSectionHtml(body.text_after);
    const result = await db(env)
      .prepare('UPDATE job_sections SET text_after = ?, edited = 1 WHERE job_id = ? AND slot = ?')
      .bind(clean, id, slot)
      .run();
    if ((result.meta?.changes ?? 0) === 0) return json({ error: 'Nie ma takiej sekcji.' }, 404);
    await audit(env, 'section.edit', id, { slot, bytes: clean.length });
    if (body?.accepted === undefined && body?.decision === undefined) {
      return json({ ok: true, text_after: clean });
    }
  }

  // Decyzja redaktora ma trzy stany: brak (null), „do wdrożenia" i „odrzucone".
  // `accepted` zostaje flagą wdrożeniową, więc jedzie w parze z `decision`.
  if (body?.decision !== undefined || body?.accepted !== undefined) {
    const decision = body?.decision !== undefined
      ? body.decision
      : (body.accepted === true ? 'accepted' : null);
    if (decision !== null && decision !== 'accepted' && decision !== 'rejected') {
      return json({ error: 'Pole „decision" przyjmuje: accepted, rejected albo null.' }, 400);
    }
    const accepted = decision === 'accepted';
    const result = await db(env)
      .prepare('UPDATE job_sections SET decision = ?, accepted = ?, accepted_at = ? WHERE job_id = ? AND slot = ?')
      .bind(decision, accepted ? 1 : 0, accepted ? nowIso() : null, id, slot)
      .run();
    if ((result.meta?.changes ?? 0) === 0) return json({ error: 'Nie ma takiej sekcji.' }, 404);
    await audit(env, 'section.accept', id, { slot, decision });
    return json({ ok: true, decision });
  }

  return typeof body?.text_after === 'string'
    ? json({ ok: true })
    : json({ error: 'Oczekiwane pola: decision, accepted i/lub text_after.' }, 400);
}

/* ---------- porada eksperta (etap finalny, Worker → OpenRouter) ---------- */

/** Generowanie/regeneracja cytatu. Działa wyłącznie na zadaniu `done` –
    celowo poza limitami kolejki (cooldown 30 dni go nie dotyczy). */
async function generateExpert(request, env, id, { fetchImpl } = {}) {
  if (!checkMutationOrigin(request)) return json({ error: 'Żądanie odrzucone.' }, 403);
  const job = await db(env).prepare('SELECT * FROM jobs WHERE id = ?').bind(id).first();
  if (!job) return json({ error: 'Nie ma takiego zadania.' }, 404);
  if (job.status !== 'done') {
    return json({ error: 'Wypowiedź ekspercka będzie dostępna po zakończeniu analizy.' }, 409);
  }

  // Wskazana osoba musi stać w liście autorów portalu – nazwisko z żądania
  // ląduje w treści wpisu, więc nie może być dowolnym tekstem z przeglądarki.
  let person = null;
  const body = await request.json().catch(() => null);
  const wanted = typeof body?.expert === 'string' ? body.expert.trim() : '';
  if (wanted) {
    const base = contentDomains(env).get(String(job.domain).toLowerCase());
    if (!base) return json({ error: 'Edytor nie obsługuje tej domeny.' }, 400);
    let authors;
    try {
      authors = await wpAuthors(base, fetchImpl ?? fetch, wpAuth(env) ?? '');
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : 'Nie udało się pobrać autorów.' }, 502);
    }
    const match = authors.find((row) => row.name === wanted);
    if (!match) return json({ error: 'Ta osoba nie jest autorem w tym portalu.' }, 400);
    if (job.author && match.name === job.author) {
      return json({ error: 'To autor tego wpisu – cytat musi podpisać ktoś inny.', code: 'self_cite' }, 400);
    }
    const role = typeof body?.role === 'string' ? body.role.trim().slice(0, 120) : '';
    person = {
      name: match.name,
      role: role || match.role || '',
      // Zdjęcie sprawdzamy przy każdym cytacie: dziś żadne konto go nie ma,
      // ale wgrany później avatar wjedzie do kartki bez zmiany w kodzie.
      photo: await expertPhoto(match.avatar, fetchImpl ?? fetch),
    };
  }

  // Materiał, na którym stoi komentarz: research, który edytor już opłacił.
  // Prompt 2.0.0 buduje cytat z tych danych – bez nich model zaczynał zmyślać
  // doświadczenie, więc brak materiału zatrzymuje etap, zanim cokolwiek
  // zapłacimy.
  const briefStep = await db(env)
    .prepare("SELECT payload FROM job_steps WHERE job_id = ? AND step = 'brief'")
    .bind(id)
    .first();
  const research = {
    gap: await gapSummary(env, job.domain, job.post_id).catch(() => null),
    rivals: await rivalsSummary(env, job.domain, job.post_id).catch(() => null),
    brief: (() => {
      try {
        return briefStep?.payload ? JSON.parse(briefStep.payload) : null;
      } catch {
        return null;
      }
    })(),
  };
  if (!hasResearch(research)) {
    return json({
      error: 'Komentarz ekspercki powstaje z materiału tego przebiegu, a materiału nie ma. '
        + 'Uruchom „Sprawdź SERP" i „Pobierz treści konkurentów", wtedy cytat będzie miał się o co oprzeć.',
      code: 'no_research',
    }, 409);
  }

  // Blokada podwójnego kliknięcia: warunkowy UPDATE przechodzi tylko, gdy
  // ekspert nie jest właśnie generowany (json_extract – JSON1 jest w D1).
  const lock = await db(env)
    .prepare(
      `UPDATE jobs SET expert = ?, updated_at = ? WHERE id = ?
         AND (expert IS NULL OR json_extract(expert, '$.status') != 'running')`,
    )
    .bind(JSON.stringify({ status: 'running', started_at: nowIso() }), nowIso(), id)
    .run();
  if ((lock.meta?.changes ?? 0) === 0) return json({ error: 'Cytat jest właśnie generowany.' }, 409);

  const sections = await db(env)
    .prepare('SELECT slot, title_before, title_after, text_before, text_after FROM job_sections WHERE job_id = ? ORDER BY slot')
    .bind(id)
    .all();

  const result = await generateExpertQuote(env, job, sections.results ?? [], {
    ...(fetchImpl ? { fetchImpl } : {}), person, research,
  });
  const record = result.ok
    ? { status: 'done', ...result.data, model: result.model, cost: result.cost, created_at: nowIso() }
    : { status: 'failed', error: result.error, created_at: nowIso() };
  await db(env)
    .prepare('UPDATE jobs SET expert = ?, updated_at = ? WHERE id = ?')
    .bind(JSON.stringify(record), nowIso(), id)
    .run();
  await audit(env, 'expert.generate', id, result.ok ? { expert: record.expert, slot: record.slot } : { error: record.error });
  if (!result.ok) return json({ error: result.error, code: result.code ?? null, expert: record }, 502);
  return json({ expert: record });
}

/** Odrzucenie cytatu – zostaje ślad (status rejected), można wygenerować nowy. */
async function rejectExpert(request, env, id) {
  if (!checkMutationOrigin(request)) return json({ error: 'Żądanie odrzucone.' }, 403);
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Przekazano nieprawidłowe dane (błąd formatu lub zbyt duży rozmiar).' }, 400);
  }
  if (body?.rejected !== true) return json({ error: 'Oczekiwane pole: {"rejected": true}.' }, 400);
  const result = await db(env)
    .prepare(
      `UPDATE jobs SET expert = json_set(expert, '$.status', 'rejected'), updated_at = ?
       WHERE id = ? AND expert IS NOT NULL AND json_extract(expert, '$.status') = 'done'`,
    )
    .bind(nowIso(), id)
    .run();
  if ((result.meta?.changes ?? 0) === 0) return json({ error: 'Nie ma cytatu do odrzucenia.' }, 404);
  await audit(env, 'expert.reject', id, null);
  return json({ ok: true });
}

/* ---------- styl i fleksja (przejazd redaktorski, Worker → OpenRouter) ---------- */

/** POST /api/cw/jobs/:id/style – jedno wywołanie modelu na cały wpis.
    Liczone z aktualnego stanu dokumentu (propozycje pipeline'u + sekcje, których
    nie ruszał), więc nowy przejazd zastępuje poprzednie propozycje stylu. */
async function runStyle(request, env, id, { fetchImpl } = {}) {
  if (!checkMutationOrigin(request)) return json({ error: 'Żądanie odrzucone.' }, 403);
  const job = await db(env).prepare('SELECT * FROM jobs WHERE id = ?').bind(id).first();
  if (!job) return json({ error: 'Nie ma takiego zadania.' }, 404);
  if (job.status !== 'done') {
    return json({ error: 'Przejazd redaktorski będzie dostępny po zakończeniu analizy.' }, 409);
  }

  // Blokada podwójnego kliknięcia – jak przy ekspercie (json_extract z JSON1).
  const lock = await db(env)
    .prepare(
      `UPDATE jobs SET style = ?, updated_at = ? WHERE id = ?
         AND (style IS NULL OR json_extract(style, '$.status') != 'running')`,
    )
    .bind(JSON.stringify({ status: 'running', started_at: nowIso() }), nowIso(), id)
    .run();
  if ((lock.meta?.changes ?? 0) === 0) return json({ error: 'Przejazd redaktorski właśnie trwa.' }, 409);

  const fail = async (message, status = 502) => {
    const record = { status: 'failed', error: message, created_at: nowIso() };
    await db(env)
      .prepare('UPDATE jobs SET style = ?, updated_at = ? WHERE id = ?')
      .bind(JSON.stringify(record), nowIso(), id)
      .run();
    await audit(env, 'style.run', id, { error: message });
    return json({ error: message, style: record }, status);
  };

  const sections = await db(env)
    .prepare('SELECT slot, title_field, text_field, title_after, text_after, decision FROM job_sections WHERE job_id = ? ORDER BY slot')
    .bind(id)
    .all();

  const doc = await styleDocument(env, job, sections.results ?? [], fetchImpl ?? fetch);
  if (doc.error) return fail(doc.error, doc.status ?? 502);

  const result = await runStylePass(env, job, doc.rows, { ...(fetchImpl ? { fetchImpl } : {}) });
  if (!result.ok) return fail(result.error);

  await saveStyleRows(env, id, result.data.sections);
  const record = {
    status: 'done',
    model: result.model,
    cost: result.cost,
    prompt_version: STYLE_PROMPT_VERSION,
    // Lista uwag per sekcja siedzi w job_style; tu zostaje to, co dotyczy
    // całego wpisu: weryfikacja faktów i propozycje uzupełnień.
    facts: result.data.facts,
    additions: result.data.additions,
    changed: result.data.sections.length,
    sections_total: doc.rows.length,
    created_at: nowIso(),
  };
  await db(env)
    .prepare('UPDATE jobs SET style = ?, updated_at = ? WHERE id = ?')
    .bind(JSON.stringify(record), nowIso(), id)
    .run();
  await audit(env, 'style.run', id, { changed: record.changed, model: record.model });
  return json({ job: await readJob(env, id) });
}

/** PATCH /api/cw/jobs/:id/style/:slot – decyzja o poprawce stylistycznej.
    Akceptacja przenosi tekst do job_sections.text_after (stamtąd bierze go
    podgląd i zapis do WordPressa), cofnięcie przywraca stan sprzed przejazdu. */
async function patchStyleSection(request, env, id, slot) {
  if (!checkMutationOrigin(request)) return json({ error: 'Żądanie odrzucone.' }, 403);
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Przekazano nieprawidłowe dane (błąd formatu lub zbyt duży rozmiar).' }, 400);
  }
  const decision = body?.decision ?? null;
  if (decision !== null && decision !== 'accepted' && decision !== 'rejected') {
    return json({ error: 'Pole „decision" przyjmuje: accepted, rejected albo null.' }, 400);
  }

  const row = await db(env)
    .prepare('SELECT * FROM job_style WHERE job_id = ? AND slot = ?')
    .bind(id, slot)
    .first();
  if (!row) return json({ error: 'Nie ma takiej poprawki stylistycznej.' }, 404);

  let createdSection = row.created_section === 1;

  if (decision === 'accepted' && row.decision !== 'accepted') {
    const existing = await db(env)
      .prepare('SELECT slot FROM job_sections WHERE job_id = ? AND slot = ?')
      .bind(id, slot)
      .first();
    if (existing) {
      await db(env)
        .prepare(
          `UPDATE job_sections
              SET text_after = ?, title_after = COALESCE(?, title_after), edited = 1
            WHERE job_id = ? AND slot = ?`,
        )
        .bind(row.text_after, row.title_after, id, slot)
        .run();
      createdSection = false;
    } else {
      // Sekcja, której pipeline nie ruszał: zakładamy jej wiersz, żeby poprawka
      // szła tą samą ścieżką co propozycje (podgląd, „kopiuj", zapis do WP).
      // Bramka konfliktu w cw-wp.js porównuje hash treści z chwili przejazdu.
      if (!ACF_FIELD.test(row.title_field ?? '') || !ACF_FIELD.test(row.text_field ?? '')) {
        return json({ error: 'Ta sekcja nie ma pól ACF – poprawki nie da się zapisać.' }, 409);
      }
      const hash = await contentHash(row.text_before ?? '');
      await db(env)
        .prepare(
          `INSERT INTO job_sections
             (job_id, slot, title_field, text_field, operation, title_before, title_after,
              text_before, text_after, text_hash_before, accepted, accepted_at, decision, edited)
           VALUES (?, ?, ?, ?, 'update', ?, ?, ?, ?, ?, 1, ?, 'accepted', 1)`,
        )
        .bind(
          id, slot, row.title_field, row.text_field,
          row.title_before ?? '', row.title_after ?? row.title_before ?? '',
          row.text_before ?? '', row.text_after, hash, nowIso(),
        )
        .run();
      createdSection = true;
    }
  }

  // Cofnięcie zatwierdzonej poprawki: albo kasujemy wiersz, który powstał przy
  // akceptacji, albo przywracamy brzmienie sprzed przejazdu.
  if (decision !== 'accepted' && row.decision === 'accepted') {
    if (row.created_section === 1) {
      await db(env).prepare('DELETE FROM job_sections WHERE job_id = ? AND slot = ?').bind(id, slot).run();
    } else {
      await db(env)
        .prepare(
          `UPDATE job_sections
              SET text_after = ?, title_after = COALESCE(?, title_after)
            WHERE job_id = ? AND slot = ?`,
        )
        .bind(row.text_before, row.title_after ? row.title_before : null, id, slot)
        .run();
    }
    createdSection = false;
  }

  await db(env)
    .prepare('UPDATE job_style SET decision = ?, created_section = ?, applied_at = ? WHERE job_id = ? AND slot = ?')
    .bind(decision, createdSection ? 1 : 0, decision === 'accepted' ? nowIso() : null, id, slot)
    .run();
  await audit(env, 'style.decide', id, { slot, decision });
  return json({ ok: true, decision, job: await readJob(env, id) });
}

async function cancelJob(request, env, id) {
  if (!checkMutationOrigin(request)) return json({ error: 'Żądanie odrzucone.' }, 403);
  const job = await db(env).prepare('SELECT id, status, run_id FROM jobs WHERE id = ?').bind(id).first();
  if (!job) return json({ error: 'Nie ma takiego zadania.' }, 404);
  if (!canTransition(job.status, 'cancelled')) {
    return json({ error: `Zadania w stanie „${job.status}" nie da się anulować.` }, 409);
  }
  await db(env)
    .prepare("UPDATE jobs SET status = 'cancelled', updated_at = ?, finished_at = ? WHERE id = ?")
    .bind(nowIso(), nowIso(), id)
    .run();
  await audit(env, 'job.cancel', id, null);

  // Runner sprawdza stan przed każdym krokiem, ale jeśli już wystartował,
  // ubijamy też sam przebieg – inaczej dalej pali jednostki API.
  const token = (env.GH_DISPATCH_TOKEN || '').trim();
  const repo = (env.GH_REPO || '').trim();
  if (job.run_id && token && repo) {
    const response = await fetch(`https://api.github.com/repos/${repo}/actions/runs/${job.run_id}/cancel`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'zaplecze-dashboard',
      },
    });
    if (!response.ok) console.error('cancel run', response.status, await response.text());
  }
  return json({ ok: true });
}

/** Callback z pipeline'u. Wywoływany PRZED bramką Basic Auth w worker.js. */
async function handleCallback(request, env) {
  const secret = (env.CW_CALLBACK_SECRET || '').trim();
  const raw = await request.text();
  if (raw.length > MAX_CALLBACK_BYTES) return json({ error: 'Przekazano nieprawidłowe dane (błąd formatu lub zbyt duży rozmiar).' }, 413);

  const check = await verifySignature({
    secret,
    timestamp: request.headers.get('X-CW-Timestamp'),
    signature: request.headers.get('X-CW-Signature'),
    body: raw,
  });
  if (!check.ok) return json({ error: 'Nieprawidłowy podpis.' }, 401);

  // Replay: ten sam podpis przechodzi tylko raz w oknie ważności.
  const signature = request.headers.get('X-CW-Signature');
  const replay = await db(env)
    .prepare('INSERT OR IGNORE INTO callback_nonces (signature, created_at) VALUES (?, ?)')
    .bind(signature, nowIso())
    .run();
  if ((replay.meta?.changes ?? 0) === 0) return json({ error: 'Podpis już zużyty.' }, 409);

  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: 'Przekazano nieprawidłowe dane (błąd formatu lub zbyt duży rozmiar).' }, 400);
  }
  const parsed = parseCallback(body);
  if (!parsed.ok) return json({ error: 'Nieprawidłowe potwierdzenie z systemu.', fields: parsed.errors }, 400);
  const cb = parsed.callback;

  const job = await db(env).prepare('SELECT * FROM jobs WHERE id = ?').bind(cb.job_id).first();
  if (!job) return json({ error: 'Nie ma takiego zadania.' }, 404);

  // Callback ze starszego przebiegu nie nadpisuje nowszego wyniku.
  if (job.run_id && String(job.run_id) !== cb.run_id) return json({ error: 'Potwierdzenie z innego procesu.' }, 409);
  if (job.run_attempt && cb.run_attempt < job.run_attempt) return json({ error: 'Potwierdzenie ze starszej próby.' }, 409);
  if (isFinal(job.status) && cb.status !== job.status) {
    return json({ error: `Zadanie jest już w stanie „${job.status}".` }, 409);
  }
  if (cb.status && cb.status !== job.status && !canTransition(job.status, cb.status)) {
    return json({ error: `Przejście ${job.status} → ${cb.status} jest niedozwolone.` }, 409);
  }

  const statements = [];
  const now = nowIso();
  statements.push(
    db(env)
      .prepare(
        `UPDATE jobs SET status = COALESCE(?, status), run_id = ?, run_attempt = ?,
           last_heartbeat_at = ?, lease_expires_at = ?, updated_at = ?,
           error = COALESCE(?, error), cost = COALESCE(?, cost),
           pipeline_version = COALESCE(?, pipeline_version),
           snapshot_hash = COALESCE(?, snapshot_hash),
           finished_at = CASE WHEN ? IN ('done','failed','cancelled','budget_exceeded') THEN ? ELSE finished_at END
         WHERE id = ?`,
      )
      .bind(
        cb.status, cb.run_id, cb.run_attempt, now, plusMinutes(LEASE_MINUTES), now,
        cb.error, cb.cost ? JSON.stringify(cb.cost) : null, cb.pipeline_version, cb.snapshot_hash,
        cb.status ?? '', now, cb.job_id,
      ),
  );

  if (cb.step) {
    statements.push(
      db(env)
        .prepare(
          `INSERT INTO job_steps (job_id, step, status, started_at, finished_at, payload, cost, model, prompt_version, input_hash, error)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
           ON CONFLICT (job_id, step) DO UPDATE SET
             status = ?3, finished_at = COALESCE(?5, finished_at), payload = COALESCE(?6, payload),
             cost = COALESCE(?7, cost), model = COALESCE(?8, model), prompt_version = COALESCE(?9, prompt_version),
             input_hash = COALESCE(?10, input_hash), error = ?11`,
        )
        .bind(
          cb.job_id, cb.step.name, cb.step.status ?? 'running',
          cb.step.started_at ?? now, cb.step.finished_at ?? null,
          cb.step.payload ? JSON.stringify(cb.step.payload) : null,
          cb.step.cost ? JSON.stringify(cb.step.cost) : null,
          cb.step.model ?? null, cb.step.prompt_version ?? null, cb.step.input_hash ?? null,
          cb.step.error ?? null,
        ),
    );
  }

  for (const section of cb.sections ?? []) {
    const slot = Number.parseInt(section?.slot, 10);
    // FAQ ma własną przestrzeń slotów (101+) – zakres `1..30` cicho gubił
    // przepisane pytania: pipeline je zmieniał, a do edytora nie docierały.
    if (!isKnownSlot(slot)) continue;
    statements.push(
      db(env)
        .prepare(
          `INSERT INTO job_sections (job_id, slot, title_field, text_field, operation, title_before, title_after, text_before, text_after, text_hash_before, diff, moved_from)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)
           ON CONFLICT (job_id, slot) DO UPDATE SET
             title_field = ?3, text_field = ?4, operation = ?5, title_before = ?6, title_after = ?7,
             text_before = ?8, text_after = ?9, text_hash_before = ?10, diff = ?11, moved_from = ?12`,
        )
        .bind(
          cb.job_id, slot,
          // Nazwy pól niesie pipeline; fallback musi znać obie przestrzenie,
          // bo FAQ siedzi w page_faq_*, nie w page_title_h2_*.
          section.title_field ?? (slot > FAQ_SLOT_BASE
            ? `page_faq_question_${slot - FAQ_SLOT_BASE}` : `page_title_h2_${slot}`),
          section.text_field ?? (slot > FAQ_SLOT_BASE
            ? `page_faq_answer_${slot - FAQ_SLOT_BASE}` : `page_text_${slot}`),
          ['insert', 'move'].includes(section.operation) ? section.operation : 'update',
          section.title_before ?? null, section.title_after ?? null,
          section.text_before ?? null, section.text_after ?? null,
          section.text_hash_before ?? null,
          section.diff ? JSON.stringify(section.diff) : null,
          Number.isFinite(Number.parseInt(section.moved_from, 10)) ? Number.parseInt(section.moved_from, 10) : null,
        ),
    );
  }

  await db(env).batch(statements);
  return json({ ok: true });
}

/** Zadania bez heartbeatu dłużej niż dzierżawa – runner padł bez śladu.
    Wywoływane przy każdym odczycie listy, więc nie potrzebujemy crona. */
async function sweepStale(env) {
  await db(env)
    .prepare(
      `UPDATE jobs SET status = 'stale', updated_at = ?, error = COALESCE(error, 'Proces w tle przestał odpowiadać.')
       WHERE status IN ('queued','dispatching','running') AND lease_expires_at IS NOT NULL AND lease_expires_at < ?`,
    )
    .bind(nowIso(), nowIso())
    .run();
}

/**
 * Trasy Content Watchera. Zwraca `null`, gdy ścieżka nie należy do tego modułu.
 * `beforeAuth` = wywołanie sprzed bramki Basic Auth (tylko callback).
 */
export async function routeContentWatcher(request, env, { beforeAuth = false, ctx = null } = {}) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/api/cw/')) return null;

  if (url.pathname === '/api/cw/callback') {
    if (request.method !== 'POST') return json({ error: 'Dozwolona metoda: POST.' }, 405);
    if (!env.CW_DB) return json({ error: 'Brak bindingu CW_DB.' }, 503);
    return handleCallback(request, env);
  }
  if (beforeAuth) return null; // reszta tras dopiero po sprawdzeniu hasła
  if (!env.CW_DB) return json({ error: 'Brak bindingu CW_DB w konfiguracji Workera.' }, 503);

  if (url.pathname === '/api/cw/jobs') {
    if (request.method === 'POST') return createJob(request, env);
    if (request.method === 'GET') {
      await sweepStale(env);
      return listJobs(env, url);
    }
    return json({ error: 'Dozwolone metody: GET, POST.' }, 405);
  }

  const contentMatch = url.pathname.match(/^\/api\/cw\/content\/([a-z0-9.-]{1,253})\/([a-z0-9_-]{1,40})\/(\d{1,10})\/?$/i);
  if (contentMatch) {
    if (request.method !== 'GET') return json({ error: 'Dozwolona metoda: GET.' }, 405);
    const [, domain, postType, postId] = contentMatch;
    return fetchPostContent(request, env, domain, postType, Number.parseInt(postId, 10));
  }

  const authorsMatch = url.pathname.match(/^\/api\/cw\/authors\/([a-z0-9.-]{1,253})\/?$/i);
  if (authorsMatch) {
    if (request.method !== 'GET') return json({ error: 'Dozwolona metoda: GET.' }, 405);
    return handleAuthors(request, env, authorsMatch[1]);
  }

  if (url.pathname === '/api/cw/usage') return handleUsage(request, env);

  const rivalsMatch = url.pathname.match(/^\/api\/cw\/rivals\/([a-z0-9.-]{1,253})\/(\d{1,10})\/?$/i);
  if (rivalsMatch) {
    if (request.method !== 'GET' && request.method !== 'POST') {
      return json({ error: 'Dozwolone metody: GET, POST.' }, 405);
    }
    if (request.method === 'POST' && !checkMutationOrigin(request)) {
      return json({ error: 'Żądanie odrzucone.' }, 403);
    }
    const [, domain, postId] = rivalsMatch;
    if (!contentDomains(env).has(domain.toLowerCase())) {
      return json({ error: 'Domena spoza CW_DOMAINS.' }, 400);
    }
    return handleRivals(request, env, domain.toLowerCase(), Number.parseInt(postId, 10), ctx);
  }

  const serpMatch = url.pathname.match(/^\/api\/cw\/serp\/([a-z0-9.-]{1,253})\/(\d{1,10})\/?$/i);
  if (serpMatch) {
    if (request.method !== 'GET' && request.method !== 'POST') {
      return json({ error: 'Dozwolone metody: GET, POST.' }, 405);
    }
    if (request.method === 'POST' && !checkMutationOrigin(request)) {
      return json({ error: 'Żądanie odrzucone.' }, 403);
    }
    const [, domain, postId] = serpMatch;
    // contentDomains zwraca Mapę domena → adres bazowy, nie listę.
    if (!contentDomains(env).has(domain.toLowerCase())) {
      return json({ error: 'Domena spoza CW_DOMAINS.' }, 400);
    }
    return handleSerpGap(request, env, domain.toLowerCase(), Number.parseInt(postId, 10), ctx);
  }

  const jobMatch = url.pathname.match(
    /^\/api\/cw\/jobs\/([a-z0-9-]{8,64})(?:\/(cancel|expert|wp-draft|wp-apply|sections\/(\d{1,3})|style\/(\d{1,3})|style|infographic\/(\d{1,3})))?\/?$/i,
  );
  if (jobMatch) {
    const [, id, action, slot, styleSlot, imageSlot] = jobMatch;
    if (action === 'cancel') {
      if (request.method !== 'POST') return json({ error: 'Dozwolona metoda: POST.' }, 405);
      return cancelJob(request, env, id);
    }
    if (action === 'wp-draft' || action === 'wp-apply') {
      if (request.method !== 'POST') return json({ error: 'Dozwolona metoda: POST.' }, 405);
      return action === 'wp-draft' ? handleWpDraft(request, env, id) : handleWpApply(request, env, id);
    }
    if (action === 'expert') {
      if (request.method === 'POST') return generateExpert(request, env, id);
      if (request.method === 'PATCH') return rejectExpert(request, env, id);
      return json({ error: 'Dozwolone metody: POST, PATCH.' }, 405);
    }
    if (styleSlot) {
      if (request.method !== 'PATCH') return json({ error: 'Dozwolona metoda: PATCH.' }, 405);
      return patchStyleSection(request, env, id, Number.parseInt(styleSlot, 10));
    }
    if (imageSlot) {
      if (request.method !== 'GET' && request.method !== 'POST') {
        return json({ error: 'Dozwolone metody: GET, POST.' }, 405);
      }
      return handleInfographic(request, env, id, Number.parseInt(imageSlot, 10));
    }
    if (action?.toLowerCase() === 'style') {
      if (request.method !== 'POST') return json({ error: 'Dozwolona metoda: POST.' }, 405);
      return runStyle(request, env, id);
    }
    if (slot) {
      if (request.method !== 'PATCH') return json({ error: 'Dozwolona metoda: PATCH.' }, 405);
      return patchSection(request, env, id, Number.parseInt(slot, 10));
    }
    if (request.method !== 'GET') return json({ error: 'Dozwolona metoda: GET.' }, 405);
    await sweepStale(env);
    const job = await readJob(env, id);
    return job ? json({ job }) : json({ error: 'Nie ma takiego zadania.' }, 404);
  }

  return json({ error: 'Nieznana trasa Content Watchera.' }, 404);
}
