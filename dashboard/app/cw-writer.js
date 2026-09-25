/**
 * Content Writer – nowe artykuły od zera (grupa-icea.pl).
 *
 * Projekt (`writer_projects`) prowadzi jedną frazę przez cztery etapy:
 *   1. research w Workerze – SERP-gap (SerpData + Senuto) i treści konkurencji
 *      (Jina), te same kroki co w edytorze Content Watchera,
 *   2. brief z GitHub Actions (przebieg `writer_brief`), do poprawki i akceptacji,
 *   3. tekst z GitHub Actions (przebieg `writer_text`) – sekcje ACF, FAQ, Źródła,
 *      linki wewnętrzne, bramka pokrycia fraz,
 *   4. dopracowanie istniejącymi narzędziami edytora (ekspert, styl i fleksja,
 *      infografiki, CTA – trasy /api/cw/jobs/:id/*) i nowy szkic w WordPressie.
 *
 * Przebiegi to zwykłe wiersze `jobs` z `post_id` = -id projektu (migracja 0011),
 * więc callbacki, dzierżawa, anulowanie i propozycje sekcji idą istniejącą
 * ścieżką. Tu mieszka tylko to, czego odświeżanie nie ma: projekt, brief
 * i zapis szkicu BEZ oryginału.
 */

import {
  checkMutationOrigin,
  contentDomains,
  DEFAULT_MODELS,
  isActive,
  LEASE_MINUTES,
  MAX_ACTIVE_PER_DOMAIN,
  MAX_JOBS_PER_DAY,
  readJob,
  sanitizeSectionHtml,
} from './cw-api.js';
import { wpAuthors } from './cw-expert.js';
import { handleRivals, rivalsSummary } from './cw-rivals.js';
import { gapSummary, handleSerpGap, normalizeKeyword } from './cw-serp.js';
import { acfFieldPayload, postUrl, wpAuth, wpFetch } from './cw-wp.js';

export const WRITER_KINDS = { brief: 'writer_brief', text: 'writer_text' };
export const WRITER_EVENT = 'content-write';
export const MAX_KEYWORD_CHARS = 120;
export const MAX_BRIEF_BYTES = 24 * 1024; // brief jedzie w client_payload
export const MAX_LEAD_BYTES = 16 * 1024;
export const MAX_PAYLOAD_FIELDS = 10; // limit GitHuba dla client_payload
// Lustro pipeline/content-writer-wp/config.py (MAX_OUTLINE, MAX_FAQ).
export const MAX_OUTLINE = 15;
export const MAX_FAQ = 8;

const MODEL_ID = /^[a-z0-9-]+\/[a-z0-9.:_-]{1,60}$/i;
const STAGE_STATUSES = {
  // W jakich stanach projektu wolno uruchomić dany etap.
  brief: ['research', 'brief_ready', 'failed'],
  write: ['brief_ready', 'written', 'failed'],
};

