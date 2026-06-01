import { emailShell, escapeHtml } from '../email-shell';
import { heading, paragraph, section, statGrid, actionItems } from './components';

type BotsResult = {
  domain: string;
  summary: { allowed: number; blocked: number; criticalBlocked: number; total: number };
  bots: Array<{ name: string; allowed: boolean; critical: boolean }>;
  actionItems: Array<{ priority: string; title: string; description: string }>;
};

export function renderReport(result: BotsResult, _query: string): { subject: string; html: string } {
  const botsHtml = result.bots
    .map(
      (b) =>
        `<div style="padding:6px 0;border-bottom:1px solid #e2e8f0;font-size:14px;color:#0f172a;">` +
        `${b.allowed ? '✅' : '⛔'} ${escapeHtml(b.name)}` +
        `${b.critical ? ' <span style="color:#64748b;font-size:12px;">(krytyczny)</span>' : ''}` +
        `</div>`,
    )
    .join('');

  const body =
    heading(`Raport dostępu botów AI: ${result.domain}`) +
    paragraph('Które boty AI mają dostęp do Twojej strony wg robots.txt.') +
    section('Podsumowanie', statGrid([
      ['Dozwolone', String(result.summary.allowed)],
      ['Zablokowane', String(result.summary.blocked)],
      ['Krytyczne zablok.', String(result.summary.criticalBlocked)],
    ])) +
    section('Boty', botsHtml) +
    (result.actionItems.length ? section('Rekomendacje', actionItems(result.actionItems)) : '');

  return {
    subject: `Raport dostępu botów AI: ${result.domain} – widocznosc.ai`,
    html: emailShell(body, `${result.summary.blocked} botów zablokowanych na ${result.domain}`),
  };
}
