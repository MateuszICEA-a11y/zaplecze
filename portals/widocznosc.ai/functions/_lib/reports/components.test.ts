import { describe, it, expect } from 'vitest';
import { heading, paragraph, pill, statGrid, list, actionItems } from './components';

describe('komponenty raportu', () => {
  it('heading escapuje treść', () => {
    expect(heading('<b>X</b>')).toContain('&lt;b&gt;X&lt;/b&gt;');
  });
  it('statGrid renderuje pary label/wartość', () => {
    const html = statGrid([['Wynik', '72/100'], ['Modele', '3/4']]);
    expect(html).toContain('72/100');
    expect(html).toContain('Modele');
  });
  it('list escapuje pozycje', () => {
    expect(list(['a & b'])).toContain('a &amp; b');
  });
  it('actionItems pokazuje priorytet i tytuł', () => {
    const html = actionItems([{ priority: 'P0', title: 'Zrób X', description: 'opis' }]);
    expect(html).toContain('P0');
    expect(html).toContain('Zrób X');
    expect(html).toContain('opis');
  });
  it('pusta lista actionItems → pusty string', () => {
    expect(actionItems([])).toBe('');
  });
  it('paragraph i pill renderują treść', () => {
    expect(paragraph('cześć')).toContain('cześć');
    expect(pill('badge')).toContain('badge');
  });
});
