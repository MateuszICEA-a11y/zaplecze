import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  buildAdditionPrompt,
  buildStylePrompt,
  runStylePass,
  STYLE_MODEL,
  styleDocument,
  styleGuard,
  STYLE_MAX_CHARS,
  weaveAddition,
} from './cw-style.js';

const ENV = {
  OPENROUTER_API_KEY: 'test-key',
  CW_DOMAINS: 'grupa-icea.pl=https://www.grupa-icea.pl',
};

const JOB = { id: 'job-abcdef12', domain: 'grupa-icea.pl', post_id: 123, post_type: 'posts', title: 'Jak AI cytuje marki' };

/** Odpowiedź OpenRoutera z treścią modelu. */
const openrouter = (content, usage = { prompt_tokens: 10, completion_tokens: 20 }) =>
  async () => new Response(JSON.stringify({
    model: STYLE_MODEL,
    choices: [{ message: { content: typeof content === 'string' ? content : JSON.stringify(content) } }],
    usage,
  }), { status: 200 });

const ROWS = [
  { slot: 1, title: 'Wstęp', text: '<p>Ta sekcja ma dostarczać wartość klientom.</p>', title_field: 'page_title_h2_1', text_field: 'page_text_1', source: 'cms', has_row: false },
  { slot: 2, title: 'Jak to działa', text: '<p>Model przeszukał internet w 2025 roku.</p>', title_field: 'page_title_h2_2', text_field: 'page_text_2', source: 'job', has_row: true },
];

/* ---------- prompt ---------- */

test('prompt: niesie sloty, tytuł wpisu i zakaz zmyślania', () => {
  const prompt = buildStylePrompt({ title: JOB.title, rows: ROWS });
  assert.match(prompt, /\[sekcja 1\] Wstęp/);
  assert.match(prompt, /\[sekcja 2\] Jak to działa/);
  assert.match(prompt, /Jak AI cytuje marki/);
  assert.match(prompt, /niczego nie zmyślaj/);
  // Reguła spójności terminologii to powód, dla którego przejazd idzie na całości.
  assert.match(prompt, /jeden termin dla jednego pojęcia w całym tekście/);
  assert.match(prompt, /DO WERYFIKACJI/);
});

test('prompt: sekcja bez nagłówka nie gubi numeru slotu', () => {
  const prompt = buildStylePrompt({ title: 'x', rows: [{ slot: 7, title: '', text: '<p>a</p>' }] });
  assert.match(prompt, /\[sekcja 7\] \(bez nagłówka\)/);
});

/* ---------- straż zmian ---------- */

test('straż: czysto redakcyjna poprawka nie budzi ostrzeżeń', () => {
  const before = '<p>Ta sekcja ma dostarczać wartość klientom sklepu internetowego.</p>';
  const after = '<p>Ta sekcja ma dawać realną wartość klientom sklepu internetowego.</p>';
  assert.deepEqual(styleGuard(before, after), []);
});

test('straż: zmieniona liczba i zniknięty link są zgłaszane', () => {
  const before = '<p>Wzrost o 47% – <a href="https://example.com/raport">raport</a>.</p>';
  const after = '<p>Wzrost o 50%.</p>';
  const kinds = styleGuard(before, after).map((row) => row.kind);
  assert.ok(kinds.includes('numbers'));
  assert.ok(kinds.includes('links'));
  const numbers = styleGuard(before, after).find((row) => row.kind === 'numbers');
  assert.match(numbers.label, /47/);
  assert.match(numbers.label, /50/);
});

test('straż: zmiana struktury HTML i wycięcie połowy treści', () => {
  const before = `<p>${'słowo '.repeat(60)}</p><ul><li>punkt</li></ul>`;
  const after = `<p>${'słowo '.repeat(20)}</p>`;
  const kinds = styleGuard(before, after).map((row) => row.kind);
  assert.ok(kinds.includes('markup'));
  assert.ok(kinds.includes('length'));
});

test('straż: dołożony link nie jest ostrzeżeniem (znikające są)', () => {
  const before = '<p>Zdanie o modelach.</p>';
  const after = '<p>Zdanie o modelach <a href="https://example.com">źródło</a>.</p>';
  assert.equal(styleGuard(before, after).filter((row) => row.kind === 'links').length, 0);
});

/* ---------- dokument wejściowy ---------- */

