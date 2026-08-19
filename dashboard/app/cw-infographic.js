/**
 * Content Watcher – infografika do wskazanej sekcji wpisu.
 *
 * Cztery kroki, każdy osobnym żądaniem, bo generowanie obrazu trwa dłużej niż
 * życie żądania Workera (kie.ai oddaje obraz po 30–180 s):
 *   1. `brief`    – model czyta sekcję i proponuje OPIS grafiki (edytowalny),
 *   2. `generate` – kie.ai createTask; taskId ląduje w job_images,
 *   3. GET        – odpytanie kie.ai o stan; gotowy obraz ma adres tymczasowy,
 *   4. `insert`   – obraz wchodzi do biblioteki mediów WordPressa (adres z kie.ai
 *                   wygasa) i jako <figure> na koniec sekcji.
 *
 * Styl grafiki NIE pochodzi od modelu – jest stałą marki (paleta i typografia
 * z ICEA Brand Manual). Model dobiera wyłącznie treść ilustracji, więc żadna
 * edycja opisu nie wyprowadzi obrazka poza identyfikację wizualną.
 *
 * Świadomy duplikat: pipeline/grupa-icea-article-images.py (STYLE_ICEA i reguły
 * pisowni polskich znaków dla gpt-image-2 – model dokłada kreski i ogonki nad
 * literami, które ich nie mają, jeśli mu się tego wprost nie zabroni).
 */

import { checkMutationOrigin, contentDomains, sanitizeSectionHtml } from './cw-api.js';
import { extractJson } from './cw-expert.js';
import { styleDocument } from './cw-style.js';
import { ACF_FIELD, contentHash, postUrl, wpAuth, wpFetch } from './cw-wp.js';

