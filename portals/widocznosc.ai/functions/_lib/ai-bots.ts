/**
 * 13 botów AI indeksujących, podzielonych na 4 kategorie funkcjonalne.
 * Źródło: artykuł GPTBot/ClaudeBot/PerplexityBot Michała Ziacha + dokumentacje
 * OpenAI / Anthropic / Google / Perplexity / Apple / Common Crawl.
 *
 * Format pasuje 1:1 do infografiki SVG w gptbot-claudebot-perplexitybot-przewodnik.md.
 */

export type BotCategory = 'training' | 'search' | 'on-demand' | 'common-crawl';

export type BotDefinition = {
  /** Nazwa wyświetlana */
  name: string;
  /** Główny token user-agent w robots.txt (case-insensitive matching) */
  userAgent: string;
  /** Alternatywne tokeny (np. ClaudeBot ma `anthropic-ai`) */
  aliases?: string[];
  owner: string;
  category: BotCategory;
  /** Krótki opis funkcji (bezokolicznik PL) */
  purpose: string;
  /** Wpływ na widoczność marki w AI */
  impact: string;
  /** Czy krytyczny – jeśli zablokowany, daje P0 action item */
  critical?: boolean;
};

export const CATEGORY_LABELS: Record<BotCategory, string> = {
  training: 'Treningowe',
  search: 'Wyszukiwawcze',
  'on-demand': 'Na żądanie',
  'common-crawl': 'Common Crawl',
};

export const CATEGORY_DESCRIPTIONS: Record<BotCategory, string> = {
  training: 'Skanują i pobierają Twoje treści, by uczyć na nich sztuczną inteligencję.',
  search:
    'Indeksują stronę na żywo. Jeśli je zablokujesz, znikniesz z gotowych odpowiedzi wyszukiwarek AI.',
  'on-demand':
    'Pobierają dane w czasie rzeczywistym tylko wtedy, gdy użytkownik wpisze zapytanie zawierające link do Twojej strony.',
  'common-crawl':
    'Zbierają dane do potężnego, otwartego archiwum (Common Crawl), z którego korzysta większość twórców dużych modeli AI na świecie.',
};

export const AI_BOTS: BotDefinition[] = [
  {
    name: 'GPTBot',
    userAgent: 'GPTBot',
    owner: 'OpenAI',
    category: 'training',
    purpose: 'Trening modeli GPT-5+',
    impact: 'Długoterminowy – nowe wersje GPT',
    critical: true,
  },
  {
    name: 'ClaudeBot',
    userAgent: 'ClaudeBot',
    aliases: ['anthropic-ai'],
    owner: 'Anthropic',
    category: 'training',
    purpose: 'Trening modeli Claude',
    impact: 'Długoterminowy',
    critical: true,
  },
  {
    name: 'Google-Extended',
    userAgent: 'Google-Extended',
    owner: 'Google',
    category: 'training',
    purpose: 'Kontrola użycia danych w Gemini / Vertex AI',
    impact: 'Trening i grounding, bez wpływu na Google Search',
    critical: true,
  },
  {
    name: 'OAI-SearchBot',
    userAgent: 'OAI-SearchBot',
    owner: 'OpenAI',
    category: 'search',
    purpose: 'Crawling dla ChatGPT Search',
    impact: 'Bieżący – cytowania w odpowiedziach',
    critical: true,
  },
  {
    name: 'PerplexityBot',
    userAgent: 'PerplexityBot',
    owner: 'Perplexity',
    category: 'search',
    purpose: 'Indeksowanie ogólne',
    impact: 'Bieżący + długoterminowy',
    critical: true,
  },
  {
    name: 'Claude-SearchBot',
    userAgent: 'Claude-SearchBot',
    owner: 'Anthropic',
    category: 'search',
    purpose: 'Wyszukiwanie real-time w Claude',
    impact: 'Bieżący',
  },
  {
    name: 'ChatGPT-User',
    userAgent: 'ChatGPT-User',
    owner: 'OpenAI',
    category: 'on-demand',
    purpose: 'Fetch on-demand (browse with web)',
    impact: 'Bieżący – per fetch użytkownika',
  },
  {
    name: 'Claude-User',
    userAgent: 'Claude-User',
    aliases: ['Claude-Web'],
    owner: 'Anthropic',
    category: 'on-demand',
    purpose: 'Fetch on-demand w Claude',
    impact: 'Bieżący',
  },
  {
    name: 'Perplexity-User',
    userAgent: 'Perplexity-User',
    owner: 'Perplexity',
    category: 'on-demand',
    purpose: 'Fetch on-demand (deep research)',
    impact: 'Bieżący',
  },
  {
    name: 'CCBot',
    userAgent: 'CCBot',
    owner: 'Common Crawl',
    category: 'common-crawl',
    purpose: 'Dataset dla wszystkich LLM',
    impact: 'Krytyczny – większość modeli używa CC',
    critical: true,
  },
  {
    name: 'Applebot-Extended',
    userAgent: 'Applebot-Extended',
    owner: 'Apple',
    category: 'common-crawl',
    purpose: 'Kontrola użycia danych w Apple Intelligence',
    impact: 'Trening / użycie danych, nie osobny crawler',
  },
  {
    name: 'GoogleOther',
    userAgent: 'GoogleOther',
    owner: 'Google',
    category: 'common-crawl',
    purpose: 'Sub-team labs, eksperymenty AI',
    impact: 'Różny',
  },
  {
    name: 'Google-NotebookLM',
    userAgent: 'Google-NotebookLM',
    owner: 'Google',
    category: 'common-crawl',
    purpose: 'NotebookLM research tool',
    impact: 'Niszowy',
  },
];
