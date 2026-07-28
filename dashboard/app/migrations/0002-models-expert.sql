-- Migracja 0002: wybór modeli per zadanie + ekspert jako etap finalny.
-- Zastosowanie (raz, na istniejącej bazie – ALTER TABLE nie jest idempotentny):
--   npx wrangler d1 execute zaplecze-content-watcher --file=./migrations/0002-models-expert.sql --remote
-- Świeże instalacje dostają te kolumny od razu z schema.sql.

ALTER TABLE jobs ADD COLUMN author TEXT;
ALTER TABLE jobs ADD COLUMN models TEXT;
ALTER TABLE jobs ADD COLUMN expert TEXT;
