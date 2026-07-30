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

export function buildExpertPrompt({ title, content, author, experts = EXPERTS }) {
  const allowed = experts.filter((name) => !author || !name.startsWith(author));
  return `Piszesz komentarz eksperta ICEA do gotowego artykułu. To ma być realna wartość dodana: obserwacja z praktyki, której nie ma w tekście – nie streszczenie tego, co już napisano.

## Artykuł po optymalizacji

Tytuł: ${title}

${content}

## Ekspert

Cytat przypisujemy osobie z zespołu ICEA. Autor tego wpisu to: ${author || 'nieznany'} – **nie wolno** przypisać cytatu autorowi, bo byłoby to cytowanie samego siebie. Wybierz inną osobę z listy: ${JSON.stringify(allowed, null, 1)}.

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
export function expertBlockquote({ quote, expert, role }) {
  return `<blockquote class="expert"><p>${quote}</p><footer>${expert ?? ''}${role ? `, ${role}` : ''}</footer></blockquote>`;
}

/**
 * Jedno wywołanie OpenRoutera. Zwraca {ok, data:{slot, expert, role, quote,
 * placement}, model, cost} albo {ok:false, error}.
 */
export async function generateExpertQuote(env, job, sections, { fetchImpl = fetch } = {}) {
  const apiKey = (env.OPENROUTER_API_KEY || '').trim();
  if (!apiKey) return { ok: false, error: 'Brak sekretu OPENROUTER_API_KEY w Workerze.' };

  const content = mergedContent(sections);
  if (!content) return { ok: false, error: 'Zadanie nie ma treści sekcji do skomentowania.' };

  const models = typeof job.models === 'string' ? JSON.parse(job.models || 'null') : job.models;
  const model = models?.writer || 'anthropic/claude-sonnet-5';
  const prompt = buildExpertPrompt({ title: job.title, content, author: job.author ?? '' });

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
      expert: String(data.expert).slice(0, 120),
      role: data.role ? String(data.role).slice(0, 120) : '',
      quote: String(data.quote).slice(0, 2000),
      placement: data.placement ? String(data.placement).slice(0, 500) : '',
    },
    model: payload?.model ?? model,
    cost: {
      tokens_in: payload?.usage?.prompt_tokens ?? 0,
      tokens_out: payload?.usage?.completion_tokens ?? 0,
    },
  };
}
