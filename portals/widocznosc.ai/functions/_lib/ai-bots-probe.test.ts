import { describe, it, expect } from 'vitest';
import {
  parseXRobotsTag,
  parseMetaRobots,
  summarizeDirectives,
  detectEdge,
  isChallengeBody,
  visibleTextLength,
  classifyProbe,
  buildPageActionItems,
  type ProbeSample,
  type PageAnalysis,
} from './ai-bots-probe';

const sample = (over: Partial<ProbeSample> = {}): ProbeSample => ({
  status: 200,
  challenge: false,
  cfMitigated: null,
  textLength: 5000,
  ...over,
});

describe('parseXRobotsTag', () => {
  it('parsuje listę tokenów bez prefiksu user-agenta', () => {
    const [group] = parseXRobotsTag('noindex, nofollow');
    expect(group!.agent).toBe('*');
    expect(group!.tokens).toEqual(['noindex', 'nofollow']);
  });

  it('rozdziela grupy po prefiksie user-agenta', () => {
    const groups = parseXRobotsTag('googlebot: noindex, otherbot: nofollow');
    expect(groups.map((g) => g.agent)).toEqual(['googlebot', 'otherbot']);
    expect(groups[0]!.tokens).toEqual(['noindex']);
  });

  it('nie myli max-snippet z prefiksem user-agenta', () => {
    const [group] = parseXRobotsTag('max-snippet: 20, noai');
    expect(group!.agent).toBe('*');
    expect(group!.tokens).toContain('noai');
  });

  it('pusty nagłówek daje pustą listę', () => {
    expect(parseXRobotsTag(null)).toEqual([]);
    expect(parseXRobotsTag('')).toEqual([]);
  });
});

describe('parseMetaRobots', () => {
  it('łapie meta robots i pomija resztę meta', () => {
    const html =
      '<head><meta name="viewport" content="width=device-width">' +
      '<meta name="description" content="opis strony, noindex w treści opisu">' +
      '<meta name="robots" content="noindex, nofollow"></head>';
    const dirs = parseMetaRobots(html);
    expect(dirs).toHaveLength(1);
    expect(dirs[0]!.agent).toBe('robots');
    expect(dirs[0]!.tokens).toEqual(['noindex', 'nofollow']);
  });

  it('łapie meta per-bot z dyrektywą noai', () => {
    const dirs = parseMetaRobots('<meta name="Google-Extended" content="NOAI">');
    expect(dirs[0]!.agent).toBe('google-extended');
    expect(dirs[0]!.tokens).toEqual(['noai']);
  });
});

describe('summarizeDirectives', () => {
  it('none implikuje noindex i nofollow', () => {
    const s = summarizeDirectives(parseXRobotsTag('none'));
    expect(s.noindex).toBe(true);
    expect(s.nofollow).toBe(true);
  });

  it('czysta strona nie ma żadnej flagi', () => {
    const s = summarizeDirectives([]);
    expect(Object.values(s).every((v) => v === false)).toBe(true);
  });
});

describe('detectEdge', () => {
  it('rozpoznaje Cloudflare po nagłówkach', () => {
    const edge = detectEdge(new Headers({ server: 'cloudflare', 'cf-ray': 'abc' }), '');
    expect(edge.cloudflare).toBe(true);
    expect(edge.signals).toContain('cf-ray');
  });

  it('rozpoznaje Cloudflare po /cdn-cgi/ w HTML', () => {
    const edge = detectEdge(new Headers(), '<script src="/cdn-cgi/challenge-platform/x.js">');
    expect(edge.cloudflare).toBe(true);
  });

  it('zwykły nginx nie jest oznaczany jako CF', () => {
    expect(detectEdge(new Headers({ server: 'nginx' }), '<html></html>').cloudflare).toBe(false);
  });
});

