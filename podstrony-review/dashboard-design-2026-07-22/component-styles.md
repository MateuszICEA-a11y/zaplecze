# Style komponentów (bloki <style> ze źródeł .astro)

Źródło prawdy dla stylów scoped – uzupełnia theme.css (globalny).


## src/components/DomainCard.astro

```css
.domain-card {
    display: block;
    background: var(--bg-surface-1);
    border: 1px solid var(--hairline);
    border-radius: 16px;
    padding: 22px 24px;
    color: var(--ink);
    box-shadow: var(--shadow-card);
    transition: border-color 0.15s ease, transform 0.15s ease;
  }
  .domain-card:hover {
    border-color: var(--accent-blue);
    text-decoration: none;
    transform: translateY(-2px);
  }
  h2 {
    margin: 0 0 14px;
    font-size: 1.22rem;
    letter-spacing: -0.01em;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .globe {
    width: 20px;
    height: 20px;
    flex: none;
    border-radius: 5px;
    object-fit: contain;
  }
  .mini-stats {
    display: flex;
    gap: 28px;
    flex-wrap: wrap;
    margin-bottom: 14px;
  }
  .mini-label {
    display: block;
    color: var(--ink-faint);
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .mini-value {
    font-size: 1.15rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
  .badges {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .section-links {
    display: flex;
    gap: 14px;
    flex-wrap: wrap;
    margin-top: 16px;
    padding-top: 14px;
    border-top: 1px solid var(--hairline-soft);
    font-size: 0.85rem;
  }
  .section-links a {
    color: var(--ink-muted);
  }
  .section-links a:hover {
    color: var(--accent-blue);
  }
  .section-links a.primary {
    color: var(--accent-blue);
    font-weight: 600;
  }
```


## src/components/DomainHeader.astro

```css
.page-header {
    margin-bottom: 6px;
  }
  .eyebrow {
    color: var(--accent-blue);
    font-size: 0.78rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 6px;
  }
  .title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
  }
  h1 {
    font-size: clamp(1.5rem, 2.6vw, 2rem);
    font-weight: 600;
    letter-spacing: -0.02em;
    margin: 0;
  }
  .measured {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: var(--ink-muted);
    font-size: 0.8rem;
    font-variant-numeric: tabular-nums;
    background: var(--bg-surface-1);
    border: 1px solid var(--hairline);
    border-radius: 999px;
    padding: 5px 13px;
  }
  .measured i {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--status-ok);
    box-shadow: 0 0 6px color-mix(in srgb, var(--status-ok) 60%, transparent);
  }
```


## src/components/SourceStatus.astro

```css
.source-badge {
    display: inline-block;
    font-size: 0.75rem;
    padding: 3px 10px;
    border-radius: 999px;
    border: 1px solid var(--hairline);
    color: var(--ink-muted);
    background: var(--bg-surface-2);
  }
  .source-badge.ok {
    color: var(--status-ok);
    border-color: transparent;
    background: color-mix(in srgb, var(--status-ok) 12%, transparent);
  }
  .source-badge.warn {
    color: var(--status-warn-fg);
    border-color: transparent;
    background: var(--status-warn-bg);
  }
  .source-badge.err {
    color: var(--status-err-fg);
    border-color: transparent;
    background: var(--status-err-bg);
  }
  .source-badge.off {
    color: var(--ink-faint);
  }
```


## src/components/StatCard.astro

