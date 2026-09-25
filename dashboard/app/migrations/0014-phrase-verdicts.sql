-- Migracja 0014: zapamiętane werdykty „odśwież czy nowy" (2026-09-25).
--   npx wrangler d1 execute zaplecze-content-watcher --file=migrations/0014-phrase-verdicts.sql --remote
--
-- Embeddingi są deterministyczne, zmienny był tylko sędzia LLM w paśmie „Sprawdź":
-- przy każdym wejściu oceniał od nowa i liczniki podpowiedzi skakały. Tu werdykt
-- sędziego (source = 'judge') – ważny, dopóki nie zmieni się to, na czym się
-- opierał (cases_hash: fraza + kandydaci + wersja promptu i model) i nie minie
-- VERDICT_TTL_DAYS – oraz decyzja redaktora (source = 'editor'), która wygrywa
-- z modelem i nie wygasa.

CREATE TABLE IF NOT EXISTS phrase_verdicts (
  domain      TEXT NOT NULL,
  phrase_key  TEXT NOT NULL,
  source      TEXT NOT NULL,            -- judge | editor
  phrase      TEXT NOT NULL,
  verdict     TEXT NOT NULL,            -- same | related | different | skip
  cases_hash  TEXT,                     -- tylko judge
  pick_path   TEXT,                     -- wskazany wpis (ścieżka)
  target      TEXT,                     -- editor: JSON wpisu {path,title,url,catalog_id,post_id}
  basis       TEXT,
  created_at  TEXT NOT NULL,
  PRIMARY KEY (domain, phrase_key, source)
);
