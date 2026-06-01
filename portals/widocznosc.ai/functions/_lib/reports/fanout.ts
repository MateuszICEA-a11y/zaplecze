import { emailShell, escapeHtml } from '../email-shell';
import { heading, paragraph, section, list } from './components';

type FanoutResult = {
  query: string;
  answer: string;
  fanoutQueries: string[];
  citedDomains: Array<{ domain: string; count: number }>;
  citations: Array<{ title: string; url: string; domain: string }>;
};

/** Akapit dla treści wieloliniowej (zachowuje złamania). */
function paragraphRaw(text: string): string {
  return `<div style="font-size:15px;line-height:1.7;color:#0f172a;white-space:pre-wrap;">${escapeHtml(text)}</div>`;
}

export function renderReport(result: FanoutResult, _query: string): { subject: string; html: string } {
  const domains = result.citedDomains.map((d) => `${d.domain} (${d.count})`);
  const citationsHtml = result.citations.length
    ? result.citations
        .map(
          (c) =>
            `<li style="font-size:14px;line-height:1.6;margin-bottom:4px;">` +
            `<a href="${escapeHtml(c.url)}" style="color:#0068cc;text-decoration:none;">${escapeHtml(c.title || c.url)}</a> ` +
            `<span style="color:#64748b;">– ${escapeHtml(c.domain)}</span></li>`,
        )
        .join('')
    : '';

  const body =
    heading(`Raport fan-out: ${result.query}`) +
    paragraph('Tak ChatGPT rozkłada Twoją frazę na zapytania składowe i jakie źródła cytuje.') +
    section('Odpowiedź modelu', paragraphRaw(result.answer)) +
    section('Zapytania fan-out', list(result.fanoutQueries)) +
    section('Najczęściej cytowane domeny', list(domains)) +
    (citationsHtml
      ? section('Źródła', `<ul style="margin:0;padding-left:18px;">${citationsHtml}</ul>`)
      : '');

  return {
    subject: `Raport fan-out „${result.query}" – widocznosc.ai`,
    html: emailShell(body, `Fan-out dla: ${result.query}`),
  };
}
