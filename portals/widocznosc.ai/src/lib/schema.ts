/**
 * Fabryki JSON-LD (schema.org) dla widocznosc.ai.
 *
 * Każda funkcja zwraca pojedynczy node bez `@context` – do złożenia
 * w `@graph` na poziomie strony (jeden Layout-level wrapper).
 * Stabilne `@id` (URL-based) pozwalają cross-referencować węzły
 * Person ↔ BlogPosting ↔ ProfilePage ↔ Organization.
 */

export const SITE_URL = 'https://widocznosc.ai';

// Stabilne identyfikatory globalne
export const ORG_ID = `${SITE_URL}/#organization`;
export const PARENT_ORG_ID = 'https://grupa-icea.pl/#organization';
export const WEBSITE_ID = `${SITE_URL}/#website`;

// Oficjalne profile social ICEA – sameAs dla Organization (sygnał encji dla AI/Google).
export const ICEA_SOCIAL = [
  'https://www.linkedin.com/company/iceagroup/',
  'https://www.facebook.com/iCEAGroup/',
  'https://www.instagram.com/icea.pl/',
  'https://www.youtube.com/@GRUPA_ICEA',
];

const cleanUrl = (path: string) => `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;

const ensureTrailingSlash = (path: string) => (path.endsWith('/') ? path : `${path}/`);

export const absoluteUrl = (path: string) => cleanUrl(ensureTrailingSlash(path));

/**
 * Pełny Organization node – dane ICEA jako parent + widocznosc.ai jako brand
 * widocznosc.ai jest projektem ICEA (parentOrganization), ale dla SEO
 * sensownie traktować go jako odrębną Organization z własnym @id.
 */
export const organizationNode = () => ({
  '@type': 'Organization',
  '@id': ORG_ID,
  name: 'widocznosc.ai',
  alternateName: 'widocznosc.ai by ICEA',
  url: SITE_URL,
  logo: {
    '@type': 'ImageObject',
    url: `${SITE_URL}/og-image.png`,
    width: 1200,
    height: 630,
  },
  image: `${SITE_URL}/og-image.png`,
  description:
    'Pozycjonowanie marek w wyszukiwarkach AI: ChatGPT, Claude, Gemini, Perplexity, Bing Copilot. Audyty widoczności, content i doradztwo Generative Engine Optimization (GEO).',
  slogan: 'Widoczność marek w erze AI Search',
  foundingDate: '2026',
  knowsAbout: [
    'Generative Engine Optimization',
    'GEO',
    'AI Search Optimization',
    'SEO',
    'Large Language Models',
    'ChatGPT',
    'Perplexity',
    'Google AI Overviews',
    'Claude',
    'Bing Copilot',
    'Retrieval Augmented Generation',
    'Prompt Engineering',
  ],
  areaServed: {
    '@type': 'Country',
    name: 'Polska',
  },
  contactPoint: [
    {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'hello@widocznosc.ai',
      areaServed: 'PL',
      availableLanguage: ['Polish', 'English'],
    },
  ],
  parentOrganization: {
    '@type': 'Organization',
    '@id': PARENT_ORG_ID,
    name: 'ICEA S.A.',
    url: 'https://grupa-icea.pl',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'ul. Szyperska 14',
      postalCode: '61-754',
      addressLocality: 'Poznań',
      addressCountry: 'PL',
    },
    email: 'biuro@grupa-icea.pl',
    telephone: '+48667000333',
    identifier: [
      { '@type': 'PropertyValue', propertyID: 'KRS', value: '0000986203' },
      { '@type': 'PropertyValue', propertyID: 'NIP', value: '7811993323' },
      { '@type': 'PropertyValue', propertyID: 'REGON', value: '382883680' },
    ],
    vatID: 'PL7811993323',
    sameAs: ICEA_SOCIAL,
  },
  sameAs: ICEA_SOCIAL,
});

/**
 * WebSite node – emitować raz, najlepiej na homepage.
 * Pozwala Google ustanowić relację "marka → witryna" dla sitelinks.
 */
export const websiteNode = () => ({
  '@type': 'WebSite',
  '@id': WEBSITE_ID,
  url: SITE_URL,
  name: 'widocznosc.ai',
  description:
    'Pozycjonowanie marek w wyszukiwarkach AI – audyty, content i doradztwo Generative Engine Optimization.',
  inLanguage: 'pl-PL',
  publisher: { '@id': ORG_ID },
});

export type EducationEntry = {
  name: string;
  degree?: string;
  fieldOfStudy?: string;
  startYear?: number;
  endYear?: number;
};

export type CredentialEntry = {
  name: string;
  issuer: string;
  dateIssued?: string;
  credentialId?: string;
};

export type AuthorData = {
  name: string;
  role: string;
  shortBio?: string;
  bio?: string;
  expertise?: string[];
  photo?: string;
  iceaProfile?: string;
  linkedin?: string;
  twitter?: string;
  email?: string;
  education?: EducationEntry[];
  credentials?: CredentialEntry[];
};

export const personIdFor = (slug: string) => `${SITE_URL}/autor/${slug}/#person`;
export const profilePageIdFor = (slug: string) => `${SITE_URL}/autor/${slug}/#profilepage`;

