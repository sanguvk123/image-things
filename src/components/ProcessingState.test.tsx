import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { ProcessingState } from './ProcessingState';

/**
 * The processing state.
 *
 * Before this existed the only sign that anything was happening was the
 * action button relabelling itself "Working…". On a 24 MP sharpen that is
 * several hundred milliseconds where the page looks broken rather than busy.
 *
 * The hard rule here is honesty. These operations report no progress -- a
 * convolution over a pixel buffer has no natural checkpoint to report from,
 * and the encode step is a single opaque call into the browser. So the UI
 * must say "working" without implying it knows how far along it is. A
 * progress bar that advances on a timer is a lie about the one thing the
 * user is trying to find out.
 */

describe('ProcessingState', () => {
  test('says what is happening', () => {
    render(<ProcessingState label="Compressing your image…" />);
    expect(screen.getByText('Compressing your image…')).toBeInTheDocument();
  });

  test('announces itself to a screen reader without stealing focus', () => {
    // The controls are replaced in place, with no navigation, so without a
    // live region a screen reader user presses the button and hears nothing.
    render(<ProcessingState label="Compressing your image…" />);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Compressing your image…');
  });

  test('repeats the privacy claim at the one moment it is most doubted', () => {
    // "Processing…" is exactly when a user wonders whether their photo is
    // being uploaded somewhere. It is also the moment the claim is cheapest
    // to make and most reassuring to read.
    render(<ProcessingState label="Compressing your image…" />);
    expect(screen.getByText(/in your browser/i)).toBeInTheDocument();
  });

  /**
   * The anti-fake-progress guard.
   *
   * This is the assertion that matters most, and it is written against the
   * accessibility tree rather than the visuals because that is where a
   * progress claim becomes machine-readable. A determinate progressbar
   * carries aria-valuenow; an honest indeterminate one must not.
   */
  test('claims no percentage, because none is actually known', () => {
    const { container } = render(<ProcessingState label="Working…" />);

    const progressbar = container.querySelector('[role="progressbar"]');
    if (progressbar) {
      expect(progressbar).not.toHaveAttribute('aria-valuenow');
    }

    expect(screen.queryByText(/\d+\s*%/)).not.toBeInTheDocument();
  });

  test('offers cancellation only when the caller can actually cancel', () => {
    const { rerender } = render(<ProcessingState label="Working…" />);
    expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();

    rerender(<ProcessingState label="Working…" onCancel={() => {}} />);
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  test('cancelling calls back', async () => {
    let cancelled = false;
    render(<ProcessingState label="Working…" onCancel={() => { cancelled = true; }} />);

    screen.getByRole('button', { name: /cancel/i }).click();
    expect(cancelled).toBe(true);
  });
});
