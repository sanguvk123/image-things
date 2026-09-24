import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, test } from 'vitest';
import { ContinueWith } from './ContinueWith';
import { getTool } from '@/tools/registry';
import { takeHandoff, clearHandoff } from '@/image/handoff';
import type { ProcessedImage } from '@/image/pipeline';

function madeResult(): ProcessedImage {
  return {
    blob: new Blob(['x'.repeat(2000)], { type: 'image/jpeg' }),
    url: 'blob:result',
    width: 1080,
    height: 1080,
    format: 'jpeg',
    fileName: 'photo-compressed.jpg',
  };
}

function renderContinue(slug: string) {
  clearHandoff();
  return render(
    <MemoryRouter>
      <ContinueWith tool={getTool(slug)!} result={madeResult()} />
    </MemoryRouter>,
  );
}

describe('continuing with the same image', () => {
  test('offers other things to do with the result', () => {
    renderContinue('compress-image');

    expect(
      screen.getByRole('heading', { name: /continue with this image/i }),
    ).toBeInTheDocument();
  });

  test('does not offer the tool the user is already on', () => {
    renderContinue('compress-image');

    const links = screen.getAllByRole('link').map((link) => link.textContent);

    expect(links).not.toContain('Compress Image');
  });

  test('choosing a next tool hands the result over, so it is not re-uploaded', async () => {
    const user = userEvent.setup();
    renderContinue('compress-image');

    await user.click(screen.getAllByRole('link')[0]!);

    const handed = takeHandoff();
    expect(handed).not.toBeNull();
    // The result's filename, not the original: the next tool operates on what
    // was just produced.
    expect(handed?.name).toBe('photo-compressed.jpg');
  });

  test('the handed-over file carries the processed bytes', async () => {
    const user = userEvent.setup();
    renderContinue('compress-image');

    await user.click(screen.getAllByRole('link')[0]!);

    expect(takeHandoff()?.size).toBe(2000);
  });

  test('each option links to a real tool page', () => {
    renderContinue('jpg-to-png');

    for (const link of screen.getAllByRole('link')) {
      const slug = link.getAttribute('href')!.replace('/', '');
      expect(getTool(slug), `${slug} is not a tool`).toBeDefined();
    }
  });
});

describe('what it suggests', () => {
  test('suggests steps that make sense after converting', () => {
    renderContinue('jpg-to-png');

    const labels = screen.getAllByRole('link').map((l) => l.textContent);

    // Converting is usually followed by shrinking it for wherever it is going.
    expect(labels.join(' ')).toMatch(/compress|resize/i);
  });

  test('offers a small, decidable number of options', () => {
    renderContinue('compress-image');

    // A wall of every tool is a directory, not a next step.
    expect(screen.getAllByRole('link').length).toBeLessThanOrEqual(4);
    expect(screen.getAllByRole('link').length).toBeGreaterThan(0);
  });
});
