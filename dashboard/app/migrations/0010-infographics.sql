-- Migracja 0010: infografika do sekcji wpisu (2026-08-17).
--   npx wrangler d1 execute zaplecze-content-watcher --file=migrations/0010-infographics.sql --remote
--
-- Generowanie obrazu (kie.ai/gpt-image-2) trwa 30–180 s, czyli dłużej niż życie
-- żądania Workera – dlatego stan zlecenia musi być trwały: `task_id` przechodzi
-- między krokami, a przeglądarka odpytuje o `status`.
--
-- Sekret Workera: KIE_API_KEY (klucz kie.ai). Wgranie obrazu do biblioteki
-- mediów idzie na tym samym haśle aplikacji co zapis treści (WP_APP_*).

CREATE TABLE IF NOT EXISTS job_images (
  job_id      TEXT NOT NULL REFERENCES jobs (id) ON DELETE CASCADE,
  slot        INTEGER NOT NULL,
  status      TEXT NOT NULL DEFAULT 'brief',  -- brief | generating | ready | inserted | failed
  brief       TEXT,      -- opis zawartości grafiki (bez stałej stylu marki)
  alt         TEXT,
  caption     TEXT,
  task_id     TEXT,      -- zlecenie w kie.ai
  image_url   TEXT,      -- adres z kie.ai (tymczasowy!)
  media_id    INTEGER,   -- ID w bibliotece mediów WordPressa
  media_url   TEXT,      -- trwały adres obrazu
  figure_html TEXT,      -- blok wstawiony do sekcji (do zdjęcia przy „usuń")
  credits     TEXT,      -- kredyty kie.ai zużyte na obraz
  error       TEXT,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL,

  PRIMARY KEY (job_id, slot)
);
