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

export const COOLDOWN_DAYS = 30; // ten sam wpis nie wraca do kolejki częściej
export const MAX_ACTIVE_PER_DOMAIN = 3;
export const MAX_JOBS_PER_DAY = 20;
export const LEASE_MINUTES = 15; // brak heartbeatu przez ten czas = zadanie „stale”
export const SIGNATURE_WINDOW_S = 300;
export const MAX_CALLBACK_BYTES = 512 * 1024;

export const IMPROVEMENTS = ['gaps', 'expert', 'sources', 'internal_links'];

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

  if (errors.length) return { ok: false, errors };
  return { ok: true, job: { domain, post_id: postId, post_type: postType, url, title, improvements } };
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
      `INSERT INTO jobs (id, domain, post_id, post_type, url, title, status, improvements, created_at, updated_at, created_by)
       SELECT ?1, ?2, ?3, ?4, ?5, ?6, 'queued', ?7, ?8, ?8, 'dashboard'
       WHERE (SELECT COUNT(*) FROM jobs WHERE domain = ?2 AND status IN ('queued','dispatching','running')) < ?9
         AND (SELECT COUNT(*) FROM jobs WHERE created_at >= ?10) < ?11
         AND NOT EXISTS (
           SELECT 1 FROM jobs
           WHERE domain = ?2 AND post_id = ?3
             AND (status IN ('queued','dispatching','running') OR created_at >= ?12)
         )`,
    )
    .bind(
      id, job.domain, job.post_id, job.post_type, job.url, job.title,
      JSON.stringify(job.improvements), nowIso(),
      MAX_ACTIVE_PER_DOMAIN, dayFrom, MAX_JOBS_PER_DAY, cooldownFrom,
    )
    .run();
  return (result.meta?.changes ?? 0) > 0;
}

/** Po odrzuceniu INSERT-a ustalamy powód – wyłącznie dla komunikatu w UI. */
async function rejectionReason(env, job, cooldownFrom, dayFrom) {
  const existing = await db(env)
    .prepare(
      `SELECT id, status, created_at FROM jobs
       WHERE domain = ? AND post_id = ?
         AND (status IN ('queued','dispatching','running') OR created_at >= ?)
       ORDER BY created_at DESC LIMIT 1`,
    )
    .bind(job.domain, job.post_id, cooldownFrom)
    .first();
  if (existing) {
    return isActive(existing.status)
      ? { code: 'already_running', message: 'Ten wpis ma już zadanie w toku.', job_id: existing.id }
      : {
          code: 'cooldown',
          message: `Ten wpis przechodził reoptymalizację ${existing.created_at.slice(0, 10)}. Kolejne zadanie możliwe po ${COOLDOWN_DAYS} dniach.`,
          job_id: existing.id,
        };
  }
  const active = await db(env)
    .prepare("SELECT COUNT(*) AS n FROM jobs WHERE domain = ? AND status IN ('queued','dispatching','running')")
    .bind(job.domain)
    .first();
  if ((active?.n ?? 0) >= MAX_ACTIVE_PER_DOMAIN) {
    return { code: 'too_many_active', message: `Limit ${MAX_ACTIVE_PER_DOMAIN} równoległych zadań na domenę.` };
  }
  const today = await db(env).prepare('SELECT COUNT(*) AS n FROM jobs WHERE created_at >= ?').bind(dayFrom).first();
  if ((today?.n ?? 0) >= MAX_JOBS_PER_DAY) {
    return { code: 'daily_limit', message: `Dzienny limit ${MAX_JOBS_PER_DAY} zadań wyczerpany.` };
  }
  return { code: 'rejected', message: 'Zadania nie udało się zakolejkować.' };
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
        improvements: job.improvements,
      },
    }),
  });
  if (!response.ok) {
    console.error('repository_dispatch', response.status, await response.text());
    return { ok: false, reason: `http_${response.status}` };
  }
  return { ok: true };
}

/* ---------- handlery ---------- */

