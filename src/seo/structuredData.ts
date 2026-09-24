/**
 * schema.org graphs for the prerendered pages.
 *
 * These exist to change how a page appears in Google, not merely to be present.
 * A tool page declaring itself a free WebApplication is eligible for a rich
 * result showing the price and category; a BreadcrumbList replaces the raw URL
 * in the result with a readable trail. Both are read literally by Google, so
 * every URL here is absolute and every @type is one Google actually supports.
 *
 * The graphs are emitted by the prerender into static HTML. A crawler that runs
 * no JavaScript still sees them, which is the whole point -- these pages are
 * built to be found.
 */

import { TOOLS, type Tool } from '@/tools/registry';
import {
  HOME_META,
  SITE_URL,
  canonicalUrl,
  toolMeta,
  type PageMeta,
} from '@/tools/seo';

/** The brand name, used for both the WebSite and the publishing Organization. */
export const SITE_NAME = 'Free Online Image Tools';

const HOME_URL = `${SITE_URL}/`;

/**
 * Serialises a graph for embedding in a <script> block.
 *
 * `<` is escaped so a value can never close the surrounding script element.
 * JSON.stringify alone does not do this, and a tool title containing "</script"
 * would otherwise end the block early and inject markup into the page.
 */
function serialize(graph: unknown[]): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': graph,
  }).replace(/</g, '\\u003c');
}

/**
 * The graph for a single tool page.
 *
 * `operatingSystem` names the browser rather than a platform: these tools run
 * anywhere with a modern browser, and claiming an OS would be inaccurate.
 */
export function toolStructuredData(tool: Tool): string {
  const url = toolMeta(tool).canonical;

  return serialize([
    {
      '@type': 'WebApplication',
      '@id': `${url}#app`,
      name: tool.title,
      url,
      description: tool.seo.description,
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'Any modern web browser',
      browserRequirements: 'Requires JavaScript',
      isAccessibleForFree: true,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      publisher: { '@id': `${HOME_URL}#organization` },
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${url}#breadcrumbs`,
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: HOME_URL,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: tool.title,
          item: url,
        },
      ],
    },
  ]);
}

/**
 * The graph for the homepage.
 *
 * The SearchAction advertises the on-site search. Google may use it to show a
 * sitelinks searchbox under the brand result -- it points at the homepage with
 * a `q` parameter, which the site's own search field reads.
 */
export function homeStructuredData(): string {
  return serialize([
    {
      '@type': 'Organization',
      '@id': `${HOME_URL}#organization`,
      name: SITE_NAME,
      url: HOME_URL,
    },
    {
      '@type': 'WebSite',
      '@id': `${HOME_URL}#website`,
      name: SITE_NAME,
      url: HOME_URL,
      publisher: { '@id': `${HOME_URL}#organization` },
      potentialAction: {
        '@type': 'SearchAction',
        target: `${canonicalUrl('/')}?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
  ]);
}

/**
 * Every page the prerender writes, each carrying its own graph.
 *
 * This lives here rather than in tools/seo.ts to keep the dependency pointing
 * one way: this module imports the metadata, not the reverse. Putting it in
 * seo.ts would create an import cycle between the two.
 */
export function pageMetaWithStructuredData(): PageMeta[] {
  return [
    { ...HOME_META, structuredData: homeStructuredData() },
    ...TOOLS.map((tool) => ({
      ...toolMeta(tool),
      structuredData: toolStructuredData(tool),
    })),
  ];
}
