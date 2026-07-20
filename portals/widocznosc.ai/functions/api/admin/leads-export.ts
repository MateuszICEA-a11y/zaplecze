/**
 * Eksport leadów i użyć narzędzi z KV dla collectora dashboardu zaplecza.
 *
 * Endpoint: GET /api/admin/leads-export
 * Auth: Authorization: Bearer <LEADS_EXPORT_TOKEN> (sekret w CF Pages i GH Actions).
 * Zwraca: { leads: LeadLogRecord[], usage: LeadLogRecord[] } posortowane po ts.
 */
import type { LeadLogRecord } from '../../_lib/lead-log';

type Env = {
  LEADS_EXPORT_TOKEN?: string;
  FANOUT_RL?: KVNamespace;
};

const GET_BATCH = 50;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

async function listAll(kv: KVNamespace, prefix: string): Promise<string[]> {
  const keys: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await kv.list({ prefix, cursor });
    keys.push(...page.keys.map((k) => k.name));
    cursor = page.list_complete ? undefined : (page as { cursor: string }).cursor;
  } while (cursor);
  return keys;
}

async function readRecords(kv: KVNamespace, keys: string[]): Promise<LeadLogRecord[]> {
  const records: LeadLogRecord[] = [];
  for (let i = 0; i < keys.length; i += GET_BATCH) {
    const batch = await Promise.all(
      keys.slice(i, i + GET_BATCH).map((key) => kv.get<LeadLogRecord>(key, 'json')),
    );
    for (const rec of batch) if (rec && rec.id) records.push(rec);
  }
  records.sort((a, b) => (a.ts < b.ts ? -1 : 1));
  return records;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const token = (env.LEADS_EXPORT_TOKEN || '').trim();
  if (!token) return json({ error: 'Eksport nieskonfigurowany (LEADS_EXPORT_TOKEN).' }, 503);

  const auth = request.headers.get('Authorization') || '';
  if (auth !== `Bearer ${token}`) return json({ error: 'Brak autoryzacji.' }, 401);

  const kv = env.FANOUT_RL;
  if (!kv) return json({ error: 'Brak bindingu KV.' }, 503);

  const [leadKeys, usageKeys] = await Promise.all([listAll(kv, 'lead:'), listAll(kv, 'usage:')]);
  const [leads, usage] = await Promise.all([readRecords(kv, leadKeys), readRecords(kv, usageKeys)]);
  return json({ leads, usage });
};
