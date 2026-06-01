import { emailShell, escapeHtml } from '../email-shell';
import { heading, paragraph, section, statGrid, actionItems } from './components';

const SCORE_PL: Record<string, string> = { '1': 'tak', '0.5': 'częściowo', '0': 'nie' };

type UrlResult = {
  url: string; finalUrl: string;
  score: { total: number; grade: string; factors: Array<{ label: string; score: number; evidence: string }> };
  actionItems: Array<{ priority: string; title: string; description: string }>;
};

export function renderReport(result: UrlResult, _query: string): { subject: string; html: string } {
  const factorsHtml = result.score.factors
    .map(
      (f) =>
        `<div style="border-bottom:1px solid #e2e8f0;padding:8px 0;">` +
        `<strong style="font-size:14px;color:#0f172a;">${escapeHtml(f.label)}</strong> ` +
        `<span style="font-size:13px;color:#0068cc;">— ${escapeHtml(SCORE_PL[String(f.score)] ?? String(f.score))}</span>` +
        `<div style="font-size:13px;line-height:1.6;color:#64748b;">${escapeHtml(f.evidence)}</div>` +
        `</div>`,
    )
    .join('');

  const body =
    heading(`Raport AI-readiness: ${result.finalUrl}`, `Ocena: ${result.score.grade}`) +
    paragraph(`Jak dobrze strona jest przygotowana pod cytowanie przez AI. Wynik: ${result.score.total}/100.`) +
    section('Podsumowanie', statGrid([
      ['Wynik', `${result.score.total}/100`],
      ['Ocena', result.score.grade],
    ])) +
    section('Czynniki', factorsHtml) +
    (result.actionItems.length ? section('Rekomendacje', actionItems(result.actionItems)) : '');

  return {
    subject: `Raport AI-readiness: ${result.finalUrl} – widocznosc.ai`,
    html: emailShell(body, `AI-readiness ${result.score.total}/100 (${result.score.grade})`),
  };
}
