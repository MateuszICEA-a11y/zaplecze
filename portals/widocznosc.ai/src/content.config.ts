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
      pillar: z.enum(BLOG_PILLARS),
      intent: z.enum(['INFO', 'COMPARE', 'HOWTO', 'TOOL', 'COMMERCIAL']).optional(),
      level: z.enum(['L1', 'L2', 'L3']).optional(),
    }),
});

export const collections = { blog, authors };
