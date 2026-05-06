export function canonical(pathname: string, site: string): string {
  const url = new URL(pathname, site);
  url.search = '';
  if (!url.pathname.endsWith('/')) url.pathname += '/';
  return url.toString();
}

export interface MetaInput {
  title: string;
  description: string;
}

export function validateMeta({ title, description }: MetaInput): void {
  if (title.length > 60) throw new Error(`Title too long: ${title.length} chars (max 60)`);
  if (title.length < 30) throw new Error(`Title too short: ${title.length} chars (min 30)`);
  if (description.length > 160) throw new Error(`Description too long: ${description.length} chars (max 160)`);
  if (description.length < 120) throw new Error(`Description too short: ${description.length} chars (min 120)`);
}
