/**
 * Pure helpers for the prerender step.
 *
 * These are kept free of file I/O so they can be unit tested. scripts/prerender.mjs
 * does nothing but read, call these, and write.
 */

import type { PageMeta } from '@/tools/seo';

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

  return [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}" />`,
    `<link rel="canonical" href="${canonical}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${escapeAttribute(meta.title)}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta name="twitter:card" content="summary" />`,
  ].join('\n    ');
}

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
  const withoutPlaceholders = template
    .replace(/[ \t]*<title>[\s\S]*?<\/title>\r?\n?/i, '')
    .replace(/[ \t]*<meta\s+name="description"[\s\S]*?\/?>\r?\n?/i, '')
    .replace(/[ \t]*<link\s+rel="canonical"[\s\S]*?\/?>\r?\n?/i, '');

  const withMeta = withoutPlaceholders.replace(
    '</head>',
    `  ${metaTags(meta)}\n  </head>`,
  );

  // The mount point must keep its id and receive the markup React will hydrate.
  const body = stripHoistedMetadata(appHtml);
  return withMeta.replace(
    /(<div id="root">)(<\/div>)/,
    (_all, open: string, close: string) => `${open}${body}${close}`,
  );
}

/** The file path a route should be written to, so static hosts serve it directly. */
export function outputPathFor(path: string): string {
  const slug = path.replace(/^\/+/, '').replace(/\/+$/, '');
  return slug === '' ? 'index.html' : `${slug}/index.html`;
}

export function buildSitemap(pages: PageMeta[]): string {
  const urls = pages
    .map((page) => `  <url>\n    <loc>${escapeText(page.canonical)}</loc>\n  </url>`)
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
