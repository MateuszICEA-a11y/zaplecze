import { emailShell, escapeHtml } from '../email-shell';
import { heading, paragraph, section, statGrid, list, actionItems } from './components';

type BotsResult = {
  domain: string;
  summary: { allowed: number; blocked: number; criticalBlocked: number; total: number };
  bots: Array<{ name: string; allowed: boolean; critical: boolean }>;
  actionItems: Array<{ priority: string; title: string; description: string }>;
  page?: {
    edge: { cloudflare: boolean; server: string | null } | null;
    directiveSummary: Record<string, boolean>;
    probes: Array<{ name: string; verdict: string; status: number | null; note: string }>;
    disclaimer: string;
    error?: string;
  };
};

const VERDICT_LABEL: Record<string, string> = {
  ok: 'przechodzi',
  'ua-blocked': 'blokada po User-Agencie',
  challenged: 'challenge CDN',
  'both-blocked': 'strona nie odpowiada',
  thin: 'okrojona treść',
  unknown: 'bez rozstrzygnięcia',
};

/** Sekcja „warstwa serwera" – tylko gdy sonda się udała i ma co pokazać. */
function pageSection(page: NonNullable<BotsResult['page']>): string {
  if (page.error) {
    return paragraph(`Nie udało się sprawdzić samej strony (${page.error}).`);
  }

  const flags = Object.entries(page.directiveSummary)
    .filter(([, on]) => on)
    .map(([name]) => name);

  const edgeLine = page.edge?.cloudflare
    ? 'Cloudflare przed domeną: tak'
    : `Cloudflare przed domeną: nie wykryto${page.edge?.server ? ` (server: ${page.edge.server})` : ''}`;

  const directiveLine = flags.length
    ? `Dyrektywy na stronie: ${flags.join(', ')}`
    : 'Dyrektywy na stronie: brak noindex / noai';

  const probesHtml = page.probes
    .map(
      (p) =>
        `<div style="padding:6px 0;border-bottom:1px solid #e2e8f0;font-size:14px;color:#0f172a;">` +
        `${p.verdict === 'ok' ? '✅' : p.verdict === 'unknown' ? '❔' : '⛔'} ${escapeHtml(p.name)} – ` +
        `${escapeHtml(VERDICT_LABEL[p.verdict] ?? p.verdict)}` +
        `${p.status ? ` (HTTP ${p.status})` : ''}` +
        `</div>`
    )
    .join('');

  return list([edgeLine, directiveLine]) + probesHtml + paragraph(page.disclaimer);
}

export function renderReport(
  result: BotsResult,
  _query: string
): { subject: string; html: string } {
  const botsHtml = result.bots
    .map(
      (b) =>
        `<div style="padding:6px 0;border-bottom:1px solid #e2e8f0;font-size:14px;color:#0f172a;">` +
        `${b.allowed ? '✅' : '⛔'} ${escapeHtml(b.name)}` +
        `${b.critical ? ' <span style="color:#64748b;font-size:12px;">(krytyczny)</span>' : ''}` +
        `</div>`
    )
    .join('');

  const body =
    heading(`Raport dostępu botów AI: ${result.domain}`) +
    paragraph(
      'Które boty AI mają dostęp do Twojej strony – wg robots.txt i wg tego, co robi serwer.'
    ) +
    section(
      'Podsumowanie',
      statGrid([
        ['Dozwolone', String(result.summary.allowed)],
        ['Zablokowane', String(result.summary.blocked)],
        ['Krytyczne zablok.', String(result.summary.criticalBlocked)],
      ])
    ) +
    section('Boty wg robots.txt', botsHtml) +
    (result.page ? section('Warstwa serwera', pageSection(result.page)) : '') +
    (result.actionItems.length ? section('Rekomendacje', actionItems(result.actionItems)) : '');

  return {
    subject: `Raport dostępu botów AI: ${result.domain} – widocznosc.ai`,
    html: emailShell(body, `${result.summary.blocked} botów zablokowanych na ${result.domain}`),
  };
}
