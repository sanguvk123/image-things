import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { ResultPanel } from './ResultPanel';
import type { ProcessedImage } from '@/image/pipeline';

/**
 * Spec §19 (result state) and §23 (accessibility).
 *
 * The result replaces the controls in place, without a navigation. Nothing
 * announces it, so a screen reader user presses the button and hears silence.
 */

function makeResult(overrides: Partial<ProcessedImage> = {}): ProcessedImage {
  return {
    blob: new Blob(['x'.repeat(40_000)], { type: 'image/jpeg' }),
    url: 'blob:result',
    width: 1280,
    height: 720,
    fileName: 'photo.jpg',
    ...overrides,
  } as ProcessedImage;
}

function renderPanel(props: Partial<Parameters<typeof ResultPanel>[0]> = {}) {
  return render(
    <ResultPanel
      result={makeResult()}
      originalBytes={100_000}
      onStartOver={vi.fn()}
      {...props}
    />,
  );
}

describe('announcing the result', () => {
  test('the summary is in a live region so it is announced, not silent', () => {
    renderPanel();

    const live = screen.getByRole('status');

    expect(live).toBeInTheDocument();
  });

  test('the announcement states the outcome rather than just a number', () => {
    renderPanel();

    // "40 KB" alone is meaningless read aloud with no context.
    expect(screen.getByRole('status')).toHaveTextContent(/ready/i);
  });
});

describe('result dimensions', () => {
  test('shows the output dimensions when the size change is the point', () => {
    // Someone compressing for an upload limit still needs to know the image
    // is still 1280 x 720 and has not been quietly downscaled.
    renderPanel();

    expect(screen.getByRole('status')).toHaveTextContent('1280');
    expect(screen.getByRole('status')).toHaveTextContent('720');
  });

  test('still shows dimensions when savings are hidden', () => {
    renderPanel({ hideSavings: true });

    expect(screen.getByRole('status')).toHaveTextContent('1280');
  });

  test('reports how much smaller the file became', () => {
    renderPanel();

    expect(screen.getByRole('status')).toHaveTextContent('60% smaller');
  });
});
