/**
 * Pure helpers for the prerender step.
 *
 * These are kept free of file I/O so they can be unit tested. scripts/prerender.mjs
 * does nothing but read, call these, and write.
 */

import {
  OG_IMAGE_HEIGHT,
  OG_IMAGE_URL,
  OG_IMAGE_WIDTH,
  type PageMeta,
} from '@/tools/seo';
import { HOME_KEY, lastmodFor } from './lastmod';
import { SITE_NAME } from './structuredData';

/** Escapes text destined for an HTML attribute value. */
export function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Escapes text destined for element content. */
export function escapeText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function metaTags(meta: PageMeta): string {
  const title = escapeText(meta.title);
  const description = escapeAttribute(meta.description);
  const canonical = escapeAttribute(meta.canonical);

  const tags = [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}" />`,
    `<link rel="canonical" href="${canonical}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${escapeAttribute(SITE_NAME)}" />`,
    `<meta property="og:title" content="${escapeAttribute(meta.title)}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta property="og:image" content="${escapeAttribute(OG_IMAGE_URL)}" />`,
    `<meta property="og:image:width" content="${OG_IMAGE_WIDTH}" />`,
    `<meta property="og:image:height" content="${OG_IMAGE_HEIGHT}" />`,
    // summary_large_image is the card that actually shows the picture; plain
    // "summary" renders a thumbnail most people never notice.
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:image" content="${escapeAttribute(OG_IMAGE_URL)}" />`,
  ];

  if (meta.structuredData) {
    // Already escaped at the source: structuredData.ts replaces "<" so no value
    // can close this script element.
    tags.push(
      `<script type="application/ld+json">${meta.structuredData}</script>`,
    );
  }

  return tags.join('\n    ');
}

/** Removes the template's placeholder title, description and canonical. */
function withoutPlaceholderMetadata(template: string): string {
  return template
    .replace(/[ \t]*<title>[\s\S]*?<\/title>\r?\n?/i, '')
    .replace(/[ \t]*<meta\s+name="description"[\s\S]*?\/?>\r?\n?/i, '')
    .replace(/[ \t]*<link\s+rel="canonical"[\s\S]*?\/?>\r?\n?/i, '');
}

/** Inserts server-rendered markup into the mount point React will hydrate. */
function withAppHtml(template: string, appHtml: string): string {
  const body = stripHoistedMetadata(appHtml);
  return template.replace(
    /(<div id="root">)(<\/div>)/,
    (_all, open: string, close: string) => `${open}${body}${close}`,
  );
}

/**
 * Copy for the 404 page. Not part of allPageMeta(): it has no canonical URL
 * of its own because it is served at every URL that does not exist.
 */
export const NOT_FOUND_META = {
  title: 'Page not found — Image Tools',
  description: 'That page does not exist. Browse the image tools instead.',
};

/**
 * Removes document metadata from server-rendered app markup.
 *
 * renderToString does not hoist <title>/<meta>/<link> into <head> the way the
 * browser runtime does -- it emits them inline where they were rendered, which
 * would leave a second title and description sitting inside <div id="root">.
 * The prerender step writes the authoritative tags into <head> itself, so the
 * inline copies are dropped. React re-hoists them on hydration and matches the
 * ones already in <head>.
 */
export function stripHoistedMetadata(appHtml: string): string {
  return appHtml
    .replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, '')
    .replace(/<meta\b[^>]*\/?>/gi, '')
    .replace(/<link\b[^>]*\/?>/gi, '');
}

/**
 * Bakes a page's metadata and server-rendered markup into the built template.
 *
 * The placeholder title and description that Vite emits are replaced rather
 * than appended, so a crawler never sees two of either.
 */
export function renderPageHtml(
  template: string,
  meta: PageMeta,
  appHtml: string,
): string {
  const withMeta = withoutPlaceholderMetadata(template).replace(
    '</head>',
    `  ${metaTags(meta)}\n  </head>`,
  );

  return withAppHtml(withMeta, appHtml);
}

/**
 * Builds dist/404.html, which Vercel serves -- with a genuine 404 status --
 * for any path that is not a real file.
 *
 * This replaces the Netlify `_redirects` rule, and the status is the whole
 * point. A catch-all rewrite to index.html would answer 200, telling crawlers
 * that every mistyped URL is a real page (a soft 404) and inviting an
 * unbounded set of junk URLs into the index. There is deliberately no
 * canonical tag: the page stands for no single URL.
 */
export function renderNotFoundHtml(template: string, appHtml: string): string {
  const tags = [
    `<title>${escapeText(NOT_FOUND_META.title)}</title>`,
    `<meta name="description" content="${escapeAttribute(NOT_FOUND_META.description)}" />`,
    `<meta name="robots" content="noindex" />`,
  ].join('\n    ');

  const withMeta = withoutPlaceholderMetadata(template).replace(
    '</head>',
    `  ${tags}\n  </head>`,
  );

  return withAppHtml(withMeta, appHtml);
}

/** The file path a route should be written to, so static hosts serve it directly. */
export function outputPathFor(path: string): string {
  const slug = path.replace(/^\/+/, '').replace(/\/+$/, '');
  return slug === '' ? 'index.html' : `${slug}/index.html`;
}

/**
 * Derives a manifest key from a canonical URL, so the sitemap and the lastmod
 * manifest cannot disagree about what a page is called.
 */
function slugFromCanonical(canonical: string): string {
  const path = new URL(canonical).pathname;
  const slug = path.replace(/^\/+/, '').replace(/\/+$/, '');
  return slug === '' ? HOME_KEY : slug;
}

export function buildSitemap(pages: PageMeta[]): string {
  const urls = pages
    .map((page) => {
      const lastmod = lastmodFor(slugFromCanonical(page.canonical));
      // A page with no recorded date omits the element rather than inventing
      // one -- a wrong date is worse than no date.
      const dateLine = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : '';
      return `  <url>\n    <loc>${escapeText(page.canonical)}</loc>${dateLine}\n  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

export function buildRobots(sitemapUrl: string): string {
  return `User-agent: *
Allow: /

Sitemap: ${sitemapUrl}
`;
}
