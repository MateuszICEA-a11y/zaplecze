/**
 * Modele AI mierzone przez widocznosc.ai – source of truth.
 * Używane w Nav mega menu, /pozycjonowanie-ai pillar grid, podstronach
 * per model, RecentArticles category filtering.
 *
 * Dane: keyword volumes z docs/widocznosc-ai/keyword-map.md (Senuto).
 */

export type AIModelSlug =
  | 'chatgpt'
  | 'claude'
  | 'gemini'
  | 'perplexity'
  | 'bing-copilot';

export type AIModel = {
  slug: AIModelSlug;
  name: string;
  vendor: string;
  href: string;
  keyword: string;
  keywordVolume: number;
  shortDesc: string;
  symbol: string;
};

export const AI_MODELS: AIModel[] = [
  {
    slug: 'chatgpt',
    name: 'ChatGPT',
    vendor: 'OpenAI',
    href: '/pozycjonowanie-ai/chatgpt/',
    keyword: 'pozycjonowanie w chatgpt',
    keywordVolume: 140,
    shortDesc:
      'Najpopularniejszy asystent w Polsce. Wykorzystuje wyszukiwanie ChatGPT Search z dostępem do sieci, łącząc dane treningowe i pobieranie informacji na żywo (RAG).',
    symbol: '◐',
  },
  {
    slug: 'claude',
    name: 'Claude',
    vendor: 'Anthropic',
    href: '/pozycjonowanie-ai/claude/',
    keyword: 'pozycjonowanie w claude',
    keywordVolume: 30,
    shortDesc:
      'Zastosowania premium w sektorze B2B, funkcja Artifacts. Mniejszy ruch, ale wyższy odsetek osób decyzyjnych.',
    symbol: '✦',
  },
  {
    slug: 'gemini',
    name: 'Gemini',
    vendor: 'Google',
    href: '/pozycjonowanie-ai/gemini/',
    keyword: 'pozycjonowanie w gemini',
    keywordVolume: 50,
    shortDesc:
      'Integracja z wyszukiwarką Google, Podsumowaniami AI (AI Overviews) i usługami Workspace. Cytowania bezpośrednio z indeksu Google.',
    symbol: '⊡',
  },
  {
    slug: 'perplexity',
    name: 'Perplexity',
    vendor: 'Perplexity AI',
    href: '/pozycjonowanie-ai/perplexity/',
    keyword: 'pozycjonowanie w perplexity',
    keywordVolume: 40,
    shortDesc:
      'Wyszukiwarka odpowiedzi z silnym naciskiem na cytowania. Każde wygenerowane stwierdzenie posiada przypis z linkiem do źródła.',
    symbol: '◇',
  },
  {
    slug: 'bing-copilot',
    name: 'Bing Copilot',
    vendor: 'Microsoft',
    href: '/pozycjonowanie-ai/bing-copilot/',
    keyword: 'pozycjonowanie w bing copilot',
    keywordVolume: 20,
    shortDesc:
      'Połączenie modelu GPT-4 z indeksem Bing. Mniejszy udział w rynku, ale model jest domyślnie wbudowany w przeglądarkę Edge i system Windows.',
    symbol: '∴',
  },
];

export const SERVICES = [
  {
    slug: 'audyt',
    label: 'Audyt widoczności',
    desc: 'Skan w 5 modelach AI',
    href: '/pozycjonowanie-ai/#audyt',
  },
  {
    slug: 'content',
    label: 'Optymalizacja contentu',
    desc: 'Pisanie pod LLM',
    href: '/pozycjonowanie-ai/#content',
  },
  {
    slug: 'monitoring',
    label: 'Monitoring cytowań',
    desc: 'Tracking wzmianek marki',
    href: '/pozycjonowanie-ai/#monitoring',
  },
  {
    slug: 'strategia',
    label: 'Strategia GEO',
    desc: 'Plan widoczności 12 mies.',
    href: '/pozycjonowanie-ai/#strategia',
  },
];
