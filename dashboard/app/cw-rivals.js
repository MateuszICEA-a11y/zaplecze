/**
 * Treść konkurentów z SERP-a: ile naprawdę piszą i co mają w tekście, czego
 * nie mamy my.
 *
 * Skąd treść: Jina Reader (r.jina.ai) zwraca stronę jako markdown, więc nie
 * trzeba własnego crawlera ani parsera HTML w Workerze. Reader oddaje CAŁĄ
 * stronę razem z menu, banerem cookies i stopką – dlatego długość liczymy
 * heurystyką „prozy" (patrz proseWords), a nie po prostu ze słów markdownu.
 *
 * Dlaczego etapami: jedno pobranie idzie kilka–kilkanaście sekund, a Worker
 * ma ograniczony czas życia. Każde żądanie POST wykonuje jeden krok i zapisuje
 * stan w `serp_snapshots` (klucz „rivals:<domena>:<post_id>"), klient odpytuje
 * dalej – ten sam wzorzec co analiza SERP-gap.
 *
 * Sekrety: JINA_API_KEY (odczyt stron), OPENROUTER_API_KEY (wypis faktów).
 */

const READER = 'https://r.jina.ai/';
const RIVALS_LIMIT = 3;
const MAX_MARKDOWN_CHARS = 18_000; // tyle wchodzi do promptu z jednej strony
const CACHE_HOURS = 24 * 7;
const TIMEOUT_MS = 60_000;

// Wycinamy to, czego nie da się pomylić z treścią artykułu. Celowo bez
// selektorów w rodzaju `[class*="content"]` czy `[class*="post"]` – trafiają
// w kontener właściwego tekstu i zostaje pusta strona.
const REMOVE_SELECTOR = 'nav,header,footer,aside,form,[id*="ookie"],[class*="ookie"],'
  + '[class*="onsent"],[class*="newsletter"]';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

const nowIso = () => new Date().toISOString();
const snapshotId = (domain, postId) => `rivals:${domain}:${postId}`;

/**
 * Słowa „prozy" w markdownie: nagłówki i akapity, z pominięciem list linków,
 * okruszków i menu, które Reader zwraca razem z treścią.
 *
 * Reguła: linia krótsza niż 8 słów albo w ponad 40% złożona z tekstu linków
 * nie jest zdaniem artykułu. Wynik bywa zawyżony o bloki CTA na końcu strony,
 * ale liczymy tak samo dla wszystkich, więc porównanie jest uczciwe.
 */
export function proseWords(markdown) {
  let total = 0;
  for (const raw of String(markdown ?? '').split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('#')) {
      total += line.replace(/[#*_`]/g, ' ').split(/\s+/).filter(Boolean).length;
      continue;
    }
    const withoutImages = line.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ');
    const linkWords = [...withoutImages.matchAll(/\[([^\]]*)\]\([^)]*\)/g)]
      .reduce((sum, match) => sum + match[1].split(/\s+/).filter(Boolean).length, 0);
    const text = withoutImages
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/[*_`>#|-]/g, ' ');
    const words = text.split(/\s+/).filter(Boolean).length;
    if (words < 8 || linkWords / Math.max(words, 1) > 0.4) continue;
    total += words;
  }
  return total;
}

/** Nagłówki H2/H3 z markdownu – struktura tekstu konkurenta. */
export function markdownHeadings(markdown) {
  return String(markdown ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^#{2,3}\s+\S/.test(line))
    .map((line) => line.replace(/^#+\s*/, '').replace(/[*_`]/g, '').trim())
    .slice(0, 40);
}

