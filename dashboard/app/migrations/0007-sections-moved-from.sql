-- Migracja 0007: pozycjonowanie nowych sekcji – operacja `move`.
--   npx wrangler d1 execute zaplecze-content-watcher --file=./migrations/0007-sections-moved-from.sql --remote
--
-- Pipeline renumeruje układ artykułu: nowa sekcja wchodzi za wskazaną kotwicą,
-- a dalsze sekcje przesuwają się w dół jako operation='move'. `moved_from`
-- trzyma slot źródłowy – edytor pokazuje po nim „przesunięta z sekcji N".

ALTER TABLE job_sections ADD COLUMN moved_from INTEGER;
