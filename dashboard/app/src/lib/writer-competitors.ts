/* Content Writer – sekcja „Konkurencja”: wpisy z sitemap konkurentów wobec
   naszych wpisów. Dane: GET /api/cw/writer/competitors/:domain (plik collectora
   + zapisany werdykt z D1), porównanie brakujących: POST …/sync w pętli. */

import { api, esc, fmtDateTime, fmtInt } from './writer-client';

type Any = Record<string, any>;
type View = 'new' | 'gap' | 'all';

const REC: Record<string, { label: string; tone: string }> = {
  new: { label: 'Nie mamy', tone: 'err' },
  check: { label: 'Mamy coś pokrewnego', tone: 'warn' },
  refresh: { label: 'Mamy', tone: 'ok' },
};
const PAGE = 40;
const NEW_DAYS = 30;

export function mountCompetitors(root: HTMLElement, { domain, pick }: { domain: string; pick: (phrase: string) => void }) {
  let data: Any | null = null;
  let view: View = 'new';
  let host = 'all';
  let query = '';
  let shown = PAGE;
  let syncing = false;

  const since = new Date(Date.now() - NEW_DAYS * 86_400_000).toISOString().slice(0, 10);
  const isNew = (item: Any) => !item.baseline && String(item.first_seen ?? '') >= since;
  const pct = (score: number | null) => (typeof score === 'number' ? `${Math.round(score * 100)}%` : '–');

  function filtered() {
    const needle = query.trim().toLowerCase();
    return ((data?.items ?? []) as Any[])
      .filter((item) => host === 'all' || item.host === host)
      .filter((item) => view === 'all' || (view === 'new' ? isNew(item) : item.action === 'new'))
      .filter((item) => !needle || item.title.toLowerCase().includes(needle))
      .sort((a, b) => String(b.first_seen ?? '').localeCompare(String(a.first_seen ?? ''))
        || String(b.lastmod ?? '').localeCompare(String(a.lastmod ?? '')));
  }

  function render() {
    if (!data) return;
    const items = data.items as Any[];
    const sites = (data.sites ?? []) as Any[];
    const count = (fn: (item: Any) => boolean) => items.filter((item) => (host === 'all' || item.host === host) && fn(item)).length;
    const rows = filtered();
    const pending = data.pending as number;

    root.innerHTML = `
      <div class="wr-tiles">
        ${sites.map((site) => {
          const mine = items.filter((item) => item.host === site.host);
          const fresh = mine.filter(isNew).length;
          const gap = mine.filter((item) => item.action === 'new').length;
          return `<button type="button" class="wr-tile wr-site ${host === site.host ? 'on' : ''} ${site.status === 'ok' ? 'ok' : 'low'}" data-host="${esc(site.host)}">
            <span class="h">${esc(site.host)}</span>
            <span class="v">${fmtInt(mine.length)}</span>
            <span class="l">wpisów w sitemapie${site.status !== 'ok' ? ` – ostatni odczyt nie powiódł się: ${esc(site.error ?? '')}` : ''}</span>
            <span class="l"><strong>${fmtInt(fresh)}</strong> nowych w ${NEW_DAYS} dni · <strong>${fmtInt(gap)}</strong> tematów, których nie mamy</span>
          </button>`;
        }).join('')}
      </div>
      ${pending ? `<div class="wr-alert"><strong>${fmtInt(pending)} wpisów czeka na porównanie z naszymi.</strong>
        <span>Porównanie idzie samo codziennie rano; możesz je dokończyć teraz.</span>
        <div class="wr-actions"><button class="wr-btn small primary" type="button" data-sync>${syncing ? 'Porównuję…' : 'Porównaj teraz'}</button><span class="wr-msg" data-sync-msg></span></div></div>` : ''}
      <div class="wr-panel">
        <div class="wr-rec-bar">
          <div class="wr-seg" role="group" aria-label="Widok">
            <button type="button" data-view="new" class="${view === 'new' ? 'on' : ''}">Nowe u konkurencji <b>${fmtInt(count(isNew))}</b></button>
            <button type="button" data-view="gap" class="${view === 'gap' ? 'on' : ''}">Tematy, których nie mamy <b>${fmtInt(count((item) => item.action === 'new'))}</b></button>
            <button type="button" data-view="all" class="${view === 'all' ? 'on' : ''}">Wszystkie <b>${fmtInt(count(() => true))}</b></button>
          </div>
          ${host !== 'all' ? `<button type="button" class="wr-btn small" data-host="all">${esc(host)} ✕</button>` : ''}
          <input class="wr-input wr-search" type="search" placeholder="Szukaj w tytułach" value="${esc(query)}" data-search aria-label="Szukaj w tytułach" />
        </div>
        <p class="wr-note">${view === 'new'
          ? `Adresy, które pojawiły się w sitemapach w ostatnich ${NEW_DAYS} dniach. Pierwszy odczyt konkurenta to punkt odniesienia – jego wpisy nie liczą się jako nowe.`
          : view === 'gap'
            ? 'Wpisy konkurencji, dla których nie mamy żadnego bliskiego tematu (podobieństwo tytułu do naszych wpisów poniżej 60%).'
            : 'Wszystkie wpisy z sitemap z oceną, czy mamy odpowiednik.'}</p>
        ${rows.length ? `<div class="wr-table-wrap"><table class="wr-table wr-comp">
          <thead><tr><th>Temat u konkurencji</th><th>Konkurent</th><th>Pojawił się</th><th>Czy mamy</th><th>Nasz najbliższy wpis</th><th></th></tr></thead>
          <tbody>${rows.slice(0, shown).map((item) => {
            const rec = item.action ? REC[item.action] : null;
            return `<tr>
              <td class="t"><a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">${esc(item.title)}</a>
                ${item.title_from === 'slug' ? '<small>tytuł z adresu</small>' : ''}</td>
              <td>${esc(item.host)}</td>
              <td class="d">${item.baseline ? '<span class="muted">przed śledzeniem</span>' : esc(item.first_seen ?? '–')}</td>
              <td>${rec ? `<span class="wr-status ${rec.tone}">${rec.label}</span>` : '<span class="muted">czeka na porównanie</span>'}</td>
              <td>${item.target ? `<a href="${item.target.catalog_id ? `/${domain}/content-watcher/edytor/?id=${encodeURIComponent(item.target.catalog_id)}` : esc(item.target.url)}">${esc(item.target.title)}</a> <small>${pct(item.score)} podobieństwa</small>` : '<span class="muted">–</span>'}</td>
              <td class="num">${item.action !== 'refresh' ? `<button class="wr-btn small" type="button" data-pick="${esc(item.title)}">Napisz</button>` : ''}</td>
            </tr>`;
          }).join('')}</tbody>
        </table></div>
        ${rows.length > shown ? `<div class="wr-actions"><button class="wr-btn small" type="button" data-more>Pokaż kolejne ${Math.min(PAGE, rows.length - shown)} z ${fmtInt(rows.length - shown)}</button></div>` : ''}`
        : `<p class="wr-empty">${view === 'new' ? `Od początku śledzenia (${esc(data.generated_at ? fmtDateTime(data.generated_at) : '–')}) konkurenci nie dodali nowych wpisów.` : 'Nic w tym widoku.'}</p>`}
      </div>`;
    bind();
  }

  function bind() {
    root.querySelectorAll<HTMLElement>('[data-view]').forEach((button) => button.addEventListener('click', () => {
      view = button.dataset.view as View;
      shown = PAGE;
      render();
    }));
    root.querySelectorAll<HTMLElement>('[data-host]').forEach((button) => button.addEventListener('click', () => {
      host = button.dataset.host === host ? 'all' : button.dataset.host!;
      shown = PAGE;
      render();
    }));
    root.querySelector<HTMLElement>('[data-more]')?.addEventListener('click', () => { shown += PAGE; render(); });
    root.querySelectorAll<HTMLElement>('[data-pick]').forEach((button) => button.addEventListener('click', () => pick(button.dataset.pick!)));
    root.querySelector<HTMLElement>('[data-sync]')?.addEventListener('click', sync);
    const search = root.querySelector<HTMLInputElement>('[data-search]');
    search?.addEventListener('input', () => {
      query = search.value;
      shown = PAGE;
      const position = search.selectionStart;
      render();
      const next = root.querySelector<HTMLInputElement>('[data-search]')!;
      next.focus();
      next.setSelectionRange(position, position);
    });
  }

  async function sync() {
    if (syncing) return;
    syncing = true;
    render();
    const message = () => root.querySelector<HTMLElement>('[data-sync-msg]');
    try {
      let failures = 0;
      for (let round = 0; round < 80; round++) {
        let result: Any;
        try {
          result = (await api<Any>(`/api/cw/writer/competitors/${domain}/sync`, { method: 'POST', body: {} })).data;
          failures = 0;
        } catch (error) {
          // Pojedyncza porcja potrafi przekroczyć limit CPU Workera – ponawiamy.
          if (++failures > 3) throw error;
          await new Promise((resolve) => setTimeout(resolve, 3000));
          continue;
        }
        const box = message();
        if (box) box.textContent = `porównano ${fmtInt(result.total - result.remaining)} z ${fmtInt(result.total)}`;
        if (!result.remaining) break;
      }
      syncing = false;
      await load();
    } catch (error) {
      syncing = false;
      render();
      const box = message();
      if (box) { box.className = 'wr-msg err'; box.textContent = (error as Error).message; }
    }
  }

  async function load() {
    try {
      data = (await api<Any>(`/api/cw/writer/competitors/${domain}`)).data;
      if (!(data!.items ?? []).length) {
        root.innerHTML = '<p class="wr-empty">Brak danych – collector jeszcze nie pobrał sitemap konkurencji (źródło competitors w domains.yaml).</p>';
        return;
      }
      // Bez nowych wpisów od startu śledzenia – od razu mapa tematów.
      if (view === 'new' && !(data!.items as Any[]).some(isNew)) view = 'gap';
      render();
    } catch (error) {
      root.innerHTML = `<p class="wr-msg err">${esc((error as Error).message)}</p>`;
    }
  }

  load();
}