/** Jedna strona przez Jina Reader. Zwraca treść w markdownie i metryki. */
export async function readPage(url, env, fetchImpl = fetch) {
  const apiKey = (env.JINA_API_KEY || '').trim();
  if (!apiKey) throw new Error('Brak sekretu JINA_API_KEY w Workerze.');
  const response = await fetchImpl(`${READER}${url}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
      'X-Remove-Selector': REMOVE_SELECTOR,
      'X-Retain-Images': 'none',
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.data?.content) {
    const detail = payload?.readableMessage ?? payload?.message ?? `HTTP ${response.status}`;
    throw new Error(`Jina Reader: ${String(detail).slice(0, 200)}`);
  }
  const markdown = String(payload.data.content);
  return {
    url,
    title: payload.data.title ?? '',
    words: proseWords(markdown),
    headings: markdownHeadings(markdown),
    markdown: markdown.slice(0, MAX_MARKDOWN_CHARS),
    tokens: payload.data.usage?.tokens ?? 0,
  };
}

export const median = (values) => {
  const rows = [...values].filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (!rows.length) return null;
  const middle = Math.floor(rows.length / 2);
  return rows.length % 2 ? rows[middle] : Math.round((rows[middle - 1] + rows[middle]) / 2);
};

export function buildFactsPrompt(ours, rivals) {
  const rivalBlocks = rivals
    .map((row, index) => `### Konkurent ${index + 1}: ${row.url}\n\n${row.markdown}`)
    .join('\n\n---\n\n');
  return `Porównujesz artykuł z tekstami konkurencji, które stoją nad nim w wynikach Google. Szukasz KONKRETÓW, których w naszym tekście brakuje: liczb, dat, nazw narzędzi, warunków brzegowych, definicji, przykładów, kroków procedury.

## Nasz artykuł

Tytuł: ${ours.title}

${ours.markdown}

## Teksty konkurencji

${rivalBlocks}

## Zadanie

Zwróć wyłącznie JSON:

{
  "facts": [
    {
      "fact": "jedno zdanie – konkret, którego u nas nie ma",
      "why": "dlaczego wart dopisania (maksymalnie jedno zdanie)",
      "source": "adres konkurenta, u którego to stoi",
      "kind": "liczba | definicja | procedura | przykład | narzędzie | ryzyko"
    }
  ],
  "topics": ["temat poruszany przez konkurencję, którego nasz tekst w ogóle nie dotyka"]
}

Zasady:
- Maksymalnie 8 faktów, uporządkowane od najważniejszego.
- „fact" to jedno zdanie, „why" najwyżej kilkanaście słów – zwięźle, bez wstępów.
- Tylko to, czego NIE MA w naszym artykule – jeśli piszemy o czymś innymi słowami, pomiń.
- Przepisuj liczby i nazwy dokładnie tak, jak stoją u konkurenta; niczego nie zaokrąglaj ani nie zmyślaj.
- Pomijaj treści marketingowe konkurenta (oferta, cennik usług, formularze kontaktowe).
- Pisz po polsku, półpauzą (–), nie myślnikiem em.`;
}

/** Wypis faktów przez OpenRouter na podstawie pobranych treści. */
export async function extractFacts(env, ours, rivals, model, fetchImpl = fetch) {
  const apiKey = (env.OPENROUTER_API_KEY || '').trim();
  if (!apiKey) throw new Error('Brak sekretu OPENROUTER_API_KEY w Workerze.');
  const response = await fetchImpl('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://zaplecze-dashboard.m-wisniewski.workers.dev',
      'X-Title': 'Content Watcher - fakty konkurencji',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: buildFactsPrompt(ours, rivals) }],
      temperature: 0.2,
      // Wypis bywa długi, a ucięta odpowiedź to nieparsowalny JSON – stąd zapas.
      max_tokens: 4000,
      ...(model.startsWith('perplexity/') ? {} : { response_format: { type: 'json_object' } }),
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    console.error('cw rivals openrouter', response.status, detail.slice(0, 300));
    throw new Error(`OpenRouter odpowiedział ${response.status}.`);
  }
  const payload = await response.json().catch(() => null);
  const text = payload?.choices?.[0]?.message?.content ?? '';
  const data = extractJson(text);
  if (!data || !Array.isArray(data.facts)) {
    // Najczęstsza przyczyna: odpowiedź ucięta limitem tokenów. Lepiej powiedzieć
    // to wprost, niż pokazać pustą listę jako „konkurencja nie ma nic nowego".
    throw new Error(payload?.choices?.[0]?.finish_reason === 'length'
      ? 'Model nie zmieścił odpowiedzi w limicie – spróbuj ponownie.'
      : 'Model nie zwrócił poprawnej listy faktów.');
  }
  const facts = data.facts;
  return {
    facts: facts.slice(0, 8).map((row) => ({
      fact: String(row?.fact ?? '').slice(0, 400),
      why: String(row?.why ?? '').slice(0, 300),
      source: String(row?.source ?? '').slice(0, 300),
      kind: String(row?.kind ?? '').slice(0, 40),
    })).filter((row) => row.fact),
    topics: (Array.isArray(data?.topics) ? data.topics : []).slice(0, 8).map((row) => String(row).slice(0, 200)),
    model: payload?.model ?? model,
    cost: {
      tokens_in: payload?.usage?.prompt_tokens ?? 0,
      tokens_out: payload?.usage?.completion_tokens ?? 0,
    },
  };
}

