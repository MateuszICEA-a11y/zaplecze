-- Migracja 0013: porównanie wpisów konkurencji z naszymi (2026-09-25).
--   npx wrangler d1 execute zaplecze-content-watcher --file=migrations/0013-competitor-matches.sql --remote
--
-- Adresy konkurencji zbiera collector (data/<domena>/competitors.json, w buildzie
-- pod /<domena>/content-writer/competitors.json). Tu wynik porównania tytułu
-- z indeksem naszych wpisów (Vectorize) – zapisany, żeby werdykt był stały
-- między wejściami, a przeliczany tylko dla nowych/zmienionych tytułów albo
-- gdy nasz indeks wpisów zmienił się po ostatnim porównaniu.

CREATE TABLE IF NOT EXISTS competitor_matches (
  domain         TEXT NOT NULL,
  url            TEXT NOT NULL,
  text_hash      TEXT NOT NULL,
  action         TEXT NOT NULL,           -- new | refresh | check
  score          REAL,                    -- podobieństwo do najbliższego naszego wpisu
  target_post_id INTEGER,
  target_catalog_id TEXT,
  target_title   TEXT,
  target_url     TEXT,
  classified_at  TEXT NOT NULL,
  PRIMARY KEY (domain, url)
);