test('dokument: propozycje pipeline\'u wygrywają z CMS-em, odrzucone nie', async () => {
  const acf = {
    page_title_h2_1: 'Wstęp', page_text_1: '<p>wersja z CMS 1</p>',
    page_title_h2_2: 'Druga', page_text_2: '<p>wersja z CMS 2</p>',
    page_title_h2_3: 'Trzecia', page_text_3: '<p>wersja z CMS 3</p>',
    page_faq_question_1: 'Czy to działa?', page_faq_answer_1: '<p>Tak.</p>',
  };
  const fetchImpl = async () => new Response(JSON.stringify({ id: 123, acf }), { status: 200 });
  const sections = [
    { slot: 2, title_field: 'page_title_h2_2', text_field: 'page_text_2', title_after: 'Druga po zmianie', text_after: '<p>propozycja 2</p>', decision: null },
    { slot: 3, title_field: 'page_title_h2_3', text_field: 'page_text_3', title_after: 'Trzecia po zmianie', text_after: '<p>propozycja 3</p>', decision: 'rejected' },
  ];

  const { rows } = await styleDocument(ENV, JOB, sections, fetchImpl);
  assert.deepEqual(rows.map((row) => row.slot), [1, 2, 3, 101]);
  assert.equal(rows[0].text, '<p>wersja z CMS 1</p>');
  assert.equal(rows[0].has_row, false);
  assert.equal(rows[1].text, '<p>propozycja 2</p>');
  assert.equal(rows[1].title, 'Druga po zmianie');
  assert.equal(rows[1].source, 'job');
  // Odrzucona propozycja nie istnieje – zostaje brzmienie z CMS-a.
  assert.equal(rows[2].text, '<p>wersja z CMS 3</p>');
  // Blok FAQ wchodzi do przejazdu razem z sekcjami (sloty 101+).
  assert.equal(rows[3].text_field, 'page_faq_answer_1');
});

test('dokument: błąd WordPressa nie jest udawany pustą treścią', async () => {
  const fetchImpl = async () => new Response('WAF', { status: 403 });
  const result = await styleDocument(ENV, JOB, [], fetchImpl);
  assert.match(result.error, /HTTP 403/);
  assert.equal(result.status, 502);
});

/* ---------- przejazd ---------- */

test('przejazd: mapuje poprawki, uwagi i fakty', async () => {
  const fetchImpl = openrouter({
    sections: [{
      slot: 1,
      title: 'Wstęp po korekcie',
      text: '<p>Ta sekcja ma dawać realną wartość klientom.</p>',
      issues: ['kalka: „dostarczać wartość" → „dawać realną wartość"'],
    }],
    facts: [{ claim: 'Gemini 3.7 Flash wyszedł w 2024', status: 'nieaktualne', note: 'premiera 2026 [DO WERYFIKACJI]', slot: 2 }],
    additions: [{ slot: 2, fact: 'RAG to nie fine-tuning', certain: true }],
  });

  const result = await runStylePass(ENV, JOB, ROWS, { fetchImpl });
  assert.equal(result.ok, true);
  assert.equal(result.data.sections.length, 1);
  const [section] = result.data.sections;
  assert.equal(section.slot, 1);
  assert.equal(section.title, 'Wstęp po korekcie');
  assert.equal(section.text_before, ROWS[0].text);
  assert.equal(section.has_row, false);
  assert.equal(section.text_field, 'page_text_1');
  assert.equal(section.issues.length, 1);
  assert.deepEqual(section.warnings, []);
  assert.equal(result.data.facts[0].status, 'nieaktualne');
  assert.equal(result.data.additions[0].certain, true);
  assert.equal(result.cost.tokens_out, 20);
});

test('przejazd: sekcja bez realnej zmiany i slot z sufitu wypadają', async () => {
  const fetchImpl = openrouter({
    sections: [
      { slot: 1, text: ROWS[0].text },          // identyczna – nie jest propozycją
      { slot: 99, text: '<p>zmyślony slot</p>' }, // slot spoza dokumentu
      { slot: 2, text: '<p>Model korzystał z danych treningowych z 2025 roku.</p>' },
    ],
  });
  const result = await runStylePass(ENV, JOB, ROWS, { fetchImpl });
  assert.deepEqual(result.data.sections.map((row) => row.slot), [2]);
});

test('przejazd: pusta treść po sanityzacji nie zastępuje sekcji', async () => {
  const fetchImpl = openrouter({ sections: [{ slot: 1, text: '<script>alert(1)</script>' }] });
  const result = await runStylePass(ENV, JOB, ROWS, { fetchImpl });
  assert.equal(result.ok, true);
  assert.deepEqual(result.data.sections, []);
});

test('przejazd: odpowiedź w bloku ``` też się parsuje', async () => {
  const fetchImpl = openrouter('```json\n{"sections":[{"slot":2,"text":"<p>Poprawione zdanie o danych treningowych.</p>"}]}\n```');
  const result = await runStylePass(ENV, JOB, ROWS, { fetchImpl });
  assert.deepEqual(result.data.sections.map((row) => row.slot), [2]);
});

