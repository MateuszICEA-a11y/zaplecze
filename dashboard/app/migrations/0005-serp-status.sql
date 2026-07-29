-- Analiza SERP idzie w tle (dwa zapytania SerpData po ~20 s nie mieszczą się
-- w czasie życia żądania), więc snapshot musi nieść własny stan.
--   npx wrangler d1 execute zaplecze-content-watcher --file=./migrations/0005-serp-status.sql --remote
ALTER TABLE serp_snapshots ADD COLUMN status TEXT NOT NULL DEFAULT 'done';
ALTER TABLE serp_snapshots ADD COLUMN error TEXT;
