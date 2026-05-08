const LABELS: Record<string, string> = {
  '': 'Strona główna',
  'pozycjonowanie-ai': 'Pozycjonowanie AI',
  'baza-wiedzy': 'Baza wiedzy',
  'modele-ai': 'Modele AI',
  'pojecia-ai': 'Pojęcia AI',
  poradniki: 'Poradniki',
  narzedzia: 'Narzędzia',
  autorzy: 'Autorzy',
  autor: 'Autor',
  'o-nas': 'O nas',
  kontakt: 'Kontakt',
};

function humanize(slug: string): string {
  if (LABELS[slug]) return LABELS[slug];
  return slug
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ');
}

export function buildBreadcrumbs(pathname: string): Array<{ name: string; url: string }> {
  const segments = pathname.split('/').filter(Boolean);
  const result = [{ name: 'Strona główna', url: '/' }];
  let acc = '';
  for (const seg of segments) {
    acc += `/${seg}`;
    result.push({ name: humanize(seg), url: `${acc}/` });
  }
  return result;
}
