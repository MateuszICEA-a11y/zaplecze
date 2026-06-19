import { describe, it, expect } from 'vitest';
import { buildSmsRequest, parseSmsResponse, sendSms } from './smsapi';

describe('buildSmsRequest', () => {
  it('buduje POST x-www-form-urlencoded z Bearer i polami SMSAPI', () => {
    const { url, init } = buildSmsRequest({ token: 'TKN', from: 'ICEA', to: '+48512345678', message: 'Kod: 123456' });
    expect(url).toBe('https://api.smsapi.pl/sms.do');
    expect(init.method).toBe('POST');
    expect((init.headers as any).Authorization).toBe('Bearer TKN');
    expect((init.headers as any)['Content-Type']).toBe('application/x-www-form-urlencoded');
    const body = String(init.body);
    expect(body).toContain('to=%2B48512345678');
    expect(body).toContain('from=ICEA');
    expect(body).toContain('format=json');
    expect(body).toContain('encoding=utf-8');
    expect(body).not.toContain('test=1');
  });
  it('dodaje test=1 gdy test', () => {
    const { init } = buildSmsRequest({ token: 'T', from: 'ICEA', to: '+48512345678', message: 'x', test: true });
    expect(String(init.body)).toContain('test=1');
  });
});

describe('parseSmsResponse', () => {
  it('sukces gdy jest niepusta lista', () => {
    expect(parseSmsResponse({ count: 1, list: [{ id: 'm1' }] })).toEqual({ ok: true, id: 'm1' });
  });
  it('błąd gdy pole error', () => {
    expect(parseSmsResponse({ error: 13, message: 'Brak srodkow' }).ok).toBe(false);
  });
  it('błąd gdy pusta lista lub śmieci', () => {
    expect(parseSmsResponse({ list: [] }).ok).toBe(false);
    expect(parseSmsResponse(null).ok).toBe(false);
  });
});

describe('sendSms', () => {
  it('zwraca ok przy 200 + lista', async () => {
    const fake = async () => new Response(JSON.stringify({ list: [{ id: 'm9' }] }), { status: 200 });
    const r = await sendSms({ token: 'T', from: 'ICEA', to: '+48512345678', message: 'x' }, fake as any);
    expect(r).toEqual({ ok: true, id: 'm9' });
  });
  it('zwraca błąd http przy != 2xx', async () => {
    const fake = async () => new Response('nope', { status: 401 });
    const r = await sendSms({ token: 'T', from: 'ICEA', to: '+48512345678', message: 'x' }, fake as any);
    expect(r.ok).toBe(false);
    expect(r.error).toBe('http-401');
  });
  it('łapie wyjątek sieci', async () => {
    const fake = async () => { throw new Error('boom'); };
    const r = await sendSms({ token: 'T', from: 'ICEA', to: '+48512345678', message: 'x' }, fake as any);
    expect(r).toEqual({ ok: false, error: 'network' });
  });
});
