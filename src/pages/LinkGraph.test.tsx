import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, test } from 'vitest';

import { AppRoutes } from '@/App';
import { EAGER_PAGES } from '@/pages/pages.eager';
import { TOOLS } from '@/tools/registry';

/**
 * Asserts the link graph of the pages as they actually render.
 *
 * seo/internalLinks.test.ts checks the function that chooses the links. That is
 * not the same thing: a page can simply not render them. /image-metadata-viewer
 * has its own layout and shipped with a single outbound link while the unit
 * tests were green, which orphaned /exif-viewer. The honest question is what
 * the built page contains, so that is what this asks.
 */

function linksOn(slug: string): string[] {
  const { unmount } = render(
    <MemoryRouter initialEntries={[`/${slug}`]}>
      <AppRoutes pages={EAGER_PAGES} />
    </MemoryRouter>,
  );

  const hrefs = Array.from(document.querySelectorAll('a[href]'))
    .map((a) => a.getAttribute('href') ?? '')
    .filter((href) => href.startsWith('/') && href !== '/');

  unmount();
  return [...new Set(hrefs)];
}

describe('the rendered internal link graph', () => {
  test('every tool page links onward to other tools', () => {
    const barren: string[] = [];
    for (const tool of TOOLS) {
      if (linksOn(tool.slug).length === 0) barren.push(tool.slug);
    }
    expect(barren).toEqual([]);
  });

  test('no tool page is orphaned across the whole site', () => {
    const inbound = new Map<string, number>(TOOLS.map((t) => [t.slug, 0]));

    for (const tool of TOOLS) {
      for (const href of linksOn(tool.slug)) {
        const target = href.replace(/^\//, '');
        if (inbound.has(target) && target !== tool.slug) {
          inbound.set(target, (inbound.get(target) ?? 0) + 1);
        }
      }
    }

    const orphans = [...inbound.entries()]
      .filter(([, count]) => count === 0)
      .map(([slug]) => slug);

    expect(orphans).toEqual([]);
  });

  test('the metadata viewer offers a way on, despite its bespoke layout', () => {
    render(
      <MemoryRouter initialEntries={['/image-metadata-viewer']}>
        <AppRoutes pages={EAGER_PAGES} />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: /related tools/i })).toBeVisible();
  });
});
