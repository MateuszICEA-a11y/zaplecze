-- Zapis wyników do WordPressa (2026-08-04): szkic podglądowy + wdrożenie.
-- npx wrangler d1 execute zaplecze-content-watcher --file=migrations/0008-wp-draft.sql --remote
ALTER TABLE jobs ADD COLUMN wp_draft_id INTEGER;  -- ID wpisu-szkicu w WP (NULL = brak)
ALTER TABLE jobs ADD COLUMN wp_draft_url TEXT;    -- link podglądu szkicu (?p=ID&preview=true)
ALTER TABLE jobs ADD COLUMN applied_at TEXT;      -- ISO; kiedy zmiany weszły na oryginał
