import { describe, expect, it } from 'vitest';
import fixture from './__fixtures__/fanout-response.json';
import { parseResponsesOutput } from './fanout-parse';

describe('parseResponsesOutput', () => {
  const parsed = parseResponsesOutput(fixture);

  it('wyciąga fan-out queries z action.query i action.queries', () => {
    expect(parsed.fanoutQueries).toEqual([
      'najlepsza agencja seo w polsce 2026 ranking',
      'agencja seo opinie ranking',
      'icea seo opinie',
    ]);
  });

  it('oznacza, że model wykonał wyszukiwanie', () => {
    expect(parsed.searched).toBe(true);
  });

  it('wyciąga cytowania z domeną bez www', () => {
    expect(parsed.citations).toHaveLength(3);
    expect(parsed.citations[0]).toMatchObject({
      title: 'Ranking agencji',
      url: 'https://www.example.com/ranking?utm=1',
      domain: 'example.com',
    });
  });

  it('agreguje domeny z liczbą cytowań i sortuje malejąco', () => {
    expect(parsed.citedDomains).toEqual([
      {
        domain: 'example.com',
        count: 2,
        urls: ['https://www.example.com/ranking?utm=1', 'https://example.com/opinie'],
      },
      { domain: 'icea.pl', count: 1, urls: ['https://icea.pl/o-nas'] },
    ]);
  });

  it('wyciąga źródła użyte w wyszukiwaniu i deduplikuje URL-e', () => {
    expect(parsed.searchedSources).toEqual([
      { url: 'https://www.example.com/ranking?utm=1', domain: 'example.com' },
      { url: 'https://rankingi.pl/seo', domain: 'rankingi.pl' },
      { url: 'https://example.com/opinie', domain: 'example.com' },
      { url: 'https://icea.pl/o-nas', domain: 'icea.pl' },
    ]);
    expect(parsed.searchedDomains).toEqual([
      {
        domain: 'example.com',
        count: 2,
        urls: ['https://www.example.com/ranking?utm=1', 'https://example.com/opinie'],
      },
      { domain: 'icea.pl', count: 1, urls: ['https://icea.pl/o-nas'] },
      { domain: 'rankingi.pl', count: 1, urls: ['https://rankingi.pl/seo'] },
    ]);
  });

  it('dla odpowiedzi bez web_search zwraca searched=false i puste listy', () => {
    const empty = parseResponsesOutput({ output: [{ type: 'message', content: [{ type: 'output_text', text: 'hej' }] }] });
    expect(empty.searched).toBe(false);
    expect(empty.fanoutQueries).toEqual([]);
    expect(empty.citedDomains).toEqual([]);
    expect(empty.answer).toBe('hej');
  });

  it('jest odporny na śmieciowe wejście', () => {
    expect(parseResponsesOutput(null).fanoutQueries).toEqual([]);
    expect(parseResponsesOutput({}).citations).toEqual([]);
  });

  it('używa domeny jako tytułu, gdy cytowanie nie ma tytułu', () => {
    const result = parseResponsesOutput({
      output: [
        {
          type: 'message',
          content: [
            { type: 'output_text', text: 'x', annotations: [{ type: 'url_citation', url: 'https://www.foo.pl/a' }] },
          ],
        },
      ],
    });
    expect(result.citations[0]).toMatchObject({ title: 'foo.pl', url: 'https://www.foo.pl/a', domain: 'foo.pl' });
  });
});
