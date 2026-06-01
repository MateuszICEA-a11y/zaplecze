import { emailShell, escapeHtml } from '../email-shell';
import { heading, paragraph, section, statGrid, list, actionItems } from './components';

const SENTIMENT_PL: Record<string, string> = {
  positive: 'pozytywny', neutral: 'neutralny', negative: 'negatywny', mixed: 'mieszany', unknown: 'nieznany',
};
const KNOWS_PL: Record<string, string> = { yes: 'zna', partial: 'częściowo', no: 'nie zna' };

type BrandResult = {
  brand: string; market: string;
  summary: { score: number; knownBy: number; totalModels: number; sentiment: string; competitors: string[] };
  models: Array<{ label: string; knowsBrand: string; sentiment: string; confidence: number; summary: string }>;
  actionItems: Array<{ priority: string; title: string; description: string }>;
};

export function renderReport(result: BrandResult, _query: string): { subject: string; html: string } {
  const s = result.summary;
  const modelsHtml = result.models
    .map(
      (m) =>
        `<div style="border:1px solid #e2e8f0;border-radius:8px;padding:10px 14px;margin:0 0 8px;">` +
        `<strong style="font-size:15px;color:#0f172a;">${escapeHtml(m.label)}</strong> ` +
        `<span style="font-size:13px;color:#64748b;">· ${escapeHtml(KNOWS_PL[m.knowsBrand] ?? m.knowsBrand)} · ${escapeHtml(SENTIMENT_PL[m.sentiment] ?? m.sentiment)} · pewność ${Math.round((m.confidence ?? 0) * 100)}%</span>` +
        `<div style="font-size:14px;line-height:1.6;color:#0f172a;margin-top:4px;">${escapeHtml(m.summary)}</div>` +
        `</div>`,
    )
    .join('');

  const body =
    heading(`Raport widoczności marki: ${result.brand}`, `Rynek: ${result.market}`) +
    paragraph(`Tak modele AI postrzegają Twoją markę. Wynik widoczności: ${s.score}/100.`) +
    section('Podsumowanie', statGrid([
      ['Wynik', `${s.score}/100`],
      ['Rozpoznawalność', `${s.knownBy}/${s.totalModels} modeli`],
      ['Sentyment', SENTIMENT_PL[s.sentiment] ?? s.sentiment],
    ])) +
    section('Konkurenci wskazani przez modele', list(s.competitors)) +
    section('Odpowiedzi modeli', modelsHtml || list([])) +
    (result.actionItems.length ? section('Rekomendacje', actionItems(result.actionItems)) : '');

  return {
    subject: `Raport widoczności marki w AI: ${result.brand} – widocznosc.ai`,
    html: emailShell(body, `Wynik widoczności ${result.brand}: ${s.score}/100`),
  };
}
