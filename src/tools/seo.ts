/**
 * Page metadata: the title, description and canonical URL served for a URL.
 *
 * Product rule for SEO pages: a page exists only if it answers one search
 * intent with a pre-configured tool. That rule is enforced structurally --
 * `Tool.seo` is required, and the tests in seo.test.ts reject duplicate or
 * oversized copy. If you cannot write a distinct title for a slug, the slug
 * does not deserve to be a page.
 */

import { TOOLS, type Tool } from './registry';

/**
 * The production origin, used to build canonical URLs and the sitemap.
 * Single place to change when the domain is decided.
 */
export const SITE_URL = 'https://imageutility.app';

/** Google truncates around here; staying under keeps the full title visible. */
export const MAX_TITLE_LENGTH = 60;
/** Description limits, chosen so snippets are neither cut off nor thin. */
export const MAX_DESCRIPTION_LENGTH = 160;
export const MIN_DESCRIPTION_LENGTH = 110;

export interface PageMeta {
  title: string;
  description: string;
  canonical: string;
}

/** Builds an absolute canonical URL from a route path or bare slug. */
export function canonicalUrl(path: string): string {
  if (path === '' || path === '/') return `${SITE_URL}/`;
  const trimmed = path.replace(/^\/+/, '').replace(/\/+$/, '');
  return `${SITE_URL}/${trimmed}`;
}

export function toolMeta(tool: Tool): PageMeta {
  return {
    title: tool.seo.title,
    description: tool.seo.description,
    canonical: canonicalUrl(tool.slug),
  };
}

export const HOME_META: PageMeta = {
  title: 'Free Online Image Tools — Compress, Resize, Convert',
  description:
    'Compress, resize, convert, crop and edit images in seconds. Every tool runs in your browser, so your files never leave your device. Free, no signup.',
  canonical: canonicalUrl('/'),
};

/** Every page the site serves, for prerendering and the sitemap. */
export function allPageMeta(): PageMeta[] {
  return [HOME_META, ...TOOLS.map(toolMeta)];
}