/** Wyłuskanie JSON-a z gadatliwej odpowiedzi modelu (bliźniak z cw-expert). */
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

/* ---------- stan w D1 ---------- */

async function readSnapshot(env, domain, postId) {
  const row = await env.CW_DB.prepare(
    'SELECT payload, status, error, created_at FROM serp_snapshots WHERE id = ?',
  ).bind(snapshotId(domain, postId)).first();
  if (!row) return null;
  let payload = null;
  try {
    payload = row.payload ? JSON.parse(row.payload) : null;
  } catch {
    payload = null;
  }
  return { status: row.status ?? 'done', error: row.error ?? null, created_at: row.created_at, payload };
}

async function writeSnapshot(env, domain, postId, { status, payload = null, error = null }) {
  await env.CW_DB.prepare(
    `INSERT INTO serp_snapshots (id, domain, post_id, payload, status, error, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, status = excluded.status,
       error = excluded.error, created_at = excluded.created_at`,
  )
    .bind(snapshotId(domain, postId), domain, postId, JSON.stringify(payload ?? null), status, error, nowIso())
    .run();
}

const isFresh = (createdAt, maxAgeHours = CACHE_HOURS) => {
  const age = (Date.now() - Date.parse(createdAt ?? '')) / 3_600_000;
  return Number.isFinite(age) && age <= maxAgeHours;
};

/** Wynik dla klienta – bez markdownów, żeby nie wozić megabajtów do przeglądarki. */
export function publicView(state) {
  if (!state) return null;
  return {
    stage: state.stage ?? null,
    our_words: state.ours?.words ?? null,
    our_url: state.ours?.url ?? null,
    rivals: (state.rivals ?? []).map((row) => ({
      url: row.url,
      host: row.host ?? '',
      title: row.title,
      words: row.words,
      headings: row.headings?.slice(0, 12) ?? [],
      error: row.error ?? null,
    })),
    median_words: median((state.rivals ?? []).filter((row) => !row.error).map((row) => row.words)),
    facts: state.facts ?? [],
    topics: state.topics ?? [],
    model: state.model ?? null,
    cost: state.cost ?? null,
    generated_at: state.generated_at ?? null,
  };
}

/**
 * Skrót gotowej analizy dla pipeline'u reoptymalizacji: fakty i mediana
 * objętości idą w dispatchu do GitHub Actions i trafiają do briefu.
 * Null, gdy analizy nie było albo nic nie znalazła – pipeline radzi sobie bez.
 */
export async function rivalsSummary(env, domain, postId) {
  const snapshot = await readSnapshot(env, domain, postId);
  if (snapshot?.status !== 'done' || !snapshot.payload) return null;
  const view = publicView(snapshot.payload);
  if (!view?.facts?.length && !view?.topics?.length) return null;
  return {
    facts: view.facts,
    topics: view.topics,
    median_words: view.median_words,
    our_words: view.our_words,
    generated_at: view.generated_at,
  };
}

/* ---------- etapy ---------- */

/**
 * Jeden krok: pobranie kolejnej strony albo wypis faktów. Stan trzymamy
 * w snapshotcie, więc przerwany przebieg da się dokończyć następnym żądaniem.
 */
export async function runRivalsStep(env, domain, postId, state, fetchImpl = fetch) {
  const { queue = [], rivals = [], ours = null } = state;

  if (!ours) {
    // Najpierw nasza strona – długość konkurencji ma sens tylko w porównaniu
    // liczonym tą samą metodą.
    let page;
    try {
      page = await readPage(state.our_url, env, fetchImpl);
    } catch (error) {
      page = { url: state.our_url, title: '', words: null, headings: [], markdown: '', error: String(error.message ?? error) };
    }
    const next = { ...state, ours: page, stage: queue.length ? 'rivals' : 'facts' };
    await writeSnapshot(env, domain, postId, { status: 'running', payload: next });
    return next;
  }

  if (queue.length) {
    const [url, ...rest] = queue;
    let page;
    try {
      page = await readPage(url, env, fetchImpl);
    } catch (error) {
      page = { url, title: '', words: null, headings: [], markdown: '', error: String(error.message ?? error) };
    }
    const next = {
      ...state,
      rivals: [...rivals, { ...page, host: hostOf(url) }],
      queue: rest,
      stage: rest.length ? 'rivals' : 'facts',
    };
    await writeSnapshot(env, domain, postId, { status: 'running', payload: next });
    return next;
  }

  const usable = rivals.filter((row) => row.markdown && !row.error);
  if (!usable.length) {
    const done = { ...state, stage: 'done', facts: [], topics: [], generated_at: nowIso() };
    await writeSnapshot(env, domain, postId, { status: 'done', payload: done });
    return done;
  }
  const result = await extractFacts(env, ours, usable, state.model, fetchImpl);
  const done = {
    ...state,
    facts: result.facts,
    topics: result.topics,
    model: result.model,
    cost: result.cost,
    stage: 'done',
    generated_at: nowIso(),
  };
  await writeSnapshot(env, domain, postId, { status: 'done', payload: done });
  return done;
}

