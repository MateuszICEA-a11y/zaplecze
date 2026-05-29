import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import rehypeExternalLinks from 'rehype-external-links';

export default defineConfig({
  site: 'https://widocznosc.ai',
  trailingSlash: 'always',
  integrations: [sitemap()],
  markdown: {
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
