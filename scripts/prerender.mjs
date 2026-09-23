/**
 * Emits one real HTML file per URL after `vite build`.
 *
 * Why this exists: a single-page app serves byte-identical HTML for every
 * route. For a site whose whole strategy is dozens of narrowly-targeted
 * landing pages, that is fatal -- the pages look like duplicates of each
 * other, and every crawler that does not execute JavaScript sees the same
 * generic title on all of them.
 *
 * So each route is rendered to static markup at build time and written to
 * <slug>/index.html, with its title, description and canonical baked in. The
 * client bundle still loads and takes over, so behaviour is unchanged.
 */

import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(new URL('../package.json', import.meta.url)));
const outDir = join(root, 'dist');
const serverDir = join(root, 'dist-prerender');

const { renderPath, allPageMeta, canonicalUrl, renderPageHtml, outputPathFor,
        buildSitemap, buildRobots } = await import(
  join(serverDir, 'entry-prerender.js')
);

const template = await readFile(join(outDir, 'index.html'), 'utf8');
const pages = allPageMeta();

for (const meta of pages) {
  // canonical -> route path, so the two can never disagree.
  const path = new URL(meta.canonical).pathname;
  const appHtml = renderPath(path);
  const html = renderPageHtml(template, meta, appHtml);

  const target = join(outDir, outputPathFor(path));
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, html, 'utf8');
}

await writeFile(join(outDir, 'sitemap.xml'), buildSitemap(pages), 'utf8');
await writeFile(
  join(outDir, 'robots.txt'),
  buildRobots(canonicalUrl('sitemap.xml')),
  'utf8',
);

// The server build is a build artefact, not something to deploy.
await rm(serverDir, { recursive: true, force: true });

console.log(`Prerendered ${pages.length} pages, sitemap.xml and robots.txt.`);
