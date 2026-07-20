import { describe, it, expect } from 'vitest';
import { buildLogRecord, cleanFields, logEvent, LEAD_LOG_TTL_S } from './lead-log';

const NOW = new Date('2026-07-20T12:00:00.000Z');

describe('cleanFields', () => {
  it('przycina stringi i wyrzuca puste/nullowe pola', () => {
    expect(cleanFields({ a: '  x  ', b: '', c: null, d: undefined, e: 5, f: true })).toEqual({
      a: 'x',
      e: 5,
      f: true,
    });
  });
  it('tnie bardzo długie wartości do 500 znaków', () => {
    const out = cleanFields({ msg: 'x'.repeat(2000) });
    expect((out.msg as string).length).toBe(500);
  });
  it('pomija obiekty i tablice (rekord ma być płaski)', () => {
    expect(cleanFields({ nested: { a: 1 }, list: [1, 2] })).toEqual({});
  });
});

describe('buildLogRecord', () => {
  it('buduje id kind:<ISO>:<rand> i stempluje ts', () => {
    const rec = buildLogRecord('lead', 'kontakt', { email: 'a@b.pl' }, NOW, 'abcd1234');
    expect(rec.id).toBe('lead:2026-07-20T12:00:00.000Z:abcd1234');
    expect(rec.kind).toBe('lead');
    expect(rec.source).toBe('kontakt');
    expect(rec.ts).toBe('2026-07-20T12:00:00.000Z');
    expect(rec.email).toBe('a@b.pl');
  });
  it('id sortuje się chronologicznie (prefiks kv.list)', () => {
    const older = buildLogRecord('usage', 'fanout', {}, new Date('2026-01-01'), 'aa');
    const newer = buildLogRecord('usage', 'fanout', {}, new Date('2026-06-01'), 'aa');
    expect(older.id < newer.id).toBe(true);
  });
});

describe('logEvent', () => {
  it('zapisuje rekord z TTL 90 dni', async () => {
    const puts: Array<{ key: string; value: string; opts: { expirationTtl?: number } }> = [];
    const kv = {
      put: async (key: string, value: string, opts: { expirationTtl?: number }) => {
        puts.push({ key, value, opts });
      },
    } as unknown as KVNamespace;
    await logEvent(kv, 'usage', 'url-check', { url: 'https://icea.pl/' });
    expect(puts).toHaveLength(1);
    expect(puts[0].key).toMatch(/^usage:\d{4}-\d{2}-\d{2}T.*:[0-9a-f]{8}$/);
    expect(puts[0].opts.expirationTtl).toBe(LEAD_LOG_TTL_S);
    expect(JSON.parse(puts[0].value).url).toBe('https://icea.pl/');
  });
  it('brak KV lub błąd put nie rzuca', async () => {
    await expect(logEvent(undefined, 'lead', 'kontakt', {})).resolves.toBeUndefined();
    const broken = { put: async () => { throw new Error('kv down'); } } as unknown as KVNamespace;
    await expect(logEvent(broken, 'lead', 'kontakt', {})).resolves.toBeUndefined();
  });
});
