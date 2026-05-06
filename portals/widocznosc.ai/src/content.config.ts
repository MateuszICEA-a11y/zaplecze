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
 * Blog categories – taxonomia widocznosc.ai bazy wiedzy.
 * Każdy artykuł musi mieć dokładnie jedną kategorię (zapobiega duplikatom
 * i ułatwia filtrowanie). Tagi (z = znacznik) są dowolne i wielokrotne.
 */
export const BLOG_CATEGORIES = [
  'ai-search',     // Jak działają wyszukiwarki AI (ChatGPT, Claude, Perplexity etc.)
  'geo',           // Generative Engine Optimization – metodologia, frameworki
  'content',       // Content pod LLM – fact-density, schema, źródła
  'narzedzia',     // Tutoriale, recenzje narzędzi GEO i AI search
  'case-study',    // Przypadki klientów ICEA, dane, rezultaty
  'definicje',     // Słownik pojęć (RAG, training data, chain-of-thought etc.)
] as const;

export const CATEGORY_LABELS: Record<(typeof BLOG_CATEGORIES)[number], string> = {
  'ai-search': 'AI Search',
  geo: 'GEO',
  content: 'Content pod LLM',
  narzedzia: 'Narzędzia',
  'case-study': 'Case study',
  definicje: 'Definicje',
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
      image: image(),
      icon: z.string(),
      author: z.object({
        name: z.string(),
        role: z.string(),
        avatar: image(),
      }),
      readTime: z.string(),
      tags: z.array(z.string()),
      category: z.enum(BLOG_CATEGORIES).default('ai-search'),
    }),
});

export const collections = { blog, authors };
