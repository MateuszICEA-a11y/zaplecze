/**
 * Content Watcher – zapis wyników do WordPressa.
 *
 * Przepływ uzgodniony 2026-08-04: edytor tworzy SZKIC (osobny wpis `draft`
 * będący kopią oryginału z podmienionymi sekcjami) do podglądu na szablonie
 * strony; akcept to podmiana pól ACF na ORYGINALE i skasowanie szkicu.
 *
 * Hasło aplikacji (WP_APP_USER/WP_APP_PASSWORD) mieszka wyłącznie w sekretach
 * Workera – przeglądarka nigdy go nie widzi, dostaje tylko wynik operacji.
 */

import { checkMutationOrigin, contentDomains, sanitizeSectionHtml } from './cw-api.js';

const json = (value, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

const nowIso = () => new Date().toISOString();

/* ---------- hash treści (port collector/sources/wordpress.py) ---------- */

const SCRIPT_RE = /<(script|style)[^>]*>[\s\S]*?<\/\1>/gi;
const TAG_RE = /<[^>]+>/g;
const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', hellip: '…' };

function unescapeEntities(text) {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&([a-z]+);/gi, (match, name) => ENTITIES[name.toLowerCase()] ?? match);
}

/** Ta sama normalizacja co `_normalize` w collectorze: bez HTML, encji
    i różnic w białych znakach – zapis w CMS bez zmiany treści nie wygląda
    jak edycja. Hash MUSI zgadzać się z `text_hash_before` z pipeline'u. */
export async function contentHash(text) {
  const plain = unescapeEntities(String(text ?? '').replace(SCRIPT_RE, ' ').replace(TAG_RE, ' '));
  const normalized = plain.replace(/\s+/g, ' ').trim().toLowerCase();
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalized));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

/* ---------- WP REST ---------- */

const ACF_FIELD = /^[a-z0-9_]{1,64}$/;
export const DRAFT_TITLE_PREFIX = '[Szkic CW] ';

function wpAuth(env) {
  const user = String(env.WP_APP_USER ?? '').trim();
  const password = String(env.WP_APP_PASSWORD ?? '').trim();
  if (!user || !password) return null;
  return `Basic ${btoa(`${user}:${password}`)}`;
}

async function wpFetch(env, url, { method = 'GET', body = null } = {}, fetchImpl = fetch) {
  const response = await fetchImpl(url, {
    method,
    redirect: 'follow',
    headers: {
      Accept: 'application/json',
      ...(wpAuth(env) ? { Authorization: wpAuth(env) } : {}),
      // WAF na seohost tnie anonimowe UA – przedstawiamy się jak pipeline.
      'User-Agent': 'content-refresher',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : null,
    signal: AbortSignal.timeout(30_000),
  });
  const raw = await response.text();
  let data = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    /* HTML z WAF-a albo błędu PHP – zostaje null */
  }
  return { status: response.status, ok: response.ok, data };
}

const postUrl = (base, postType, postId = null) =>
  // Końcowy ukośnik jest obowiązkowy – bez niego WP robi 301 (gotcha z wp.py).
  `${base.replace(/\/$/, '')}/wp-json/wp/v2/${postType}/${postId ? `${postId}/` : ''}`;

/* ---------- złożenie finalnych pól ---------- */

const parse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

function expertHtml(job) {
  const expert = parse(job.expert, null);
  if (expert?.status !== 'done' || !expert?.quote) return null;
  const footer = `${expert.expert ?? ''}${expert.role ? `, ${expert.role}` : ''}`;
  // Ten sam format co expertBlockquote w edytorze – „kopiuj cytat" i zapis
  // do WP mają dawać identyczny HTML.
  return { slot: expert.slot ?? null, html: `<blockquote class="expert"><p>${expert.quote}</p><footer>${footer}</footer></blockquote>` };
}

/**
 * Pola ACF do zapisania. Szkic odzwierciedla podgląd całości w edytorze
 * (odrzucone sekcje zostają w brzmieniu z CMS-a, reszta dostaje propozycje);
 * wdrożenie pisze WYŁĄCZNIE sekcje zatwierdzone przez redaktora.
 */
export function acfFieldPayload(job, sections, { forApply = false } = {}) {
  const rows = (sections ?? []).filter((section) => {
    if (section.decision === 'rejected') return false;
    if (forApply && section.decision !== 'accepted') return false;
    return typeof section.text_after === 'string' || typeof section.title_after === 'string';
  });
  const undecided = (sections ?? []).filter(
    (section) => !section.decision && (typeof section.text_after === 'string' || typeof section.title_after === 'string'),
  ).length;

  const expert = expertHtml(job);
  const fields = {};
  const slots = [];
  for (const row of rows) {
    if (!ACF_FIELD.test(row.title_field ?? '') || !ACF_FIELD.test(row.text_field ?? '')) continue;
    let text = sanitizeSectionHtml(row.text_after ?? row.text_before ?? '');
    // Cytat eksperta stoi na końcu wskazanej sekcji – text_after w bazie
    // zostaje czystym wynikiem pipeline'u (jak w sectionCopyText edytora).
    if (expert && expert.slot === row.slot) text = `${text}\n${sanitizeSectionHtml(expert.html)}`;
    fields[row.title_field] = row.title_after ?? row.title_before ?? '';
    fields[row.text_field] = text;
    slots.push(row.slot);
  }
  return { fields, slots, undecided };
}

