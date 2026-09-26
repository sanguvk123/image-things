import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, test } from 'vitest';

import { RelatedTools, ToolPage } from './ToolLayout';
import { App } from '@/App';
import { getTool } from '@/tools/registry';

/**
 * Minimum tap-target sizes, asserted on the classes that produce them.
 *
 * A browser measurement across 320/375/390/430/768/1280 found three controls
 * under the 44px minimum: the back link at 68x17, the related-tool cards at
 * 41px, and the site header logo at 120x28. The cards were only three pixels
 * short, which is exactly the kind of near-miss that survives a visual review.
 * All three were padding problems, so all three were identical at every width.
 *
 * jsdom computes no layout, so height cannot be measured here. What can be
 * pinned is the utility that guarantees it: min-h-11 is 2.75rem, which is
 * 44px at the default root size. That is weaker than a real measurement --
 * it would not catch a parent constraining the height -- so it is a
 * regression guard for a fix already verified in a browser, not a substitute
 * for having verified it.
 */

const MIN_TARGET_CLASS = 'min-h-11';

function renderPage() {
  const tool = getTool('compress-image');
  if (!tool) throw new Error('compress-image missing from the registry');

  return render(
    <MemoryRouter>
      <ToolPage tool={tool}>
        <div />
      </ToolPage>
    </MemoryRouter>,
  );
}

describe('tap targets', () => {
  test('the back link is padded to a full tap target', () => {
    const { container } = renderPage();

    const back = container.querySelector('a[href="/"]');
    expect(back).not.toBeNull();
    expect(back?.className).toContain(MIN_TARGET_CLASS);
  });

  test('every related-tool card is a full tap target', () => {
    const tool = getTool('compress-image');
    if (!tool) throw new Error('compress-image missing from the registry');

    const { container } = render(
      <MemoryRouter>
        <RelatedTools tool={tool} />
      </MemoryRouter>,
    );

    const cards = container.querySelectorAll('a[href^="/"]');
    expect(cards.length).toBeGreaterThan(0);
    for (const card of cards) {
      expect(card.className).toContain(MIN_TARGET_CLASS);
    }
  });

  /**
   * Rendered through App rather than the header in isolation: on a tool page
   * this is the only way home, so what matters is that the real composed
   * document exposes it at a thumb-sized target, not that a component would
   * if someone rendered it.
   */
  test('the site header logo is a full tap target', () => {
    render(<App />);

    const home = screen.getAllByRole('link', { name: /image tools/i })[0];
    expect(home).toBeDefined();
    expect(home.className).toContain(MIN_TARGET_CLASS);
  });
});
