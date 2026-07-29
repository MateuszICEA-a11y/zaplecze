-- Migracja 0006: decyzja redaktora per sekcja w edytorze.
--   npx wrangler d1 execute zaplecze-content-watcher --file=./migrations/0006-sections-decision.sql --remote
--
-- Dotąd była sama flaga `accepted` (0/1), więc „jeszcze nie oglądałem" nie dało
-- się odróżnić od „odrzucone". Kolumna `decision` trzyma trzeci stan (NULL),
-- a `accepted` zostaje – to po niej idzie wdrożenie treści do WordPressa.

ALTER TABLE job_sections ADD COLUMN decision TEXT;

UPDATE job_sections SET decision = 'accepted' WHERE accepted = 1 AND decision IS NULL;