/**
 * Person node – kluczowy dla E-E-A-T sygnału.
 * `slug` to id z `getCollection('authors')` (np. "mateusz-wisniewski").
 */
export const personNode = (slug: string, data: AuthorData) => {
  const sameAs = [data.linkedin, data.iceaProfile, data.twitter].filter(Boolean) as string[];

  // alumniOf: czyste EducationalOrganization (sama uczelnia).
  const alumniOf = data.education?.map((edu) => ({
    '@type': 'EducationalOrganization',
    name: edu.name,
  }));

  // Dyplomy z education -> EducationalOccupationalCredential na poziomie Person
  // (hasCredential), z recognizedBy wskazujacym uczelnie. hasOccupationalCredential
  // nie jest property schema.org; hasCredential jest poprawne na Person.
  const degreeCredentials = data.education
    ?.map((edu) => {
      const category = [edu.degree, edu.fieldOfStudy].filter(Boolean).join(' · ');
      if (!category) return null;
      return {
        '@type': 'EducationalOccupationalCredential',
        credentialCategory: category,
        recognizedBy: {
          '@type': 'EducationalOrganization',
          name: edu.name,
        },
        ...(edu.endYear ? { dateCreated: String(edu.endYear) } : {}),
      };
    })
    .filter(Boolean);

  const certCredentials = data.credentials?.map((cred) => ({
    '@type': 'EducationalOccupationalCredential',
    name: cred.name,
    credentialCategory: 'certification',
    recognizedBy: {
      '@type': 'Organization',
      name: cred.issuer,
    },
    ...(cred.dateIssued ? { dateCreated: cred.dateIssued } : {}),
    ...(cred.credentialId ? { identifier: cred.credentialId } : {}),
  }));

  const hasCredential = [...(certCredentials ?? []), ...(degreeCredentials ?? [])];

  return {
    '@type': 'Person',
    '@id': personIdFor(slug),
    name: data.name,
    jobTitle: data.role,
    description: data.shortBio,
    image: data.photo ? cleanUrl(data.photo) : undefined,
    worksFor: { '@id': PARENT_ORG_ID },
    url: `${SITE_URL}/autor/${slug}/`,
    knowsAbout: data.expertise,
    ...(alumniOf?.length ? { alumniOf } : {}),
    ...(hasCredential?.length ? { hasCredential } : {}),
    ...(data.email ? { email: data.email } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };
};

/**
 * ProfilePage node – wrapper dla strony autora.
 * `mainEntity` referuje Person przez @id (autor żyje też jako @id w BlogPosting).
 */
export const profilePageNode = (slug: string, data: AuthorData, articleCount: number) => ({
  '@type': 'ProfilePage',
  '@id': profilePageIdFor(slug),
  url: `${SITE_URL}/autor/${slug}/`,
  name: `${data.name} – ${data.role}`,
  description: data.shortBio,
  mainEntity: { '@id': personIdFor(slug) },
  isPartOf: { '@id': WEBSITE_ID },
  inLanguage: 'pl-PL',
  about: {
    '@type': 'Thing',
    name: 'Autor publikujący w bazie wiedzy widocznosc.ai',
  },
  interactionStatistic: {
    '@type': 'InteractionCounter',
    interactionType: { '@type': 'WriteAction' },
    userInteractionCount: articleCount,
  },
});

export type BreadcrumbItem = { name: string; path: string };

export const breadcrumbNode = (items: BreadcrumbItem[]) => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: absoluteUrl(item.path),
  })),
});

export type BlogPostingInput = {
  pillar: string;
  slug: string;
  title: string;
  description?: string;
  subtitle?: string;
  imageUrl: string;
  imageWidth?: number;
  imageHeight?: number;
  datePublished: string;
  dateModified?: string;
  tags?: string[];
  pillarLabel: string;
  authorSlug: string;
  authorName: string;
  authorRole: string;
  readTime?: string;
  wordCount?: number;
};

const READTIME_TO_MINUTES = (readTime?: string) => {
  if (!readTime) return undefined;
  const m = readTime.match(/(\d+)/);
  return m ? Number(m[1]) : undefined;
};

