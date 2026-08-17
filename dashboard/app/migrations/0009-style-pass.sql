-- Migracja 0009: etap „styl i fleksja" (2026-08-17).
--   npx wrangler d1 execute zaplecze-content-watcher --file=migrations/0009-style-pass.sql --remote
--
-- Przejazd redaktorski liczony jest z CAŁEGO wpisu jednym wywołaniem modelu
-- (spójność terminologii), a wynik nie nadpisuje treści: siedzi tu jako
-- propozycja z diffem i decyzją ✓/✕ per sekcja. Akceptacja pisze do
-- job_sections.text_after, cofnięcie przywraca text_before.

ALTER TABLE jobs ADD COLUMN style TEXT;  -- JSON: {status, model, cost, issues, facts, additions}

CREATE TABLE IF NOT EXISTS job_style (
  job_id           TEXT NOT NULL REFERENCES jobs (id) ON DELETE CASCADE,
  slot             INTEGER NOT NULL,
  title_field      TEXT,     -- pola ACF: sekcja bez propozycji pipeline'u nie ma
  text_field       TEXT,     -- wiersza w job_sections, akceptacja go zakłada
  title_before     TEXT,
  title_after      TEXT,     -- NULL = model nie ruszał nagłówka
  text_before      TEXT,     -- wejście modelu = stan, który redaktor widział
  text_after       TEXT,
  issues           TEXT,     -- JSON: lista poprawek tej sekcji (dla człowieka)
  warnings         TEXT,     -- JSON: co wzbudziło straż (liczby, linki, struktura)
  decision         TEXT,     -- NULL | accepted | rejected
  created_section  INTEGER NOT NULL DEFAULT 0,  -- 1 = wiersz job_sections powstał przy akceptacji
  applied_at       TEXT,
  created_at       TEXT NOT NULL,

  PRIMARY KEY (job_id, slot)
);
