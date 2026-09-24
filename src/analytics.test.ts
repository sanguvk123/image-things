import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

/**
 * Analytics is mounted in exactly one place, and that place is the browser
 * entry.
 *
 * Asserted against the source rather than by rendering, because the mistakes
 * worth catching are structural:
 *
 * - Importing it from App.tsx would pull it into the prerender, where there
 *   is no browser to measure and where a beacon fired at build time would
 *   report 64 phantom visits.
 * - Importing it from a tool page would put a third-party script in the
 *   critical path of the one thing the user came to do.
 */

const read = (path: string) => readFileSync(path, 'utf8');

describe('where analytics is mounted', () => {
  test('the browser entry mounts it', () => {
    expect(read('src/main.tsx')).toMatch(/@vercel\/analytics/);
  });

  test('the prerender entry does not', () => {
    // A build-time beacon would report visits nobody made.
    expect(read('src/entry-prerender.tsx')).not.toMatch(/@vercel\/analytics/);
  });

  test('the shared app tree does not', () => {
    // App.tsx is rendered by both entries, so anything here reaches the
    // prerender too.
    expect(read('src/App.tsx')).not.toMatch(/@vercel\/analytics/);
  });

  test('it uses the framework-agnostic entry, not the Next.js one', () => {
    // The dashboard shows the Next.js snippet by default. This is a Vite app;
    // '@vercel/analytics/next' resolves to Next internals and fails to build.
    const main = read('src/main.tsx');

    expect(main).not.toMatch(/@vercel\/analytics\/next/);
    expect(main).toMatch(/@vercel\/analytics\/react/);
  });
});