/**
 * BlogPosting – serce schemy artykułu.
 * Linkuje autora przez @id (osobny Person node w @graph).
 * `mainEntityOfPage` ustawiamy na WebPage z tym samym url.
 */
export const blogPostingNode = (input: BlogPostingInput) => {
  const fullUrl = `${SITE_URL}/${input.pillar}/${input.slug}/`;
  const minutes = READTIME_TO_MINUTES(input.readTime);

  return {
    '@type': 'BlogPosting',
    '@id': `${fullUrl}#article`,
    isPartOf: { '@id': WEBSITE_ID },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': fullUrl,
      url: fullUrl,
    },
    url: fullUrl,
    headline: input.title,
    name: input.title,
    description: input.description || input.subtitle,
    image: {
      '@type': 'ImageObject',
      url: input.imageUrl,
      ...(input.imageWidth ? { width: input.imageWidth } : {}),
      ...(input.imageHeight ? { height: input.imageHeight } : {}),
    },
    datePublished: input.datePublished,
    dateModified: input.dateModified ?? input.datePublished,
    author: { '@id': personIdFor(input.authorSlug) },
    publisher: { '@id': ORG_ID },
    inLanguage: 'pl-PL',
    articleSection: input.pillarLabel,
    keywords: input.tags?.join(', '),
    ...(input.wordCount ? { wordCount: input.wordCount } : {}),
    ...(minutes ? { timeRequired: `PT${minutes}M` } : {}),
  };
};

export type PillarHubInput = {
  pillar: string;
  pillarLabel: string;
  pillarTitle: string;
  description: string;
  posts: Array<{
    pillar: string;
    slug: string;
    title: string;
    description?: string;
    imageUrl: string;
    datePublished: string;
    authorSlug: string;
    authorName: string;
  }>;
};

export const collectionPageNode = (input: PillarHubInput) => {
  const hubUrl = `${SITE_URL}/${input.pillar}/`;

  return {
    '@type': 'CollectionPage',
    '@id': `${hubUrl}#collection`,
    url: hubUrl,
    name: input.pillarTitle,
    description: input.description,
    isPartOf: { '@id': WEBSITE_ID },
    inLanguage: 'pl-PL',
    about: {
      '@type': 'Thing',
      name: input.pillarTitle,
    },
    hasPart: {
      '@type': 'ItemList',
      numberOfItems: input.posts.length,
      itemListOrder: 'https://schema.org/ItemListOrderDescending',
      itemListElement: input.posts.map((post, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'BlogPosting',
          '@id': `${SITE_URL}/${post.pillar}/${post.slug}/#article`,
          headline: post.title,
          description: post.description,
          url: `${SITE_URL}/${post.pillar}/${post.slug}/`,
          image: post.imageUrl,
          datePublished: post.datePublished,
          author: { '@id': personIdFor(post.authorSlug) },
          publisher: { '@id': ORG_ID },
          inLanguage: 'pl-PL',
        },
      })),
    },
  };
};

export type SoftwareApplicationInput = {
  name: string;
  description: string;
  slug: string;
  featureList?: string[];
  screenshotUrl?: string;
  aggregateRating?: { ratingValue: number; ratingCount: number };
};

/**
 * SoftwareApplication – dla narzędzi w /narzedzia/. Offer 0 PLN sygnalizuje
 * bezpłatność, applicationCategory BusinessApplication + operatingSystem Web.
 */
