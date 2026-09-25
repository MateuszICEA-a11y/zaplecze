-- Migracja 0011: Content Writer – nowe artykuły od zera (2026-09-25).
--   npx wrangler d1 execute zaplecze-content-watcher --file=migrations/0011-content-writer.sql --remote
--
-- Projekt artykułu (writer_projects) prowadzi frazę od researchu przez brief
-- do szkicu w WordPressie. Przebiegi w GitHub Actions to zwykłe wiersze `jobs`
-- z `kind` = writer_brief | writer_text i `post_id` = -id projektu: nowy
-- artykuł nie ma jeszcze wpisu w CMS-ie, a ujemny numer nie zderzy się z żadnym
-- ID WordPressa. Dzięki temu callbacki, dzierżawa, anulowanie, sekcje, ekspert,
-- styl, infografiki i CTA działają istniejącą ścieżką Content Watchera.

ALTER TABLE jobs ADD COLUMN kind TEXT NOT NULL DEFAULT 'refresh';  -- refresh | writer_brief | writer_text

CREATE TABLE IF NOT EXISTS writer_projects (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  domain            TEXT NOT NULL,
  keyword           TEXT NOT NULL,              -- fraza w brzmieniu redaktora
  keyword_norm      TEXT NOT NULL,              -- normalizeKeyword() – klucz duplikatów
  title             TEXT,                       -- tytuł roboczy (z briefu, do edycji)
  status            TEXT NOT NULL DEFAULT 'research',
                    -- research | brief_running | brief_ready | writing | written | failed | cancelled
  brief             TEXT,                       -- JSON: brief po poprawkach redaktora – z niego pisze model
  brief_accepted_at TEXT,
  brief_job_id      TEXT,
  write_job_id      TEXT,
  author_id         INTEGER,                    -- autor wpisu w WordPressie
  author_name       TEXT,                       -- ekspert nie może cytować autora
  category_id       INTEGER,
  lead              TEXT,                       -- wstęp przed pierwszym H2 (pole `content` WP)
  wp_post_id        INTEGER,                    -- szkic w WordPressie
  wp_draft_url      TEXT,
  wp_modified       TEXT,                       -- `modified` szkicu z chwili zapisu – wykrywa edycję w WP
  wp_saved_at       TEXT,
  error             TEXT,
  created_by        TEXT,
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS writer_projects_domain ON writer_projects (domain, created_at DESC);
-- Jedna fraza = jeden projekt; anulowany zwalnia frazę.
CREATE UNIQUE INDEX IF NOT EXISTS writer_projects_keyword
  ON writer_projects (domain, keyword_norm) WHERE status != 'cancelled';
