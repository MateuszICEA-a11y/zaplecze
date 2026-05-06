import { defineCollection, reference, z } from 'astro:content';

const authorSchema = z.object({
  name: z.string(),
  role: z.string(),
  company: z.literal('ICEA'),
  bio: z.string(),
  shortBio: z.string().max(280),
  expertise: z.array(z.string()).min(1),
  photo: z.string(),
  email: z.string().email().optional(),
  linkedin: z.string().url().optional(),
  twitter: z.string().url().optional(),
  github: z.string().url().optional(),
  iceaProfile: z.string().url(),
  publishedAt: z.coerce.date(),
});

const faqSchema = z.array(
  z.object({
    question: z.string(),
    answer: z.string(),
  }),
);

const sourceSchema = z.array(
  z.object({
    title: z.string(),
    url: z.string().url(),
    accessed: z.coerce.date().optional(),
  }),
);

const breadcrumbSchema = z.array(
  z.object({
    name: z.string(),
    url: z.string(),
  }),
);

const pillar = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string().max(70),
    metaTitle: z.string().max(60),
    metaDescription: z.string().min(120).max(160),
    primaryKeyword: z.string(),
    searchVolume: z.number().int().nonnegative(),
    intent: z.literal('commercial'),
    hero: z.object({
      headline: z.string(),
      subheadline: z.string(),
      ctaText: z.string(),
      ctaHref: z.string(),
    }),
    serviceOffer: z.object({
      name: z.string(),
      description: z.string(),
      deliverables: z.array(z.string()).min(2),
      priceFrom: z.string().optional(),
      ctaText: z.string(),
      ctaHref: z.string(),
    }),
    relatedArticles: z.array(reference('articles')).optional(),
    caseStudies: z.array(reference('caseStudies')).optional(),
    faq: faqSchema.optional(),
    schema: z.object({
      type: z.enum(['Service', 'Product']),
      breadcrumbs: breadcrumbSchema,
    }),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    authors: z.array(reference('authors')).min(1),
    draft: z.boolean().default(false),
  }),
});

const articles = defineCollection({
  type: 'content',
  schema: ({ image }) =>
    z.object({
      title: z.string().max(70),
      metaTitle: z.string().max(60),
      metaDescription: z.string().min(120).max(160),
      primaryKeyword: z.string(),
      secondaryKeywords: z.array(z.string()).default([]),
      category: z.enum(['modele-ai', 'pojecia-ai', 'poradniki']),
      subcategory: z.string().optional(),
      intent: z.enum(['educational', 'comparison', 'tutorial']),
      hero: z.object({
        image: image(),
        alt: z.string(),
        caption: z.string().optional(),
      }),
      infographic: z
        .object({
          image: image(),
          alt: z.string(),
          caption: z.string().optional(),
        })
        .optional(),
      tldr: z.string().min(50).max(280),
      readingTimeMin: z.number().int().positive(),
      toc: z.boolean().default(true),
      faq: faqSchema.optional(),
      sources: sourceSchema.min(1),
      relatedArticles: z.array(reference('articles')).optional(),
      relatedPillars: z.array(reference('pillar')).optional(),
      schema: z.object({
        type: z.enum(['Article', 'TechArticle', 'HowTo']),
        breadcrumbs: breadcrumbSchema,
      }),
      publishedAt: z.coerce.date(),
      updatedAt: z.coerce.date(),
      authors: z.array(reference('authors')).min(1),
      reviewer: reference('authors').optional(),
      draft: z.boolean().default(false),
    }),
});

const authors = defineCollection({
  type: 'content',
  schema: authorSchema,
});

const caseStudies = defineCollection({
  type: 'content',
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      metaTitle: z.string().max(60),
      metaDescription: z.string().max(160),
      client: z.object({
        name: z.string(),
        industry: z.string(),
        logo: z.string().optional(),
      }),
      challenge: z.string(),
      solution: z.string(),
      results: z
        .array(
          z.object({
            metric: z.string(),
            before: z.string(),
            after: z.string(),
          }),
        )
        .min(1),
      testimonial: z
        .object({
          quote: z.string(),
          author: z.string(),
          role: z.string(),
        })
        .optional(),
      hero: image(),
      publishedAt: z.coerce.date(),
      draft: z.boolean().default(false),
    }),
});

export const collections = { pillar, articles, authors, caseStudies };
