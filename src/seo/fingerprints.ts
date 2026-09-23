/**
 * Entry point for scripts/lastmod.mjs.
 *
 * Kept separate from lastmod.ts because that module imports lastmod.json, and
 * the script has to compute fingerprints *before* the manifest exists. This
 * file therefore reads only the registry and the content module.
 */

import { TOOLS } from '@/tools/registry';
import { HOME_KEY, contentFingerprint, homeFingerprint } from './fingerprint';

/** Current fingerprint of every page, keyed by slug (homepage as "/"). */
export function fingerprints(): Record<string, string> {
  const result: Record<string, string> = {
    [HOME_KEY]: homeFingerprint(TOOLS),
  };

  for (const tool of TOOLS) {
    result[tool.slug] = contentFingerprint(tool);
  }

  return result;
}
