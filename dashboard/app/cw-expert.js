/**
 * Porada eksperta – finalny etap Content Watchera, wykonywany z Workera.
 *
 * Krok expert nie potrzebuje researchu (SERP/Senuto) – tylko scalonej treści,
 * którą Worker ma już w D1 (job_sections). Dlatego generujemy cytat
 * bezpośrednio przez OpenRouter (sekret OPENROUTER_API_KEY w Workerze),
 * w sekundy, zamiast ponownie odpalać cały pipeline w GitHub Actions.
 *
 * Świadome duplikaty (komentarze krzyżowe w bliźniaczych plikach):
 * - lista EXPERTS: pipeline/content-refresher/run.py
 * - prompt: pipeline/content-refresher/prompts/expert.md (wersja niżej)
 * - reguły redakcyjne: pipeline/content-refresher/config.py (EDITORIAL_RULES)
 */

export const EXPERT_PROMPT_VERSION = '1.0.0';

export const EXPERTS = [
  'Mateusz Wiśniewski – ekspert SEO i AI Search',
  'Magdalena Antoń – specjalistka ds. treści',
  'Karolina Goćkowska – specjalistka SEO',
  'Dorota Prokopiak – specjalistka ds. marketingu',
];

/* Stanowiska osób, o których wiemy – WordPress ich nie niesie (pole `description`
   ma wypełnione pięć kont na trzydzieści siedem, a strona autora podaje samo
   „Autor w serwisie ICEA"). Dla reszty rola zostaje pusta i redaktor wpisuje ją
   w edytorze. */
export const KNOWN_ROLES = Object.fromEntries(
  EXPERTS.map((row) => {
    const [name, role] = row.split(' – ');
    return [name.trim(), (role ?? '').trim()];
  }),
);

// Konta serwisowe i partnerskie w liście autorów WordPressa („ICEA",
// „Globkurier.pl", „Responso"). Cytat podpisujemy człowiekiem, więc bierzemy
// tylko konta wyglądające na imię i nazwisko.
const PERSON_NAME = /^[A-ZĄĆĘŁŃÓŚŹŻ][\p{L}.'-]+(?:\s+[A-ZĄĆĘŁŃÓŚŹŻ][\p{L}.'-]+){1,2}$/u;

export const isPersonName = (name) => PERSON_NAME.test(String(name ?? '').trim());

/**
 * Autorzy portalu do wyboru w edytorze. Źródłem jest WordPress, nie lista
 * w kodzie – redakcja przychodzi i odchodzi, a `EXPERTS` zostawało w tyle.
 * Enumeracja po `?author=` jest zablokowana przez AIOS, więc liczby wpisów
 * nie podajemy; kolejność alfabetyczna.
 */
export async function wpAuthors(base, fetchImpl = fetch, auth = '') {
  const url = `${String(base).replace(/\/$/, '')}/wp-json/wp/v2/users/?per_page=100&_fields=id,name,slug,description,avatar_urls`;
  const response = await fetchImpl(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'content-refresher',
      // Bez uwierzytelnienia AIOS odbija listę użytkowników (HTTP 403) i pole
      // „ekspert" zostawało puste – hasło aplikacji Worker i tak już ma.
      ...(auth ? { Authorization: auth } : {}),
    },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`WordPress nie oddał listy autorów (HTTP ${response.status}).`);
  const rows = await response.json();
  if (!Array.isArray(rows)) throw new Error('WordPress nie oddał listy autorów.');
  return rows
    .map((row) => ({
      name: String(row?.name ?? '').trim(),
      slug: String(row?.slug ?? '').trim(),
      role: KNOWN_ROLES[String(row?.name ?? '').trim()] ?? '',
      avatar: avatarUrl((row?.avatar_urls ?? {})['96'] ?? ''),
    }))
    .filter((row) => isPersonName(row.name))
    .sort((a, b) => a.name.localeCompare(b.name, 'pl'));
}

/** Adres awatara w rozmiarze pod kartę cytatu. Gravatarowi każemy oddać 404
    zamiast zastępczej ikonki – inaczej nie da się odróżnić realnego zdjęcia
    od domyślnego szarego ludzika. */