test('przejazd: brak listy sekcji w odpowiedzi to błąd, nie cisza', async () => {
  const fetchImpl = openrouter({ uwagi: 'wszystko dobrze' });
  const result = await runStylePass(ENV, JOB, ROWS, { fetchImpl });
  assert.equal(result.ok, false);
  assert.match(result.error, /poprawnej listy poprawek/);
});

test('przejazd: brak klucza OpenRoutera zgłaszany wprost', async () => {
  const result = await runStylePass({ ...ENV, OPENROUTER_API_KEY: '' }, JOB, ROWS, { fetchImpl: openrouter({}) });
  assert.equal(result.ok, false);
  assert.match(result.error, /OPENROUTER_API_KEY/);
});

test('przejazd: za długi wpis jest odrzucany, nie przycinany', async () => {
  let called = false;
  const fetchImpl = async () => { called = true; return new Response('{}', { status: 200 }); };
  const long = [{ slot: 1, title: 'x', text: '<p>' + 'a'.repeat(STYLE_MAX_CHARS) + '</p>' }];
  const result = await runStylePass(ENV, JOB, long, { fetchImpl });
  assert.equal(result.ok, false);
  assert.match(result.error, /za długi/);
  assert.equal(called, false, 'nie płacimy za wywołanie, którego wynik byłby niepełny');
});

test('przejazd: model z :online nie dostaje wymuszonego JSON-a', async () => {
  let body = null;
  const fetchImpl = async (_url, options) => {
    body = JSON.parse(options.body);
    return new Response(JSON.stringify({ choices: [{ message: { content: '{"sections":[]}' } }] }), { status: 200 });
  };
  await runStylePass(ENV, JOB, ROWS, { fetchImpl });
  assert.equal(body.model, STYLE_MODEL);
  assert.equal(body.response_format, undefined);

  await runStylePass({ ...ENV, CW_STYLE_MODEL: 'anthropic/claude-sonnet-5' }, JOB, ROWS, { fetchImpl });
  assert.deepEqual(body.response_format, { type: 'json_object' });
});

test('przejazd: błąd HTTP OpenRoutera nie wycieka szczegółami', async () => {
  const fetchImpl = async () => new Response('rate limited', { status: 429 });
  const result = await runStylePass(ENV, JOB, ROWS, { fetchImpl });
  assert.equal(result.ok, false);
  assert.match(result.error, /429/);
});

/* ---------- wplecenie uzupełnienia ---------- */

test('uzupełnienie: prompt niesie sekcję, fakt i zakaz dopisywania', () => {
  const prompt = buildAdditionPrompt({
    title: JOB.title,
    row: ROWS[0],
    fact: 'Schema.org LocalBusiness ułatwia robotom odczyt oferty.',
  });
  assert.match(prompt, /Sekcja „Wstęp" z artykułu „Jak AI cytuje marki"/);
  assert.match(prompt, /dostarczać wartość klientom/);
  assert.match(prompt, /Schema\.org LocalBusiness/);
  assert.match(prompt, /Nie dopisuj niczego poza tym faktem/);
  assert.match(prompt, /"text"/);
});

test('uzupełnienie: wplata fakt i oddaje pełną sekcję', async () => {
  const woven = '<p>Ta sekcja ma dostarczać wartość klientom. Warto wdrożyć dane Schema.org.</p>';
  const result = await weaveAddition(ENV, JOB, ROWS[0], 'dane Schema.org', {
    fetchImpl: openrouter({ text: woven }),
  });
  assert.equal(result.ok, true);
  assert.equal(result.text, woven);
  assert.equal(result.cost.tokens_out, 20);
});

test('uzupełnienie: model bez :online, sekcja bez zmian to błąd', async () => {
  let calledModel = '';
  const fetchImpl = async (_url, init) => {
    calledModel = JSON.parse(init.body).model;
    return openrouter({ text: ROWS[0].text })();
  };
  const result = await weaveAddition(ENV, JOB, ROWS[0], 'fakt', { fetchImpl });
  assert.equal(calledModel.includes(':online'), false);
  assert.equal(result.ok, false);
  assert.match(result.error, /bez zmian/);
});

test('uzupełnienie: pusta lub wycięta odpowiedź nie przechodzi', async () => {
  const result = await weaveAddition(ENV, JOB, ROWS[0], 'fakt', {
    fetchImpl: openrouter({ text: '<script>x()</script>' }),
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /nie zwrócił treści/);
});
