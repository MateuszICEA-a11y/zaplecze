import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import rehypeExternalLinks from 'rehype-external-links';

export default defineConfig({
  site: 'https://widocznosc.ai',
  trailingSlash: 'always',
  integrations: [sitemap()],
  markdown: {
    // Dual-theme Shiki – kod dostaje zmienne --shiki-light / --shiki-dark,
    // a wybór motywu robi nasz selektor [data-theme] w CSS (Article.astro).
    // Bez tego Shiki wkleja sztywny github-dark inline i kod jest nieczytelny
    // w przeciwnym motywie.
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: false,
    },
    rehypePlugins: [
      [
        rehypeExternalLinks,
        {
          target: '_blank',
          rel: ['noopener', 'noreferrer'],
          // Otwieraj w nowym oknie tylko linki zewnętrzne (absolutne http/https
          // spoza widocznosc.ai). Linki względne i do własnej domeny – bez zmian.
          test: (element) => {
            const href = element.properties && element.properties.href;
            if (typeof href !== 'string') return false;
            if (!/^https?:\/\//i.test(href)) return false;
            return !/(^|\.)widocznosc\.ai(\/|$|:)/i.test(href);
          },
        },
      ],
    ],
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
