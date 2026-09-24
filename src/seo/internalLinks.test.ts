import { describe, expect, test } from 'vitest';

import { TOOLS, getTool, type Tool } from '@/tools/registry';

import { relatedTools } from './internalLinks';

/**
 * Internal links are how PageRank reaches a page and how a crawler discovers it
 * without relying on the sitemap. A page nothing links to is an orphan: it can
 * be indexed, but it inherits no authority from the rest of the site.
 *
 * The alias pages -- /make-image-smaller, /remove-exif and friends -- exist
 * purely to rank for the words people actually type. Orphaning them defeats
 * their whole reason for existing.
 */

/** Builds the full inbound-link graph the way the rendered pages would. */
function inboundCounts(): Map<string, number> {
  const counts = new Map<string, number>(TOOLS.map((t) => [t.slug, 0]));
  for (const tool of TOOLS) {
    for (const other of relatedTools(tool)) {
      counts.set(other.slug, (counts.get(other.slug) ?? 0) + 1);
    }
  }
  return counts;
}

describe('relatedTools', () => {
  test('never links a page to itself', () => {
    for (const tool of TOOLS) {
      expect(relatedTools(tool).map((t) => t.slug), tool.slug).not.toContain(tool.slug);
    }
  });

  test('returns a bounded list, so a page is not buried in links', () => {
    for (const tool of TOOLS) {
      expect(relatedTools(tool).length, tool.slug).toBeLessThanOrEqual(6);
    }
  });

  test('gives every tool at least one onward link', () => {
    for (const tool of TOOLS) {
      expect(relatedTools(tool).length, tool.slug).toBeGreaterThan(0);
    }
  });

  test('is deterministic, so the prerendered HTML is stable between builds', () => {
    for (const tool of TOOLS.slice(0, 10)) {
      const first = relatedTools(tool).map((t) => t.slug);
      const second = relatedTools(tool).map((t) => t.slug);
      expect(second).toEqual(first);
    }
  });

  test('contains no duplicates', () => {
    for (const tool of TOOLS) {
      const slugs = relatedTools(tool).map((t) => t.slug);
      expect(new Set(slugs).size, tool.slug).toBe(slugs.length);
    }
  });

  test('prefers tools from the same category', () => {
    const tool = getTool('compress-image')!;
    const sameCategory = relatedTools(tool).filter(
      (t) => t.category === tool.category,
    );
    expect(sameCategory.length).toBeGreaterThan(0);
  });
});

describe('the link graph as a whole', () => {
  const counts = inboundCounts();

  test('leaves no tool page orphaned', () => {
    const orphans = [...counts.entries()]
      .filter(([, count]) => count === 0)
      .map(([slug]) => slug);
    expect(orphans).toEqual([]);
  });

  test('links to the alias pages, which exist only to be found in search', () => {
    const aliases = TOOLS.filter((t) => t.aliasOf);
    expect(aliases.length).toBeGreaterThan(0);
    for (const alias of aliases) {
      expect(counts.get(alias.slug), `${alias.slug} has no inbound links`)
        .toBeGreaterThan(0);
    }
  });

  test('an alias is reachable from the tool it duplicates', () => {
    const alias = TOOLS.find((t) => t.aliasOf) as Tool;
    const canonical = getTool(alias.aliasOf!)!;
    const reachable = relatedTools(canonical).map((t) => t.slug);
    expect(reachable).toContain(alias.slug);
  });
});
