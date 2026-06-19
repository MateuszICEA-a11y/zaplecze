/** Cienki klient SMSAPI.pl (REST /sms.do). Jedyna warstwa IO do dostawcy SMS. */

export type SmsSendInput = {
  token: string;
  from: string;
  to: string; // E.164, np. +48512345678
  message: string;
  test?: boolean;
};

export function buildSmsRequest(input: SmsSendInput): { url: string; init: RequestInit } {
  const params = new URLSearchParams({
    to: input.to,
    from: input.from,
    message: input.message,
    format: 'json',
    encoding: 'utf-8',
  });
  if (input.test) params.set('test', '1');
  return {
    url: 'https://api.smsapi.pl/sms.do',
    init: {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${input.token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    },
  };
}

export function parseSmsResponse(json: unknown): { ok: boolean; id?: string; error?: string } {
  if (!json || typeof json !== 'object') return { ok: false, error: 'invalid-response' };
  const o = json as Record<string, unknown>;
  if ('error' in o) return { ok: false, error: String(o.message ?? o.error) };
  const list = o.list as Array<{ id?: string }> | undefined;
  if (Array.isArray(list) && list.length > 0) return { ok: true, id: String(list[0]?.id ?? '') };
  return { ok: false, error: 'no-message-sent' };
}

export async function sendSms(
  input: SmsSendInput,
  fetchImpl: typeof fetch = fetch,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const { url, init } = buildSmsRequest(input);
  try {
    const res = await fetchImpl(url, init);
    if (!res.ok) return { ok: false, error: `http-${res.status}` };
    const json = await res.json().catch(() => null);
    return parseSmsResponse(json);
  } catch {
    return { ok: false, error: 'network' };
  }
}
