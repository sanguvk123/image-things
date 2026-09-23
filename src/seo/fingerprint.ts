/**
 * Content fingerprints, used to decide when a page's <lastmod> should move.
 *
 * Separate from lastmod.ts so the regeneration script can compute fingerprints
 * without importing the manifest it is about to write.
 *
 * Why fingerprints rather than git commit dates, which is the more obvious
 * approach: git timestamps describe the repository, not the page. Rebasing,
 * squashing or a fresh CI clone rewrites them, which would push the entire
 * sitemap to one date -- the same false signal, differently caused. CI
 * checkouts are also often shallow and have no history to read.
 */

import { contentFor } from '@/tools/content';
import type { Tool } from '@/tools/registry';

/** Manifest key for the homepage, which has no slug. */
export const HOME_KEY = '/';

/**
 * Small, stable, non-cryptographic hash (FNV-1a).
 *
 * No dependency, and identical in Node and the browser -- which matters
 * because the build script and the test suite both compute it.
 */
function hash(value: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

/**
 * Fingerprint of everything a visitor reads on a tool page.
 *
 * Deliberately excludes fields that do not change the page itself: `popular`
 * only affects placement on the homepage, so toggling it must not claim this
 * page was modified.
 */
export function contentFingerprint(tool: Tool): string {
  const content = contentFor(tool);

  return hash(
    JSON.stringify([
      tool.slug,
      tool.title,
      tool.h1 ?? null,
      tool.tagline,
      tool.description,
      tool.seo.title,
      tool.seo.description,
      // Presets change what the tool does, so they change the page.
      tool.targetKB ?? null,
      tool.presetSize ?? null,
      tool.defaultCompression ?? null,
      tool.convert ?? null,
      tool.sourceLabel ?? null,
      content.steps,
      content.why,
      content.faqs,
    ]),
  );
}

/** Fingerprint of the homepage, which changes when the tool directory does. */
export function homeFingerprint(tools: Tool[]): string {
  return hash(JSON.stringify(tools.map((tool) => [tool.slug, tool.title])));
}
