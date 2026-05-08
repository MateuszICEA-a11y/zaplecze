import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async () => {
  const pillars = await getCollection('pillar', ({ data }: any) => !data.draft);
  const articles = await getCollection('articles', ({ data }: any) => !data.draft);

  const lines: string[] = [
    '# widocznosc.ai',
    '',
    '> Portal o widoczności marki w AI – pozycjonowanie w ChatGPT, Claude, Gemini, Perplexity. Część ICEA.',
    '',
    '## Pozycjonowanie AI (usługi)',
    ...pillars.map(
      (p: any) =>
        `- [${p.data.title}](https://widocznosc.ai/pozycjonowanie-ai/${p.slug}/): ${p.data.metaDescription}`,
    ),
    '',
    '## Baza wiedzy (edukacja)',
    ...articles.map(
      (a: any) =>
        `- [${a.data.title}](https://widocznosc.ai/baza-wiedzy/${a.data.category}/${a.slug}/): ${a.data.metaDescription}`,
    ),
    '',
  ];

  return new Response(lines.join('\n'), {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
