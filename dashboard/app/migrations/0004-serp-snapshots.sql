-- Cache analizy SERP-gap: kto zajmuje temat wpisu i jakich fraz nam brakuje.
-- Jeden wiersz na wpis (domena + post_id); świeżość rozstrzyga created_at,
-- bo ponowne wejście do edytora nie może palić limitów SerpData i Senuto.
--   npx wrangler d1 execute zaplecze-content-watcher --file=./migrations/0004-serp-snapshots.sql --remote
CREATE TABLE IF NOT EXISTS serp_snapshots (
  id         TEXT PRIMARY KEY,     -- "<domena>:<post_id>"
  domain     TEXT NOT NULL,
  post_id    INTEGER NOT NULL,
  payload    TEXT NOT NULL,        -- JSON: zapytania, konkurenci, luki fraz
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS serp_snapshots_domain ON serp_snapshots (domain, created_at DESC);
