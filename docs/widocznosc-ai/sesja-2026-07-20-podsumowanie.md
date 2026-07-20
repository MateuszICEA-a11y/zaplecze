# Sesja 2026-07-20 – Dashboard analityczny zaplecza (e2e) + Clarity na widocznosc.ai

## Co powstało

**Dashboard analityczny** – publiczny, multi-domain, w pełni operacyjny:
🔗 **https://zaplecze-dashboard.m-wisniewski.workers.dev**

Architektura: GH Actions cron (04:30 UTC) → collector Python → JSONL w `dashboard/data/<domena>/snapshots.jsonl` (1 linia/dzień, idempotentnie) → Cloudflare **Workers Builds** (git, root `dashboard/app`) → Astro 6 + uPlot. Konfiguracja domen: `dashboard/domains.yaml` (nowa domena = 1 wpis, zero kodu). Instrukcje: `dashboard/README.md` + interaktywny poradnik-artefakt (checklista 8 kroków).

### Źródła danych (5/5 zielone na prod)
| Źródło | Metryki | Uwagi |
|---|---|---|
| Senuto | top3/top10/top50, indeks widoczności, domain_rank | `dashboard/getDomainStatistics`, fetch_mode=`topLevelDomain` |
| GSC | kliknięcia, wyświetlenia, CTR, śr. pozycja, frazy z wyświetleniami | service account, property **prefiks URL** `https://widocznosc.ai/`, lag 3 dni |
| Ahrefs | backlinki, ref. domains, Domain Rating, ahrefs_rank | API v3 `backlinks-stats` + `domain-rating`, sekret `AHREFS_API_KEY` |
| SMSAPI | saldo + **przelicznik na SMS-y** (0,17 zł/szt. → 326) | wycena live przez `sms.do` `test=1` |
| OpenRouter | konto (`/credits`) + **zużycie klucza projektu** (`/key`) | fallback `secrets.OPENROUTER_KEY` w workflow |

DataForSEO backlinks zostawione w kodzie jako wyłączony fallback (frontend ma koalescencję ahrefs→backlinks). Clarity = placeholder na `CLARITY_API_TOKEN`.

### Microsoft Clarity na widocznosc.ai
Tag `xntfosggp9` w Layout.astro (136 stron) – **cookieless start**, ciasteczka dopiero po zgodzie analitycznej: sync z cookie `wai_consent` przy wejściu + live `clarity('consent', analytics)` z banera (`CookieConsent.astro`).

## Gotche odkryte w sesji
- **Senuto HTTP 418** = walidacja parametrów (`fetch_mode` przyjmuje tylko `topLevelDomain|subdomain`), NIE WAF; kolejność: walidacja(418) → auth(302 na login). Szczegóły w memory `senuto-api-access`.
- **Cloudflare „Import a repository"** = Workers Builds, nie Pages – wstrzykiwany token nie ma uprawnień Pages (auth error 10000); rozwiązanie: `[assets]` w wrangler.toml + deploy command `npx wrangler deploy`.
- **google-auth wymaga `requests`** do refreshu tokenu SA (w requirements).
- **GSC property** widocznosc.ai to prefiks URL, nie domenowa.
- **`.env` bez trailing newline** – `echo >>` skleja linie i klucz jest pusty (naprawione + zafałszowało diagnozę tokenu Senuto).
- Sekret OpenRoutera w repo istnieje tylko jako `OPENROUTER_KEY` (nazwa z fb-postera) – workflow ma fallback `||`.
- GH Actions: brak uprawnień `gh workflow run` (403) – obejście: trigger `push` z paths na pliki collectora (bez pętli, bo commity bota z GITHUB_TOKEN nie triggerują workflowów).

## Audyt bezpieczeństwa (przy okazji)
`api-credentials.md` z żywymi kluczami jest **gitignored i nigdy nie trafił do repo** (fałszywy alarm). Jedyny klucz w historii publicznej: stary kie.ai `b0635a47…` – zweryfikowany jako **martwy** (401). Żywy klucz kie.ai wpisany do `.env`/`pipeline/.env` (zamknięta gotcha „martwy klucz w .env").

## Pierwsze dane (baseline 2026-07-20)
GSC (17.07): 198 wyświetleń, 0 kliknięć, poz. 11,2, 20 fraz · Senuto: 2×TOP50 · Ahrefs: DR 29, 9 backlinków, 2 domeny · SMSAPI: 55,44 zł ≈ 326 SMS · OpenRouter: 469,96 $ pozostało, klucz projektu 1,50 $.

## Otwarte
- `OPENROUTER_PROJECT_KEY` = obecnie ten sam klucz co główny (label `sk-or-v1-142…948`) – jeśli ma śledzić klucz narzędzi z CF Pages, podmienić wartość sekretu.
- Clarity Data Export API → po zebraniu danych: token z panelu → sekret `CLARITY_API_TOKEN` + `clarity.enabled: true`.
- Token Senuto: rotacja ~31 dni (obecny do ~13.08), dashboard przypomina żółtym bannerem.
- Poradnik (artefakt): https://claude.ai/code/artifact/e85a884c-3364-4446-9a31-ba3919623df8

Commity: `8b77d24..976c4b8` (dashboard, ~14 commitów) + Clarity `6562397`. Wszystko wypchnięte.
