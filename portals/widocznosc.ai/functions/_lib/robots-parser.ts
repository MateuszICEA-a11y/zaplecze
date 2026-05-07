/**
 * Minimalistyczny parser robots.txt – sprawdza, czy konkretny user-agent
 * ma dostęp do path `/` (root domeny).
 *
 * Implementacja zgodna z RFC 9309 dla podstawowych przypadków:
 * - case-insensitive matching user-agent tokenów
 * - Allow wygrywa nad Disallow przy tej samej długości path
 * - dłuższy path wygrywa nad krótszym
 * - fallback na blok `User-agent: *` gdy nie ma matchu
 * - brak robots.txt lub brak ograniczeń = allowed
 *
 * NIE obsługuje: wildcardów `*` w path (najczęściej dla robots.txt AI nie ma znaczenia,
 * bo blokady są zwykle `Disallow: /` całościowo).
 */

export type RobotsRule = {
  type: 'allow' | 'disallow';
  path: string;
};

export type RobotsGroup = {
  userAgents: string[];
  rules: RobotsRule[];
};

/**
 * Parsuje treść robots.txt do listy bloków user-agent → rules.
 */
export function parseRobotsTxt(text: string): RobotsGroup[] {
  const groups: RobotsGroup[] = [];
  let current: RobotsGroup | null = null;
  let lastLineWasUserAgent = false;

  const lines = text.split(/\r?\n/);
  for (const rawLine of lines) {
    // Strip comments and whitespace
    const line = rawLine.replace(/#.*$/, '').trim();
    if (!line) continue;

    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    const directive = line.slice(0, colonIdx).trim().toLowerCase();
    const value = line.slice(colonIdx + 1).trim();

    if (directive === 'user-agent') {
      // Sąsiednie User-agent: lines (bez Disallow/Allow między) → ten sam blok
      if (!current || !lastLineWasUserAgent) {
        current = { userAgents: [], rules: [] };
        groups.push(current);
      }
      current.userAgents.push(value.toLowerCase());
      lastLineWasUserAgent = true;
    } else if (directive === 'disallow' || directive === 'allow') {
      if (!current) {
        // Reguła bez user-agent przed nią – ignoruj
        continue;
      }
      current.rules.push({
        type: directive as 'allow' | 'disallow',
        path: value,
      });
      lastLineWasUserAgent = false;
    }
    // Sitemap, Crawl-delay i inne dyrektywy są ignorowane na potrzeby tego narzędzia
  }

  return groups;
}

/**
 * Znajduje grupę reguł najbardziej specyficzną dla danego user-agenta.
 * Preferowany jest exact match (case-insensitive) przed `*`.
 *
 * Aliasy: jeśli któryś z `userAgentTokens` znajdzie match, używamy tej grupy.
 */
export function findMatchingGroup(
  groups: RobotsGroup[],
  userAgentTokens: string[]
): RobotsGroup | null {
  const tokens = userAgentTokens.map((t) => t.toLowerCase());

  // Najpierw szukamy exact matchu
  for (const group of groups) {
    for (const ua of group.userAgents) {
      if (tokens.includes(ua)) return group;
    }
  }

  // Fallback – grupa `*`
  for (const group of groups) {
    if (group.userAgents.includes('*')) return group;
  }

  return null;
}

/**
 * Czy dany user-agent ma dostęp do `path` zgodnie z robots.txt.
 *
 * Algorytm RFC 9309:
 * 1. Najdłuższy path (longest match) wygrywa
 * 2. Przy tej samej długości path: Allow wygrywa nad Disallow
 * 3. Brak matchu lub pusta `Disallow:` value = allowed
 * 4. Brak grupy w ogóle = allowed
 */
export function isPathAllowed(group: RobotsGroup | null, path: string): boolean {
  if (!group) return true;

  let bestMatch: { rule: RobotsRule; length: number } | null = null;

  for (const rule of group.rules) {
    // Pusta wartość Disallow = brak ograniczeń (norma robots.txt)
    if (rule.path === '') continue;

    // Wildcard pattern w path? Bardzo prosta heurystyka – sprawdzamy czy ścieżka
    // zaczyna się od `rule.path` (bez wildcard supportu)
    const matches = path.startsWith(rule.path);
    if (!matches) continue;

    if (
      !bestMatch ||
      rule.path.length > bestMatch.length ||
      (rule.path.length === bestMatch.length &&
        rule.type === 'allow' &&
        bestMatch.rule.type === 'disallow')
    ) {
      bestMatch = { rule, length: rule.path.length };
    }
  }

  if (!bestMatch) return true;
  return bestMatch.rule.type === 'allow';
}

/**
 * High-level helper – sprawdza, czy konkretny bot (rozpoznawany przez listę tokenów
 * user-agent + aliasów) ma dostęp do path `/` na podstawie raw text robots.txt.
 *
 * Zwraca także informację, na jakim user-agent został matchnięty (`*`, exact, none).
 */
export function checkBotAccess(
  robotsText: string,
  userAgentTokens: string[],
  path = '/'
): {
  allowed: boolean;
  matchedUserAgent: string | null;
} {
  const groups = parseRobotsTxt(robotsText);
  const group = findMatchingGroup(groups, userAgentTokens);
  const allowed = isPathAllowed(group, path);
  const matchedUserAgent = group ? group.userAgents[0] : null;
  return { allowed, matchedUserAgent };
}
