/* Sanityzacja HTML dokumentu edytora wpisu i podgląd shortcode'ów motywu.
   Przeniesione z legacy/edytor-script.ts – używa jej i dokument (legacy),
   i panele React (migawka treści, podgląd całości). */

/* ---------- sanityzacja HTML ----------
   Treść z WordPressa i z modelu to dane niezaufane – każdy render HTML
   przechodzi przez tę funkcję. Niedozwolone tagi są rozpakowywane
   (dzieci zostają), script/style/iframe znikają w całości. */
const ALLOWED_TAGS = new Set(['P', 'BR', 'UL', 'OL', 'LI', 'STRONG', 'B', 'EM', 'I', 'A',
  'H2', 'H3', 'H4', 'BLOCKQUOTE', 'FOOTER', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD', 'SPAN',
  // Układ karty eksperta (DIV) i zdjęcie z konta WordPressa (IMG) – lustro
  // whitelisty w cw-api.js.
  'DIV', 'IMG',
  // Infografika wstawiona do sekcji (cw-infographic.js) – lustro whitelisty
  // sanitizeSectionHtml w cw-api.js.
  'FIGURE', 'FIGCAPTION']);
const DROP_TAGS = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'FORM', 'LINK', 'META']);

/* Lustro STYLE_TAGS/STYLE_SAFE z cw-api.js: wygląd kart (ekspert, CTA,
   infografika) jedzie w atrybucie `style`, bo CSS motywu WordPressa nie
   ruszymy. Bez przepuszczenia stylu edytor i podgląd pokazywały te bloki
   jako goły tekst zlany z treścią. Brak nawiasów wyklucza url(). */