```css
a.stat-card {
    display: block;
    color: inherit;
    text-decoration: none;
    cursor: pointer;
  }
  a.stat-card:hover {
    text-decoration: none;
    transform: translateY(-1px);
  }
  .stat-card {
    position: relative;
    background: linear-gradient(180deg, color-mix(in srgb, var(--ink) 3%, var(--bg-surface-1)), var(--bg-surface-1) 55%);
    border: 1px solid var(--hairline);
    border-radius: 14px;
    padding: 16px 18px;
    min-width: 0;
    overflow: hidden;
    transition: border-color 0.15s ease, transform 0.15s ease;
  }
  .stat-card:hover {
    border-color: color-mix(in srgb, var(--accent-blue) 35%, var(--hairline));
  }
  .stat-card.hero::before {
    content: '';
    position: absolute;
    inset: 0 auto auto 0;
    width: 100%;
    height: 2px;
    background: linear-gradient(90deg, var(--accent-blue), transparent 70%);
  }
  .stat-label {
    color: var(--ink-muted);
    font-size: 0.74rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    margin-bottom: 8px;
  }
  .stat-row {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 12px;
  }
  .stat-value {
    font-family: var(--font-display);
    font-size: 1.8rem;
    font-weight: 600;
    letter-spacing: -0.02em;
    line-height: 1.02;
  }
  .hero .stat-value {
    font-size: 2.7rem;
  }
  .spark {
    width: 96px;
    height: 30px;
    color: var(--accent-blue);
    opacity: 0.9;
    flex: none;
  }
  .stat-delta {
    margin-top: 6px;
    font-size: 0.8rem;
    color: var(--ink-faint);
    font-variant-numeric: tabular-nums;
  }
  .stat-delta.good {
    color: var(--status-ok);
  }
  .stat-delta.bad {
    color: var(--status-err-fg);
  }
```


## src/components/TimeSeriesChart.astro

```css
.chart-card {
    background: linear-gradient(180deg, color-mix(in srgb, var(--ink) 3%, var(--bg-surface-1)), var(--bg-surface-1) 55%);
    border: 1px solid var(--hairline);
    border-radius: 14px;
    padding: 16px 18px 10px;
    margin: 0;
    min-width: 0;
    transition: border-color 0.15s ease;
  }
  .chart-card:hover {
    border-color: color-mix(in srgb, var(--accent-blue) 30%, var(--hairline));
  }
  figcaption {
    color: var(--ink);
    font-family: var(--font-display);
    font-weight: 600;
    font-size: 0.95rem;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }
  .cap-meta {
    color: var(--ink-faint);
    font-size: 0.76rem;
    font-weight: 500;
    font-family: var(--font-body);
  }
  .cap-side {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    justify-content: flex-end;
    font-family: var(--font-body);
    font-weight: 500;
  }
  .cap-side :global(.seg-mini) {
    padding: 2px;
  }
  .cap-side :global(.seg-mini button) {
    font-size: 0.74rem;
    padding: 4px 9px;
  }
  .chart-empty {
    color: var(--ink-faint);
    font-size: 0.88rem;
    padding: 32px 0 40px;
    text-align: center;
  }
  /* Legenda uPlot w tokenach – zawsze widoczna, wartości przy hoverze */
  .chart-card :global(.u-legend) {
    font: 12px Inter, system-ui, sans-serif;
    color: var(--ink-muted);
    text-align: left;
    padding-top: 6px;
  }
  .chart-card :global(.u-legend .u-value) {
    font-variant-numeric: tabular-nums;
    color: var(--ink);
  }
  .chart-card :global(.u-legend .u-marker) {
    width: 12px;
    height: 12px;
    border-radius: 3px;
  }
  .chart-card :global(.u-select) {
    background: var(--accent-blue-soft);
  }
```


## src/layouts/Layout.astro