/** Skalarne pola ACF oryginału – kopiujemy je do szkicu, żeby szablon strony
    miał komplet danych. Obiekty i tablice (obrazki, relacje) zostają za burtą:
    w formacie REST nie wracają bezstratnie i potrafią wywrócić zapis. */
export function scalarAcf(acf) {
  const out = {};
  for (const [key, value] of Object.entries(acf ?? {})) {
    if (!ACF_FIELD.test(key)) continue;
    if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) out[key] = value;
  }
  return out;
}

/* ---------- handlery ---------- */

const db = (env) => env.CW_DB;

async function audit(env, action, jobId, detail) {
  await db(env)
    .prepare('INSERT INTO audit_log (at, actor, action, job_id, detail) VALUES (?, ?, ?, ?, ?)')
    .bind(nowIso(), 'dashboard', action, jobId ?? null, detail ? JSON.stringify(detail) : null)
    .run();
}

async function loadJobContext(env, id) {
  const job = await db(env).prepare('SELECT * FROM jobs WHERE id = ?').bind(id).first();
  if (!job) return { error: json({ error: 'Nie ma takiego zadania.' }, 404) };
  if (job.status !== 'done') {
    return { error: json({ error: 'Zapis do WordPressa jest dostępny po zakończeniu analizy.' }, 409) };
  }
  const base = contentDomains(env).get(String(job.domain).toLowerCase());
  if (!base) return { error: json({ error: 'Edytor nie obsługuje tej domeny.' }, 400) };
  const sections = await db(env)
    .prepare('SELECT slot, title_field, text_field, operation, title_before, title_after, text_before, text_after, text_hash_before, decision FROM job_sections WHERE job_id = ? ORDER BY slot')
    .bind(id)
    .all();
  return { job, base, sections: sections.results ?? [] };
}

/** POST /api/cw/jobs/:id/wp-draft – szkic podglądowy (utworzenie albo aktualizacja). */
export async function handleWpDraft(request, env, id, { fetchImpl = fetch } = {}) {
  if (!checkMutationOrigin(request)) return json({ error: 'Żądanie odrzucone.' }, 403);
  if (!wpAuth(env)) return json({ error: 'Brak sekretów WP_APP_USER / WP_APP_PASSWORD w Workerze.' }, 503);

  const ctx = await loadJobContext(env, id);
  if (ctx.error) return ctx.error;
  const { job, base, sections } = ctx;

  const { fields, slots } = acfFieldPayload(job, sections);
  if (!slots.length) return json({ error: 'Brak propozycji do zapisania w szkicu.' }, 400);

  // Kopia oryginału: surowy tytuł/treść (context=edit) i skalarne pola ACF
  // w formacie „light" – to one wracają bezstratnie przy zapisie.
  const original = await wpFetch(
    env,
    `${postUrl(base, job.post_type, job.post_id)}?context=edit&acf_format=light&_fields=id,title,content,acf,status`,
    {},
    fetchImpl,
  );
  if (!original.ok) {
    return json({ error: `Nie udało się pobrać oryginalnego wpisu (HTTP ${original.status}).`, code: wpErrorCode(original) }, 502);
  }

  const body = {
    status: 'draft',
    title: `${DRAFT_TITLE_PREFIX}${original.data?.title?.raw ?? job.title}`,
    content: original.data?.content?.raw ?? '',
    acf: { ...scalarAcf(original.data?.acf), ...fields },
  };

  // Ponowny zapis aktualizuje istniejący szkic; skasowany ręcznie w CMS-ie
  // (404/410) jest zakładany od nowa.
  let draftId = job.wp_draft_id || null;
  let saved = null;
  if (draftId) {
    saved = await wpFetch(env, postUrl(base, job.post_type, draftId), { method: 'POST', body }, fetchImpl);
    if (saved.status === 404 || saved.status === 410) draftId = null;
  }
  if (!draftId) {
    saved = await wpFetch(env, postUrl(base, job.post_type), { method: 'POST', body }, fetchImpl);
  }
  if (!saved.ok || !saved.data?.id) {
    return json({ error: `WordPress odrzucił zapis szkicu (HTTP ${saved.status}).`, code: wpErrorCode(saved) }, 502);
  }

  const previewUrl = `${base.replace(/\/$/, '')}/?p=${saved.data.id}&preview=true`;
  await db(env)
    .prepare('UPDATE jobs SET wp_draft_id = ?, wp_draft_url = ?, updated_at = ? WHERE id = ?')
    .bind(saved.data.id, previewUrl, nowIso(), id)
    .run();
  await audit(env, 'wp.draft', id, { draft_id: saved.data.id, slots });

  return json({ draft_id: saved.data.id, preview_url: previewUrl, updated: Boolean(job.wp_draft_id && job.wp_draft_id === saved.data.id), slots });
}

