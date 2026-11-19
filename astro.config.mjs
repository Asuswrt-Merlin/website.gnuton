// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Deployment URL and sub-path are injected by the GitHub Pages workflow.
// Local development falls back to the production origin and a root base path.
const site = process.env.SITE_URL ?? 'https://asuswrt-merlin.github.io';
const base = process.env.BASE_PATH || undefined;

// https://astro.build/config
export default defineConfig({
  site,
  ...(base ? { base } : {}),
  integrations: [sitemap()],
  vite: {
    css: {
      preprocessorOptions: {
        // Bulma 1.0.4 still uses the legacy Sass if() function; silence the
        // dependency warning without hiding warnings from our own styles.
        scss: {
          silenceDeprecations: ['if-function'],
        },
      },
    },
  },
});
