/**
 * Fails the build if any prerendered page shipped without its tool.
 *
 * This is the backstop for code splitting. React.lazy suspends on its first
 * render, so a lazy component reaching the prerender makes renderToString emit
 * the Suspense fallback instead of the page -- the HTML is still valid, the
 * build still succeeds, and the landing page silently becomes an empty shell.
 * Exactly the failure the prerender exists to prevent.
 *
 * It is checked here rather than in a unit test because under vitest the
 * prerender entry and the app resolve `react-router` to two module instances,
 * which breaks the render for reasons unrelated to this code. The built output
 * is the honest thing to assert against.
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(new URL('../package.json', import.meta.url)));
const dist = join(root, 'dist');

function htmlFiles(dir) {
  const found = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) found.push(...htmlFiles(full));
    else if (entry === 'index.html') found.push(full);
  }
  return found;
}

const pages = htmlFiles(dist);
const problems = [];

for (const file of pages) {
  const html = readFileSync(file, 'utf8');
  const route = file.slice(dist.length).replace(/\/index\.html$/, '') || '/';

  // The homepage is a directory, not a tool, so it has no upload control.
  if (route === '/') {
    if (!html.includes('Popular tools')) problems.push(`${route}: no tool directory`);
    continue;
  }

  if (!html.includes('Choose image') && !html.includes('Choose images')) {
    problems.push(`${route}: no upload control (lazy component in the prerender?)`);
  }
  if (!html.includes('<h1')) {
    problems.push(`${route}: no h1`);
  }
}

/*
 * Structured data and the social card are invisible when they break: the page
 * still renders perfectly for a human, and only the search result quietly
 * degrades. So both are asserted against the built HTML.
 */
for (const file of pages) {
  const html = readFileSync(file, 'utf8');
  const route = file.slice(dist.length).replace(/\/index\.html$/, '') || '/';

  const graph = html.match(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/,
  );
  if (!graph) {
    problems.push(`${route}: no JSON-LD -- structured data is not reaching the page`);
  } else {
    try {
      // Google discards the whole block on a parse error, so invalid JSON here
      // is equivalent to shipping none at all.
      JSON.parse(graph[1]);
    } catch (error) {
      problems.push(`${route}: JSON-LD does not parse (${error.message})`);
    }
  }

  if (!html.includes('property="og:image"')) {
    problems.push(`${route}: no og:image -- shared links will have no preview`);
  }
}

// A meta tag promising an image that 404s is worse than no tag: the crawler
// fetches it, fails, and the link is shared with a blank card.
for (const asset of ['og.png', 'favicon.svg', 'apple-touch-icon.png']) {
  if (!existsSync(join(dist, asset))) {
    problems.push(`${asset} is referenced in <head> but missing from the build`);
  }
}

/*
 * Code splitting is easy to undo by accident and nothing fails when you do.
 * Statically importing a tool page anywhere the browser entry can reach it
 * cancels the matching dynamic import, the bundler folds every page back into
 * the main chunk, and the only symptom is a warning in the build log. The
 * tests still pass, because the app behaves identically -- it is just slower
 * for everyone. So the built chunks are checked directly.
 */
const assets = readdirSync(join(dist, 'assets'));
const splitChunks = ['CropImage', 'ImageToPdf', 'ConvertImage', 'ViewMetadata'];

for (const name of splitChunks) {
  if (!assets.some((f) => f.startsWith(`${name}-`) && f.endsWith('.js'))) {
    problems.push(
      `${name} has no chunk of its own -- route code splitting has regressed ` +
        `(a static import of a tool page is reachable from the browser entry)`,
    );
  }
}

if (problems.length > 0) {
  console.error(`\nPrerender verification failed:\n  ${problems.join('\n  ')}\n`);
  process.exit(1);
}

console.log(
  `Verified ${pages.length} prerendered pages: all carry their tool, ` +
    `tool routes are code-split, and every page ships valid structured data ` +
    `and a social card that exists.`,
);
