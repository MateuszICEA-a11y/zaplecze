# Sesja 2026-06-01 cz.2 – podsumowanie (widocznosc.ai)

Kontynuacja po cz.1 (lead-gen /kontakt + GTM). Wszystko wdrożone na `main` i pushnięte na prod.

## 1. Zdjęcie noindex + indeksacja (commit 45b4c23)
- `Layout.astro`: domyślny prop `noindex` `true→false`; `public/_headers`: usunięty globalny `X-Robots-Tag: noindex`.
- 404 zostaje `noindex` (przekazuje prop jawnie). Sitemap zweryfikowany: 79/79 indeksowalnych stron.

## 2. Domena techniczna *.pages.dev → noindex (commit 054bba1)
- `functions/_middleware.ts` + `_lib/indexing.ts` (`shouldBlockIndexing`): `X-Robots-Tag: noindex` tylko dla hostów `*.pages.dev` (alias prod + preview). 6 testów. E2E przez wrangler.

## 3. Kanoniczna domena (Cloudflare, nie repo)
- Root cause: w strefie CF była **sub-delegacja `www NS → seohost`** (jak gotcha `_domainkey`) → CF ignorował lokalny CNAME, www serwował parking SEOHOST. Usunięto 2 rekordy `www NS`. + `www CNAME → widocznosc.ai` Proxied + Redirect Rule www→apex 301 + „Always Use HTTPS" ON.
- Efekt: tylko `https://widocznosc.ai` = 200, reszta 301. Szczegóły: pamięć `reference-widocznosc-dns-seohost-delegacje`.

## 4. Narzędzia – limity per IP (Plan A, merge c0c2d7a)
- `_lib/tool-rate-limit.ts` (`resolveLimit` + `checkToolLimit`, klucz KV `tool:<nazwa>:<ip>`, reset Warsaw). Defaulty w kodzie: brand-check **3**, fanout **5**, url-check **10**, ai-bots-check **∞**. E2E: 200/200/200/429.

## 5. Narzędzia – łapanie leadów (Plan B1+B2, merge 625c7c9)
- Backend: `_lib/email-shell.ts` (wspólny szablon, wyciągnięty z contact.ts), 4 renderery `_lib/reports/*`, `_lib/send-report.ts` (walidacja + powiadomienie leadowe z flagą zgody), endpoint `functions/api/tools/send-report.ts` (limit 5/IP, honeypot, walidacja, limit 32KB).
- Frontend: `src/components/tools/ReportLeadForm.astro` (raport na e-mail + opcjonalny checkbox zgody + kontekstowe CTA), wpięty w 4 strony przez event `tool:result`.
- Polityka prywatności: `<li>` w §2 o danych z narzędzi.
- Fix UI (commit 928d31b): zła nazwa zmiennych CSS → białe tło na dark; poprawione na realne `--color-bg-card/--color-ink/--color-hairline/--accent-blue` + `max-width` (1080 / 100%); tytuł h3 21px (`!important`, bije globalną regułę h3=32px). Zweryfikowane wizualnie (Playwright, dark+light).

## 6. Newsy – fix jakości + nowy wpis (commits 1a4784e, 6bb8c8c, 9c35946)
- Problem (user): artykuł NVIDIA-ARM = sprzęt + naciągane fakty + brand tie-in. Usunięty.
- Pipeline `news-generator-widocznosc`: feeds przebudowane pod modele (The Decoder, OpenAI, DeepMind, Ars Technica; usunięty CNBC + martwy SEL); `collector.py` – z whitelisty AI wycięte `nvidia`/`data cent`; `generator.py` – persona = **ekspert AI (nie brand-manager)**, twardy zakaz marka/SEO/GEO + „disclaimerów", ścisła wierność faktom.
- Nowy wpis za dziś: **MiniMax M3** (open-weight, 1M kontekstu) – fakty z The Decoder (WebFetch), hero przez kie.ai (vision-validated). published.json zaktualizowany.

## Stan / otwarte
- **Do weryfikacji na prod:** realna wysyłka raportu z narzędzi (lokalnie dummy RESEND_API_KEY) – sprawdzić, że mail do usera + lead na lead.icea@gmail.com dochodzą.
- Opcjonalnie env `TOOL_REPORT_DAILY_LIMIT` (default 5 w kodzie).
- Obserwować następny cron newsów – czy nowe źródła/prompt dają realne newsy o modelach bez wątku brandowego.
- Otwarte z lead-genu (z prior sesji): decyzje fraz/newslettera/capture.
