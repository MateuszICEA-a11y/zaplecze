# Spec: Własny baner zgody + Consent Mode v2 (widocznosc.ai)

Data: 2026-06-08
Status: zaakceptowany (brainstorming), do napisania plan wdrożenia
Kontekst: stack Astro 6.2 + Cloudflare Pages, `portals/widocznosc.ai/`, deploy z `main`.

## 1. Cel i zakres

Wdrożyć bramkę zgody RODO oraz poprawne sygnały **Google Consent Mode v2** dla
GTM/GA4 (i przyszłych Google Ads). Dziś w kodzie nie ma żadnego
`gtag('consent', …)` – GTM (`GTM-58684HSJ`) ładuje się i tagi odpalają bez
bramki zgody. To luka prawna do zamknięcia.

Domyślnie wszystkie sygnały reklamowe i analityczne są `denied`. GTM ładuje się
nadal – Consent Mode dba o gating tagów oraz tzw. *cookieless pings*
(modelowane dane jeszcze przed zgodą). **Nie blokujemy ładowania GTM** – to jest
istota Consent Mode, nie warunkowe wstrzykiwanie kontenera.

Decyzje z brainstormingu:
- **Własny baner** (nie Cookiebot, nie vanilla-cookieconsent) – dual-theme,
  zero zewnętrznych zależności, lekkość (priorytet perf/GEO).
- **Zakres reklamowy: „nie wiem jeszcze / elastycznie"** – budujemy z poprawnymi
  4 sygnałami Consent Mode v2, tak by ewentualna późniejsza podmiana na
  certyfikowany CMP (wymagany przez Google do personalizowanego remarketingu w
  EOG) nie wymagała przebudowy reszty.
- **Granulacja: „pasek + panel ustawień"** – kategorie: Niezbędne (zawsze),
  Analityka, Marketing.

## 2. Architektura

Trzy izolowane jednostki + jedno dotknięcie stopki:

### 2.1 `src/lib/consent.ts` (czysta logika, testowalna)
Funkcje czyste, bez DOM/efektów ubocznych:
- `parseConsentCookie(cookieString: string): ConsentState | null` – odczyt i
  walidacja cookie; zwraca `null` przy braku, błędzie parsowania lub niezgodnej
  wersji (`v`).
- `serializeConsent(state: ConsentState): string` – JSON → wartość cookie.
- `toConsentSignals(state: ConsentState): ConsentSignals` – mapowanie kategorii
  na sygnały Consent Mode v2 (`'granted' | 'denied'`).

Typy:
```ts
type ConsentState = { v: number; analytics: boolean; marketing: boolean; ts: number };
type ConsentSignals = {
  analytics_storage: 'granted' | 'denied';
  ad_storage: 'granted' | 'denied';
  ad_user_data: 'granted' | 'denied';
  ad_personalization: 'granted' | 'denied';
};
```
Stała `CONSENT_VERSION = 1`. Cała logika mapowania mieszka TU (jedno źródło prawdy).

### 2.2 Inline skrypt w `<head>` Layoutu (NAD snippetem GTM)
`is:inline`, uruchamia się przed GTM. Nie może importować modułu, więc zawiera
minimalny, świadomie zdublowany parser cookie (~12 linii, do weryfikacji okiem;
pełna, testowana wersja jest w `consent.ts`). Odpowiada za:
1. Inicjalizację `dataLayer` + funkcji `gtag`.
2. `gtag('consent','default', { … denied …, wait_for_update: 500 })`.
3. `gtag('set', 'ads_data_redaction', true)`.
4. Dla powracającego użytkownika: odczyt cookie `wai_consent` → natychmiastowy
   `gtag('consent','update', …)` JESZCZE PRZED załadowaniem GTM (brak migotania
   stanu zgody).

### 2.3 `src/components/CookieConsent.astro`
Markup paska + panelu, scoped style oparte na tokenach design systemu
(`var(--bg-canvas)`, `var(--ink)`, `var(--accent-blue)` itd. – dual-theme przez
`data-theme` działa bez dodatkowej pracy). Client-script importuje `consent.ts`
i obsługuje: render warunkowy (pokaż pasek tylko gdy `parseConsentCookie` zwróci
`null`), kliknięcia, zapis cookie, `gtag('consent','update', …)`, otwieranie
panelu, reakcję na event `open-cookie-settings` ze stopki. Wpięty raz globalnie
w `Layout.astro` (body).

### 2.4 `src/components/Footer.astro`
Dodać przycisk/link „Ustawienia cookies", który robi
`window.dispatchEvent(new Event('open-cookie-settings'))`. Baner nasłuchuje i
otwiera panel (pozwala zmienić zgodę po jej wcześniejszym udzieleniu/odrzuceniu).

## 3. Consent Mode v2 – sygnały i timing

Default (w head, przed GTM):

