import { describe, expect, it } from 'vitest';
import {
  NOT_FOUND_META,
  buildRobots,
  buildSitemap,
  escapeAttribute,
  outputPathFor,
  renderNotFoundHtml,
  renderPageHtml,
  stripHoistedMetadata,
} from './html';
import { SITE_URL, allPageMeta, canonicalUrl, type PageMeta } from '@/tools/seo';
import { TOOLS } from '@/tools/registry';

const TEMPLATE = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Image tools that just work.</title>
    <meta name="description" content="Generic placeholder copy." />
    <script type="module" src="/assets/index.js"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
`;

const META: PageMeta = {
  title: 'Compress Image to 100KB Online — Free Tool',
  description: 'Compress any image to under 100KB in one click.',
  canonical: canonicalUrl('compress-image-to-100kb'),
};

describe('renderPageHtml', () => {
  const html = renderPageHtml(TEMPLATE, META, '<h1>Compress your image to 100KB</h1>');

  it('bakes the page title into the served HTML', () => {
    expect(html).toContain('<title>Compress Image to 100KB Online — Free Tool</title>');
  });

  it('replaces the placeholder title instead of adding a second one', () => {
    expect(html).not.toContain('Image tools that just work.');
    expect(html.match(/<title>/g)).toHaveLength(1);
  });

  it('replaces the placeholder description instead of adding a second one', () => {
    expect(html).not.toContain('Generic placeholder copy.');
    expect(html.match(/name="description"/g)).toHaveLength(1);
  });

  it('includes the canonical URL', () => {
    expect(html).toContain(
      `<link rel="canonical" href="${SITE_URL}/compress-image-to-100kb" />`,
    );
  });

  it('puts the rendered markup inside the mount point so crawlers see content', () => {
    // This is the whole point of prerendering: the H1 must be in the served
    // HTML, not produced later by JavaScript.
    expect(html).toContain('<div id="root"><h1>Compress your image to 100KB</h1></div>');
  });

  it('keeps the script tag so the page still hydrates into the live app', () => {
    expect(html).toContain('<script type="module" src="/assets/index.js"></script>');
  });

  it('escapes quotes in metadata so attributes cannot be broken out of', () => {
    const html = renderPageHtml(
      TEMPLATE,
      { ...META, description: 'He said "resize" & left' },
      '',
    );
    expect(html).toContain('content="He said &quot;resize&quot; &amp; left"');
  });
});

describe('stripHoistedMetadata', () => {
  // renderToString does not hoist metadata into <head>; it leaves the tags
  // inline. Shipping them would give every page two titles and two
  // descriptions, which is exactly the duplicate-signal problem prerendering
  // is meant to solve.
  const rendered =
    '<title>Dup</title><meta name="description" content="Dup."/>' +
    '<link rel="canonical" href="https://example.test/x"/>' +
    '<h1>Convert JPG to PNG</h1><p>Real content.</p>';

  it('removes inline title, meta and link tags', () => {
    const stripped = stripHoistedMetadata(rendered);
    expect(stripped).not.toContain('<title>');
    expect(stripped).not.toContain('name="description"');
    expect(stripped).not.toContain('rel="canonical"');
  });

  it('keeps the page content intact', () => {
    expect(stripHoistedMetadata(rendered)).toBe(
      '<h1>Convert JPG to PNG</h1><p>Real content.</p>',
    );
  });

  it('leaves markup without metadata untouched', () => {
    expect(stripHoistedMetadata('<h1>Crop Image</h1>')).toBe('<h1>Crop Image</h1>');
  });
});

describe('renderPageHtml with server-rendered metadata', () => {
  const appHtml =
    '<title>Dup</title><meta name="description" content="Dup."/>' +
    '<h1>Compress your image to 100KB</h1>';
  const html = renderPageHtml(TEMPLATE, META, appHtml);

  it('emits exactly one title and one description for the whole document', () => {
    expect(html.match(/<title>/g)).toHaveLength(1);
    expect(html.match(/name="description"/g)).toHaveLength(1);
  });

  it('emits exactly one canonical link', () => {
    expect(html.match(/rel="canonical"/g)).toHaveLength(1);
  });

  it('still renders the page content', () => {
    expect(html).toContain('<h1>Compress your image to 100KB</h1>');
  });
});

describe('escapeAttribute', () => {
  it('escapes the characters that would terminate an attribute or tag', () => {
    expect(escapeAttribute('a "b" & <c>')).toBe('a &quot;b&quot; &amp; &lt;c&gt;');
  });
});

describe('outputPathFor', () => {
  it('writes the home route to the root index', () => {
    expect(outputPathFor('/')).toBe('index.html');
  });

  it('writes a tool route to its own directory index', () => {
    // Directory-style output means a static host serves /compress-image
    // without any rewrite rules.
    expect(outputPathFor('/compress-image')).toBe('compress-image/index.html');
    expect(outputPathFor('compress-image')).toBe('compress-image/index.html');
  });
});

describe('buildSitemap', () => {
  const sitemap = buildSitemap(allPageMeta());

  it('lists every page exactly once', () => {
    expect(sitemap.match(/<loc>/g)).toHaveLength(TOOLS.length + 1);
  });

  it('lists absolute canonical URLs', () => {
    expect(sitemap).toContain(`<loc>${SITE_URL}/compress-image</loc>`);
    expect(sitemap).toContain(`<loc>${SITE_URL}/</loc>`);
  });

  it('is well-formed XML with the sitemap namespace', () => {
    expect(sitemap.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(sitemap).toContain(
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    );
    expect(sitemap.trimEnd().endsWith('</urlset>')).toBe(true);
  });
});

describe('buildRobots', () => {
  it('allows crawling and points at the sitemap', () => {
    const robots = buildRobots(canonicalUrl('sitemap.xml'));
    expect(robots).toContain('User-agent: *');
    expect(robots).toContain('Allow: /');
    expect(robots).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`);
  });
});

describe('renderNotFoundHtml', () => {
  const html = renderNotFoundHtml(TEMPLATE, '<h1>Tool not found</h1>');

  it('marks the page noindex', () => {
    // Vercel serves 404.html for every unmatched path. Without this, one
    // stored copy could be indexed and shown for any number of bad URLs.
    expect(html).toContain('<meta name="robots" content="noindex" />');
  });

  it('carries no canonical URL', () => {
    // A canonical here would nominate some real page as the duplicate target
    // for every mistyped URL on the site.
    expect(html).not.toContain('rel="canonical"');
  });

  it('replaces the placeholder title rather than adding a second one', () => {
    expect(html).not.toContain('Image tools that just work.');
    expect(html.match(/<title>/g)).toHaveLength(1);
  });

  it('keeps exactly one description', () => {
    expect(html.match(/name="description"/g)).toHaveLength(1);
  });

  it('puts the rendered markup inside the mount point', () => {
    expect(html).toContain('<div id="root"><h1>Tool not found</h1></div>');
  });

  it('is excluded from the sitemap', () => {
    // It is reachable at any URL, so it belongs to no single URL.
    const sitemap = buildSitemap(allPageMeta());
    expect(sitemap).not.toContain(NOT_FOUND_META.title);
    expect(allPageMeta().map((meta) => meta.title)).not.toContain(
      NOT_FOUND_META.title,
    );
  });
});
