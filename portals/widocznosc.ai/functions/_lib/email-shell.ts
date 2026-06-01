/**
 * Wspólny szkielet brandowanego maila widocznosc.ai (table-layout, inline CSS,
 * kompatybilny z Gmail/Outlook). Używany przez formularz /kontakt i raporty narzędzi.
 */

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Paleta brandu (email-safe, wartości z Theme.css) ──
export const C = {
  dark: '#0b1020',
  accent: '#0a9cff',
  accentDark: '#0068cc',
  accentSoft: '#e6f4ff',
  page: '#eef2f7',
  card: '#ffffff',
  ink: '#0f172a',
  inkMuted: '#64748b',
  line: '#e2e8f0',
  msgBg: '#f1f5f9',
};

/** Wspólny szkielet maila. `bodyInner` to wiersze <tr>…</tr> wstrzyknięte między nagłówek a stopkę. */
export function emailShell(bodyInner: string, preheader = ''): string {
  return (
    `<!DOCTYPE html><html lang="pl"><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width,initial-scale=1"></head>` +
    `<body style="margin:0;padding:0;background:${C.page};">` +
    (preheader
      ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>`
      : '') +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.page};padding:24px 12px;">` +
    `<tr><td align="center">` +
    `<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${C.card};border-radius:14px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;box-shadow:0 1px 3px rgba(15,23,42,.08);">` +
    `<tr><td style="background:${C.dark};padding:22px 32px;">` +
    `<span style="font-size:20px;font-weight:700;letter-spacing:-.4px;color:#fff;">widocznosc<span style="color:${C.accent};">.ai</span></span>` +
    `</td></tr>` +
    bodyInner +
    `<tr><td style="padding:22px 32px;border-top:1px solid ${C.line};">` +
    `<p style="margin:0;font-size:12px;line-height:1.6;color:${C.inkMuted};">` +
    `ICEA S.A. · ul. Szyperska 14 · 61-754 Poznań<br>` +
    `Flagowy projekt <a href="https://grupa-icea.pl" style="color:${C.accentDark};text-decoration:none;">grupa-icea.pl</a> · pozycjonowanie marek w wyszukiwarkach AI` +
    `</p></td></tr>` +
    `</table></td></tr></table></body></html>`
  );
}
