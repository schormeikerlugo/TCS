// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://tcsyeg.com',

  // Site stays static; only the API endpoint runs on-demand (prerender = false).
  output: 'static',
  adapter: vercel(),

  vite: {
    plugins: [tailwindcss()],
    css: {
      transformer: 'postcss',
    },
  },

  integrations: [sitemap()],
});