const json = (value, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

const nowIso = () => new Date().toISOString();
const db = (env) => env.CW_DB;

export const KIE_API_BASE = 'https://api.kie.ai/api/v1/jobs';
export const KIE_MODEL = 'gpt-image-2-text-to-image';
export const BRIEF_MODEL = 'google/gemini-3.7-flash';
export const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const TIMEOUT_MS = 60_000;

/** Styl marki – lustro STYLE_ICEA z pipeline/grupa-icea-article-images.py. */
export const STYLE_ICEA =
  'Premium brand design for a digital marketing agency. Deep midnight navy '
  + 'background (#000623). Color palette strictly limited to: midnight navy '
  + '#000623, vivid periwinkle blue #5768FF, soft off-white #F9F9F9, and warm '
  + 'coral orange #F6704C used ONLY as a small accent on the navy background – '
  + 'orange must never touch or sit next to blue elements. Clean geometric '
  + 'sans-serif typography (Roobert/Inter style), low contrast letterforms. '
  + 'Minimal, technical, high-end consultancy aesthetic. Generous negative '
  + 'space, crisp thin lines, no gradients except subtle glows, no decorative '
  + 'clutter. 16:9 aspect ratio. Modern editorial infographic with Polish text '
  + 'labels. ';

/** Reguła pisowni: gpt-image-2 dokłada akcenty tam, gdzie ich nie ma. */
export const SPELLING_RULE =
  ' SPELLING RULES for every Polish label above: reproduce each word letter by '
  + 'letter exactly as given. Never add accents, diacritics, dots or marks to '
  + 'letters that do not have them in the provided text, and never drop the '
  + 'diacritics from letters that do have them (ą, ć, ę, ł, ń, ó, ś, ź, ż). '
  + 'Do not translate, shorten or rephrase the labels.';

export const finalPrompt = (brief) => `${STYLE_ICEA}${String(brief ?? '').trim()}${SPELLING_RULE}`;

/* ---------- opis grafiki (OpenRouter) ---------- */

const stripTags = (html) =>
  String(html ?? '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

export function buildBriefPrompt({ title, section }) {
  return `Projektujesz infografikę do jednej sekcji artykułu o SEO i AI search. Twoim zadaniem jest OPIS zawartości grafiki – styl marki (paleta, typografia, format) jest narzucony osobno i nie zajmujesz się nim.

## Artykuł
${title}

## Sekcja do zilustrowania
Nagłówek: ${section.title || '(bez nagłówka)'}

${stripTags(section.text).slice(0, 6000)}

## Zadanie

Zwróć wyłącznie JSON:

{
  "brief": "opis zawartości grafiki po angielsku: układ, elementy, etykiety",
  "alt": "tekst alternatywny po polsku, jedno zdanie",
  "caption": "podpis pod grafiką po polsku, jedno zdanie"
}

Zasady opisu w polu "brief":
- Pisz po angielsku (tak działa model graficzny), ale WSZYSTKIE etykiety widoczne na obrazie podawaj po polsku, w apostrofach, dokładnie w brzmieniu, w jakim mają się pojawić.
- Zilustruj mechanizm albo zależność z tej sekcji – schemat, przepływ, porównanie, oś czasu. Nie dekoracyjną abstrakcję.
- Maksymalnie 8 etykiet tekstowych, każda do czterech słów. Model graficzny psuje dłuższe napisy.
- Podaj układ wprost: co stoi na górze, co po lewej, co do czego prowadzi.
- Nie wymyślaj liczb, których nie ma w sekcji. Jeśli sekcja nie podaje danych, zbuduj schemat bez liczb.
- Nie proś o logo, znaki firmowe ani zdjęcia ludzi.`;
}

export async function generateBrief(env, job, section, { fetchImpl = fetch } = {}) {
  const apiKey = (env.OPENROUTER_API_KEY || '').trim();
  if (!apiKey) return { ok: false, error: 'Brak sekretu OPENROUTER_API_KEY w Workerze.' };

  const models = typeof job.models === 'string' ? JSON.parse(job.models || 'null') : job.models;
  const model = (env.CW_BRIEF_MODEL || '').trim() || models?.writer || BRIEF_MODEL;
  let response;
  try {
    response = await fetchImpl('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://zaplecze-dashboard.m-wisniewski.workers.dev',
        'X-Title': 'Content Watcher - infografika',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: buildBriefPrompt({ title: job.title, section }) }],
        temperature: 0.5,
        max_tokens: 1500,
        ...(model.includes(':online') || model.startsWith('perplexity/')
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
    console.error('cw infographic brief', response.status, detail.slice(0, 300));
    return { ok: false, error: `Błąd usługi OpenRouter: ${response.status}.` };
  }
  const payload = await response.json().catch(() => null);
  const data = extractJson(payload?.choices?.[0]?.message?.content ?? '');
  if (!data?.brief) return { ok: false, error: 'Model nie zwrócił opisu grafiki.' };
  return {
    ok: true,
    data: {
      brief: String(data.brief).slice(0, 4000),
      alt: String(data.alt ?? '').slice(0, 300),
      caption: String(data.caption ?? '').slice(0, 300),
    },
    model: payload?.model ?? model,
    cost: {
      tokens_in: payload?.usage?.prompt_tokens ?? 0,
      tokens_out: payload?.usage?.completion_tokens ?? 0,
    },
  };
}

/* ---------- kie.ai (gpt-image-2) ---------- */

export async function createImageTask(env, brief, { fetchImpl = fetch } = {}) {
  const apiKey = (env.KIE_API_KEY || '').trim();
  if (!apiKey) return { ok: false, error: 'Brak sekretu KIE_API_KEY w Workerze.' };
  let response;
  try {
    response = await fetchImpl(`${KIE_API_BASE}/createTask`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: KIE_MODEL,
        input: { prompt: finalPrompt(brief), aspect_ratio: '16:9' },
      }),
      signal: AbortSignal.timeout(30_000),
    });
  } catch (err) {
    return { ok: false, error: `Brak odpowiedzi od kie.ai: ${err instanceof Error ? err.message : err}` };
  }
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.code !== 200 || !payload?.data?.taskId) {
    console.error('cw infographic createTask', response.status, JSON.stringify(payload ?? {}).slice(0, 300));
    return { ok: false, error: `kie.ai odrzuciło zlecenie: ${payload?.msg ?? `HTTP ${response.status}`}.` };
  }
  return { ok: true, taskId: String(payload.data.taskId) };
}

