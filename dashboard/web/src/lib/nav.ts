/* Nawigacja: domeny z domains.yaml × sekcje z DOMAIN_SECTIONS. Sekcje jeszcze
   nieprzeniesione do nowego frontu linkują do obecnego dashboardu (Astro). */
import { loadConfig, sectionsFor } from './data';

/** Obecny dashboard – docelowo znika, gdy nowy front pokryje wszystkie sekcje. */
export const LEGACY_URL = 'https://zaplecze-dashboard.m-wisniewski.workers.dev';

/** Sekcje przeniesione do Next.js (etap 1). */
const PORTED = new Set(['', 'senuto', 'gsc', 'ga4']);

export interface NavSection {
  slug: string;
  label: string;
  href: string;
  ported: boolean;
}

export interface NavDomain {
  id: string;
  name: string;
  sections: NavSection[];
}

export function loadNav(): NavDomain[] {
  return loadConfig().domains.map((domain) => ({
    id: domain.id,
    name: domain.name,
    sections: sectionsFor(domain).map((section) => {
      const path = `/${domain.id}/${section.slug ? `${section.slug}/` : ''}`;
      const ported = PORTED.has(section.slug);
      return { slug: section.slug, label: section.label, href: ported ? path : `${LEGACY_URL}${path}`, ported };
    }),
  }));
}
