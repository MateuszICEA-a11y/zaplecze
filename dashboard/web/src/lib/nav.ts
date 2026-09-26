/* Nawigacja: domeny z domains.yaml × sekcje z DOMAIN_SECTIONS. Content Watcher
   i Content Writer to w menu jedna pozycja „Treści" (zakładki w środku) –
   adresy zostają osobne, bo Worker czyta spod nich pliki JSON. */
import { loadConfig, sectionsFor } from './data';

/** Sekcje łączone w pozycję „Treści" – kolejność = kolejność zakładek. */
export const CONTENT_SLUGS = ['content-watcher', 'content-writer'] as const;

export interface NavSection {
  slug: string;
  label: string;
  href: string;
  /** Ścieżki (drugi segment adresu), dla których pozycja jest aktywna. */
  match: string[];
}

export interface NavDomain {
  id: string;
  name: string;
  sections: NavSection[];
}

export function loadNav(): NavDomain[] {
  return loadConfig().domains.map((domain) => {
    const sections: NavSection[] = [];
    const content = sectionsFor(domain).filter((s) => (CONTENT_SLUGS as readonly string[]).includes(s.slug));
    for (const section of sectionsFor(domain)) {
      const href = `/${domain.id}/${section.slug ? `${section.slug}/` : ''}`;
      if ((CONTENT_SLUGS as readonly string[]).includes(section.slug)) {
        if (section.slug !== content[0]?.slug) continue;
        sections.push({ slug: section.slug, label: 'Treści', href, match: content.map((s) => s.slug) });
        continue;
      }
      sections.push({ slug: section.slug, label: section.label, href, match: [section.slug] });
    }
    return { id: domain.id, name: domain.name, sections };
  });
}