export function avatarUrl(raw) {
  const url = String(raw ?? '').trim();
  if (!/^https:\/\//i.test(url)) return '';
  const base = url.split('?')[0];
  return /(^|\.)gravatar\.com$/i.test(new URL(base).hostname)
    ? `${base}?s=112&d=404`
    : url;
}

/** Zdjęcie eksperta, jeśli konto WordPressa je ma. Dziś żadne nie ma, więc
    kartę podpisuje kółko z inicjałami – ale gdy ktoś wgra avatar, wjedzie
    do cytatu bez zmiany w kodzie. */
export async function expertPhoto(url, fetchImpl = fetch) {
  if (!url) return '';
  try {
    const response = await fetchImpl(url, {
      method: 'HEAD',
      headers: { 'User-Agent': 'content-refresher' },
      signal: AbortSignal.timeout(8_000),
    });
    return response.ok ? url : '';
  } catch {
    return ''; // zdjęcie jest ozdobą, nie warunkiem wygenerowania cytatu
  }
}

const EDITORIAL_RULES = `Zasady redakcyjne, których musisz przestrzegać:
- Półpauza (–), nigdy myślnik em (—).
- Przed listą stawiaj dwukropek, nie półpauzę.
- W listach nie stosuj wzorca „**Pogrubienie:** opis" – pisz „**Termin** – opis".
- Anchor linku ma być zgodny gramatycznie ze zdaniem, w którym stoi.
- Nie obiecuj efektów, których nie da się potwierdzić danymi.
- Zachowaj polską interpunkcję i pełne znaki diakrytyczne.
- Nie zmieniaj sensu zdań, które są poprawne merytorycznie.`;

const MAX_CONTENT_CHARS = 24_000;
const TIMEOUT_MS = 60_000;

const stripHtml = (html) =>
  String(html ?? '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

/** Scala sekcje zadania w treść dla modelu – propozycja pipeline'u, jeśli
    jest, inaczej stan wyjściowy. */
export function mergedContent(sections) {
  const parts = [];
  for (const section of sections ?? []) {
    const title = section.title_after ?? section.title_before ?? '';
    const text = stripHtml(section.text_after ?? section.text_before ?? '');
    if (text) parts.push(`[sekcja ${section.slot}] ${title}\n${text}`);
  }
  return parts.join('\n\n').slice(0, MAX_CONTENT_CHARS);
}

export function buildExpertPrompt({ title, content, author, experts = EXPERTS, person = null }) {
  const allowed = experts.filter((name) => !author || !name.startsWith(author));
  // Redaktor wskazał osobę w edytorze – model jej nie zmienia, dobiera tylko
  // treść i miejsce. Rola bywa pusta (WordPress stanowisk nie trzyma).
  const chosen = person?.name
    ? `## Ekspert

Cytat podpisujemy imieniem i nazwiskiem: **${person.name}**${person.role ? ` (${person.role})` : ''}. W polu „expert" zwróć dokładnie to imię i nazwisko${person.role ? `, w polu „role" – dokładnie to stanowisko` : ', a pole „role" zostaw puste'}. Nie proponuj innej osoby.`
    : null;
  return `Piszesz komentarz eksperta ICEA do gotowego artykułu. To ma być realna wartość dodana: obserwacja z praktyki, której nie ma w tekście – nie streszczenie tego, co już napisano.

## Artykuł po optymalizacji

Tytuł: ${title}

${content}

${chosen ?? `## Ekspert

Cytat przypisujemy osobie z zespołu ICEA. Autor tego wpisu to: ${author || 'nieznany'} – **nie wolno** przypisać cytatu autorowi, bo byłoby to cytowanie samego siebie. Wybierz inną osobę z listy: ${JSON.stringify(allowed, null, 1)}.`}

## Zadanie

Zwróć wyłącznie JSON:

{
  "slot": 5,
  "expert": "imię i nazwisko",
  "role": "stanowisko",
  "quote": "dwa–cztery zdania komentarza w pierwszej osobie",
  "placement": "po której sekcji komentarz ma stanąć i dlaczego"
}

Zasady:
- Komentarz ma wnosić konkret z praktyki: obserwację z projektów, typowy błąd, warunek brzegowy.
- Bez ogólników w rodzaju „warto zadbać o jakość treści".
- Bez obietnic wyników i bez liczb, których nie da się potwierdzić.
- Ton: rzeczowy, pierwsza osoba, język mówiony, ale poprawny.

${EDITORIAL_RULES}`;
}

/** Wyłuskanie JSON-a z gadatliwej odpowiedzi modelu – port llm._extract_json. */
export function extractJson(text) {
  let out = String(text ?? '').trim();
  const fence = out.match(/```(?:json)?\s*([\s\S]+?)```/);
  if (fence) out = fence[1].trim();
  const start = out.indexOf('{');
  if (start < 0) return null;
  for (let end = out.length; end > start; end--) {
    try {
      return JSON.parse(out.slice(start, end));
    } catch {
      /* przycinamy od końca aż do poprawnego obiektu */
    }
  }
  return null;
}

/** Format identyczny z step_expert w run.py – „kopiuj treść" w edytorze
    dokleja dokładnie taki sam blok. */
/* Wygląd niesiony w `style`, bo do CSS motywu WordPressa nie mamy dostępu:
   konto `redaktor` ma rolę editor, a arkusz motywu wymaga FTP albo admina.
   Kolory z palety serwisu: #000623 (--main-color), #5768ff (--second-color),
   #f0f1ff (--selected-color). Świadomy duplikat: EXPERT_STYLE w edytorze
   (edytor.astro) – „kopiuj cytat” i zapis do WP dają ten sam HTML. */
export const EXPERT_STYLE = {
  quote: 'margin:28px 0;padding:24px 28px;background:#eef0ff;border:1px solid #dfe2fb;'
    + 'border-left:4px solid #5768ff;border-radius:12px;box-shadow:0 1px 2px #00062314',
  row: 'display:flex;gap:18px;align-items:flex-start',
  avatar: 'flex:0 0 56px;width:56px;height:56px;border-radius:50%;background:#5768ff;'
    + 'color:#ffffff;font-size:18px;font-weight:700;display:flex;align-items:center;'
    + 'justify-content:center',
  photo: 'flex:0 0 56px;width:56px;height:56px;border-radius:50%;object-fit:cover',
  body: 'flex:1 1 auto;min-width:0',
  label: 'display:block;margin-bottom:10px;color:#5768ff;font-size:12px;'
    + 'font-weight:700;letter-spacing:.08em;text-transform:uppercase',
  text: 'margin:0 0 14px;color:#000623;font-size:17px;line-height:1.7;font-style:italic',
  // Motyw stylizuje `blockquote footer` ciemnym tłem – bez jawnego zerowania
  // podpis wychodził jako czarny pasek, a nazwisko znikało w tym tle.
  footer: 'margin:0;padding:0;border:0;background:transparent;color:#6e7181;'
    + 'font-size:14px;font-style:normal',
  name: 'color:#000623;font-weight:600',
};

/** Inicjały do awatara – zdjęć autorów nie mamy (żadne z 37 kont nie ma
    Gravatara), więc kółko dostaje dwie pierwsze litery imienia i nazwiska. */
export function expertInitials(name) {
  const words = String(name ?? '').trim().split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map((word) => word[0].toUpperCase()).join('');
}

export function expertBlockquote({ quote, expert, role, photo }) {
  const name = String(expert ?? '').trim();
  const initials = expertInitials(name);
  const sign = [name, [role, 'ICEA'].filter(Boolean).join(', ')].filter(Boolean);
  const face = photo
    ? `<img src="${photo}" alt="${name}" style="${EXPERT_STYLE.photo}" />`
    : (initials ? `<div style="${EXPERT_STYLE.avatar}">${initials}</div>` : '');
  return `<blockquote class="expert" style="${EXPERT_STYLE.quote}">`
    + `<div style="${EXPERT_STYLE.row}">`
    + face
    + `<div style="${EXPERT_STYLE.body}">`
    + `<span style="${EXPERT_STYLE.label}">Zdaniem eksperta</span>`
    + `<p style="${EXPERT_STYLE.text}">${quote}</p>`
    + `<footer style="${EXPERT_STYLE.footer}">`
    + (name ? `<span style="${EXPERT_STYLE.name}">${name}</span>` : '')
    + (sign.length > 1 ? ` · ${sign[1]}` : '')
    + '</footer></div></div></blockquote>';
}

/**
 * Jedno wywołanie OpenRoutera. Zwraca {ok, data:{slot, expert, role, quote,
 * placement}, model, cost} albo {ok:false, error}.
 */
export async function generateExpertQuote(env, job, sections, { fetchImpl = fetch, person = null } = {}) {
  const apiKey = (env.OPENROUTER_API_KEY || '').trim();
  if (!apiKey) return { ok: false, error: 'Brak sekretu OPENROUTER_API_KEY w Workerze.' };

  const content = mergedContent(sections);
  if (!content) return { ok: false, error: 'Zadanie nie ma treści sekcji do skomentowania.' };

  const models = typeof job.models === 'string' ? JSON.parse(job.models || 'null') : job.models;
  const model = models?.writer || 'anthropic/claude-sonnet-5';
  const prompt = buildExpertPrompt({ title: job.title, content, author: job.author ?? '', person });

  let response;
  try {
    response = await fetchImpl('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://zaplecze-dashboard.m-wisniewski.workers.dev',
        'X-Title': 'Content Watcher - porada eksperta',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 2000,
        // Modele Perplexity nie obsługują response_format (jak w llm.py).
        ...(model.startsWith('perplexity/') ? {} : { response_format: { type: 'json_object' } }),
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    return { ok: false, error: `Brak odpowiedzi od OpenRouter: ${err instanceof Error ? err.message : err}` };
  }
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    console.error('cw expert openrouter', response.status, detail.slice(0, 300));
    return { ok: false, error: `Błąd usługi OpenRouter: ${response.status}.` };
  }
  const payload = await response.json().catch(() => null);
  const text = payload?.choices?.[0]?.message?.content ?? '';
  const data = extractJson(text);
  if (!data?.quote || !data?.expert) {
    return { ok: false, error: 'Model nie zwrócił poprawnego cytatu.' };
  }
  const slot = Number.parseInt(data.slot, 10);
  return {
    ok: true,
    data: {
      slot: Number.isFinite(slot) && slot >= 1 && slot <= 30 ? slot : null,
      // Wybór redaktora jest wiążący – model bywa uparty i podpisuje po swojemu.
      expert: person?.name ?? String(data.expert).slice(0, 120),
      role: person ? (person.role ?? '') : (data.role ? String(data.role).slice(0, 120) : ''),
      quote: String(data.quote).slice(0, 2000),
      placement: data.placement ? String(data.placement).slice(0, 500) : '',
      photo: person?.photo ?? '',
    },
    model: payload?.model ?? model,
    cost: {
      tokens_in: payload?.usage?.prompt_tokens ?? 0,
      tokens_out: payload?.usage?.completion_tokens ?? 0,
    },
  };
}