const json = (value, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

const nowIso = () => new Date().toISOString();
const plusMinutes = (minutes) => new Date(Date.now() + minutes * 60_000).toISOString();
const db = (env) => env.CW_DB;
const parse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

/** Projekt ↔ przebieg: ujemne post_id nie zderzy się z żadnym ID WordPressa. */
export const projectPostId = (id) => -Math.abs(Number(id));

async function audit(env, action, jobId, detail) {
  await db(env)
    .prepare('INSERT INTO audit_log (at, actor, action, job_id, detail) VALUES (?, ?, ?, ?, ?)')
    .bind(nowIso(), 'dashboard', action, jobId ?? null, detail ? JSON.stringify(detail) : null)
    .run();
}

async function readBody(request) {
  try {
    return { body: await request.json() };
  } catch {
    return { error: json({ error: 'Przekazano nieprawidłowe dane (błąd formatu lub zbyt duży rozmiar).' }, 400) };
  }
}

/* ---------- walidacja ---------- */

/** Fraza z formularza: domena z CW_DOMAINS, 2–120 znaków, co najmniej jedna litera. */
export function parseProjectRequest(input, env) {
  const errors = [];
  const domain = typeof input?.domain === 'string' ? input.domain.trim().toLowerCase() : '';
  if (!contentDomains(env).has(domain)) errors.push('domain');
  const keyword = typeof input?.keyword === 'string' ? input.keyword.replace(/\s+/g, ' ').trim() : '';
  const norm = normalizeKeyword(keyword);
  if (keyword.length < 2 || keyword.length > MAX_KEYWORD_CHARS || !/[a-z]/.test(norm)) errors.push('keyword');
  if (errors.length) return { ok: false, errors };
  return { ok: true, project: { domain, keyword, keyword_norm: norm } };
}

const text = (value, max) => (typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '');
const list = (value, max) => (Array.isArray(value) ? value.slice(0, max) : []);
const int = (value, min, max) => {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : null;
};

/**
 * Brief po poprawkach redaktora. Z niego pisze model, więc zostaje tylko to,
 * co rozumie prompt `write` – nieznane pola wypadają, długości są przycięte.
 * `basis` (podstawa w materiale) przechodzi dalej: pokazuje, skąd wziął się
 * punkt planu, i daje redaktorowi powód, żeby go skreślić.
 */
export function normalizeBrief(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { ok: false, errors: ['brief'] };
  if (JSON.stringify(input).length > MAX_BRIEF_BYTES) return { ok: false, errors: ['brief_size'] };
  const outline = list(input.outline, MAX_OUTLINE)
    .map((row) => ({
      heading: text(row?.heading, 200),
      points: list(row?.points, 8).map((point) => text(point, 300)).filter(Boolean),
      keywords: list(row?.keywords, 8).map((keyword) => text(keyword, 120)).filter(Boolean),
      words: int(row?.words, 50, 1500),
      basis: text(row?.basis, 300),
    }))
    .filter((row) => row.heading);
  const brief = {
    main_keyword: text(input.main_keyword, 120),
    intent: text(input.intent, 300),
    title: text(input.title, 200),
    angle: text(input.angle, 1000),
    audience: text(input.audience, 300),
    target_words: int(input.target_words, 300, 6000),
    outline,
    faq: list(input.faq, MAX_FAQ)
      .map((row) => ({ question: text(row?.question, 200), basis: text(row?.basis, 300) }))
      .filter((row) => row.question),
    keywords_to_cover: list(input.keywords_to_cover, 30)
      .map((row) => ({
        keyword: text(row?.keyword, 120),
        volume: int(row?.volume, 0, 10_000_000),
        where: text(row?.where, 200),
      }))
      .filter((row) => row.keyword),
    keywords_rejected: list(input.keywords_rejected, 30)
      .map((row) => ({ keyword: text(row?.keyword, 120), why: text(row?.why, 300) }))
      .filter((row) => row.keyword),
    facts_to_use: list(input.facts_to_use, 12)
      .map((row) => ({ fact: text(row?.fact, 400), source: text(row?.source, 300) }))
      .filter((row) => row.fact),
    skip: input.skip === true,
    reason: text(input.reason, 500),
  };
  if (!brief.skip && !brief.outline.length) return { ok: false, errors: ['outline'] };
  return { ok: true, brief };
}

/* ---------- stan projektu ---------- */

/**
 * Status projektu wynika z jego przebiegów – callback zna tylko `jobs`, więc
 * projekt dogania stan przy odczycie. Gotowy brief i wstęp kopiujemy z kroków
 * do projektu raz: od tej chwili źródłem prawdy jest wersja redaktora.
 */
export async function syncProject(env, project) {
  if (!project || project.status === 'cancelled') return project;
  const patch = {};
  const step = async (jobId, name) => {
    const row = await db(env)
      .prepare('SELECT payload FROM job_steps WHERE job_id = ? AND step = ?')
      .bind(jobId, name)
      .first();
    return parse(row?.payload, null);
  };
  const jobState = async (jobId) =>
    jobId ? db(env).prepare('SELECT id, status, error FROM jobs WHERE id = ?').bind(jobId).first() : null;

  const writeJob = await jobState(project.write_job_id);
  const briefJob = writeJob ? null : await jobState(project.brief_job_id);
  const job = writeJob ?? briefJob;
  if (job) {
    const failed = ['failed', 'cancelled', 'stale', 'budget_exceeded'].includes(job.status);
    if (isActive(job.status)) {
      patch.status = writeJob ? 'writing' : 'brief_running';
    } else if (job.status === 'done' && writeJob) {
      patch.status = 'written';
      if (!project.lead) {
        const payload = await step(job.id, 'write');
        if (typeof payload?.lead === 'string' && payload.lead.trim()) patch.lead = sanitizeSectionHtml(payload.lead);
        if (!project.title && payload?.title) patch.title = text(payload.title, 200);
      }
    } else if (job.status === 'done') {
      if (!project.brief) {
        const normalized = normalizeBrief(await step(job.id, 'brief'));
        if (normalized.ok) {
          patch.brief = JSON.stringify(normalized.brief);
          if (!project.title && normalized.brief.title) patch.title = normalized.brief.title;
          patch.status = 'brief_ready';
        } else {
          patch.status = 'failed';
          patch.error = 'Brief wrócił niekompletny – uruchom go ponownie.';
        }
      } else {
        patch.status = 'brief_ready';
      }
    } else if (failed) {
      patch.status = 'failed';
      patch.error = job.error || 'Przebieg nie doszedł do końca.';
    }
  }
  const changed = Object.entries(patch).filter(([key, value]) => project[key] !== value);
  if (!changed.length) return project;
  const assignments = changed.map(([key]) => `${key} = ?`).join(', ');
  await db(env)
    .prepare(`UPDATE writer_projects SET ${assignments}, updated_at = ? WHERE id = ?`)
    .bind(...changed.map(([, value]) => value), nowIso(), project.id)
    .run();
  return { ...project, ...Object.fromEntries(changed), updated_at: nowIso() };
}

const publicProject = (project) => ({ ...project, brief: parse(project.brief, null) });

async function loadProject(env, id) {
  const row = await db(env).prepare('SELECT * FROM writer_projects WHERE id = ?').bind(id).first();
  return row ? syncProject(env, row) : null;
}

/* ---------- handlery ---------- */

async function createProject(request, env) {
  if (!checkMutationOrigin(request)) return json({ error: 'Żądanie odrzucone.' }, 403);
  const { body, error } = await readBody(request);
  if (error) return error;
  const parsed = parseProjectRequest(body, env);
  if (!parsed.ok) return json({ error: 'Nieprawidłowa fraza albo domena.', fields: parsed.errors }, 400);
  const { domain, keyword, keyword_norm: norm } = parsed.project;

  const existing = await db(env)
    .prepare("SELECT id, status FROM writer_projects WHERE domain = ? AND keyword_norm = ? AND status != 'cancelled'")
    .bind(domain, norm)
    .first();
  if (existing) {
    return json({ error: 'Ta fraza ma już projekt – otwórz go z listy.', code: 'duplicate', project_id: existing.id }, 409);
  }
  const now = nowIso();
  const result = await db(env)
    .prepare(
      `INSERT INTO writer_projects (domain, keyword, keyword_norm, status, created_by, created_at, updated_at)
       VALUES (?, ?, ?, 'research', 'dashboard', ?, ?)`,
    )
    .bind(domain, keyword, norm, now, now)
    .run();
  const id = result.meta?.last_row_id;
  await audit(env, 'writer.create', null, { project_id: id, keyword });
  const project = await db(env).prepare('SELECT * FROM writer_projects WHERE id = ?').bind(id).first();
  return json({ project: publicProject(project) }, 201);
}

async function listProjects(env, url) {
  const domain = String(url.searchParams.get('domain') ?? '').toLowerCase();
  if (!contentDomains(env).has(domain)) return json({ error: 'Domena spoza CW_DOMAINS.' }, 400);
  const rows = await db(env)
    .prepare(
      `SELECT * FROM writer_projects WHERE domain = ? AND status != 'cancelled'
       ORDER BY updated_at DESC LIMIT 100`,
    )
    .bind(domain)
    .all();
  const projects = [];
  for (const row of rows.results ?? []) projects.push(publicProject(await syncProject(env, row)));
  return json({ projects });
}

async function getProject(env, id) {
  const project = await loadProject(env, id);
  if (!project) return json({ error: 'Nie ma takiego projektu.' }, 404);
  return json({
    project: publicProject(project),
    brief_job: project.brief_job_id ? await readJob(env, project.brief_job_id) : null,
    write_job: project.write_job_id ? await readJob(env, project.write_job_id) : null,
  });
}

/** Autor z listy redakcji portalu – nazwisko trafia do blokady self-cite eksperta. */
async function resolveAuthor(env, base, authorId, fetchImpl) {
  const authors = await wpAuthors(base, fetchImpl, wpAuth(env) ?? '');
  return authors.find((row) => row.id === authorId) ?? null;
}

async function patchProject(request, env, id, { fetchImpl = fetch } = {}) {
  if (!checkMutationOrigin(request)) return json({ error: 'Żądanie odrzucone.' }, 403);
  const { body, error } = await readBody(request);
  if (error) return error;
  const project = await loadProject(env, id);
  if (!project) return json({ error: 'Nie ma takiego projektu.' }, 404);
  if (project.status === 'cancelled') return json({ error: 'Projekt został zamknięty.' }, 409);

  if (body?.cancel === true) {
    if (['brief_running', 'writing'].includes(project.status)) {
      return json({ error: 'Najpierw zatrzymaj trwający przebieg.' }, 409);
    }
    await db(env)
      .prepare("UPDATE writer_projects SET status = 'cancelled', updated_at = ? WHERE id = ?")
      .bind(nowIso(), id)
      .run();
    await audit(env, 'writer.cancel', null, { project_id: id });
    return json({ ok: true });
  }

  const fields = {};
  if (body?.title !== undefined) {
    const title = text(body.title, 200);
    if (!title) return json({ error: 'Tytuł nie może być pusty.' }, 400);
    fields.title = title;
  }
  if (body?.brief !== undefined) {
    if (['brief_running', 'writing'].includes(project.status)) {
      return json({ error: 'Briefu nie da się zmienić w trakcie przebiegu.' }, 409);
    }
    const normalized = normalizeBrief(body.brief);
    if (!normalized.ok) return json({ error: 'Brief jest niekompletny.', fields: normalized.errors }, 400);
    fields.brief = JSON.stringify(normalized.brief);
  }
  if (body?.lead !== undefined) {
    if (typeof body.lead !== 'string' || body.lead.length > MAX_LEAD_BYTES) {
      return json({ error: 'Wstęp jest za długi.' }, 413);
    }
    fields.lead = sanitizeSectionHtml(body.lead);
  }
  if (body?.category_id !== undefined) {
    const category = Number.isInteger(body.category_id) && body.category_id > 0 ? body.category_id : null;
    fields.category_id = category;
  }
  if (body?.author_id !== undefined) {
    if (!Number.isInteger(body.author_id) || body.author_id <= 0) return json({ error: 'Wybierz autora z listy.' }, 400);
    const base = contentDomains(env).get(project.domain);
    let author;
    try {
      author = await resolveAuthor(env, base, body.author_id, fetchImpl);
    } catch (err) {
      return json({ error: err instanceof Error ? err.message : 'Nie udało się pobrać autorów.' }, 502);
    }
    if (!author) return json({ error: 'Ta osoba nie jest autorem w tym portalu.' }, 400);
    fields.author_id = author.id;
    fields.author_name = author.name;
  }
  const entries = Object.entries(fields);
  if (!entries.length) return json({ error: 'Brak pól do zapisania.' }, 400);

  const statements = [
    db(env)
      .prepare(`UPDATE writer_projects SET ${entries.map(([key]) => `${key} = ?`).join(', ')}, updated_at = ? WHERE id = ?`)
      .bind(...entries.map(([, value]) => value), nowIso(), id),
  ];
  // Ekspert porównuje cytowaną osobę z `jobs.author` – po zmianie autora
  // blokada self-cite musi patrzeć na nowe nazwisko.
  if (fields.author_name && project.write_job_id) {
    statements.push(
      db(env).prepare('UPDATE jobs SET author = ?, updated_at = ? WHERE id = ?').bind(fields.author_name, nowIso(), project.write_job_id),
    );
  }
  await db(env).batch(statements);
  await audit(env, 'writer.update', project.write_job_id ?? project.brief_job_id ?? null, {
    project_id: id, fields: entries.map(([key]) => key),
  });
  return getProject(env, id);
}

/**
 * SERP-gap i treści konkurencji – bez własnej logiki: przepinamy żądanie na
 * handlery edytora z tematem = fraza projektu i kluczem = -id projektu.
 */
async function projectResearch(request, env, id, kind, ctx, fetchImpl = fetch) {
  const project = await db(env).prepare('SELECT * FROM writer_projects WHERE id = ?').bind(id).first();
  if (!project) return json({ error: 'Nie ma takiego projektu.' }, 404);
  const base = contentDomains(env).get(project.domain);
  if (!base) return json({ error: 'Domena spoza CW_DOMAINS.' }, 400);
  const key = projectPostId(project.id);

  let forwarded = request;
  if (request.method === 'POST') {
    if (!checkMutationOrigin(request)) return json({ error: 'Żądanie odrzucone.' }, 403);
    const body = (await request.json().catch(() => null)) ?? {};
    const payload = kind === 'serp'
      ? {
          title: project.keyword,
          url: `${base.replace(/\/$/, '')}/`,
          // Nasze frazy z katalogu (Senuto) – po nich luka dzieli się na
          // „brak", „słabo" i „mamy", czyli co już pokrywamy innymi stronami.
          own_keywords: Array.isArray(body.own_keywords) ? body.own_keywords.slice(0, 5000) : [],
        }
      : {
          topic: project.keyword,
          rivals: Array.isArray(body.rivals) ? body.rivals : [],
          ...(typeof body.model === 'string' ? { model: body.model } : {}),
        };
    forwarded = new Request(request.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }
  return kind === 'serp'
    ? handleSerpGap(forwarded, env, project.domain, key, ctx, fetchImpl)
    : handleRivals(forwarded, env, project.domain, key, ctx, fetchImpl);
}

/** Wstawienie przebiegu z limitami Content Watchera w jednym warunkowym INSERT-cie. */
async function insertRun(env, job) {
  const dayFrom = new Date(Date.now() - 86_400_000).toISOString();
  const result = await db(env)
    .prepare(
      `INSERT INTO jobs (id, domain, post_id, post_type, url, title, author, status, improvements, models, created_at, updated_at, created_by, kind)
       SELECT ?1, ?2, ?3, 'posts', ?4, ?5, ?6, 'queued', '[]', ?7, ?8, ?8, 'dashboard', ?9
       WHERE (SELECT COUNT(*) FROM jobs WHERE domain = ?2 AND status IN ('queued','dispatching','running')) < ?10
         AND (SELECT COUNT(*) FROM jobs WHERE created_at >= ?11) < ?12
         AND NOT EXISTS (
           SELECT 1 FROM jobs WHERE domain = ?2 AND post_id = ?3 AND status IN ('queued','dispatching','running')
         )`,
    )
    .bind(
      job.id, job.domain, job.post_id, job.url, job.title, job.author || null,
      job.models ? JSON.stringify(job.models) : null, nowIso(), job.kind,
      MAX_ACTIVE_PER_DOMAIN, dayFrom, MAX_JOBS_PER_DAY,
    )
    .run();
  if ((result.meta?.changes ?? 0) > 0) return { ok: true };
  const active = await db(env)
    .prepare("SELECT id FROM jobs WHERE domain = ? AND post_id = ? AND status IN ('queued','dispatching','running')")
    .bind(job.domain, job.post_id)
    .first();
  if (active) return { ok: false, code: 'already_running', message: 'Ten projekt ma już przebieg w toku.' };
  const count = await db(env)
    .prepare("SELECT COUNT(*) AS n FROM jobs WHERE domain = ? AND status IN ('queued','dispatching','running')")
    .bind(job.domain)
    .first();
  if ((count?.n ?? 0) >= MAX_ACTIVE_PER_DOMAIN) {
    return { ok: false, code: 'too_many_active', message: `Osiągnięto limit ${MAX_ACTIVE_PER_DOMAIN} jednoczesnych zadań dla tej domeny.` };
  }
  return { ok: false, code: 'daily_limit', message: `Dzienny limit ${MAX_JOBS_PER_DAY} zadań wyczerpany.` };
}

/**
 * client_payload dla workflowu content-writer-wp. GitHub przyjmuje najwyżej
 * 10 pól najwyższego poziomu – research i brief jadą jako obiekty.
 */
export function dispatchPayload(job, project, research, brief) {
  return {
    job_id: job.id,
    domain: job.domain,
    stage: job.kind === WRITER_KINDS.text ? 'write' : 'brief',
    project_id: project.id,
    keyword: project.keyword,
    title: project.title || '',
    author: project.author_name || '',
    models: job.models ?? null,
    research,
    brief: brief ?? null,
  };
}

async function dispatch(env, payload) {
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
    body: JSON.stringify({ event_type: WRITER_EVENT, client_payload: payload }),
  });
  if (!response.ok) {
    console.error('repository_dispatch (writer)', response.status, await response.text());
    return { ok: false, reason: `http_${response.status}` };
  }
  return { ok: true };
}

