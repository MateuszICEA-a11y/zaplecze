/**
 * Trwały zapis leadów i użyć narzędzi do KV (dashboard zaplecza).
 *
 * Klucze: `lead:<ISO ts>:<rand>` / `usage:<ISO ts>:<rand>` (sort chronologiczny
 * przy kv.list), wartość = JSON rekordu, TTL 90 dni. Zapis jest best-effort –
 * błąd KV nigdy nie może wywrócić obsługi formularza ani narzędzia.
 * Eksport: functions/api/admin/leads-export.ts (Bearer LEADS_EXPORT_TOKEN).
 */

export type LeadLogKind = 'lead' | 'usage';

export type LeadLogRecord = {
  id: string;
  kind: LeadLogKind;
  /** Skąd wpis: kontakt | raport-narzedzia | sms-code | fanout | brand-check | url-check | ai-bots-check */
  source: string;
  ts: string;
  [field: string]: unknown;
};

export const LEAD_LOG_TTL_S = 90 * 24 * 3600;
const MAX_FIELD_LEN = 500;

/** Przycina stringi, wyrzuca puste/nullowe pola – rekord ma zawierać tylko treść. */
export function cleanFields(fields: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value == null) continue;
    if (typeof value === 'string') {
      const trimmed = value.trim().slice(0, MAX_FIELD_LEN);
      if (trimmed) out[key] = trimmed;
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      out[key] = value;
    }
  }
  return out;
}

export function buildLogRecord(
  kind: LeadLogKind,
  source: string,
  fields: Record<string, unknown>,
  now: Date,
  rand: string,
): LeadLogRecord {
  const ts = now.toISOString();
  return { id: `${kind}:${ts}:${rand}`, kind, source, ts, ...cleanFields(fields) };
}

/** Zapis do KV – best-effort (awaria KV nie psuje odpowiedzi endpointu). */
export async function logEvent(
  kv: KVNamespace | undefined,
  kind: LeadLogKind,
  source: string,
  fields: Record<string, unknown>,
): Promise<void> {
  if (!kv) return;
  try {
    const record = buildLogRecord(kind, source, fields, new Date(), crypto.randomUUID().slice(0, 8));
    await kv.put(record.id, JSON.stringify(record), { expirationTtl: LEAD_LOG_TTL_S });
  } catch {
    // celowo połknięte – logowanie nie jest ścieżką krytyczną
  }
}
