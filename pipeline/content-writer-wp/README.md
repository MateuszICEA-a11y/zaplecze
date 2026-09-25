# Content Writer (grupa-icea.pl)

Nowe artykuły od zera, uruchamiane z modułu **Content Writer** w dashboardzie
(`/grupa-icea.pl/content-writer/`). Nie mylić z `pipeline/content-writer`
(BusManiak.pl, Hugo).

## Przebieg

1. **Research w Workerze** (`/api/cw/writer/projects/:id/serp|rivals`) –
   SERP-gap z SerpData + Senuto i fakty z treści konkurencji (Jina), te same
   handlery co w edytorze Content Watchera, klucz = `-id` projektu.
2. **Brief** – `write.py --stage brief`: SERP (AI Overview, PAA, powiązane),
   nagłówki i frazy konkurencji, prompt `prompts/brief_new.md`. Model musi
   podać `basis` każdego punktu i ma wyjście `{"skip": true, "reason": …}`.
3. **Akceptacja** – redaktor poprawia plan w dashboardzie, zatwierdzony brief
   jedzie w `client_payload.brief` → `BRIEF_JSON`.
4. **Tekst** – `write.py --stage write`: prompt `prompts/write.md`, potem kroki
   z content-refresher bez zmian: bramka pokrycia fraz (`coverage` +
   `coverage_faq`), Źródła do pól `page_sources_*` (slot 200), linki wewnętrzne
   z katalogu. Wynik to wiersze `job_sections` z operacją `insert`.
5. **Dopracowanie i szkic** – ekspert, styl i fleksja, infografiki, CTA
   (trasy `/api/cw/jobs/:id/*`), potem nowy szkic w WordPressie
   (`/api/cw/writer/projects/:id/wp-draft`).

## Wspólny silnik

`write.py` dziedziczy po `Pipeline` z `pipeline/content-refresher/run.py`
i importuje jego moduły (`llm`, `research`, `extract`, `matching`, `apply`,
`budget`, `client`, `wp`). Dlatego plik konfiguracji nazywa się
`writer_config.py` – `config` z content-refresher musi zostać nieprzesłonięty.

Limity `MAX_OUTLINE` i `MAX_FAQ` są lustrem stałych w
`dashboard/app/cw-writer.js` – pilnuje tego test `test_limity_lustrem_workera`.

## Lokalnie

```
python pipeline/content-writer-wp/write.py --job test --domain grupa-icea.pl \
    --stage brief --keyword "audyt seo" --dry-run --research-file research.json
python -m pytest pipeline/content-writer-wp/tests
```
