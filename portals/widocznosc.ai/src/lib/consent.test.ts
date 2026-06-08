import { describe, it, expect } from 'vitest';
import {
  CONSENT_VERSION,
  parseConsentCookie,
  serializeConsent,
  toConsentSignals,
  type ConsentState,
} from './consent';

const state: ConsentState = {
  v: CONSENT_VERSION,
  analytics: true,
  marketing: false,
  ts: 1700000000000,
};

describe('parseConsentCookie', () => {
  it('zwraca null gdy brak cookie', () => {
    expect(parseConsentCookie('theme=dark; foo=bar')).toBeNull();
  });
  it('zwraca null przy zepsutym JSON', () => {
    expect(parseConsentCookie('wai_consent=not-json')).toBeNull();
  });
  it('zwraca null przy niezgodnej wersji', () => {
    const v = encodeURIComponent(JSON.stringify({ v: 0, analytics: true, marketing: true, ts: 1 }));
    expect(parseConsentCookie('wai_consent=' + v)).toBeNull();
  });
  it('parsuje poprawne cookie spośród innych', () => {
    const cookie = 'theme=dark; wai_consent=' + serializeConsent(state) + '; x=1';
    expect(parseConsentCookie(cookie)).toEqual(state);
  });
  it('zwraca ts=0 gdy brak pola ts', () => {
    const v = encodeURIComponent(JSON.stringify({ v: 1, analytics: true, marketing: false }));
    expect(parseConsentCookie('wai_consent=' + v)?.ts).toBe(0);
  });
});

describe('serializeConsent round-trip', () => {
  it('serialize → parse zwraca równy stan', () => {
    expect(parseConsentCookie('wai_consent=' + serializeConsent(state))).toEqual(state);
  });
});

describe('toConsentSignals', () => {
  it('sama analityka', () => {
    expect(toConsentSignals({ analytics: true, marketing: false })).toEqual({
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
  });
  it('marketing mapuje na trzy sygnały ad_*', () => {
    expect(toConsentSignals({ analytics: false, marketing: true })).toEqual({
      analytics_storage: 'denied',
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
    });
  });
  it('wszystko odrzucone', () => {
    expect(toConsentSignals({ analytics: false, marketing: false })).toEqual({
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
  });
  it('wszystko zaakceptowane', () => {
    expect(toConsentSignals({ analytics: true, marketing: true })).toEqual({
      analytics_storage: 'granted',
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
    });
  });
});
