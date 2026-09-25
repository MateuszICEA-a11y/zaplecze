/* Wspólne drobiazgi przeglądarkowe Content Writera (lista projektów i projekt).
   Wywołania Workera idą z nagłówkiem X-CW-Request – bez niego mutacje są
   odrzucane (ochrona przed CSRF, checkMutationOrigin w cw-api.js). */

export type ApiError = Error & { code?: string; status?: number; data?: Record<string, unknown> };

export async function api<T = any>(path: string, options: { method?: string; body?: unknown } = {}): Promise<{ status: number; data: T }> {
  const response = await fetch(path, {
    method: options.method ?? 'GET',
    headers: { 'X-CW-Request': '1', 'Content-Type': 'application/json' },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.error ?? `Błąd ${response.status}`) as ApiError;
    error.code = typeof data?.code === 'string' ? data.code : undefined;
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return { status: response.status, data };
}

export const esc = (value: unknown) =>
  String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);

export const fmtInt = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) ? value.toLocaleString('pl-PL', { useGrouping: true }) : '–';

export const fmtDateTime = (iso: unknown) => {
  const date = new Date(String(iso ?? ''));
  return Number.isNaN(date.getTime())
    ? '–'
    : date.toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
};

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/* Stany projektu – nazwy dla redaktora (bez „pipeline", „runner", „job"). */
export const STATUS_LABEL: Record<string, string> = {
  research: 'research',
  brief_running: 'brief w przygotowaniu',
  brief_ready: 'brief do akceptacji',
  writing: 'tekst w przygotowaniu',
  written: 'tekst gotowy',
  failed: 'przebieg przerwany',
  cancelled: 'zamknięty',
};

export const STATUS_TONE: Record<string, 'ok' | 'mid' | 'warn' | 'err' | 'idle'> = {
  research: 'idle',
  brief_running: 'mid',
  brief_ready: 'warn',
  writing: 'mid',
  written: 'ok',
  failed: 'err',
  cancelled: 'idle',
};
