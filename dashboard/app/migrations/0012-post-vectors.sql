-- Migracja 0012: indeks znaczeniowy wpisów dla Content Writera (2026-09-25).
--   npx wrangler d1 execute zaplecze-content-watcher --file=migrations/0012-post-vectors.sql --remote
--
-- Wektory siedzą w Vectorize (indeks zaplecze-posts, bge-m3, 1024 wymiary),
-- tu tylko hash tekstu, z którego policzono embedding – po nim cron wie,
-- które wpisy przeliczyć (nowe, zmienione tytuły/H2/opis, nowa EMBED_VERSION).

CREATE TABLE IF NOT EXISTS post_vectors (
  domain     TEXT NOT NULL,
  post_id    INTEGER NOT NULL,
  text_hash  TEXT NOT NULL,
  indexed_at TEXT NOT NULL,
  PRIMARY KEY (domain, post_id)
);