async function startRun(request, env, id, stage) {
  if (!checkMutationOrigin(request)) return json({ error: 'Żądanie odrzucone.' }, 403);
  const body = (await request.json().catch(() => null)) ?? {};
  const project = await loadProject(env, id);
  if (!project) return json({ error: 'Nie ma takiego projektu.' }, 404);
  if (!STAGE_STATUSES[stage].includes(project.status)) {
    return json({ error: 'Ten etap nie jest teraz dostępny.', code: 'bad_state', status: project.status }, 409);
  }
  const base = contentDomains(env).get(project.domain);
  if (!base) return json({ error: 'Domena spoza CW_DOMAINS.' }, 400);

  let brief = null;
  if (stage === 'write') {
    brief = parse(project.brief, null);
    if (!brief?.outline?.length || brief.skip) {
      return json({ error: 'Najpierw uzupełnij plan artykułu w briefie.', code: 'no_brief' }, 409);
    }
  }
  let models = null;
  const writer = typeof body.models?.writer === 'string' ? body.models.writer.trim() : '';
  const researchModel = typeof body.models?.research === 'string' ? body.models.research.trim() : '';
  if ((writer && !MODEL_ID.test(writer)) || (researchModel && !MODEL_ID.test(researchModel))) {
    return json({ error: 'Nieprawidłowy identyfikator modelu.' }, 400);
  }
  if (writer || researchModel) {
    models = { research: researchModel || DEFAULT_MODELS.research, writer: writer || DEFAULT_MODELS.writer };
  }

  const kind = stage === 'write' ? WRITER_KINDS.text : WRITER_KINDS.brief;
  const job = {
    id: crypto.randomUUID(),
    kind,
    domain: project.domain,
    post_id: projectPostId(project.id),
    url: `${base.replace(/\/$/, '')}/`,
    title: project.title || project.keyword,
    author: project.author_name || '',
    models,
  };
  const inserted = await insertRun(env, job);
  if (!inserted.ok) return json({ error: inserted.message, code: inserted.code }, 409);

  const key = projectPostId(project.id);
  const research = {
    rivals: await rivalsSummary(env, project.domain, key).catch(() => null),
    gap: await gapSummary(env, project.domain, key).catch(() => null),
  };
  // Nowy brief zastępuje stary razem z tekstem, który z niego powstał (status
  // projektu idzie za najnowszym przebiegiem). Nowy tekst zeruje wstęp – ten
  // przychodzi z przebiegu razem z sekcjami.
  const now = nowIso();
  const update = stage === 'write'
    ? db(env)
        .prepare("UPDATE writer_projects SET write_job_id = ?, status = 'writing', lead = NULL, brief_accepted_at = ?, error = NULL, updated_at = ? WHERE id = ?")
        .bind(job.id, now, now, project.id)
    : db(env)
        .prepare("UPDATE writer_projects SET brief_job_id = ?, write_job_id = NULL, brief = NULL, status = 'brief_running', error = NULL, updated_at = ? WHERE id = ?")
        .bind(job.id, now, project.id);
  await update.run();
  await audit(env, `writer.${stage}`, job.id, { project_id: project.id });

  const sent = await dispatch(env, dispatchPayload(job, project, research, brief));
  if (!sent.ok) {
    const message = sent.reason === 'not_configured'
      ? 'Brak konfiguracji GH_DISPATCH_TOKEN / GH_REPO w Workerze.'
      : 'Nie udało się uruchomić przebiegu.';
    await db(env)
      .prepare("UPDATE jobs SET status = 'failed', error = ?, updated_at = ?, finished_at = ? WHERE id = ?")
      .bind(message, nowIso(), nowIso(), job.id)
      .run();
    await db(env)
      .prepare("UPDATE writer_projects SET status = 'failed', error = ?, updated_at = ? WHERE id = ?")
      .bind(message, nowIso(), project.id)
      .run();
    return json({ error: message, job_id: job.id }, 502);
  }
  await db(env)
    .prepare("UPDATE jobs SET status = 'dispatching', updated_at = ?, lease_expires_at = ? WHERE id = ?")
    .bind(nowIso(), plusMinutes(LEASE_MINUTES), job.id)
    .run();
  return getProject(env, id);
}