describe('isChallengeBody / visibleTextLength', () => {
  it('wykrywa interstitial Cloudflare', () => {
    expect(isChallengeBody('<title>Just a moment...</title>')).toBe(true);
    expect(isChallengeBody('<h1>Witamy na stronie</h1>')).toBe(false);
  });

  it('nie liczy skryptów jako prozy', () => {
    const html = '<script>var a = "bardzo długi kod javascript tutaj";</script><p>Tekst</p>';
    expect(visibleTextLength(html)).toBe('Tekst'.length);
  });
});

describe('classifyProbe', () => {
  const baseline = sample();

  it('bot 403 przy 200 dla przeglądarki = blokada po UA', () => {
    expect(classifyProbe(baseline, sample({ status: 403 }))).toBe('ua-blocked');
  });

  it('challenge dla bota, gdy przeglądarka przechodzi', () => {
    expect(classifyProbe(baseline, sample({ status: 503, challenge: true }))).toBe('challenged');
    expect(classifyProbe(baseline, sample({ cfMitigated: 'challenge' }))).toBe('challenged');
  });

  it('blokada obu stron nie jest wycelowana w boty', () => {
    expect(classifyProbe(sample({ status: 503 }), sample({ status: 503 }))).toBe('both-blocked');
  });

  it('drastycznie krótsza treść dla bota = thin', () => {
    expect(classifyProbe(baseline, sample({ textLength: 100 }))).toBe('thin');
  });

  it('drobna różnica długości nie jest thin', () => {
    expect(classifyProbe(baseline, sample({ textLength: 4800 }))).toBe('ok');
  });

  it('błąd sondy daje unknown', () => {
    expect(classifyProbe(baseline, sample({ error: 'timeout' }))).toBe('unknown');
  });

  it('nie orzeka o bocie, gdy baseline sam padł', () => {
    expect(classifyProbe(sample({ error: 'timeout' }), sample())).toBe('unknown');
  });
});

const analysis = (over: Partial<PageAnalysis> = {}): PageAnalysis => ({
  pageUrl: 'https://example.com/',
  finalUrl: 'https://example.com/',
  status: 200,
  edge: { cloudflare: true, server: 'cloudflare', signals: ['cf-ray'] },
  directives: [],
  directiveSummary: {
    noindex: false,
    nofollow: false,
    noai: false,
    noimageai: false,
    noarchive: false,
    nosnippet: false,
  },
  probes: [],
  baselineChallenge: false,
  ...over,
});

describe('buildPageActionItems', () => {
  it('noindex to P0 z nazwaniem źródła', () => {
    const directives = parseXRobotsTag('noindex');
    const items = buildPageActionItems(
      analysis({ directives, directiveSummary: summarizeDirectives(directives) })
    );
    expect(items[0]!.priority).toBe('P0');
    expect(items[0]!.description).toContain('X-Robots-Tag');
  });

  it('blokada UA to P0 z podpowiedzią o Cloudflare i disclaimerem', () => {
    const items = buildPageActionItems(
      analysis({
        probes: [
          { name: 'GPTBot', userAgent: 'GPTBot', verdict: 'ua-blocked', status: 403, note: '' },
        ],
      })
    );
    const blocked = items.find((i) => i.title.includes('GPTBot'));
    expect(blocked!.priority).toBe('P0');
    expect(blocked!.description).toContain('AI Crawl Control');
    expect(blocked!.description).toContain('reverse DNS');
  });

  it('czysta strona kończy się pojedynczym P2', () => {
    const items = buildPageActionItems(
      analysis({
        probes: [{ name: 'GPTBot', userAgent: 'GPTBot', verdict: 'ok', status: 200, note: '' }],
      })
    );
    expect(items).toHaveLength(1);
    expect(items[0]!.priority).toBe('P2');
  });

  it('błąd sondy nie udaje wyniku', () => {
    const items = buildPageActionItems(analysis({ error: 'timeout' }));
    expect(items).toHaveLength(1);
    expect(items[0]!.title).toContain('Nie udało się');
  });
});
