/**
 * 14 botów AI (user-agentów i tokenów robots.txt), podzielonych na 4 kategorie funkcjonalne.
 * Stan dokumentacji dostawców: 2026-09-25.
 * Źródło: artykuł GPTBot/ClaudeBot/PerplexityBot Michała Ziacha + dokumentacje
 * OpenAI / Anthropic / Google / Perplexity / Apple / Common Crawl.
 *
 * Format pasuje 1:1 do infografiki SVG w gptbot-claudebot-perplexitybot-przewodnik.md.
 */

export type BotCategory = 'training' | 'search' | 'on-demand' | 'common-crawl';

/**
 * Czy bot według dokumentacji dostawcy stosuje się do robots.txt.
 * - `honored` – tak (domyślnie),
 * - `may-ignore` – dostawca pisze, że reguły robots.txt mogą go nie obejmować
 *   (ChatGPT-User: „robots.txt rules may not apply”, Perplexity-User:
 *   „generally ignores robots.txt rules”) – realną blokadę daje dopiero WAF,
 * - `undeclared` – dostawca nie deklaruje.
 */
export type RobotsTxtCompliance = 'honored' | 'may-ignore' | 'undeclared';

export type BotDefinition = {
  /** Nazwa wyświetlana */
  name: string;
  /** Główny token user-agent w robots.txt (case-insensitive matching) */
  userAgent: string;
  /** Alternatywne tokeny, które dostawca nadal honoruje – liczone jako reguła dla bota */
  aliases?: string[];
  /**
   * Przestarzałe tokeny (legacy) – dostawca już ich nie używa, więc NIE są liczone
   * jako reguła dla bota. Służą tylko do wykrycia i ostrzeżenia w raporcie.
   */
  legacyTokens?: string[];
  /** Zgodność z robots.txt wg dokumentacji dostawcy (domyślnie `honored`) */
  robotsTxt?: RobotsTxtCompliance;
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
    'Pobierają stronę na potrzeby konkretnej rozmowy lub akcji użytkownika (albo, jak OAI-AdsBot, sprawdzają stronę docelową reklamy). Uwaga: według dokumentacji OpenAI i Perplexity ich boty ChatGPT-User i Perplexity-User mogą nie stosować się do robots.txt – realnie zatrzyma je dopiero reguła na zaporze (WAF). Claude-User respektuje robots.txt.',
  'common-crawl':
    'Zbierają dane do potężnego, otwartego archiwum (Common Crawl), z którego korzysta większość twórców dużych modeli AI na świecie.',
};

export const AI_BOTS: BotDefinition[] = [
  {
    name: 'GPTBot',
    userAgent: 'GPTBot',
    owner: 'OpenAI',
    category: 'training',
    purpose: 'Trening modeli bazowych OpenAI (GPT-6 i kolejnych)',
    impact: 'Długoterminowy – nowe wersje GPT',
    critical: true,
  },
  {
    name: 'ClaudeBot',
    userAgent: 'ClaudeBot',
    legacyTokens: ['anthropic-ai'],
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
    purpose: 'Pobieranie strony na potrzeby rozmowy lub akcji użytkownika (ChatGPT, GPT-y)',
    impact: 'Bieżący – robots.txt może go nie obejmować, blokada tylko przez WAF',
    robotsTxt: 'may-ignore',
  },
  {
    name: 'Claude-User',
    userAgent: 'Claude-User',
    legacyTokens: ['Claude-Web'],
    owner: 'Anthropic',
    category: 'on-demand',
    purpose: 'Pobieranie strony na żądanie użytkownika Claude',
    impact: 'Bieżący – respektuje robots.txt',
  },
  {
    name: 'Perplexity-User',
    userAgent: 'Perplexity-User',
    owner: 'Perplexity',
    category: 'on-demand',
    purpose: 'Pobieranie strony na żądanie użytkownika Perplexity',
    impact: 'Bieżący – z reguły ignoruje robots.txt, blokada tylko przez WAF',
    robotsTxt: 'may-ignore',
  },
  {
    name: 'OAI-AdsBot',
    userAgent: 'OAI-AdsBot',
    owner: 'OpenAI',
    category: 'on-demand',
    purpose: 'Weryfikacja stron docelowych reklam w ChatGPT',
    impact: 'Dotyczy tylko reklamodawców; dane nie służą do trenowania',
    robotsTxt: 'undeclared',
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