/**
 * Nowy szkic w WordPressie. W odróżnieniu od Content Watchera nie ma oryginału:
 * treść to wstęp z projektu, pola ACF z sekcji przebiegu (to samo złożenie co
 * `handleWpDraft` – ekspert, FAQ, Źródła), autor i kategoria z projektu.
 *
 * Ponowny zapis zakłada szkic od nowa (rewizja tworzona przez REST nie ma pól
 * ACF, podgląd pokazywał wtedy pusty wpis), ale tylko, gdy nikt go w międzyczasie
 * nie ruszał w WordPressie: `modified` inny niż przy zapisie = praca redaktora,
 * której nie skasujemy bez `force`.
 */
export async function projectWpDraft(request, env, id, { fetchImpl = fetch } = {}) {
  if (!checkMutationOrigin(request)) return json({ error: 'Żądanie odrzucone.' }, 403);
  if (!wpAuth(env)) return json({ error: 'Brak sekretów WP_APP_USER / WP_APP_PASSWORD w Workerze.' }, 503);
  const body = (await request.clone().json().catch(() => null)) ?? {};
  const project = await loadProject(env, id);
  if (!project) return json({ error: 'Nie ma takiego projektu.' }, 404);
  if (project.status !== 'written' || !project.write_job_id) {
    return json({ error: 'Szkic zapiszesz, gdy tekst będzie gotowy.', code: 'bad_state' }, 409);
  }
  if (!project.title) return json({ error: 'Uzupełnij tytuł artykułu.', code: 'no_title' }, 400);
  if (!project.author_id) return json({ error: 'Wybierz autora wpisu.', code: 'no_author' }, 400);
  if (!project.category_id) return json({ error: 'Wybierz kategorię wpisu.', code: 'no_category' }, 400);
  const base = contentDomains(env).get(project.domain);
  if (!base) return json({ error: 'Domena spoza CW_DOMAINS.' }, 400);

  const job = await db(env).prepare('SELECT * FROM jobs WHERE id = ?').bind(project.write_job_id).first();
  const sections = await db(env)
    .prepare('SELECT slot, title_field, text_field, operation, title_before, title_after, text_before, text_after, text_hash_before, decision FROM job_sections WHERE job_id = ? ORDER BY slot')
    .bind(project.write_job_id)
    .all();
  const { fields, slots } = acfFieldPayload(job, sections.results ?? []);
  if (!slots.length) return json({ error: 'Artykuł nie ma żadnej sekcji do zapisania.' }, 400);

  let replaced = null;
  if (project.wp_post_id) {
    const current = await wpFetch(
      env,
      `${postUrl(base, 'posts', project.wp_post_id)}?context=edit&_fields=id,status,modified`,
      {},
      fetchImpl,
    );
    if (current.ok && current.data?.id) {
      if (current.data.status !== 'draft') {
        return json({
          error: 'Ten wpis nie jest już szkicem w WordPressie – dalsze zmiany wprowadzaj bezpośrednio tam.',
          code: 'not_draft',
        }, 409);
      }
      if (project.wp_modified && current.data.modified !== project.wp_modified && body.force !== true) {
        return json({
          error: 'Szkic był edytowany w WordPressie po ostatnim zapisie. Nowy zapis skasuje te zmiany.',
          code: 'edited_in_wp',
        }, 409);
      }
      const removed = await wpFetch(env, `${postUrl(base, 'posts', project.wp_post_id)}?force=true`, { method: 'DELETE' }, fetchImpl);
      if (!removed.ok) {
        return json({ error: `Nie udało się podmienić poprzedniego szkicu (HTTP ${removed.status}).` }, 502);
      }
      replaced = project.wp_post_id;
    } else if (current.status !== 404) {
      return json({ error: `Nie udało się sprawdzić poprzedniego szkicu (HTTP ${current.status}).` }, 502);
    }
  }

  const saved = await wpFetch(env, postUrl(base, 'posts'), {
    method: 'POST',
    body: {
      status: 'draft',
      title: project.title,
      content: project.lead ?? '',
      author: project.author_id,
      categories: [project.category_id],
      acf: fields,
    },
  }, fetchImpl);
  if (!saved.ok || !saved.data?.id) {
    return json({ error: `WordPress odrzucił zapis szkicu (HTTP ${saved.status}).` }, 502);
  }
  const previewUrl = `${base.replace(/\/$/, '')}/?p=${saved.data.id}&preview=true`;
  await db(env)
    .prepare('UPDATE writer_projects SET wp_post_id = ?, wp_draft_url = ?, wp_modified = ?, wp_saved_at = ?, updated_at = ? WHERE id = ?')
    .bind(saved.data.id, previewUrl, saved.data.modified ?? null, nowIso(), nowIso(), project.id)
    .run();
  await audit(env, 'writer.wp_draft', project.write_job_id, { project_id: project.id, draft_id: saved.data.id, replaced, slots });
  return json({ draft_id: saved.data.id, preview_url: previewUrl, replaced, slots });
}