| Sygnał                  | Default  |
|-------------------------|----------|
| `ad_storage`            | denied   |
| `ad_user_data`          | denied   |
| `ad_personalization`    | denied   |
| `analytics_storage`     | denied   |
| `functionality_storage` | granted  |
| `security_storage`      | granted  |

Dodatkowo `wait_for_update: 500` oraz `ads_data_redaction: true`.

Mapowanie kategorii → sygnały (po wyborze użytkownika, `consent update`):
- **Analityka** = `analytics_storage`.
- **Marketing** = `ad_storage` + `ad_user_data` + `ad_personalization`.
- **Niezbędne** – zawsze (nie steruje sygnałami reklamowymi/analitycznymi).

## 4. UX (wariant „pasek + panel")

- Pasek `position: fixed` na dole, **nie blokuje** strony (non-modal), wysoki
  z-index, **bez CLS** (fixed nie przesuwa treści).
- Przyciski równorzędne wizualnie (wymóg RODO – „odrzuć" tak samo łatwe jak
  „zaakceptuj"):
  - **Zaakceptuj wszystko** (accent).
  - **Odrzuć wszystko** (równie widoczny).
  - **Ustawienia** (link/tekst) – rozwija panel.
- Panel: ☑ Niezbędne (disabled, zawsze zaznaczone) · ☐ Analityka · ☐ Marketing
  + przycisk **Zapisz wybór**.
- Każdy wybór: zapis cookie → `consent update` → ukrycie paska.
- Stopka: „Ustawienia cookies" ponownie otwiera panel.
- Link do `/polityka-prywatnosci/` w treści paska.

## 5. Przechowywanie zgody

Cookie `wai_consent`:
- Czas życia: 12 miesięcy.
- `SameSite=Lax`, `path=/`, `Secure` (prod HTTPS).
- Wartość: JSON `{ v: 1, analytics: bool, marketing: bool, ts: epoch_ms }`.
- Pole `v` (wersja): zmiana kategorii w przyszłości → bump wersji → `parseConsentCookie`
  zwraca `null` → ponowne pokazanie paska (re-consent).

## 6. Dostępność

- Panel: `role="dialog"`, `aria-label`, focus-trap, ESC zamyka.
- Pełna obsługa klawiatury, `:focus-visible`.
- Brak flash przy starcie (skrypt `is:inline` + tokeny motywu już ustawione
  wcześniejszym inline theme-initem).

## 7. Świadomie POZA zakresem (YAGNI)

- Geo-detekcja / region scoping – default `denied` globalnie, baner dla
  wszystkich (audytorium głównie PL/EOG).
- i18n – tylko PL.
- IAB TCF / lista vendorów – domena certyfikowanego CMP.
- SSR stanu zgody – stan żyje klient-side (cookie).

## 8. Strategia testów

- **Jednostkowe** (`consent.ts`): `parseConsentCookie` (poprawny / brak / zły JSON
  / zła wersja), `serializeConsent` round-trip, `toConsentSignals` dla wszystkich
  kombinacji analytics×marketing.
- **Manualne** (Tag Assistant / podgląd `dataLayer`):
  1. Pierwsze wejście: stan `denied`, pasek widoczny.
  2. „Zaakceptuj wszystko": sygnały `granted`, cookie zapisane, pasek znika.
  3. Reload: pasek się nie pokazuje, `consent update` leci przed GTM.
  4. „Odrzuć wszystko": `denied` utrwalone.
  5. „Ustawienia" → tylko Analityka: `analytics_storage=granted`, `ad_*=denied`.
  6. Link „Ustawienia cookies" w stopce ponownie otwiera panel.
  7. Dark/light, mobile, klawiatura + ESC.

## 9. Powiązane drobiazgi (poza tym specem, do zrobienia przy okazji sesji)

Nie wchodzą do tego planu wdrożenia banera, ale należą do tego samego wątku
„poprawki pod analityka":

1. **`ReportLeadForm.astro`** – dodać `dataLayer.push({ event:'generate_lead',
   form_id:'narzedzia', lead_type:'raport' })` po `res.ok` (dziś nie pushuje
   żadnego eventu po sukcesie – luka pomiaru drugiego formularza lead-gen).
2. **Instrukcja dla analityka** – w GTM utworzyć **Custom Event trigger**
   `generate_lead` i podpiąć pod niego tag konwersji GA4/Ads (zamiast natywnego
   Form Submission, który łapie też nieudane wysyłki). Plus ustalić GA4 Enhanced
   Measurement „Page changes based on browser history events": jeśli ON →
   ręczny `page_view` push w `Layout.astro` można usunąć (dubluje); jeśli OFF →
   zostawić (jest jedynym źródłem pageview dla nawigacji SPA ClientRouter) i
   poprawić pola (`page_location` zamiast `page_path`).