const hostOf = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
};

async function stepSafely(env, domain, postId, state, fetchImpl) {
  try {
    return await runRivalsStep(env, domain, postId, state, fetchImpl);
  } catch (error) {
    await writeSnapshot(env, domain, postId, {
      status: 'error',
      payload: state,
      error: error instanceof Error ? error.message : 'Nie udało się przeczytać treści konkurencji.',
    });
    return null;
  }
}

const STAGE_LABEL = {
  ours: 'czytam nasz wpis…',
  rivals: 'czytam teksty konkurencji…',
  facts: 'porównuję fakty…',
};

/**
 * GET  /api/cw/rivals/:domain/:postId – stan analizy.
 * POST /api/cw/rivals/:domain/:postId – start albo kolejny krok.
 *   body: {our_url, rivals: [url], model?}; `?force=1` pomija zapisany wynik.
 */
export async function handleRivals(request, env, domain, postId, ctx, fetchImpl = fetch) {
  const url = new URL(request.url);
  const snapshot = await readSnapshot(env, domain, postId);

  if (request.method === 'GET') {
    if (!snapshot) return json({ status: 'idle', analysis: null });
    return json({
      status: snapshot.status,
      analysis: snapshot.status === 'done' ? publicView(snapshot.payload) : null,
      stage: snapshot.payload?.stage ?? null,
      stage_label: STAGE_LABEL[snapshot.payload?.stage] ?? null,
      error: snapshot.error,
      checked_at: snapshot.created_at,
    });
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Body musi być poprawnym JSON-em.' }, 400);
  }
  const ourUrl = String(body.our_url ?? '').trim();
  const rivalUrls = (Array.isArray(body.rivals) ? body.rivals : [])
    .map((row) => String(row ?? '').trim())
    .filter((row) => /^https?:\/\//i.test(row))
    .slice(0, RIVALS_LIMIT);
  if (!/^https?:\/\//i.test(ourUrl)) return json({ error: 'Wymagane pole: our_url.' }, 400);
  if (!rivalUrls.length) return json({ error: 'Najpierw sprawdź SERP – nie ma adresów konkurentów.' }, 400);
  if (!env.JINA_API_KEY) return json({ error: 'Brak sekretu JINA_API_KEY w Workerze.' }, 503);

  const force = url.searchParams.get('force') === '1';
  if (!force && snapshot?.status === 'done' && isFresh(snapshot.created_at)) {
    return json({ status: 'done', analysis: publicView(snapshot.payload), from_cache: true });
  }

  const model = typeof body.model === 'string' && /^[a-z0-9-]+\/[a-z0-9.:_-]{1,60}$/i.test(body.model)
    ? body.model
    : 'anthropic/claude-sonnet-5';

  // Przerwany przebieg dokańczamy, o ile nie zdążył zwietrzeć.
  const resumable = !force && snapshot?.status === 'running' && snapshot.payload?.stage
    && isFresh(snapshot.created_at, 0.25);
  const state = resumable
    ? snapshot.payload
    : { our_url: ourUrl, queue: rivalUrls, rivals: [], ours: null, model, stage: 'ours' };
  if (!resumable) await writeSnapshot(env, domain, postId, { status: 'running', payload: state });

  const work = stepSafely(env, domain, postId, state, fetchImpl);
  if (ctx?.waitUntil) {
    ctx.waitUntil(work);
    return json({ status: 'running', stage: state.stage, stage_label: STAGE_LABEL[state.stage] ?? null }, 202);
  }
  // Bez kontekstu Workera (testy) przechodzimy wszystkie kroki od razu.
  let current = await work;
  while (current && current.stage !== 'done') {
    current = await stepSafely(env, domain, postId, current, fetchImpl);
  }
  return current?.stage === 'done'
    ? json({ status: 'done', analysis: publicView(current) })
    : json({ status: 'error', analysis: null }, 502);
}
