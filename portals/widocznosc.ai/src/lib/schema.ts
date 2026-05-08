const SITE = 'https://widocznosc.ai';

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'widocznosc.ai',
    url: SITE,
    logo: `${SITE}/images/logo-full.svg`,
    parentOrganization: {
      '@type': 'Organization',
      name: 'ICEA',
      url: 'https://www.grupa-icea.pl',
    },
    sameAs: ['https://www.linkedin.com/company/icea-polska/'],
  };
}

export function breadcrumbListSchema(
  items: Array<{ name: string; url: string }>,
  site = SITE,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: new URL(item.url, site).toString(),
    })),
  };
}

export function personSchema(author: {
  name: string;
  role: string;
  bio: string;
  photo: string;
  iceaProfile: string;
  linkedin?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: author.name,
    jobTitle: author.role,
    description: author.bio,
    image: author.photo,
    url: author.iceaProfile,
    sameAs: [author.iceaProfile, author.linkedin].filter(Boolean),
    worksFor: {
      '@type': 'Organization',
      name: 'ICEA',
      url: 'https://www.grupa-icea.pl',
    },
  };
}

export interface ArticleSchemaInput {
  type: 'Article' | 'TechArticle' | 'HowTo';
  title: string;
  description: string;
  url: string;
  image: string;
  publishedAt: Date;
  updatedAt: Date;
  authors: Array<{ name: string; iceaProfile: string }>;
}

export function articleSchema(input: ArticleSchemaInput) {
  return {
    '@context': 'https://schema.org',
    '@type': input.type,
    headline: input.title,
    description: input.description,
    url: input.url,
    image: input.image,
    datePublished: input.publishedAt.toISOString(),
    dateModified: input.updatedAt.toISOString(),
    author: input.authors.map((a) => ({
      '@type': 'Person',
      name: a.name,
      url: a.iceaProfile,
    })),
    publisher: {
      '@type': 'Organization',
      name: 'widocznosc.ai',
      logo: { '@type': 'ImageObject', url: `${SITE}/images/logo-full.svg` },
    },
  };
}

export function faqPageSchema(faq: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  };
}