```css
.shell {
        display: grid;
        grid-template-columns: 244px minmax(0, 1fr);
        min-height: 100vh;
        transition: grid-template-columns 0.18s ease;
      }
      :global(html.collapsed) .shell {
        grid-template-columns: 68px minmax(0, 1fr);
      }
      .sidebar {
        position: sticky;
        top: 0;
        height: 100vh;
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 18px 14px;
        background: var(--bg-rail);
        border-right: 1px solid var(--hairline);
        overflow: hidden;
      }
      .side-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 4px 4px 14px;
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 10px;
        font-family: var(--font-display);
        font-weight: 600;
        color: var(--ink);
        min-width: 0;
      }
      .brand:hover {
        text-decoration: none;
      }
      .brand-mark {
        /* Wysokość = logo (24px) + odstęp (2px) + podtytuł – symetria z kolumną tekstu. */
        width: 38px;
        height: 38px;
        border-radius: 9px;
        box-shadow: 0 0 18px var(--accent-blue-soft);
        flex: none;
      }
      .brand-text {
        display: flex;
        flex-direction: column;
        line-height: 1.12;
        min-width: 0;
        white-space: nowrap;
      }
      .brand-logo {
        width: 112px;
        height: 24px;
        object-fit: contain;
        object-position: left;
        display: block;
      }
      /* Wordmark jest biały – w jasnym motywie odwracamy do czerni. */
      :global(html[data-theme='light']) .brand-logo {
        filter: invert(1);
      }
      .brand-sub {
        margin-top: 2px;
        font-size: 0.68rem;
        font-weight: 500;
        color: var(--ink-faint);
        text-transform: uppercase;
        letter-spacing: 0.1em;
      }
      .collapse-btn {
        flex: none;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: none;
        border: 1px solid var(--hairline);
        border-radius: 8px;
        color: var(--ink-muted);
        cursor: pointer;
        padding: 0;
      }
      .collapse-btn:hover {
        color: var(--ink);
        border-color: var(--ink-faint);
      }
      .collapse-btn svg {
        width: 15px;
        height: 15px;
        transition: transform 0.18s ease;
      }
      :global(html.collapsed) .collapse-btn svg {
        transform: rotate(180deg);
      }
      :global(html.collapsed) .brand-text,
      :global(html.collapsed) .nav-text,
      :global(html.collapsed) .nav-label,
      :global(html.collapsed) .back-link,
      :global(html.collapsed) #theme-toggle span,
      :global(html.collapsed) .side-meta,
      :global(html.collapsed) .nav-item .dot {
        display: none;
      }
      :global(html.collapsed) .side-top {
        flex-direction: column;
        justify-content: center;
      }
      :global(html.collapsed) .nav-item {
        justify-content: center;
        padding: 9px 0;
      }
      :global(html.collapsed) .side-footer {
        justify-content: center;
      }
      :global(html.collapsed) #theme-toggle {
        padding: 7px;
      }
      .side-nav {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }
      .back-link {
        color: var(--ink-faint);
        font-size: 0.78rem;
        padding: 2px 10px 10px;
      }
      .nav-label {
        color: var(--ink-faint);
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.09em;
        padding: 4px 10px 8px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .nav-item {
        display: flex;
        align-items: center;
        gap: 10px;
        color: var(--ink-muted);
        font-size: 0.9rem;
        font-weight: 500;
        padding: 8px 10px;
        border-radius: 9px;
        border: 1px solid transparent;
        white-space: nowrap;
      }
      .nav-item:hover {
        color: var(--ink);
        background: var(--bg-surface-2);
        text-decoration: none;
      }
      .nav-item.active {
        color: var(--ink);
        background: var(--bg-surface-2);
        border-color: var(--hairline);
        font-weight: 600;
        box-shadow: inset 2px 0 0 var(--accent-blue);
      }
      .nav-icon {
        width: 17px;
        height: 17px;
        flex: none;
        opacity: 0.85;
      }
      .nav-favicon {
        border-radius: 4px;
        object-fit: contain;
      }
      .nav-item.active .nav-icon {
        color: var(--accent-blue);
        opacity: 1;
      }
      .nav-text {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: var(--ink-faint);
        flex: none;
      }
      .dot.ok {
        background: var(--status-ok);
        box-shadow: 0 0 6px color-mix(in srgb, var(--status-ok) 60%, transparent);
      }
      .dot.warn {
        background: var(--status-warn-fg);
      }
      .dot.err {
        background: var(--status-err-fg);
      }
      .dot.off {
        background: transparent;
        outline: 1px solid var(--hairline);
      }
      .side-footer {
        margin-top: auto;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 10px 6px 0;
        border-top: 1px solid var(--hairline-soft);
      }
      #theme-toggle {
        display: flex;
        align-items: center;
        gap: 7px;
        background: none;
        border: 1px solid var(--hairline);
        border-radius: 8px;
        color: var(--ink-muted);
        font: inherit;
        font-size: 0.8rem;
        padding: 6px 10px;
        cursor: pointer;
      }
      #theme-toggle:hover {
        color: var(--ink);
        border-color: var(--ink-faint);
      }
      #theme-toggle svg {
        width: 14px;
        height: 14px;
      }
      .side-meta {
        color: var(--ink-faint);
        font-size: 0.72rem;
      }
      .content {
        min-width: 0;
        display: flex;
        flex-direction: column;
      }
      main {
        flex: 1;
        width: 100%;
        /* Pełna szerokość – siatki auto-fit wypełniają duże monitory. */
        max-width: none;
        padding: 30px clamp(18px, 3.5vw, 44px) 64px;
      }
      .site-footer {
        border-top: 1px solid var(--hairline);
        color: var(--ink-faint);
        font-size: 0.82rem;
        padding: 18px clamp(18px, 3.5vw, 44px);
      }

      /* Mobile: sidebar staje się górnym pasem, nav przewijalny poziomo. */
      @media (max-width: 900px) {
        .shell,
        :global(html.collapsed) .shell {
          grid-template-columns: 1fr;
        }
        .collapse-btn {
          display: none;
        }
        :global(html.collapsed) .brand-text,
        :global(html.collapsed) .nav-text,
        :global(html.collapsed) .side-footer #theme-toggle {
          display: revert;
        }
        :global(html.collapsed) .nav-item {
          justify-content: flex-start;
          padding: 7px 10px;
        }
        .side-top {
          padding: 0 4px 0 0;
        }
        .sidebar {
          position: static;
          height: auto;
          flex-direction: row;
          align-items: center;
          flex-wrap: wrap;
          gap: 4px 10px;
          padding: 12px 14px;
          border-right: none;
          border-bottom: 1px solid var(--hairline);
        }
        .brand {
          padding: 0 4px;
        }
        .side-nav {
          flex-direction: row;
          align-items: center;
          gap: 2px;
          overflow-x: auto;
          scrollbar-width: none;
          width: 100%;
          order: 3;
        }
        .side-nav::-webkit-scrollbar {
          display: none;
        }
        .back-link,
        .nav-label {
          display: none;
        }
        .nav-item {
          padding: 7px 10px;
        }
        .nav-item.active {
          box-shadow: inset 0 -2px 0 var(--accent-blue);
        }
        .side-footer {
          margin-top: 0;
          margin-left: auto;
          border-top: none;
          padding: 0;
        }
        .side-meta {
          display: none;
        }
        #theme-toggle span {
          display: none;
        }
        main {
          padding-top: 20px;
        }
      }
```


## src/pages/[domain]/clarity.astro

```css
.friction-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 18px;
  }
  .friction-label {
    color: var(--ink-faint);
    font-size: 0.8rem;
  }
```


## src/pages/[domain]/leady.astro

```css
.sub {
    display: block;
    color: var(--ink-faint);
    font-size: 0.78rem;
    margin-top: 2px;
  }
  .sub.msg {
    max-width: 420px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  td .chip + .chip {
    margin-left: 4px;
  }
```


## src/pages/index.astro

```css
h1 {
    font-size: 1.35rem;
    letter-spacing: -0.01em;
    margin: 28px 0 16px;
  }
  .domain-grid {
    display: grid;
    gap: 16px;
  }
  .badges {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 16px;
  }
  .stat-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 14px;
    margin-bottom: 18px;
  }
  .chart-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 16px;
  }
```
