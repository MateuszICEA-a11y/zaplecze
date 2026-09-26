/**
 * Dopasowanie fraz z odmianą i przyimkami – lustro pipeline/content-refresher/
 * matching.py (i matchera w edytorze Content Watchera). Content Writer używa go
 * do podpowiedzi luk (build) i do kontroli kanibalizacji (przeglądarka):
 * „audyt seo" ma trafić w tytuł „Audyty SEO – co sprawdzamy".
 *
 * Zwykły .js, żeby test node:test działał bez kompilacji; przypadki w
 * phrase-match.test.js są te same co w tests/test_matching.py.
 */

const SUFFIXES = ['ami', 'ach', 'iem', 'em', 'ow', 'om', 'ie', 'y', 'i', 'e', 'a', 'u'];
const STEM_MIN = 4;
const SOFT_ENDINGS = [['dz', 'g'], ['sz', 'ch'], ['c', 'k']];
const FOLD = { ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ź: 'z', ż: 'z' };
export const PHRASE_FILLERS = new Set(['na', 'w', 'we', 'z', 'ze', 'do', 'dla', 'o', 'u', 'od', 'po',
  'przy', 'pod', 'nad', 'bez', 'przez', 'i', 'oraz', 'a', 'albo', 'lub', 'czy', 'sie', 'jak']);
const MAX_FILLER_GAP = 2;

export function stem(word) {
  let out = word;
  for (let round = 0; round < 2; round += 1) {
    const suffix = SUFFIXES.find((end) => out.endsWith(end) && out.length - end.length >= STEM_MIN);
    if (!suffix) break;
    out = out.slice(0, -suffix.length);
  }
  return out;
}

export function soft(word) {
  for (const [ending, base] of SOFT_ENDINGS) {
    if (word.endsWith(ending) && word.length - ending.length + base.length >= STEM_MIN) {
      return word.slice(0, -ending.length) + base;
    }
  }
  return word;
}

export function fold(text) {
  let out = '';
  for (const character of String(text ?? '')) {
    const lower = character.toLowerCase();
    const mapped = FOLD[lower] ?? lower;
    const safe = mapped.length === character.length ? mapped : character;
    out += safe.replace(/[^a-z0-9]/g, ' ');
  }
  return out;
}

export function tokens(text) {
  const out = [];
  for (const match of fold(text).matchAll(/[a-z0-9]+/g)) {
    out.push({ stem: soft(stem(match[0])), start: match.index, end: match.index + match[0].length });
  }
  return out;
}

/** Rdzenie słów znaczących frazy (bez przyimków i spójników). */
export const phraseStems = (phrase) => tokens(phrase).map((token) => token.stem).filter((word) => !PHRASE_FILLERS.has(word));

/** Trafienia frazy w już stokenizowanym tekście – przy porównaniu jednej
    frazy z setkami tytułów tokenizujemy każdy tytuł raz. */
export function matchTokens(hay, needle) {
  if (!needle.length) return [];
  const hits = [];
  hay.forEach((token, i) => {
    if (token.stem !== needle[0]) return;
    let last = i;
    for (const word of needle.slice(1)) {
      let j = last + 1;
      let gap = 0;
      while (j < hay.length && gap < MAX_FILLER_GAP && PHRASE_FILLERS.has(hay[j].stem)) {
        j += 1;
        gap += 1;
      }
      if (j < hay.length && hay[j].stem === word) {
        last = j;
      } else {
        return;
      }
    }
    hits.push({ start: token.start, end: hay[last].end });
  });
  return hits;
}

export const findPhrase = (text, phrase) => matchTokens(tokens(text), phraseStems(phrase));

export const hasPhrase = (text, phrase) => findPhrase(text, phrase).length > 0;

/** Klucz wariantów fleksyjnych i szyku: „agencje seo" = „seo agencja". */
export const phraseKey = (phrase) => [...new Set(phraseStems(phrase))].sort().join(' ');
