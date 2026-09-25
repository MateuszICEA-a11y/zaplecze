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
  author            TEXT,                        -- ekspert nie może cytować autora wpisu
  status            TEXT NOT NULL DEFAULT 'queued',
  improvements      TEXT NOT NULL DEFAULT '[]',  -- JSON: wybrany pakiet ulepszeń
  models            TEXT,                        -- JSON: {research, writer} – nadpisanie defaultów pipeline'u
  expert            TEXT,                        -- JSON: {status, quote, expert, role, slot, model, cost} – etap finalny z Workera
  style             TEXT,                        -- JSON: {status, model, cost, issues, facts, additions} – przejazd redaktorski (migracja 0009)
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
  error             TEXT,
  wp_draft_id       INTEGER,                     -- ID wpisu-szkicu w WP (migracja 0008)
  wp_draft_url      TEXT,                        -- link podglądu szkicu (?p=ID&preview=true)
  applied_at        TEXT,                        -- ISO; kiedy zmiany weszły na oryginał
  kind              TEXT NOT NULL DEFAULT 'refresh' -- refresh | writer_brief | writer_text (migracja 0011)
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
  operation        TEXT NOT NULL DEFAULT 'update',  -- update | insert | move
  moved_from       INTEGER,  -- dla operation='move': slot, z którego sekcja się przesunęła
  title_before     TEXT,
  title_after      TEXT,
  text_before      TEXT,
  text_after       TEXT,
  text_hash_before TEXT,
  diff             TEXT,   -- JSON: opcode'y z difflib
  accepted         INTEGER NOT NULL DEFAULT 0,
  accepted_at      TEXT,
  edited           INTEGER NOT NULL DEFAULT 0,  -- text_after poprawiony ręcznie w edytorze
  decision         TEXT,   -- NULL | accepted | rejected (migracja 0006)

  PRIMARY KEY (job_id, slot)
);

-- Propozycje przejazdu redaktorskiego („styl i fleksja”, migracja 0009).
-- Osobna tabela, bo to druga warstwa nad propozycjami pipeline'u: diff liczony
-- jest względem stanu, który redaktor widział, a akceptacja przenosi tekst
-- do job_sections.text_after.
CREATE TABLE IF NOT EXISTS job_style (
  job_id           TEXT NOT NULL REFERENCES jobs (id) ON DELETE CASCADE,
  slot             INTEGER NOT NULL,
  title_field      TEXT,
  text_field       TEXT,
  title_before     TEXT,
  title_after      TEXT,   -- NULL = model nie ruszał nagłówka
  text_before      TEXT,
  text_after       TEXT,
  issues           TEXT,   -- JSON: lista poprawek tej sekcji
  warnings         TEXT,   -- JSON: ostrzeżenia straży (liczby, linki, struktura)
  decision         TEXT,   -- NULL | accepted | rejected
  created_section  INTEGER NOT NULL DEFAULT 0,
  applied_at       TEXT,
  created_at       TEXT NOT NULL,

  PRIMARY KEY (job_id, slot)
);

-- Infografiki generowane do sekcji (migracja 0010). Stan zlecenia musi być
-- trwały: kie.ai oddaje obraz po 30–180 s, czyli po końcu żądania Workera.
CREATE TABLE IF NOT EXISTS job_images (
  job_id      TEXT NOT NULL REFERENCES jobs (id) ON DELETE CASCADE,
  slot        INTEGER NOT NULL,
  status      TEXT NOT NULL DEFAULT 'brief',  -- brief | generating | ready | inserted | failed
  brief       TEXT,      -- opis zawartości grafiki (bez stałej stylu marki)
  alt         TEXT,
  caption     TEXT,
  task_id     TEXT,
  image_url   TEXT,      -- adres z kie.ai (tymczasowy!)
  media_id    INTEGER,   -- ID w bibliotece mediów WordPressa
  media_url   TEXT,
  figure_html TEXT,      -- blok wstawiony do sekcji (do zdjęcia przy „usuń”)
  credits     TEXT,
  error       TEXT,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL,

  PRIMARY KEY (job_id, slot)
);

-- Cache analizy SERP-gap i treści konkurencji (migracje 0004/0005). Klucz
-- "<domena>:<post_id>" (SERP) albo "rivals:<domena>:<post_id>"; Content Writer
-- używa ujemnego post_id = -id projektu.
CREATE TABLE IF NOT EXISTS serp_snapshots (
  id         TEXT PRIMARY KEY,
  domain     TEXT NOT NULL,
  post_id    INTEGER NOT NULL,
  payload    TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'done',
  error      TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS serp_snapshots_domain ON serp_snapshots (domain, created_at DESC);

-- Content Writer: projekt nowego artykułu (migracja 0011). Przebiegi to wiersze
-- `jobs` z kind = writer_brief | writer_text i post_id = -id projektu.
CREATE TABLE IF NOT EXISTS writer_projects (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  domain            TEXT NOT NULL,
  keyword           TEXT NOT NULL,
  keyword_norm      TEXT NOT NULL,
  title             TEXT,
  status            TEXT NOT NULL DEFAULT 'research',
  brief             TEXT,
  brief_accepted_at TEXT,
  brief_job_id      TEXT,
  write_job_id      TEXT,
  author_id         INTEGER,
  author_name       TEXT,
  category_id       INTEGER,
  lead              TEXT,
  wp_post_id        INTEGER,
  wp_draft_url      TEXT,
  wp_modified       TEXT,
  wp_saved_at       TEXT,
  error             TEXT,
  created_by        TEXT,
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS writer_projects_domain ON writer_projects (domain, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS writer_projects_keyword
  ON writer_projects (domain, keyword_norm) WHERE status != 'cancelled';

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