async function createJob(request, env) {
  if (!checkMutationOrigin(request)) return json({ error: 'Żądanie odrzucone.' }, 403);
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Nieprawidłowy JSON.' }, 400);
  }
  const parsed = parseJobRequest(body);
  if (!parsed.ok) return json({ error: 'Nieprawidłowe dane zadania.', fields: parsed.errors }, 400);

  const id = crypto.randomUUID();
  const cooldownFrom = new Date(Date.now() - COOLDOWN_DAYS * 86_400_000).toISOString();
  const dayFrom = new Date(Date.now() - 86_400_000).toISOString();

  if (!(await insertJob(env, parsed.job, id, cooldownFrom, dayFrom))) {
    const reason = await rejectionReason(env, parsed.job, cooldownFrom, dayFrom);
    return json({ error: reason.message, code: reason.code, job_id: reason.job_id ?? null }, 409);
  }
  await audit(env, 'job.create', id, { post_id: parsed.job.post_id, improvements: parsed.job.improvements });

  const dispatch = await dispatchWorkflow(env, { id, ...parsed.job });
  if (!dispatch.ok) {
    // Zadanie zostaje w bazie ze stanem `failed` – widać, że dispatch nie
    // wyszedł, i można je ponowić, zamiast czekać na runner, który nie ruszył.
    await db(env)
      .prepare("UPDATE jobs SET status = 'failed', error = ?, updated_at = ?, finished_at = ? WHERE id = ?")
      .bind(
        dispatch.reason === 'not_configured'
          ? 'Brak konfiguracji GH_DISPATCH_TOKEN / GH_REPO w Workerze.'
          : 'Nie udało się uruchomić workflow w GitHub Actions.',
        nowIso(), nowIso(), id,
      )
      .run();
    return json({ error: 'Nie udało się uruchomić pipeline’u.', job_id: id }, 502);
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
    .prepare('SELECT slot, title_field, text_field, operation, title_before, title_after, text_before, text_after, text_hash_before, diff, accepted FROM job_sections WHERE job_id = ? ORDER BY slot')
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
    improvements: parse(job.improvements, []),
    cost: parse(job.cost, {}),
    steps: (steps.results ?? []).map((step) => ({ ...step, payload: parse(step.payload, null), cost: parse(step.cost, null) })),
    sections: (sections.results ?? []).map((section) => ({ ...section, diff: parse(section.diff, null), accepted: section.accepted === 1 })),
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

async function acceptSection(request, env, id, slot) {
  if (!checkMutationOrigin(request)) return json({ error: 'Żądanie odrzucone.' }, 403);
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Nieprawidłowy JSON.' }, 400);
  }
  const accepted = body?.accepted === true;
  const result = await db(env)
    .prepare('UPDATE job_sections SET accepted = ?, accepted_at = ? WHERE job_id = ? AND slot = ?')
    .bind(accepted ? 1 : 0, accepted ? nowIso() : null, id, slot)
    .run();
  if ((result.meta?.changes ?? 0) === 0) return json({ error: 'Nie ma takiej sekcji.' }, 404);
  await audit(env, 'section.accept', id, { slot, accepted });
  return json({ ok: true });
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
  if (raw.length > MAX_CALLBACK_BYTES) return json({ error: 'Payload za duży.' }, 413);

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
    return json({ error: 'Nieprawidłowy JSON.' }, 400);
  }
  const parsed = parseCallback(body);
  if (!parsed.ok) return json({ error: 'Nieprawidłowy callback.', fields: parsed.errors }, 400);
  const cb = parsed.callback;

  const job = await db(env).prepare('SELECT * FROM jobs WHERE id = ?').bind(cb.job_id).first();
  if (!job) return json({ error: 'Nie ma takiego zadania.' }, 404);

  // Callback ze starszego przebiegu nie nadpisuje nowszego wyniku.
  if (job.run_id && String(job.run_id) !== cb.run_id) return json({ error: 'Callback z innego przebiegu.' }, 409);
  if (job.run_attempt && cb.run_attempt < job.run_attempt) return json({ error: 'Callback ze starszej próby.' }, 409);
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
    if (!Number.isFinite(slot) || slot < 1 || slot > 30) continue;
    statements.push(
      db(env)
        .prepare(
          `INSERT INTO job_sections (job_id, slot, title_field, text_field, operation, title_before, title_after, text_before, text_after, text_hash_before, diff)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
           ON CONFLICT (job_id, slot) DO UPDATE SET
             title_field = ?3, text_field = ?4, operation = ?5, title_before = ?6, title_after = ?7,
             text_before = ?8, text_after = ?9, text_hash_before = ?10, diff = ?11`,
        )
        .bind(
          cb.job_id, slot,
          section.title_field ?? `page_title_h2_${slot}`,
          section.text_field ?? `page_text_${slot}`,
          section.operation === 'insert' ? 'insert' : 'update',
          section.title_before ?? null, section.title_after ?? null,
          section.text_before ?? null, section.text_after ?? null,
          section.text_hash_before ?? null,
          section.diff ? JSON.stringify(section.diff) : null,
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
      `UPDATE jobs SET status = 'stale', updated_at = ?, error = COALESCE(error, 'Runner przestał raportować postęp.')
       WHERE status IN ('queued','dispatching','running') AND lease_expires_at IS NOT NULL AND lease_expires_at < ?`,
    )
    .bind(nowIso(), nowIso())
    .run();
}

/**
 * Trasy Content Watchera. Zwraca `null`, gdy ścieżka nie należy do tego modułu.
 * `beforeAuth` = wywołanie sprzed bramki Basic Auth (tylko callback).
 */
export async function routeContentWatcher(request, env, { beforeAuth = false } = {}) {
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

  const jobMatch = url.pathname.match(/^\/api\/cw\/jobs\/([a-z0-9-]{8,64})(\/(cancel|sections\/(\d{1,2})))?\/?$/i);
  if (jobMatch) {
    const [, id, , action, slot] = jobMatch;
    if (action === 'cancel') {
      if (request.method !== 'POST') return json({ error: 'Dozwolona metoda: POST.' }, 405);
      return cancelJob(request, env, id);
    }
    if (slot) {
      if (request.method !== 'PATCH') return json({ error: 'Dozwolona metoda: PATCH.' }, 405);
      return acceptSection(request, env, id, Number.parseInt(slot, 10));
    }
    if (request.method !== 'GET') return json({ error: 'Dozwolona metoda: GET.' }, 405);
    await sweepStale(env);
    const job = await readJob(env, id);
    return job ? json({ job }) : json({ error: 'Nie ma takiego zadania.' }, 404);
  }

  return json({ error: 'Nieznana trasa Content Watchera.' }, 404);
}