/** Stan zlecenia. Zwraca {state:'generating'|'ready'|'failed', url, credits, error}. */
export async function pollImageTask(env, taskId, { fetchImpl = fetch } = {}) {
  const apiKey = (env.KIE_API_KEY || '').trim();
  if (!apiKey) return { state: 'failed', error: 'Brak sekretu KIE_API_KEY w Workerze.' };
  let response;
  try {
    response = await fetchImpl(`${KIE_API_BASE}/recordInfo?taskId=${encodeURIComponent(taskId)}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(30_000),
    });
  } catch (err) {
    // Pojedyncze nieudane odpytanie nie kończy zlecenia – przeglądarka spróbuje
    // ponownie, obraz po stronie kie.ai dalej się generuje.
    return { state: 'generating', error: err instanceof Error ? err.message : String(err) };
  }
  const payload = await response.json().catch(() => null);
  const data = payload?.data ?? {};
  if (data.state === 'success') {
    let result = {};
    try {
      result = JSON.parse(data.resultJson || '{}');
    } catch { /* pusty wynik obsłużony niżej */ }
    const url = (result.resultUrls ?? [result.imageUrl]).find(Boolean);
    return url
      ? { state: 'ready', url: String(url), credits: data.creditsConsumed ?? null }
      : { state: 'failed', error: 'kie.ai zgłosiło sukces bez adresu obrazu.' };
  }
  if (data.state === 'failed' || data.state === 'fail') {
    return { state: 'failed', error: String(data.failMsg || 'Generowanie obrazu nie udało się.') };
  }
  return { state: 'generating' };
}

/* ---------- biblioteka mediów WordPressa ---------- */

const slug = (text) =>
  String(text ?? '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/ł/g, 'l')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || 'infografika';

/**
 * Wgranie obrazu do biblioteki mediów. Adres z kie.ai jest tymczasowy, więc bez
 * tego kroku obrazek zniknąłby z wpisu po kilku dniach.
 */
export async function uploadToMedia(env, base, imageUrl, { filename, alt, caption }, fetchImpl = fetch) {
  const auth = wpAuth(env);
  if (!auth) return { ok: false, error: 'Brak sekretów WP_APP_USER / WP_APP_PASSWORD w Workerze.' };

  let bytes;
  try {
    const source = await fetchImpl(imageUrl, { signal: AbortSignal.timeout(60_000) });
    if (!source.ok) return { ok: false, error: `Nie udało się pobrać obrazu (HTTP ${source.status}).` };
    bytes = await source.arrayBuffer();
  } catch (err) {
    return { ok: false, error: `Nie udało się pobrać obrazu: ${err instanceof Error ? err.message : err}` };
  }
  if (bytes.byteLength > MAX_IMAGE_BYTES) {
    return { ok: false, error: `Obraz jest większy niż ${Math.round(MAX_IMAGE_BYTES / 1024 / 1024)} MB.` };
  }

  let upload;
  try {
    upload = await fetchImpl(postUrl(base, 'media'), {
      method: 'POST',
      headers: {
        Authorization: auth,
        Accept: 'application/json',
        'User-Agent': 'content-refresher',
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
      body: bytes,
      signal: AbortSignal.timeout(60_000),
    });
  } catch (err) {
    return { ok: false, error: `WordPress nie przyjął pliku: ${err instanceof Error ? err.message : err}` };
  }
  const data = await upload.json().catch(() => null);
  if (!upload.ok || !data?.id) {
    console.error('cw infographic media', upload.status, JSON.stringify(data ?? {}).slice(0, 300));
    return {
      ok: false,
      // Konto redaktora bez prawa upload_files odbija się właśnie tutaj –
      // kod WP-a mówi wprost, czy to uprawnienia, czy WAF.
      error: `WordPress odrzucił wgranie obrazu (HTTP ${upload.status}${data?.code ? `, ${data.code}` : ''}).`,
      code: typeof data?.code === 'string' ? data.code : null,
    };
  }

  // Alt i podpis idą osobnym zapisem – multipartowy upload ich nie przyjmuje.
  if (alt || caption) {
    await wpFetch(env, postUrl(base, 'media', data.id), {
      method: 'POST',
      body: { alt_text: alt ?? '', caption: caption ?? '' },
    }, fetchImpl).catch(() => null);
  }
  return { ok: true, id: data.id, url: String(data.source_url ?? '') };
}

/* ---------- blok w treści ---------- */

/* Wygląd niesiony w `style`, bo do CSS motywu WordPressa nie mamy dostępu
   (ta sama przyczyna co przy karcie eksperta – konto ma rolę editor).
   Kolory z palety serwisu: #000623, #6e7181. */
export const FIGURE_STYLE = {
  figure: 'margin:28px 0;padding:0',
  image: 'width:100%;height:auto;border-radius:8px;display:block',
  caption: 'margin:10px 0 0;color:#6e7181;font-size:14px;line-height:1.6',
};

export function figureHtml({ src, alt, caption }) {
  // Alt i podpis pochodzą od modelu – wpuszczamy sam tekst. Znaczniki lecą
  // razem z zawartością, żeby w alcie nie zostawało samotne „b" po <b>.
  const plain = (value) => String(value ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  const safeAlt = plain(alt).replace(/["<>]/g, '');
  const safeCaption = plain(caption).replace(/[<>]/g, '');
  return `<figure style="${FIGURE_STYLE.figure}">`
    + `<img src="${src}" alt="${safeAlt}" style="${FIGURE_STYLE.image}" />`
    + (safeCaption ? `<figcaption style="${FIGURE_STYLE.caption}">${safeCaption}</figcaption>` : '')
    + '</figure>';
}

/* ---------- handler ---------- */

async function readRecord(env, jobId, slot) {
  return db(env)
    .prepare('SELECT * FROM job_images WHERE job_id = ? AND slot = ?')
    .bind(jobId, slot)
    .first();
}

async function saveRecord(env, jobId, slot, patch) {
  const columns = Object.keys(patch);
  const stamp = nowIso();
  await db(env)
    .prepare(
      `INSERT INTO job_images (job_id, slot, ${columns.join(', ')}, created_at, updated_at)
       VALUES (?, ?, ${columns.map(() => '?').join(', ')}, ?, ?)
       ON CONFLICT (job_id, slot) DO UPDATE SET
         ${columns.map((column) => `${column} = excluded.${column}`).join(', ')},
         updated_at = excluded.updated_at`,
    )
    .bind(jobId, slot, ...columns.map((column) => patch[column]), stamp, stamp)
    .run();
  return readRecord(env, jobId, slot);
}

async function audit(env, action, jobId, detail) {
  await db(env)
    .prepare('INSERT INTO audit_log (at, actor, action, job_id, detail) VALUES (?, ?, ?, ?, ?)')
    .bind(nowIso(), 'dashboard', action, jobId ?? null, detail ? JSON.stringify(detail) : null)
    .run();
}

/** Sekcja w brzmieniu, które redaktor ma przed sobą (propozycja albo CMS). */
export async function sectionForSlot(env, job, slot, fetchImpl) {
  const sections = await db(env)
    .prepare('SELECT slot, title_field, text_field, title_after, text_after, decision FROM job_sections WHERE job_id = ? ORDER BY slot')
    .bind(job.id)
    .all();
  const doc = await styleDocument(env, job, sections.results ?? [], fetchImpl);
  if (doc.error) return doc;
  const row = doc.rows.find((item) => item.slot === slot);
  // Komunikat neutralny – z tej funkcji korzysta też CTA (cw-cta.js).
  return row ? { row } : { error: 'W tej sekcji nie ma treści.', status: 404 };
}

/**
 * /api/cw/jobs/:id/infographic/:slot
 *   GET                         – stan (z odpytaniem kie.ai, gdy obraz się liczy)
 *   POST {step:'brief'}         – propozycja opisu grafiki
 *   POST {step:'generate'}      – zlecenie obrazu (brief z ciała żądania)
 *   POST {step:'insert'}        – biblioteka mediów + <figure> w sekcji
 *   POST {step:'drop'}          – zdjęcie bloku z sekcji i skasowanie zapisu
 */
export async function handleInfographic(request, env, id, slot, { fetchImpl = fetch } = {}) {
  const job = await db(env).prepare('SELECT * FROM jobs WHERE id = ?').bind(id).first();
  if (!job) return json({ error: 'Nie ma takiego zadania.' }, 404);

  if (request.method === 'GET') {
    const record = await readRecord(env, id, slot);
    if (!record) return json({ image: null });
    if (record.status !== 'generating' || !record.task_id) return json({ image: record });
    const poll = await pollImageTask(env, record.task_id, { fetchImpl });
    if (poll.state === 'ready') {
      const fresh = await saveRecord(env, id, slot, {
        status: 'ready',
        image_url: poll.url,
        credits: poll.credits === null ? null : String(poll.credits),
        error: null,
      });
      return json({ image: fresh });
    }
    if (poll.state === 'failed') {
      const fresh = await saveRecord(env, id, slot, { status: 'failed', error: poll.error });
      return json({ image: fresh });
    }
    return json({ image: record });
  }

  if (!checkMutationOrigin(request)) return json({ error: 'Żądanie odrzucone.' }, 403);
  if (job.status !== 'done') {
    return json({ error: 'Infografika będzie dostępna po zakończeniu analizy.' }, 409);
  }
  const body = await request.json().catch(() => null);
  const step = String(body?.step ?? '').trim();

  if (step === 'brief') {
    const found = await sectionForSlot(env, job, slot, fetchImpl);
    if (found.error) return json({ error: found.error }, found.status ?? 502);
    const result = await generateBrief(env, job, found.row, { fetchImpl });
    if (!result.ok) return json({ error: result.error }, 502);
    const record = await saveRecord(env, id, slot, {
      status: 'brief',
      brief: result.data.brief,
      alt: result.data.alt,
      caption: result.data.caption,
      error: null,
    });
    await audit(env, 'image.brief', id, { slot, model: result.model });
    return json({ image: record });
  }

  if (step === 'generate') {
    const brief = String(body?.brief ?? '').trim();
    if (brief.length < 40) {
      return json({ error: 'Opis grafiki jest za krótki – model potrzebuje układu i etykiet.' }, 400);
    }
    if (brief.length > 4000) return json({ error: 'Opis grafiki jest za długi.' }, 413);
    const task = await createImageTask(env, brief, { fetchImpl });
    if (!task.ok) return json({ error: task.error }, 502);
    const record = await saveRecord(env, id, slot, {
      status: 'generating',
      brief,
      alt: String(body?.alt ?? '').slice(0, 300),
      caption: String(body?.caption ?? '').slice(0, 300),
      task_id: task.taskId,
      image_url: null,
      error: null,
    });
    await audit(env, 'image.generate', id, { slot, task_id: task.taskId });
    return json({ image: record }, 202);
  }

  if (step === 'insert') {
    const record = await readRecord(env, id, slot);
    if (!record?.image_url) return json({ error: 'Najpierw wygeneruj obraz.' }, 409);
    if (record.status === 'inserted') return json({ error: 'Ta infografika już stoi w sekcji.' }, 409);

    const base = contentDomains(env).get(String(job.domain).toLowerCase());
    if (!base) return json({ error: 'Edytor nie obsługuje tej domeny.' }, 400);
    const found = await sectionForSlot(env, job, slot, fetchImpl);
    if (found.error) return json({ error: found.error }, found.status ?? 502);
    if (!ACF_FIELD.test(found.row.text_field ?? '') || !ACF_FIELD.test(found.row.title_field ?? '')) {
      return json({ error: 'Ta sekcja nie ma pól ACF – obrazu nie da się zapisać.' }, 409);
    }

    const upload = await uploadToMedia(
      env,
      base,
      record.image_url,
      {
        filename: `${slug(job.title)}-infografika-${slot}.png`,
        alt: record.alt ?? '',
        caption: record.caption ?? '',
      },
      fetchImpl,
    );
    if (!upload.ok) return json({ error: upload.error, code: upload.code ?? null }, 502);

    const figure = sanitizeSectionHtml(figureHtml({ src: upload.url, alt: record.alt, caption: record.caption }));
    if (!/<img\s/i.test(figure)) {
      // Sanityzacja zdjęła obraz (adres nie na https) – nie zapisujemy sekcji
      // z pustym blokiem.
      return json({ error: 'WordPress oddał adres obrazu, którego nie wolno wstawić do treści.' }, 502);
    }
    const text = `${found.row.text}\n${figure}`;
    await ensureSectionText(env, id, slot, found.row, text);
    const fresh = await saveRecord(env, id, slot, {
      status: 'inserted',
      media_id: upload.id,
      media_url: upload.url,
      figure_html: figure,
      error: null,
    });
    await audit(env, 'image.insert', id, { slot, media_id: upload.id });
    return json({ image: fresh });
  }

  if (step === 'drop') {
    const record = await readRecord(env, id, slot);
    if (!record) return json({ error: 'Nie ma takiej infografiki.' }, 404);
    if (record.figure_html) {
      const section = await db(env)
        .prepare('SELECT text_after, text_before FROM job_sections WHERE job_id = ? AND slot = ?')
        .bind(id, slot)
        .first();
      const current = section?.text_after ?? section?.text_before ?? '';
      if (current.includes(record.figure_html)) {
        await db(env)
          .prepare('UPDATE job_sections SET text_after = ? WHERE job_id = ? AND slot = ?')
          .bind(current.replace(`\n${record.figure_html}`, '').replace(record.figure_html, ''), id, slot)
          .run();
      }
    }
    await db(env).prepare('DELETE FROM job_images WHERE job_id = ? AND slot = ?').bind(id, slot).run();
    // Plik zostaje w bibliotece mediów – kasowanie go z Workera zabrałoby
    // obrazek również stronom, które ktoś w międzyczasie mógł nim zilustrować.
    await audit(env, 'image.drop', id, { slot, media_id: record.media_id ?? null });
    return json({ ok: true, media_kept: record.media_id ?? null });
  }

  return json({ error: 'Nieznany krok. Dozwolone: brief, generate, insert, drop.' }, 400);
}

/** Wpisanie treści sekcji – z założeniem wiersza, jeśli pipeline jej nie ruszał
    (ta sama ścieżka co akceptacja korekty stylu w cw-api.js). */
export async function ensureSectionText(env, jobId, slot, row, text) {
  const existing = await db(env)
    .prepare('SELECT slot FROM job_sections WHERE job_id = ? AND slot = ?')
    .bind(jobId, slot)
    .first();
  if (existing) {
    await db(env)
      .prepare('UPDATE job_sections SET text_after = ?, edited = 1 WHERE job_id = ? AND slot = ?')
      .bind(text, jobId, slot)
      .run();
    return;
  }
  await db(env)
    .prepare(
      `INSERT INTO job_sections
         (job_id, slot, title_field, text_field, operation, title_before, title_after,
          text_before, text_after, text_hash_before, accepted, accepted_at, decision, edited)
       VALUES (?, ?, ?, ?, 'update', ?, ?, ?, ?, ?, 1, ?, 'accepted', 1)`,
    )
    .bind(
      jobId, slot, row.title_field, row.text_field,
      row.title ?? '', row.title ?? '',
      row.text ?? '', text, await contentHash(row.text ?? ''), nowIso(),
    )
    .run();
}
