import { describe, expect, it } from 'vitest';
import { __test__ } from './url-check';

describe('url-check schema parser', () => {
  it('counts schema.org microdata FAQ as full schema and FAQ signal', () => {
    const html = `
      <html>
        <head>
          <script type="application/ld+json">
            {"@context":"https://schema.org","@type":"Article","dateModified":"2026-05-13"}
          </script>
        </head>
        <body>
          <article>
            <h1>Jak pozycjonować blog?</h1>
            <h2>FAQ</h2>
            <section itemscope itemtype="https://schema.org/FAQPage">
              <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
                <h3 itemprop="name">Jak pozycjonować blog firmowy?</h3>
                <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
                  <p itemprop="text">Zacznij od intencji, struktury nagłówków i linkowania.</p>
                </div>
              </div>
              <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
                <h3 itemprop="name">Ile trwa pozycjonowanie bloga?</h3>
                <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
                  <p itemprop="text">Pierwsze efekty zwykle widać po kilku miesiącach.</p>
                </div>
              </div>
              <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
                <h3 itemprop="name">Czy blog potrzebuje aktualizacji?</h3>
                <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
                  <p itemprop="text">Tak, aktualizacja zwiększa świeżość i trafność treści.</p>
                </div>
              </div>
            </section>
          </article>
        </body>
      </html>
    `;

    const prepared = __test__.prepare(html);
    const factors = __test__.deterministicFactors(prepared);

    expect(factors.schema?.score).toBe(1);
    expect(factors.schema?.earned).toBe(14);
    expect(factors.faq?.score).toBe(1);
    expect(factors.faq?.earned).toBe(12);
    expect(factors.faq?.details).toContain('FAQPage: tak');
  });
});