/** GET /api/cw/writer/categories/:domain – kategorie wpisów do wyboru przy szkicu. */
export async function handleCategories(env, domain, { fetchImpl = fetch } = {}) {
  const base = contentDomains(env).get(domain.toLowerCase());
  if (!base) return json({ error: 'Domena spoza CW_DOMAINS.' }, 400);
  const result = await wpFetch(
    env,
    `${base.replace(/\/$/, '')}/wp-json/wp/v2/categories/?per_page=100&orderby=count&order=desc&_fields=id,name,count,parent`,
    {},
    fetchImpl,
  );
  if (!result.ok || !Array.isArray(result.data)) {
    return json({ error: `Nie udało się pobrać kategorii (HTTP ${result.status}).` }, 502);
  }
  const categories = result.data
    .filter((row) => Number.isInteger(row?.id))
    .map((row) => ({ id: row.id, name: String(row.name ?? '').replace(/&amp;/g, '&'), count: row.count ?? 0, parent: row.parent ?? 0 }));
  return new Response(JSON.stringify({ categories }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'private, max-age=600' },
  });
}

/* ---------- trasy ---------- */

/** Trasy /api/cw/writer/*. Zwraca `null` dla ścieżek spoza modułu. */
export async function routeWriter(request, env, { ctx = null, fetchImpl } = {}) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/api/cw/writer/')) return null;
  if (!env.CW_DB) return json({ error: 'Brak bindingu CW_DB w konfiguracji Workera.' }, 503);
  const options = fetchImpl ? { fetchImpl } : {};

  if (/^\/api\/cw\/writer\/projects\/?$/.test(url.pathname)) {
    if (request.method === 'POST') return createProject(request, env);
    if (request.method === 'GET') return listProjects(env, url);
    return json({ error: 'Dozwolone metody: GET, POST.' }, 405);
  }

  const categories = url.pathname.match(/^\/api\/cw\/writer\/categories\/([a-z0-9.-]{1,253})\/?$/i);
  if (categories) {
    if (request.method !== 'GET') return json({ error: 'Dozwolona metoda: GET.' }, 405);
    return handleCategories(env, categories[1], options);
  }

  const match = url.pathname.match(/^\/api\/cw\/writer\/projects\/(\d{1,9})(?:\/(serp|rivals|brief|write|wp-draft))?\/?$/);
  if (!match) return json({ error: 'Nieznana trasa Content Writera.' }, 404);
  const id = Number.parseInt(match[1], 10);
  const action = match[2];

  if (action === 'serp' || action === 'rivals') {
    if (request.method !== 'GET' && request.method !== 'POST') return json({ error: 'Dozwolone metody: GET, POST.' }, 405);
    return projectResearch(request, env, id, action, ctx, fetchImpl ?? fetch);
  }
  if (action === 'brief' || action === 'write') {
    if (request.method !== 'POST') return json({ error: 'Dozwolona metoda: POST.' }, 405);
    return startRun(request, env, id, action);
  }
  if (action === 'wp-draft') {
    if (request.method !== 'POST') return json({ error: 'Dozwolona metoda: POST.' }, 405);
    return projectWpDraft(request, env, id, options);
  }
  if (request.method === 'GET') return getProject(env, id);
  if (request.method === 'PATCH') return patchProject(request, env, id, options);
  return json({ error: 'Dozwolone metody: GET, PATCH.' }, 405);
}
