import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async () => {
  const pillars = await getCollection('pillar', ({ data }: any) => !data.draft);
  const articles = await getCollection('articles', ({ data }: any) => !data.draft);

  const sections: string[] = ['# widocznosc.ai – Full Content', ''];

  for (const p of pillars as any[]) {
    sections.push(`## ${p.data.title}`);
    sections.push(`URL: https://widocznosc.ai/pozycjonowanie-ai/${p.slug}/`);
    sections.push('');
    sections.push(p.body ?? '');
    sections.push('');
  }

  for (const a of (articles as any[]).slice(0, 20)) {
    sections.push(`## ${a.data.title}`);
    sections.push(`URL: https://widocznosc.ai/baza-wiedzy/${a.data.category}/${a.slug}/`);
    sections.push(`TLDR: ${a.data.tldr}`);
    sections.push('');
    sections.push(a.body ?? '');
    sections.push('');
  }

  return new Response(sections.join('\n'), {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
