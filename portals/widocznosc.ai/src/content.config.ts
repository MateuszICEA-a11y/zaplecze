/**
 * Astro 5+ requires this file at `src/content.config.ts` to define
 * content collections used by `getCollection()`. The location is hardcoded
 * by the framework - moving or renaming this file will break content loading.
 *
 * @see https://docs.astro.build/en/guides/content-collections/
 */
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Blog pillars – taxonomia widocznosc.ai bazy wiedzy.
 * Każdy artykuł musi mieć dokładnie jeden pillar (zapobiega duplikatom
 * i ułatwia filtrowanie). Tagi (z = znacznik) są dowolne i wielokrotne.
 */
export const BLOG_PILLARS = [
  'geo',
  'modele-llm',
  'prompty',
  'agenci-ai',
  'rag',
  'ai-w-biznesie',
] as const;

export const PILLAR_LABELS: Record<(typeof BLOG_PILLARS)[number], string> = {
  geo: 'GEO',
  'modele-llm': 'Modele LLM',
  prompty: 'Prompty',
  'agenci-ai': 'Agenci AI',
  rag: 'RAG',
  'ai-w-biznesie': 'AI w biznesie',
};

export const PILLAR_GUIDE_TITLE: Record<(typeof BLOG_PILLARS)[number], string> = {
  geo: 'Generative Engine Optimization',
  'modele-llm': 'Modele językowe (LLM)',
  prompty: 'Prompt engineering',
  'agenci-ai': 'Agenci AI',
  rag: 'RAG',
  'ai-w-biznesie': 'Wdrożenie AI w firmie',
};

/**
 * Authors collection – zespół ICEA piszący na widocznosc.ai.
 * Schema oparta na plan-1 (richer profile data dla SEO + E-E-A-T).
 */
const authors = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/authors' }),
  schema: z.object({
    name: z.string(),
    role: z.string(),
    company: z.literal('ICEA'),
    bio: z.string(),
    shortBio: z.string().max(280),
    expertise: z.array(z.string()).min(1),
    photo: z.string(),
    iceaProfile: z.string().url(),
    publishedAt: z.coerce.date(),
    linkedin: z.string().url().optional(),
    twitter: z.string().url().optional(),
    email: z.string().email().optional(),
    /**
     * Wykształcenie autora – używane do Person.alumniOf w schema.org.
     * Każdy wpis powinien zawierać przynajmniej nazwę uczelni.
     */
    education: z
      .array(
        z.object({
          name: z.string(),
          degree: z.string().optional(),
          fieldOfStudy: z.string().optional(),
          startYear: z.number().int().optional(),
          endYear: z.number().int().optional(),
        })
      )
      .optional(),
    /**
     * Certyfikaty zawodowe – używane do Person.hasCredential.
     * Pomaga LLM-om i Google ocenić ekspertyzę autora (E-E-A-T).
     */
    credentials: z
      .array(
        z.object({
          name: z.string(),
          issuer: z.string(),
          dateIssued: z.string().optional(),
          credentialId: z.string().optional(),
        })
      )
      .optional(),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      subtitle: z.string(),
      description: z.string(),
      date: z.date(),
      /**
       * Data ostatniej aktualizacji wpisu. Opcjonalna – gdy ustawiona,
       * pokazuje się w byline („Aktualizacja: …") i zasila dateModified
       * w JSON-LD BlogPosting. Gdy brak – nic się nie renderuje.
       */
      updated: z.coerce.date().optional(),
      image: image(),
      icon: z.string(),
      author: z.object({
        name: z.string(),
        role: z.string(),
        avatar: image(),
      }),
      readTime: z.string(),
      tags: z.array(z.string()),
      pillar: z.enum(BLOG_PILLARS),
      featured: z.boolean().optional(),
      intent: z.enum(['INFO', 'COMPARE', 'HOWTO', 'TOOL', 'COMMERCIAL']).optional(),
      level: z.enum(['L1', 'L2', 'L3']).optional(),
      /**
       * Nagłówek sekcji FAQ – zachowuje oryginalny wariant tematyczny
       * (np. „Często zadawane pytania o GEO"). Fallback w ArticleFAQ.astro.
       */
      faqHeading: z.string().optional(),
      /**
       * FAQ artykułu – źródło prawdy dla widocznej sekcji (ArticleFAQ.astro)
       * oraz JSON-LD FAQPage. Trzymane w frontmatter, nie w body (reguła CLAUDE.md).
       * Pole `a` może zawierać inline HTML (&ndash;, &nbsp;, <strong>).
       */
      faq: z
        .array(
          z.object({
            q: z.string(),
            a: z.string(),
          })
        )
        .optional(),
    }),
});

const news = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/news' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      lead: z.string(),
      date: z.coerce.date(),
      image: image(),
      sourceName: z.string(),
      sourceUrl: z.string().url(),
      tags: z.array(z.string()).default([]),
      author: z.string().default('Redakcja widocznosc.ai'),
    }),
});

export const collections = { blog, authors, news };
