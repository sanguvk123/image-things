/**
 * Renders the static image assets: the social card and the iOS home-screen icon.
 *
 *   public/og.png             1200x630, from scripts/og-image.html
 *   public/apple-touch-icon.png  180x180, from public/favicon.svg
 *
 * Run by hand -- NOT part of `npm run build`. The deploy builder has no browser
 * installed, so making the build depend on Chrome would break deployment. The
 * generated PNGs are committed instead, which also keeps builds deterministic.
 *
 *   node scripts/make-og.mjs
 *
 * Re-run it whenever the source artwork changes.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(new URL('../package.json', import.meta.url)));
const source = join(root, 'scripts', 'og-image.html');
const outDir = join(root, 'public');
const target = join(outDir, 'og.png');

/** The sizes every major platform crops the social card to. */
const WIDTH = 1200;
const HEIGHT = 630;

/** Apple's home-screen icon size. */
const ICON_SIZE = 180;

const CANDIDATES = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
];

const chrome = CANDIDATES.find((path) => existsSync(path));
if (!chrome) {
  console.error(
    'No Chrome or Chromium found. Tried:\n  ' + CANDIDATES.join('\n  '),
  );
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });

execFileSync(chrome, [
  '--headless',
  '--disable-gpu',
  '--hide-scrollbars',
  // A transparent default would make the card unreadable in dark-mode clients
  // that composite it over their own background.
  '--default-background-color=0f1117',
  `--screenshot=${target}`,
  `--window-size=${WIDTH},${HEIGHT}`,
  `--force-device-scale-factor=1`,
  `file://${source}`,
]);

console.log(`Wrote ${target} at ${WIDTH}x${HEIGHT}.`);

// The apple-touch-icon: the favicon SVG on its own opaque page. Screenshotting
// the SVG file directly would letterbox it inside the browser's default white
// viewport, so it is embedded at an exact size instead.
const iconPage = join(root, 'scripts', '.icon.tmp.html');
writeFileSync(
  iconPage,
  `<!doctype html><meta charset="utf-8">
<style>html,body{margin:0;padding:0;width:${ICON_SIZE}px;height:${ICON_SIZE}px;overflow:hidden}
img{display:block;width:${ICON_SIZE}px;height:${ICON_SIZE}px}</style>
<img src="file://${join(outDir, 'favicon.svg')}" alt="">`,
  'utf8',
);

const iconTarget = join(outDir, 'apple-touch-icon.png');
execFileSync(chrome, [
  '--headless',
  '--disable-gpu',
  '--hide-scrollbars',
  '--default-background-color=00000000',
  `--screenshot=${iconTarget}`,
  `--window-size=${ICON_SIZE},${ICON_SIZE}`,
  '--force-device-scale-factor=1',
  `file://${iconPage}`,
]);

rmSync(iconPage, { force: true });

console.log(`Wrote ${iconTarget} at ${ICON_SIZE}x${ICON_SIZE}.`);
