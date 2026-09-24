import { describe, expect, test } from 'vitest';

import { TOOLS, getTool } from '@/tools/registry';
import { HOME_META, SITE_URL, toolMeta } from '@/tools/seo';

import {
  homeStructuredData,
  pageMetaWithStructuredData,
  toolStructuredData,
} from './structuredData';

/**
 * Structured data is how a tool page earns a rich result rather than a plain
 * blue link. Google parses these graphs literally: a wrong @type or a relative
 * URL is not a soft failure, it is an ignored page. So these tests assert the
 * shape Google documents, not merely that "some JSON-LD exists".
 */

type Node = Record<string, unknown>;

function graphOf(json: string): Node[] {
  const parsed = JSON.parse(json) as { '@graph'?: Node[] };
  expect(Array.isArray(parsed['@graph'])).toBe(true);
  return parsed['@graph'] as Node[];
}

function nodeOfType(graph: Node[], type: string): Node {
  const found = graph.find((node) => node['@type'] === type);
  expect(found, `expected a ${type} node in the graph`).toBeDefined();
  return found as Node;
}

describe('tool page structured data', () => {
  const tool = getTool('resize-image')!;
  const graph = graphOf(toolStructuredData(tool));

  test('is valid JSON with a schema.org context', () => {
    const parsed = JSON.parse(toolStructuredData(tool)) as Node;
    expect(parsed['@context']).toBe('https://schema.org');
  });

  test('declares the page as a free WebApplication so it can earn a rich result', () => {
    const app = nodeOfType(graph, 'WebApplication');
    expect(app.name).toBe(tool.title);
    expect(app.applicationCategory).toBe('MultimediaApplication');
    expect(app.url).toBe(toolMeta(tool).canonical);
  });

  test('states a zero price, which is what makes the free label eligible', () => {
    const app = nodeOfType(graph, 'WebApplication');
    const offer = app.offers as Node;
    expect(offer['@type']).toBe('Offer');
    expect(offer.price).toBe('0');
    expect(offer.priceCurrency).toBe('USD');
  });

  test('names the browser as the requirement rather than an operating system', () => {
    const app = nodeOfType(graph, 'WebApplication');
    expect(app.operatingSystem).toMatch(/browser/i);
  });

  test('publishes a breadcrumb trail back to the homepage', () => {
    const crumbs = nodeOfType(graph, 'BreadcrumbList');
    const items = crumbs.itemListElement as Node[];
    expect(items).toHaveLength(2);
    expect(items[0].position).toBe(1);
    expect(items[0].item).toBe(`${SITE_URL}/`);
    expect(items[1].position).toBe(2);
    expect(items[1].item).toBe(toolMeta(tool).canonical);
    expect(items[1].name).toBe(tool.title);
  });

  test('every URL in the graph is absolute, since Google will not resolve relative ones', () => {
    const urls = JSON.stringify(graph).match(/"(?:url|item|@id)":"([^"]+)"/g) ?? [];
    expect(urls.length).toBeGreaterThan(0);
    for (const entry of urls) {
      expect(entry).toMatch(/"https:\/\//);
    }
  });

  test('produces a valid graph for every tool, not just the sampled one', () => {
    for (const each of TOOLS) {
      const parsed = JSON.parse(toolStructuredData(each)) as Node;
      expect(parsed['@context'], each.slug).toBe('https://schema.org');
      const nodes = parsed['@graph'] as Node[];
      expect(nodes.some((n) => n['@type'] === 'WebApplication'), each.slug).toBe(true);
      expect(nodes.some((n) => n['@type'] === 'BreadcrumbList'), each.slug).toBe(true);
    }
  });

  test('contains no unescaped closing script tag that would break out of the <script> block', () => {
    for (const each of TOOLS) {
      expect(toolStructuredData(each).toLowerCase(), each.slug).not.toContain('</script');
    }
  });
});

describe('homepage structured data', () => {
  const graph = graphOf(homeStructuredData());

  test('declares the WebSite so Google can attribute the brand', () => {
    const site = nodeOfType(graph, 'WebSite');
    expect(site.url).toBe(`${SITE_URL}/`);
    expect(site.name).toBeTruthy();
  });

  test('declares the publishing Organization', () => {
    const org = nodeOfType(graph, 'Organization');
    expect(org.url).toBe(`${SITE_URL}/`);
    expect(org.name).toBeTruthy();
  });

  test('advertises the on-site search so Google can offer a sitelinks searchbox', () => {
    const site = nodeOfType(graph, 'WebSite');
    const action = site.potentialAction as Node;
    expect(action['@type']).toBe('SearchAction');
    expect(String(action.target)).toContain(SITE_URL);
    expect(String(action.target)).toContain('{search_term_string}');
    expect(action['query-input']).toBe('required name=search_term_string');
  });

  test('uses the homepage title as the site name so branding is consistent', () => {
    const site = nodeOfType(graph, 'WebSite');
    expect(HOME_META.title).toContain(String(site.name));
  });
});

describe('attaching graphs to the pages the prerender writes', () => {
  const pages = pageMetaWithStructuredData();

  test('covers every page, so no page ships without structured data', () => {
    expect(pages).toHaveLength(TOOLS.length + 1);
    for (const page of pages) {
      expect(page.structuredData, page.canonical).toBeTruthy();
    }
  });

  test('gives the homepage the WebSite graph, not a tool graph', () => {
    const home = pages.find((p) => p.canonical === `${SITE_URL}/`);
    expect(home?.structuredData).toContain('WebSite');
    expect(home?.structuredData).not.toContain('WebApplication');
  });

  test('gives each tool page its own graph naming its own URL', () => {
    const page = pages.find((p) => p.canonical.endsWith('/resize-image'));
    expect(page?.structuredData).toContain('WebApplication');
    expect(page?.structuredData).toContain(`${SITE_URL}/resize-image`);
  });

  test('leaves the existing title and description untouched', () => {
    const page = pages.find((p) => p.canonical.endsWith('/resize-image'));
    const original = toolMeta(getTool('resize-image')!);
    expect(page?.title).toBe(original.title);
    expect(page?.description).toBe(original.description);
  });
});
