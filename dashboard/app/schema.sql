-- Content Watcher – stan kolejki reoptymalizacji (Cloudflare D1).
-- Zastosowanie:
--   npx wrangler d1 execute zaplecze-content-watcher --file=./schema.sql --remote
-- Skrypt jest idempotentny (CREATE TABLE IF NOT EXISTS), więc można go puścić
-- ponownie po dołożeniu indeksu.

-- Zadanie reoptymalizacji jednego wpisu.
-- Cykl życia: queued → dispatching → running → done | failed | cancelled
--             | budget_exceeded | stale (utracona dzierżawa)
CREATE TABLE IF NOT EXISTS jobs (
  id                TEXT PRIMARY KEY,
  domain            TEXT NOT NULL,
  post_id           INTEGER NOT NULL,
  post_type         TEXT NOT NULL DEFAULT 'posts',
  url               TEXT NOT NULL,
  title             TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'queued',
  improvements      TEXT NOT NULL DEFAULT '[]',  -- JSON: wybrany pakiet ulepszeń
  snapshot_hash     TEXT,                        -- hash treści z chwili startu
  run_id            TEXT,                        -- GitHub Actions run id
  run_attempt       INTEGER,
  lease_expires_at  TEXT,                        -- ISO; po tym czasie zadanie jest „stale”
  last_heartbeat_at TEXT,
  pipeline_version  TEXT,
  cost              TEXT NOT NULL DEFAULT '{}',  -- JSON: {ahrefs_units, tokens_in, tokens_out}
  created_by        TEXT,                        -- audyt: kto zakolejkował
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL,
  finished_at       TEXT,
  error             TEXT
);

CREATE INDEX IF NOT EXISTS jobs_domain_created ON jobs (domain, created_at DESC);
CREATE INDEX IF NOT EXISTS jobs_post ON jobs (domain, post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS jobs_status ON jobs (status, lease_expires_at);

-- Kroki pipeline'u. Kroki `done` nie są liczone ponownie przy retry.
CREATE TABLE IF NOT EXISTS job_steps (
  job_id         TEXT NOT NULL REFERENCES jobs (id) ON DELETE CASCADE,
  step           TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'pending',
  started_at     TEXT,
  finished_at    TEXT,
  payload        TEXT,   -- JSON: wyniki researchu, wytyczne
  cost           TEXT,   -- JSON: jednostki Ahrefs, tokeny
  model          TEXT,
  prompt_version TEXT,
  input_hash     TEXT,
  error          TEXT,
  PRIMARY KEY (job_id, step)
);

-- Propozycje zmian per slot ACF (page_title_h2_N + page_text_N to jedna sekcja).
-- Trzymamy hash „przed”, żeby przed skopiowaniem wykryć zmianę po stronie CMS-a.
CREATE TABLE IF NOT EXISTS job_sections (
  job_id           TEXT NOT NULL REFERENCES jobs (id) ON DELETE CASCADE,
  slot             INTEGER NOT NULL,
  title_field      TEXT NOT NULL,
  text_field       TEXT NOT NULL,
  operation        TEXT NOT NULL DEFAULT 'update',  -- update | insert
  title_before     TEXT,
  title_after      TEXT,
  text_before      TEXT,
  text_after       TEXT,
  text_hash_before TEXT,
  diff             TEXT,   -- JSON: opcode'y z difflib
  accepted         INTEGER NOT NULL DEFAULT 0,
  accepted_at      TEXT,
  PRIMARY KEY (job_id, slot)
);

-- Zużyte podpisy callbacków – ochrona przed replayem w oknie ważności.
CREATE TABLE IF NOT EXISTS callback_nonces (
  signature  TEXT PRIMARY KEY,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS callback_nonces_created ON callback_nonces (created_at);

-- Log operacji człowieka (kolejkowanie, akceptacja sekcji, anulowanie).
CREATE TABLE IF NOT EXISTS audit_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  at         TEXT NOT NULL,
  actor      TEXT,
  action     TEXT NOT NULL,
  job_id     TEXT,
  detail     TEXT
);

CREATE INDEX IF NOT EXISTS audit_log_at ON audit_log (at DESC);