/** POST /api/cw/jobs/:id/wp-apply – podmiana treści na oryginale + kasowanie szkicu.
    `?force=1` przeskakuje ostrzeżenie o zmianie treści w CMS-ie po analizie
    oraz blokadę ponownego wdrożenia – nigdy bramkę niezdecydowanych sekcji. */
export async function handleWpApply(request, env, id, { fetchImpl = fetch } = {}) {
  if (!checkMutationOrigin(request)) return json({ error: 'Żądanie odrzucone.' }, 403);
  if (!wpAuth(env)) return json({ error: 'Brak sekretów WP_APP_USER / WP_APP_PASSWORD w Workerze.' }, 503);

  const ctx = await loadJobContext(env, id);
  if (ctx.error) return ctx.error;
  const { job, base, sections } = ctx;
  const force = new URL(request.url).searchParams.get('force') === '1';

  if (job.applied_at && !force) {
    return json({ error: `Zmiany zostały już wdrożone ${job.applied_at.slice(0, 10)}.`, code: 'already_applied' }, 409);
  }

  const { fields, slots, undecided } = acfFieldPayload(job, sections, { forApply: true });
  if (undecided) {
    return json({
      error: `Najpierw oceń wszystkie propozycje – ${undecided} sekcji czeka na decyzję.`,
      code: 'undecided',
      count: undecided,
    }, 409);
  }
  if (!slots.length) return json({ error: 'Brak zatwierdzonych sekcji do wdrożenia.' }, 400);

  // Bramka bezpieczeństwa: propozycje liczono na treści z chwili analizy.
  // Jeśli ktoś w międzyczasie edytował wpis w CMS-ie, hashe się rozjadą –
  // wtedy wdrożenie wymaga świadomego `force` (to samo robi apply w pipeline).
  const current = await wpFetch(
    env,
    `${postUrl(base, job.post_type, job.post_id)}?acf_format=standard&_fields=id,acf`,
    {},
    fetchImpl,
  );
  if (!current.ok) {
    return json({ error: `Nie udało się pobrać oryginalnego wpisu (HTTP ${current.status}).`, code: wpErrorCode(current) }, 502);
  }
  const conflicts = [];
  for (const section of sections) {
    if (section.decision !== 'accepted' || !slots.includes(section.slot)) continue;
    const liveText = String(current.data?.acf?.[section.text_field] ?? '');
    if (section.text_hash_before) {
      if ((await contentHash(liveText)) !== section.text_hash_before) conflicts.push(section.slot);
    } else if (liveText.trim()) {
      // Insert/move celował w wolny slot – zajęty w międzyczasie to konflikt.
      conflicts.push(section.slot);
    }
  }
  if (conflicts.length && !force) {
    return json({
      error: `Treść wpisu zmieniła się w CMS-ie od czasu analizy (sekcje: ${conflicts.join(', ')}).`,
      code: 'content_changed',
      slots: conflicts,
    }, 409);
  }

  const saved = await wpFetch(env, postUrl(base, job.post_type, job.post_id), { method: 'POST', body: { acf: fields } }, fetchImpl);
  if (!saved.ok) {
    return json({ error: `WordPress odrzucił zapis zmian (HTTP ${saved.status}).`, code: wpErrorCode(saved) }, 502);
  }

  // Szkic zrobił swoje – kasujemy z pominięciem kosza. Nieudane kasowanie nie
  // unieważnia wdrożenia, zostaje tylko w odpowiedzi.
  let draftDeleted = null;
  if (job.wp_draft_id) {
    const removed = await wpFetch(env, `${postUrl(base, job.post_type, job.wp_draft_id)}?force=true`, { method: 'DELETE' }, fetchImpl);
    draftDeleted = removed.ok || removed.status === 404 || removed.status === 410;
  }

  const appliedAt = nowIso();
  await db(env)
    .prepare('UPDATE jobs SET applied_at = ?, wp_draft_id = NULL, wp_draft_url = NULL, updated_at = ? WHERE id = ?')
    .bind(appliedAt, appliedAt, id)
    .run();
  await audit(env, 'wp.apply', id, { slots, forced: force || undefined, draft_deleted: draftDeleted });

  return json({ ok: true, applied_at: appliedAt, slots, draft_deleted: draftDeleted });
}

/** Kod błędu WP (rest_cannot_edit, rest_forbidden…) do komunikatu w UI –
    bez niego 502 nie mówi, czy to uprawnienia, czy WAF. */
function wpErrorCode(result) {
  return typeof result?.data?.code === 'string' ? result.data.code : null;
}
