/** Composable bloki email-HTML dla raportów narzędzi. Wszystkie wartości escapowane. */
import { escapeHtml, C } from '../email-shell';

/** Sekcja-wiersz: tytuł + dowolny HTML wewnątrz (już zbudowany przez wołającego). */
export function section(titleText: string, innerHtml: string): string {
  return (
    `<tr><td style="padding:8px 32px 4px;">` +
    `<div style="font-size:11px;letter-spacing:.6px;text-transform:uppercase;color:${C.inkMuted};margin:16px 0 8px;">${escapeHtml(titleText)}</div>` +
    innerHtml +
    `</td></tr>`
  );
}

export function heading(text: string, badgeText?: string): string {
  const badge = badgeText
    ? `<span style="display:inline-block;background:${C.accentSoft};color:${C.accentDark};font-size:12px;font-weight:600;padding:5px 12px;border-radius:999px;margin-bottom:10px;">${escapeHtml(badgeText)}</span><br>`
    : '';
  return (
    `<tr><td style="padding:32px 32px 4px;">` +
    badge +
    `<h1 style="margin:6px 0 0;font-size:22px;line-height:1.3;color:${C.ink};">${escapeHtml(text)}</h1>` +
    `</td></tr>`
  );
}

export function paragraph(text: string): string {
  return (
    `<tr><td style="padding:6px 32px;">` +
    `<p style="margin:0;font-size:15px;line-height:1.7;color:${C.ink};">${escapeHtml(text)}</p>` +
    `</td></tr>`
  );
}

export function pill(text: string): string {
  return `<span style="display:inline-block;background:${C.accentSoft};color:${C.accentDark};font-size:12px;font-weight:600;padding:4px 10px;border-radius:999px;margin:0 6px 6px 0;">${escapeHtml(text)}</span>`;
}

/** Tabela par [label, wartość]. Zwraca surowy HTML (do wstrzyknięcia w section()). */
export function statGrid(rows: Array<[string, string]>): string {
  const cells = rows
    .map(
      ([k, v]) =>
        `<td style="padding:10px 14px;background:${C.msgBg};border-radius:8px;">` +
        `<div style="font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:${C.inkMuted};">${escapeHtml(k)}</div>` +
        `<div style="font-size:18px;font-weight:700;color:${C.ink};margin-top:2px;">${escapeHtml(v)}</div>` +
        `</td>`,
    )
    .join('<td style="width:8px;"></td>');
  return `<table role="presentation" cellpadding="0" cellspacing="0"><tr>${cells}</tr></table>`;
}

export function list(items: string[]): string {
  if (items.length === 0) return `<p style="margin:0;font-size:14px;color:${C.inkMuted};">—</p>`;
  return (
    `<ul style="margin:0;padding-left:18px;">` +
    items.map((i) => `<li style="font-size:14px;line-height:1.6;color:${C.ink};">${escapeHtml(i)}</li>`).join('') +
    `</ul>`
  );
}

export function actionItems(
  items: Array<{ priority: string; title: string; description: string }>,
): string {
  if (items.length === 0) return '';
  return items
    .map(
      (a) =>
        `<div style="border-left:3px solid ${C.accent};background:${C.msgBg};border-radius:6px;padding:10px 14px;margin:0 0 8px;">` +
        `<div style="font-size:11px;font-weight:700;color:${C.accentDark};">${escapeHtml(a.priority)}</div>` +
        `<div style="font-size:15px;font-weight:600;color:${C.ink};margin:2px 0;">${escapeHtml(a.title)}</div>` +
        `<div style="font-size:14px;line-height:1.6;color:${C.inkMuted};">${escapeHtml(a.description)}</div>` +
        `</div>`,
    )
    .join('');
}
