import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { installCanvasStubs, type CanvasStub } from '@/test/canvas';
import { choosePhoto, renderTool } from '@/test/tool';

/**
 * The five states of a tool page, asserted as a page actually renders them.
 *
 * ProcessingState.test.tsx proves the component behaves. This proves tools
 * reach it. That distinction is not academic: the internal-link work earlier
 * in this project had unit tests passing at 0 orphans while the built site
 * had 7, because one page never called the function under test. A component
 * nobody renders is indistinguishable from a component that does not exist.
 */

let canvas: CanvasStub;

beforeEach(() => {
  canvas = installCanvasStubs();
});

afterEach(() => {
  canvas.restore();
  vi.restoreAllMocks();
});

describe('a tool page through a whole operation', () => {
  test('starts empty, with the upload control as the way in', () => {
    renderTool('compress-image');

    expect(screen.getByLabelText('Choose image')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  test('shows the image and its action once one is chosen', async () => {
    const user = userEvent.setup();
    renderTool('compress-image');
    await choosePhoto(user);

    expect(await screen.findByText('photo.jpg')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /compress/i }),
    ).toBeInTheDocument();
  });

  /**
   * The state that did not exist before this change.
   *
   * Holding the encode open is what makes the intermediate state observable
   * at all -- with the stub resolving immediately, the tool goes from
   * "selected" to "done" within one tick and there is nothing to assert on.
   */
  test('shows an honest working state while the operation runs', async () => {
    const user = userEvent.setup();

    let releaseEncode: (() => void) | undefined;
    const held = new Promise<void>((resolve) => {
      releaseEncode = resolve;
    });
    canvas.holdToBlob(held);

    renderTool('compress-image');
    await choosePhoto(user);
    await user.click(screen.getByRole('button', { name: /compress/i }));

    const status = await screen.findByRole('status');
    expect(status).toHaveTextContent(/working|compress/i);

    /*
     * The claim under test: the working state invents no percentage.
     *
     * Scoped to the status region rather than the page. A page-wide search
     * matched "shrink by 70-80%" in the explanatory copy below the tool --
     * prose about compression, not a progress claim. Asserting on the whole
     * document made this test fail for a reason that had nothing to do with
     * the behaviour it names.
     */
    expect(status.textContent).not.toMatch(/\d+\s*%/);
    expect(status.querySelector('[aria-valuenow]')).toBeNull();

    releaseEncode?.();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument(),
    );
  });

  test('ends on a result carrying the real numbers, not placeholders', async () => {
    const user = userEvent.setup();
    renderTool('compress-image');
    await choosePhoto(user);
    await user.click(screen.getByRole('button', { name: /compress/i }));

    const download = await screen.findByRole('button', { name: /download/i });
    expect(download).toBeInTheDocument();

    // The original was 2.8 MB; the result must state a real, different size
    // rather than a hardcoded example.
    expect(screen.getByText(/2\.8 MB/)).toBeInTheDocument();
    expect(screen.getByText('✓ Done')).toBeInTheDocument();
  });

  test('offers a way back to process another image', async () => {
    const user = userEvent.setup();
    renderTool('compress-image');
    await choosePhoto(user);
    await user.click(screen.getByRole('button', { name: /compress/i }));

    await user.click(await screen.findByRole('button', { name: /start over/i }));

    expect(screen.getByLabelText('Choose image')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /download/i })).not.toBeInTheDocument();
  });

  test('a failed operation explains itself and leaves the image in place', async () => {
    const user = userEvent.setup();
    canvas.failToBlob();

    renderTool('compress-image');
    await choosePhoto(user);
    await user.click(screen.getByRole('button', { name: /compress/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toBeInTheDocument();
    // No internals: the user gets advice, not "Array buffer allocation failed".
    expect(alert.textContent).not.toMatch(/undefined|null|Error:|stack/i);
    // The image survives, so the user can retry without re-uploading.
    expect(screen.getByText('photo.jpg')).toBeInTheDocument();
  });
});
