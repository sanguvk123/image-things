/**
 * Regenerates src/seo/lastmod.json.
 *
 * Run this after changing page copy, then commit the result:
 *
 *   npm run lastmod
 *
 * The important behaviour is what it does NOT do: pages whose fingerprint is
 * unchanged keep their existing date. Only pages whose content actually moved
 * get today's date. Rewriting every entry on every run would recreate exactly
 * the bug this file exists to prevent -- a sitemap claiming the whole site
 * changed whenever anything did.
 *
 * A test fails if the manifest and the content disagree, so forgetting to run
 * this breaks the build rather than silently shipping wrong dates.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const root = dirname(fileURLToPath(new URL('../package.json', import.meta.url)));
const manifestPath = join(root, 'src/seo/lastmod.json');

// The fingerprint logic lives in TypeScript and imports the registry, so it is
// bundled here rather than duplicated -- two implementations would drift.
const bundle = await build({
  configFile: false,
  logLevel: 'error',
  resolve: { alias: { '@': join(root, 'src') } },
  build: {
    write: false,
    ssr: true,
    rollupOptions: {
      input: join(root, 'src/seo/fingerprints.ts'),
      output: { format: 'esm' },
    },
  },
});

const code = bundle.output[0].code;
const moduleUrl = `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
const { fingerprints } = await import(moduleUrl);

let existing = {};
try {
  existing = JSON.parse(readFileSync(manifestPath, 'utf8'));
} catch {
  // First run: no manifest yet.
}

const today = new Date().toISOString().slice(0, 10);
const current = fingerprints();
const next = {};
const changed = [];

for (const [key, fingerprint] of Object.entries(current)) {
  const previous = existing[key];

  if (previous && previous.fingerprint === fingerprint) {
    // Unchanged: keep the date it already had.
    next[key] = previous;
  } else {
    next[key] = { lastmod: today, fingerprint };
    changed.push(key);
  }
}

// Sort keys so the file has a stable diff.
const sorted = Object.fromEntries(
  Object.keys(next)
    .sort()
    .map((key) => [key, next[key]]),
);

writeFileSync(manifestPath, `${JSON.stringify(sorted, null, 2)}\n`, 'utf8');

const removed = Object.keys(existing).filter((key) => !(key in current));

console.log(
  changed.length === 0
    ? `lastmod.json is up to date (${Object.keys(sorted).length} pages).`
    : `Updated ${changed.length} of ${Object.keys(sorted).length} pages to ${today}:\n  ${changed.join('\n  ')}`,
);
if (removed.length > 0) {
  console.log(`Dropped ${removed.length} page(s) no longer in the registry.`);
}