const STYLE_TAGS = new Set(['BLOCKQUOTE', 'P', 'FOOTER', 'SPAN', 'DIV', 'IMG', 'FIGURE', 'FIGCAPTION']);
const STYLE_SAFE = /^[a-z0-9 .,:;%#\/-]+$/i;

/* Widgety szablonu wklejone w treść („Zobacz również", boksy powiązanych
   wpisów). Na stronie to element poboczny obok tekstu, w edytorze wchodziły
   w środek akapitu i psuły zarówno odbiór, jak i liczenie słów. */
const WIDGET_SELECTORS = ['[class*="k-post-link"]', '[class*="k-post-list"]', '[class*="k-post-item"]',
  '[class*="related"]', '.wp-block-embed'];

/* Shortcody motywu (wytyczne deva WP, 2026-09-03). W CMS-ie zostają jako
   tekst w nawiasach kwadratowych, ale redaktor ma widzieć, co zatwierdza –
   w dokumencie rysujemy ich podgląd: [k_img] jako zdjęcie z podpisem,
   [k_quote_box] jako kartę cytatu, [k_link]/[k_link_word] jako etykietę
   karty „Zobacz również”. Podgląd jest przybliżeniem CSS strony. */
const SHORTCODE_RE = /\[(k_[a-z_]+)((?:\s+[a-z_]+="[^"]*")*)\s*\]/g;
const THEME_CLASSES: Record<string, string[]> = { DIV: ['k-table'], OL: ['k-ol-h3'] };
function shortcodeAttrs(raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const match of raw.matchAll(/([a-z_]+)="([^"]*)"/g)) out[match[1]] = match[2];
  return out;
}
export const escapeHtml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function shortcodePreview(name: string, attrs: Record<string, string>): string | null {
  if (name === 'k_img' || name === 'k_img_full') {
    if (!/^https:\/\//i.test(attrs.src ?? '')) return '';
    return `<figure data-shortcode="${name}"><img src="${escapeHtml(attrs.src)}" alt="${escapeHtml(attrs.alt ?? '')}" />`
      + (attrs.name ? `<figcaption>${escapeHtml(attrs.name)}</figcaption>` : '') + '</figure>';
  }
  if (name === 'k_quote_box') {
    const person = attrs.author_name ?? '';
    const initials = person.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0].toUpperCase()).join('');
    const face = /^https:\/\//i.test(attrs.author_img ?? '')
      ? `<img src="${escapeHtml(attrs.author_img)}" alt="${escapeHtml(person)}" />`
      : (initials ? `<div>${initials}</div>` : '');
    return `<blockquote class="expert" data-shortcode="k_quote_box"><div>${face}<div>`
      + '<span>Zdaniem eksperta</span>'
      + `<p>${escapeHtml(attrs.text ?? '')}</p>`
      + `<footer>${person ? `<span>${escapeHtml(person)}</span>` : ''}${attrs.author_pos ? ` · ${escapeHtml(attrs.author_pos)}` : ''}</footer>`
      + '</div></div></blockquote>';
  }
  if (name === 'k_link' || name === 'k_link_word') {
    return `<span class="ed-shortcode" data-shortcode="${name}">karta „Zobacz również” · ${name === 'k_link_word' ? 'słownik' : 'wpis'} #${escapeHtml(attrs.id ?? '?')}</span>`;
  }
  return null;
}
/** Zamienia shortcody w tekście HTML na ich podgląd; nieznane zostają jako
    etykieta, żeby nie zniknęły z oczu. */
export function renderShortcodes(html: string): string {
  return html.replace(SHORTCODE_RE, (whole, name: string, raw: string) => {
    const preview = shortcodePreview(name, shortcodeAttrs(raw));
    if (preview === null) return `<span class="ed-shortcode" data-shortcode="${name}">${escapeHtml(whole)}</span>`;
    return preview;
  });
}

export function sanitizeInto(host: HTMLElement, html: string | null) {
  const doc = new DOMParser().parseFromString(renderShortcodes(html ?? ''), 'text/html');
  for (const selector of WIDGET_SELECTORS) {
    doc.body.querySelectorAll(selector).forEach((node) => node.remove());
  }
  // Po wycięciu boksu zostaje pusty akapit-skorupa – też idzie precz.
  doc.body.querySelectorAll('p').forEach((node) => {
    if (!node.textContent?.trim() && !node.querySelector('img')) node.remove();
  });
  const walk = (node: Element) => {
    for (const child of [...node.children]) {
      if (DROP_TAGS.has(child.tagName)) { child.remove(); continue; }
      walk(child);
      if (!ALLOWED_TAGS.has(child.tagName)) { child.replaceWith(...child.childNodes); continue; }
      const href = child.tagName === 'A' ? child.getAttribute('href') ?? '' : '';
      const expertQuote = child.tagName === 'BLOCKQUOTE' && child.classList.contains('expert');
      const src = child.tagName === 'IMG' ? child.getAttribute('src') ?? '' : '';
      const alt = child.tagName === 'IMG' ? child.getAttribute('alt') ?? '' : '';
      const style = STYLE_TAGS.has(child.tagName) ? child.getAttribute('style') ?? '' : '';
      const shortcode = child.getAttribute('data-shortcode') ?? '';
      const themeClass = (THEME_CLASSES[child.tagName] ?? []).find((name) => child.classList.contains(name));
      const shortcodeTag = child.tagName === 'SPAN' && child.classList.contains('ed-shortcode');
      for (const attr of [...child.attributes]) child.removeAttribute(attr.name);
      if (expertQuote) child.className = 'expert';
      // Podgląd shortcode'u i klasy motywu (k-table, k-ol-h3) zostają –
      // lustro THEME_CLASSES w sanitizeSectionHtml (cw-api.js).
      if (shortcode) child.setAttribute('data-shortcode', shortcode);
      if (themeClass) child.className = themeClass;
      if (shortcodeTag) child.className = 'ed-shortcode';
      if (style && STYLE_SAFE.test(style)) child.setAttribute('style', style);
      if (child.tagName === 'IMG') {
        // Zdjęcie eksperta: adres zostaje, ale tylko https – reszta atrybutów
        // (w tym `onerror`) już zdjęta wyżej.
        if (/^https:\/\//i.test(src)) {
          child.setAttribute('src', src);
          child.setAttribute('alt', alt);
        } else {
          child.remove();
          continue;
        }
      }
      if (child.tagName === 'A') {
        // `mailto:` niesie przycisk CTA – lustro sanitizeSectionHtml w cw-api.js.
        if (/^https?:\/\//i.test(href)) {
          child.setAttribute('href', href);
          child.setAttribute('target', '_blank');
          child.setAttribute('rel', 'noopener nofollow');
        } else if (/^mailto:/i.test(href)) {
          child.setAttribute('href', href);
        } else {
          child.replaceWith(...child.childNodes);
        }
      }
    }
  };
  walk(doc.body);
  host.replaceChildren(...doc.body.childNodes);
}

/** Etykieta typu bloku w rynience (h2, p, ul…) – jak w edytorach SEO.
    Czytelnik od razu widzi strukturę, a nie samą ścianę tekstu. */
const BLOCK_LABEL: Record<string, string> = {
  H1: 'h1', H2: 'h2', H3: 'h3', H4: 'h4', P: 'p', UL: 'ul', OL: 'ol',
  BLOCKQUOTE: 'cyt', TABLE: 'tab', FIGURE: 'graf',
};
export function markBlocks(host: HTMLElement) {
  for (const child of [...host.children]) {
    const label = BLOCK_LABEL[child.tagName];
    if (label) (child as HTMLElement).dataset.block = label;
  }
}

/** Blok treści dokumentu (sanityzowany HTML + rynienka z typami bloków). */
export function docProse(html: string | null, className = '') {
  const body = document.createElement('div');
  body.className = `doc-prose ed-doc-body ${className}`.trim();
  sanitizeInto(body, html);
  markBlocks(body);
  return body;
}
