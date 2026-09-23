/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

/** Fallback origin, used for local builds and tests. */
const DEFAULT_SITE_URL = 'https://imageutility.app';

/**
 * Resolves the origin that canonical URLs and the sitemap are built from.
 *
 * Canonicals must be stable across deploys, so VERCEL_URL is deliberately NOT
 * used: it is unique per deployment (and changes on every push), so pointing
 * canonicals at it would tell Google that a throwaway preview build is the
 * authoritative copy of the site. VERCEL_PROJECT_PRODUCTION_URL is the fixed
 * production domain, which is what a canonical is supposed to name.
 */
function resolveSiteUrl(): string {
  const explicit = process.env.SITE_URL ?? process.env.VITE_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, '');

  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (production) return `https://${production.replace(/\/+$/, '')}`;

  return DEFAULT_SITE_URL;
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    // Inlined at build time so the client bundle and the prerender step can
    // never disagree about which origin the site is served from.
    'import.meta.env.VITE_SITE_URL': JSON.stringify(resolveSiteUrl()),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
});
