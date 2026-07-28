-- Migracja 0003: ręczne poprawki propozycji sekcji w edytorze.
--   npx wrangler d1 execute zaplecze-content-watcher --file=./migrations/0003-sections-edited.sql --remote

ALTER TABLE job_sections ADD COLUMN edited INTEGER NOT NULL DEFAULT 0;