export const softwareApplicationNode = (input: SoftwareApplicationInput) => {
  const url = `${SITE_URL}/narzedzia/${input.slug}/`;
  return {
    '@type': 'SoftwareApplication',
    '@id': `${url}#tool`,
    name: input.name,
    description: input.description,
    url,
    applicationCategory: 'BusinessApplication',
    applicationSubCategory: 'SEO',
    operatingSystem: 'Web',
    inLanguage: 'pl-PL',
    isAccessibleForFree: true,
    provider: { '@id': ORG_ID },
    publisher: { '@id': ORG_ID },
    offers: {
      '@type': 'Offer',
      price: 0,
      priceCurrency: 'PLN',
      availability: 'https://schema.org/InStock',
    },
    ...(input.featureList?.length ? { featureList: input.featureList } : {}),
    ...(input.screenshotUrl ? { screenshot: input.screenshotUrl } : {}),
    ...(input.aggregateRating
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: input.aggregateRating.ratingValue,
            ratingCount: input.aggregateRating.ratingCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };
};

export type ServiceInput = {
  name: string;
  description: string;
  serviceType: string;
  slug: string;
  parentServicePath?: string;
  features?: string[];
};

/**
 * Service – dla usług per model AI (chatgpt, claude, gemini, perplexity).
 * Provider = widocznosc.ai (przez @id), areaServed = PL.
 */
export const serviceNode = (input: ServiceInput) => {
  const url = `${SITE_URL}${input.slug.startsWith('/') ? input.slug : `/${input.slug}`}`;
  return {
    '@type': 'Service',
    '@id': `${url}#service`,
    name: input.name,
    description: input.description,
    serviceType: input.serviceType,
    url,
    provider: { '@id': ORG_ID },
    areaServed: {
      '@type': 'Country',
      name: 'Polska',
    },
    ...(input.parentServicePath
      ? {
          // Service nie ma isPartOf (to property CreativeWork). Relacja
          // "specjalizacja usługi nadrzędnej" przez isRelatedTo (valid na Service).
          isRelatedTo: {
            '@type': 'Service',
            '@id': `${SITE_URL}${input.parentServicePath}#service`,
            name: 'Pozycjonowanie AI',
            url: `${SITE_URL}${input.parentServicePath}`,
          },
        }
      : {}),
    ...(input.features?.length
      ? {
          hasOfferCatalog: {
            '@type': 'OfferCatalog',
            name: input.name,
            // Offer nie ma property position (to ListItem). Kolejność wynika
            // z porządku w tablicy itemListElement.
            itemListElement: input.features.map((feature) => ({
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Service',
                name: feature,
              },
            })),
          },
        }
      : {}),
  };
};

/**
 * Strip HTML entities + tagów z odpowiedzi FAQ – schema.org Answer.text
 * przyjmuje HTML, ale Google preferuje plain text dla pewności parsowania.
 */
const stripHtml = (s: string) =>
  s
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

/**
 * FAQPage – mainEntity to lista Question/Answer.
 * Uwaga: rich result dla FAQ jest od 08.2023 restricted do gov+healthcare,
 * ale schema nadal pomaga LLM-om (Perplexity, AIO) wybierać cytaty.
 */
export const faqPageNode = (faqs: Array<{ q: string; a: string }>, pageUrl: string) => ({
  '@type': 'FAQPage',
  '@id': `${pageUrl}#faq`,
  mainEntity: faqs.map((qa) => ({
    '@type': 'Question',
    name: stripHtml(qa.q),
    acceptedAnswer: {
      '@type': 'Answer',
      text: stripHtml(qa.a),
    },
  })),
});

export type NewsArticleInput = {
  slug: string;
  title: string;
  lead: string;
  imageUrl: string;
  datePublished: string;
  sourceName: string;
  sourceUrl: string;
  tags: string[];
  author: string;
};

/** NewsArticle – wpis sekcji News. Autor zbiorczy (Redakcja). */
export const newsArticleNode = (input: NewsArticleInput) => {
  const url = `${SITE_URL}/news/${input.slug}/`;
  return {
    '@type': 'NewsArticle',
    '@id': `${url}#article`,
    headline: input.title,
    description: input.lead,
    url,
    image: input.imageUrl,
    datePublished: input.datePublished,
    inLanguage: 'pl-PL',
    author: { '@type': 'Organization', name: input.author, '@id': ORG_ID },
    publisher: { '@id': ORG_ID },
    isPartOf: { '@id': WEBSITE_ID },
    keywords: input.tags.join(', '),
    isBasedOn: input.sourceUrl,
    citation: { '@type': 'CreativeWork', name: input.sourceName, url: input.sourceUrl },
  };
};

export type NewsListItem = { slug: string; title: string; datePublished: string };

/** CollectionPage + ItemList dla /news/ (listing chronologiczny). */
export const newsListingNode = (items: NewsListItem[]) => {
  const url = `${SITE_URL}/news/`;
  return {
    '@type': 'CollectionPage',
    '@id': `${url}#collection`,
    url,
    name: 'News – widoczność marek w AI',
    isPartOf: { '@id': WEBSITE_ID },
    inLanguage: 'pl-PL',
    hasPart: {
      '@type': 'ItemList',
      numberOfItems: items.length,
      itemListOrder: 'https://schema.org/ItemListOrderDescending',
      itemListElement: items.map((it, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'NewsArticle',
          '@id': `${SITE_URL}/news/${it.slug}/#article`,
          headline: it.title,
          datePublished: it.datePublished,
        },
      })),
    },
  };
};

/**
 * Złóż wszystkie nody w jeden @graph i opakuj w stringa do `set:html`.
 * Filtruje undefined żeby nie wypluwać pustych pól.
 */
export const buildGraph = (...nodes: Array<Record<string, unknown> | null | undefined>) => {
  const clean = nodes.filter(Boolean) as Record<string, unknown>[];
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': clean,
  });
};
