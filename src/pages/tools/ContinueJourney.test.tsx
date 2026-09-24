import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { ToolRoute } from '@/pages/ToolRoute';
import { EAGER_PAGES } from '@/pages/pages.eager';
import { clearHandoff } from '@/image/handoff';
import { installCanvasStubs, fakeImageFile, type CanvasStub } from '@/test/canvas';

/**
 * The whole point of the handoff, end to end.
 *
 * The unit tests prove the pieces work. They would all still pass if the
 * pickup never ran, or ran on the wrong route, so the journey itself is
 * tested here: finish on one tool, click through, and the image should
 * already be loaded on the next one.
 */

let canvas: CanvasStub;

beforeEach(() => {
  clearHandoff();
  canvas = installCanvasStubs();
});

afterEach(() => {
  canvas.restore();
  clearHandoff();
});

function renderApp(at: string) {
  return render(
    <MemoryRouter initialEntries={[at]}>
      <Routes>
        <Route path="/:slug" element={<ToolRoute pages={EAGER_PAGES} />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('carrying an image from one tool to the next', () => {
  test('the next tool opens with the image already loaded', async () => {
    const user = userEvent.setup();
    renderApp('/compress-image');

    await user.upload(
      screen.getByLabelText('Choose image'),
      fakeImageFile('holiday.jpg', 400_000),
    );
    await user.click(await screen.findByRole('button', { name: 'Compress Image' }));

    // Finished: the next steps should be on offer.
    const next = await screen.findByRole('link', { name: 'Resize Image' });
    await user.click(next);

    // No dropzone: the image came with us.
    await waitFor(() =>
      expect(screen.queryByText('Drop image here')).not.toBeInTheDocument(),
    );
    expect(await screen.findByRole('button', { name: 'Resize Image' })).toBeInTheDocument();
  });

  test('the carried image is the result, not the original upload', async () => {
    const user = userEvent.setup();
    renderApp('/compress-image');

    await user.upload(
      screen.getByLabelText('Choose image'),
      fakeImageFile('holiday.jpg', 400_000),
    );
    await user.click(await screen.findByRole('button', { name: 'Compress Image' }));
    await user.click(await screen.findByRole('link', { name: 'Resize Image' }));

    // The compressed output carries a distinct name, so showing it proves the
    // second tool received the processed bytes rather than the upload.
    expect(await screen.findByText(/holiday-compressed\.jpg/)).toBeInTheDocument();
  });

  test('arriving directly still shows the upload area', async () => {
    renderApp('/resize-image');

    // Nothing was handed over, so the tool must not appear to be mid-task.
    expect(await screen.findByText('Drop image here')).toBeInTheDocument();
  });
});
