const HEADER_ALIASES = {
  query: ['grounding query', 'query', 'zapytanie grounding', 'zapytanie'],
  intent: ['intent', 'intencja'],
  topic: ['topic', 'temat'],
  citations: ['citations', 'citation count', 'cytowania', 'liczba cytowan'],
  citationShare: ['citation share', 'share', 'udzial cytowan', 'udzial'],
};

const normalizeHeader = (value) =>
  String(value ?? '')
    .replace(/^\uFEFF/, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ł/g, 'l')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');

function delimiterFromHeader(text) {
  const line = String(text ?? '').replace(/^\uFEFF/, '').split(/\r?\n/, 1)[0] ?? '';
  const counts = { ',': 0, ';': 0, '\t': 0 };
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' && line[i + 1] === '"') {
      i++;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (!quoted && char in counts) {
      counts[char]++;
    }
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

export function parseCsv(text) {
  const source = String(text ?? '').replace(/^\uFEFF/, '');
  const delimiter = delimiterFromHeader(source);
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (quoted) {
      if (char === '"' && source[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === delimiter) {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (field !== '' || row.length > 0) {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
      }
      if (char === '\r' && source[i + 1] === '\n') i++;
    } else {
      field += char;
    }
  }

  if (quoted) throw new Error('Nieprawidłowy CSV: niedomknięty cudzysłów.');
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const headerIndex = (headers, aliases) => {
  const normalizedAliases = aliases.map(normalizeHeader);
  return headers.findIndex((header) => normalizedAliases.includes(normalizeHeader(header)));
};

const integer = (value) => {
  const parsed = Number.parseInt(String(value ?? '').replace(/[\s\u00A0]/g, ''), 10);
  return Number.isFinite(parsed) ? parsed : 0;
};

const percent = (value) => {
  const match = String(value ?? '')
    .replace(/[\s\u00A0]/g, '')
    .replace(',', '.')
    .match(/-?\d+(?:\.\d+)?/);
  return match ? Number.parseFloat(match[0]) : null;
};

const dateFromFilename = (filename, fallbackDate) => {
  const pl = String(filename ?? '').match(/(\d{2})[.-](\d{2})[.-](\d{4})/);
  if (pl) return `${pl[3]}-${pl[2]}-${pl[1]}`;
  const iso = String(filename ?? '').match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  return fallbackDate;
};

export function parseBingAiCsv(text, filename = '', now = new Date()) {
  const table = parseCsv(text).filter((row) => row.some((field) => field.trim() !== ''));
  if (table.length < 2) throw new Error('CSV nie zawiera żadnych danych.');

  const headers = table[0];
  const indexes = {
    query: headerIndex(headers, HEADER_ALIASES.query),
    intent: headerIndex(headers, HEADER_ALIASES.intent),
    topic: headerIndex(headers, HEADER_ALIASES.topic),
    citations: headerIndex(headers, HEADER_ALIASES.citations),
    citationShare: headerIndex(headers, HEADER_ALIASES.citationShare),
  };
  if (indexes.query < 0 || indexes.citations < 0) {
    throw new Error(
      'Nie rozpoznaję eksportu AI Performance. Wymagane kolumny: Grounding Query i Citations.',
    );
  }

  const rows = table
    .slice(1)
    .filter((row) => String(row[indexes.query] ?? '').trim() !== '')
    .map((row) => ({
      query: String(row[indexes.query] ?? '').trim(),
      intent: indexes.intent >= 0 ? String(row[indexes.intent] ?? '').trim() : '',
      topic: indexes.topic >= 0 ? String(row[indexes.topic] ?? '').trim() : '',
      citations: Math.max(0, integer(row[indexes.citations])),
      citation_share: indexes.citationShare >= 0 ? percent(row[indexes.citationShare]) : null,
    }))
    .sort((a, b) => b.citations - a.citations || a.query.localeCompare(b.query, 'pl'));

  if (rows.length === 0) throw new Error('CSV nie zawiera żadnych zapytań grounding.');
  const fallbackDate = now.toISOString().slice(0, 10);
  return {
    schema_version: 1,
    date: dateFromFilename(filename, fallbackDate),
    filename: String(filename || 'bing-ai-performance.csv').slice(0, 240),
    imported_at: now.toISOString(),
    rows,
  };
}
