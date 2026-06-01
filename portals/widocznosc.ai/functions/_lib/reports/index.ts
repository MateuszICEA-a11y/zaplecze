import { renderReport as brandCheck } from './brand-check';
import { renderReport as fanout } from './fanout';
import { renderReport as urlCheck } from './url-check';
import { renderReport as aiBotsCheck } from './ai-bots-check';

export const TOOLS = ['brand-check', 'fanout', 'url-check', 'ai-bots-check'] as const;
export type Tool = (typeof TOOLS)[number];

const LABELS: Record<Tool, string> = {
  'brand-check': 'Brand Check',
  fanout: 'Fan-out Check',
  'url-check': 'URL Check',
  'ai-bots-check': 'AI Bots Check',
};

const RENDERERS: Record<Tool, (result: any, query: string) => { subject: string; html: string }> = {
  'brand-check': brandCheck,
  fanout,
  'url-check': urlCheck,
  'ai-bots-check': aiBotsCheck,
};

export function isTool(x: unknown): x is Tool {
  return typeof x === 'string' && (TOOLS as readonly string[]).includes(x);
}
export function toolLabel(tool: Tool): string {
  return LABELS[tool];
}
export function renderToolReport(tool: Tool, result: unknown, query: string) {
  return RENDERERS[tool](result, query);
}
