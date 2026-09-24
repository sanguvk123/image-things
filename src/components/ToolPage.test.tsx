import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, test } from 'vitest';

import { AppRoutes } from '@/App';
import { EAGER_PAGES } from '@/pages/pages.eager';
import { TOOLS } from '@/tools/registry';

/**
 * Every tool page wears the same shell.
 *
 * Three tools need their own body -- crop has a drag surface, image-to-pdf
 * takes many files, the metadata viewer has no action at all -- and each grew
 * its own copy of the page header. The copies then drifted: they lost the
 * category icon, used different padding, and silently omitted the related-tools
 * section, which orphaned six pages.
 *
 * So the shell is asserted here for all 22 tool pages at once, rather than
 * trusting that a future bespoke layout will remember to include everything.
 */

function renderTool(slug: string) {
  return render(
    <MemoryRouter initialEntries={[`/${slug}`]}>
      <AppRoutes pages={EAGER_PAGES} />
    </MemoryRouter>,
  );
}

/** One slug per distinct page component, including the three bespoke ones. */
const SAMPLE = [
  'compress-image',
  'resize-image',
  'jpg-to-png',
  'crop-image',
  'image-to-pdf',
  'image-metadata-viewer',
  'remove-metadata',
  'rotate-image',
];

describe('the tool page shell', () => {
  test.each(SAMPLE)('%s offers a way back to the directory', (slug) => {
    const { unmount } = renderTool(slug);
    expect(screen.getByRole('link', { name: /all tools/i })).toBeVisible();
    unmount();
  });

  test.each(SAMPLE)('%s leads with exactly one h1', (slug) => {
    const { unmount } = renderTool(slug);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    unmount();
  });

  test.each(SAMPLE)('%s shows the category icon beside the heading', (slug) => {
    // The icon carries the category colour from the homepage grid, so arriving
    // from the grid or from Google both land on a recognisable page. The
    // bespoke layouts dropped it, which made those tools look like a different
    // site.
    //
    // Asserted against the h1's immediate previous sibling. An earlier version
    // of this test searched `h1.closest('div')`, which is the whole page
    // wrapper -- it found seven unrelated icons further down the page and
    // passed for every tool, including the three that have no icon at all.
    const { unmount } = renderTool(slug);
    const heading = screen.getByRole('heading', { level: 1 });
    const sibling = heading.previousElementSibling;

    expect(sibling, `${slug}: nothing precedes the h1`).not.toBeNull();
    expect(
      sibling?.querySelector('svg'),
      `${slug}: no category icon immediately before the h1`,
    ).not.toBeNull();
    unmount();
  });

  test.each(SAMPLE)('%s carries the supporting content and related tools', (slug) => {
    const { unmount } = renderTool(slug);
    expect(screen.getByRole('heading', { name: /related tools/i })).toBeVisible();
    unmount();
  });

  test('every tool in the registry renders a shell, not just the sample', () => {
    for (const tool of TOOLS) {
      const { unmount } = renderTool(tool.slug);
      expect(
        screen.getAllByRole('heading', { level: 1 }),
        `${tool.slug} should have exactly one h1`,
      ).toHaveLength(1);
      unmount();
    }
  });
});
