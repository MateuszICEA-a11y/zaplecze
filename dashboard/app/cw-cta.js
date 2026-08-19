/**
 * Content Watcher – uniwersalne CTA w sekcji.
 *
 * Bez modelu: gotowa, ostylowana wstawka (paleta serwisu, styl inline jak przy
 * karcie eksperta i infografice – do CSS motywu WordPressa nie mamy dostępu).
 * Redaktor klika „CTA" przy sekcji i wstawia blok na jej koniec, tą samą
 * ścieżką co infografika (job_sections.text_after → podgląd → zapis do WP).
 *
 * Rozpoznawanie bloku: sanityzacja zdejmuje klasy (poza blockquote.expert),
 * więc znacznikiem jest kotwica w adresie przycisku (#cw-cta). Fragment nie
 * psuje analityki (w przeciwieństwie do utm_* na linku wewnętrznym, które
 * ucinałyby sesję GA4).
 *
 * Świadomy duplikat: podgląd bloku w edytorze (edytor.astro, CTA_PREVIEW) –
 * ten sam HTML po obu stronach.
 */

import { checkMutationOrigin, sanitizeSectionHtml } from './cw-api.js';
import { ensureSectionText, sectionForSlot } from './cw-infographic.js';
import { ACF_FIELD } from './cw-wp.js';

export const CTA_VERSION = '1.2.0';

/** Znacznik obecności CTA w treści sekcji – przeżywa sanityzację.
    Kotwica zamiast utm_* celowo: parametry utm na linku wewnętrznym ucinałyby
    sesję GA4. Przycisk kieruje na /kontakt/ (decyzja 2026-08-19; krótki epizod
    1.1.0 z mailto cofnięty tego samego dnia). */
export const CTA_MARKER = 'kontakt/#cw-cta';
/** Znacznik bloków wstawionych wersją 1.1.0 (mailto) – żeby dało się je zdjąć. */
export const CTA_MARKER_LEGACY = 'mailto:biuro@grupa-icea.pl';

const CTA_STYLE = {
  box: 'margin:28px 0;padding:26px 28px;background:#000623;border-radius:12px',
  head: 'margin:0 0 6px;color:#ffffff;font-size:19px;font-weight:700;line-height:1.4',
  text: 'margin:0 0 18px;color:#c7cbe0;font-size:15px;line-height:1.6',
  button: 'display:inline-block;padding:12px 26px;background:#5768ff;color:#ffffff;'
    + 'border-radius:8px;font-weight:700;font-size:15px',
};

/* Link stylowany przez wewnętrzny <span> – sanityzacja nie przepuszcza `style`
   na <a>. */
export function ctaHtml() {
  return `<div style="${CTA_STYLE.box}">`
    + `<p style="${CTA_STYLE.head}">Chcesz, żeby klienci znajdowali Twoją firmę w Google i w wyszukiwarkach AI?</p>`
    + `<p style="${CTA_STYLE.text}">Przeanalizujemy Twoją stronę i pokażemy, co blokuje jej widoczność. Konsultacja jest bezpłatna i niezobowiązująca.</p>`
    + `<a href="https://www.grupa-icea.pl/${CTA_MARKER}"><span style="${CTA_STYLE.button}">Umów bezpłatną konsultację</span></a>`
    + '</div>';
}

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');

/** Usuwa blok CTA z treści – po znaczniku (bieżącym albo z wersji 1.0.0), nie
    po dosłownym szablonie, żeby zmiana stylistyki nie zostawiała starych
    bloków na zawsze. Szablon nie zagnieżdża <div>, więc dopasowanie do
    pierwszego </div> za znacznikiem jest bezpieczne. */
export function stripCta(text) {
  let out = String(text ?? '');
  for (const marker of [CTA_MARKER, CTA_MARKER_LEGACY]) {
    const pattern = new RegExp(
      String.raw`\n?<div[^>]*>(?:(?!<\/div>)[\s\S])*?${escapeRegex(marker)}(?:(?!<\/div>)[\s\S])*?<\/div>`,
      'g',
    );
    out = out.replace(pattern, '');
  }
  return out;
}

export const hasCta = (text) =>
  String(text ?? '').includes(CTA_MARKER) || String(text ?? '').includes(CTA_MARKER_LEGACY);

const json = (value, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

const nowIso = () => new Date().toISOString();
const db = (env) => env.CW_DB;

async function audit(env, action, jobId, detail) {
  await db(env)
    .prepare('INSERT INTO audit_log (at, actor, action, job_id, detail) VALUES (?, ?, ?, ?, ?)')
    .bind(nowIso(), 'dashboard', action, jobId ?? null, detail ? JSON.stringify(detail) : null)
    .run();
}

/**
 * POST /api/cw/jobs/:id/cta/:slot – {step:'insert'} dokleja blok na koniec
 * sekcji, {step:'drop'} zdejmuje go z treści. Stan wynika z samej treści
 * (znacznik #cw-cta) – osobnej tabeli nie ma.
 */
export async function handleCta(request, env, id, slot, { fetchImpl = fetch } = {}) {
  if (!checkMutationOrigin(request)) return json({ error: 'Żądanie odrzucone.' }, 403);
  const job = await db(env).prepare('SELECT * FROM jobs WHERE id = ?').bind(id).first();
  if (!job) return json({ error: 'Nie ma takiego zadania.' }, 404);
  if (job.status !== 'done') return json({ error: 'CTA będzie dostępne po zakończeniu analizy.' }, 409);
  if (slot > 100) return json({ error: 'CTA nie wchodzi do bloku FAQ – wybierz sekcję treści.' }, 400);

  const body = await request.json().catch(() => null);
  const step = String(body?.step ?? '').trim();

  const found = await sectionForSlot(env, job, slot, fetchImpl);
  if (found.error) return json({ error: found.error }, found.status ?? 502);

  if (step === 'insert') {
    if (hasCta(found.row.text)) return json({ error: 'Ta sekcja już ma blok CTA.' }, 409);
    if (!ACF_FIELD.test(found.row.text_field ?? '') || !ACF_FIELD.test(found.row.title_field ?? '')) {
      return json({ error: 'Ta sekcja nie ma pól ACF – bloku nie da się zapisać.' }, 409);
    }
    const block = sanitizeSectionHtml(ctaHtml());
    await ensureSectionText(env, id, slot, found.row, `${found.row.text}\n${block}`);
    await audit(env, 'cta.insert', id, { slot, version: CTA_VERSION });
    return json({ ok: true, inserted: true });
  }

  if (step === 'drop') {
    if (!hasCta(found.row.text)) return json({ error: 'W tej sekcji nie ma bloku CTA.' }, 404);
    await ensureSectionText(env, id, slot, found.row, stripCta(found.row.text));
    await audit(env, 'cta.drop', id, { slot });
    return json({ ok: true, inserted: false });
  }

  return json({ error: 'Nieznany krok. Dozwolone: insert, drop.' }, 400);
}
