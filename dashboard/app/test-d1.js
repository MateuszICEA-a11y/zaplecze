/**
 * D1 w testach na prawdziwym SQLite (node:sqlite, Node 22.5+), zasilanym
 * schema.sql. W odróżnieniu od stubów po fragmencie SQL łapie literówki
 * w kolumnach, złe warunki WHERE i rozjazd schema.sql z kodem.
 */
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const SCHEMA = new URL('./schema.sql', import.meta.url);

/** D1 nie zna `undefined` ani booleanów – mapujemy jak runtime Workera. */
const value = (item) => (item === undefined ? null : typeof item === 'boolean' ? Number(item) : item);

export function sqliteD1() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(SCHEMA, 'utf8'));
  const statement = (sql) => {
    let args = [];
    const self = {
      bind: (...values) => {
        args = values.map(value);
        return self;
      },
      first: async () => sqlite.prepare(sql).get(...args) ?? null,
      all: async () => ({ results: sqlite.prepare(sql).all(...args) }),
      run: async () => {
        const result = sqlite.prepare(sql).run(...args);
        return { meta: { changes: Number(result.changes), last_row_id: Number(result.lastInsertRowid) } };
      },
    };
    return self;
  };
  return {
    sqlite,
    prepare: statement,
    batch: async (statements) => {
      const out = [];
      for (const item of statements) out.push(await item.run());
      return out;
    },
  };
}
