/**
 * Chooses the onward links shown at the foot of a tool page.
 *
 * This is a search concern as much as a navigation one. A page nothing links to
 * is an orphan: crawlers reach it only through the sitemap and it inherits no
 * authority from the rest of the site. Before this existed, the seven alias
 * pages -- /make-image-smaller, /remove-exif and the rest -- had zero inbound
 * links, which is a poor outcome for pages whose entire purpose is to rank.
 *
 * The competing pressure is that a wall of links helps nobody and dilutes the
 * value of each one. So the list is capped, and ordered by how likely the link
 * is to be the user's actual next step.
 */

import { TOOLS, type Tool } from '@/tools/registry';

/** Above this, the list stops being a suggestion and becomes a directory. */
const MAX_LINKS = 6;

/**
 * The aliases pointing at a given tool.
 *
 * Listing these on the canonical page is what stops them being orphans. They
 * are different phrasings of the same job ("make image smaller" for Compress
 * Image), so they belong with it rather than anywhere else.
 */
function aliasesOf(tool: Tool): Tool[] {
  return TOOLS.filter((other) => other.aliasOf === tool.slug);
}

/**
 * The tools in a category, in registry order, excluding aliases.
 *
 * Aliases are reached from the tool they duplicate rather than from the
 * category ring, so that each one sits next to the page it rephrases.
 */
function categoryRing(tool: Tool): Tool[] {
  return TOOLS.filter(
    (other) => other.category === tool.category && !other.aliasOf,
  );
}

/**
 * Onward links for a tool page, best first.
 *
 * Order of preference:
 *   1. The canonical tool, if this page is an alias -- an alias's most useful
 *      link is the page it duplicates, and this gives aliases a route back
 *      into the main graph.
 *   2. This tool's own aliases, so they are never orphaned.
 *   3. Neighbours in the same category, walked as a ring (see below).
 *   4. Popular tools from elsewhere, to fill a short list.
 *
 * The ring matters. Taking the first N of a category instead would mean that
 * in a category of twenty tools, the same handful collect every internal link
 * and the rest are orphaned -- which is exactly what a naive implementation of
 * this function did. Starting each page at its own position and wrapping round
 * guarantees every tool is linked from its predecessors, so link equity is
 * spread across the category rather than pooling at the top of the registry.
 */
export function relatedTools(tool: Tool): Tool[] {
  const chosen: Tool[] = [];
  const seen = new Set<string>([tool.slug]);

  const add = (candidate: Tool | undefined) => {
    if (!candidate) return;
    if (seen.has(candidate.slug)) return;
    if (chosen.length >= MAX_LINKS) return;
    seen.add(candidate.slug);
    chosen.push(candidate);
  };

  if (tool.aliasOf) {
    add(TOOLS.find((other) => other.slug === tool.aliasOf));
  }

  for (const alias of aliasesOf(tool)) add(alias);

  const ring = categoryRing(tool);
  const start = ring.findIndex((other) => other.slug === tool.slug);
  for (let step = 1; step <= ring.length; step += 1) {
    // start is -1 for an alias, which is not in the ring; +1 then starts the
    // walk at the head of the category, which is the sensible default.
    add(ring[(start + step) % ring.length]);
  }

  // Only reached by tools in a sparse category; without this a page could end
  // up with a single onward link, or none at all.
  for (const other of TOOLS) {
    if (other.popular && !other.aliasOf) add(other);
  }

  return chosen;
}
