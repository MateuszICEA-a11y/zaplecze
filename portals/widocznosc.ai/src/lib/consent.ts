// Czysta logika zgód cookie (RODO + Consent Mode v2). Bez DOM/efektów ubocznych.
// UWAGA: stała CONSENT_VERSION musi być zsynchronizowana z inline head-skryptem
// w Layout.astro (tam wersja jest zapisana na sztywno jako `s.v === 1`).
export const CONSENT_VERSION = 1;
export const CONSENT_COOKIE = 'wai_consent';

export type ConsentState = {
  v: typeof CONSENT_VERSION;
  analytics: boolean;
  marketing: boolean;
  ts: number;
};

export type ConsentSignals = {
  analytics_storage: 'granted' | 'denied';
  ad_storage: 'granted' | 'denied';
  ad_user_data: 'granted' | 'denied';
  ad_personalization: 'granted' | 'denied';
};

export function parseConsentCookie(cookieString: string): ConsentState | null {
  const m = /(?:^|; )wai_consent=([^;]+)/.exec(cookieString);
  if (!m) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(m[1]));
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      parsed.v !== CONSENT_VERSION ||
      typeof parsed.analytics !== 'boolean' ||
      typeof parsed.marketing !== 'boolean'
    ) {
      return null;
    }
    return {
      v: CONSENT_VERSION,
      analytics: parsed.analytics,
      marketing: parsed.marketing,
      ts: typeof parsed.ts === 'number' ? parsed.ts : 0,
    };
  } catch {
    return null;
  }
}

export function serializeConsent(state: ConsentState): string {
  return encodeURIComponent(
    JSON.stringify({
      v: state.v,
      analytics: state.analytics,
      marketing: state.marketing,
      ts: state.ts,
    }),
  );
}

export function toConsentSignals(state: { analytics: boolean; marketing: boolean }): ConsentSignals {
  return {
    analytics_storage: state.analytics ? 'granted' : 'denied',
    ad_storage: state.marketing ? 'granted' : 'denied',
    ad_user_data: state.marketing ? 'granted' : 'denied',
    ad_personalization: state.marketing ? 'granted' : 'denied',
  };
}
