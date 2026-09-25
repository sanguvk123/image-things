import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import { fakeImageFile, installCanvasStubs, type CanvasStub } from '@/test/canvas';
import { renderTool } from '@/test/tool';

/**
 * The three tools that drive their own bodies: crop, image-to-pdf, and the
 * metadata viewer.
 *
 * They opt out of ToolLayout for good reasons -- crop needs a drag surface,
 * image-to-pdf takes many files, the viewer has no operation to perform -- and
 * so they opt out of everything ToolLayout provides. That has already cost
 * this project once: the same three pages silently lost their related-tools
 * section, leaving six pages with one outbound link between them.
 *
 * A bespoke body is legitimate. Quietly missing a shared behaviour is not, so
 * these assert the behaviours directly rather than trusting that a page using
 * its own layout remembered them.
 */

let canvas: CanvasStub;

beforeEach(() => {
  canvas = installCanvasStubs();
});

afterEach(() => {
  canvas.restore();
});

describe('image to PDF', () => {
  test('shows a working state while the document is being assembled', async () => {
    const user = userEvent.setup();

    let release: (() => void) | undefined;
    canvas.holdToBlob(
      new Promise<void>((resolve) => {
        release = resolve;
      }),
    );

    renderTool('image-to-pdf');
    await user.upload(
      screen.getByLabelText('Choose images'),
      fakeImageFile('page.jpg', 900_000),
    );

    await user.click(await screen.findByRole('button', { name: /create pdf/i }));

    // Assembling several photos into a PDF is the slowest thing the site
    // does, which makes this the page that most needs to say it is working.
    const status = await screen.findByRole('status');
    expect(status).toHaveTextContent(/pdf|working|building/i);
    expect(status.textContent).not.toMatch(/\d+\s*%/);

    release?.();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument(),
    );
  });

  test('cannot queue more images while the document is being built', async () => {
    const user = userEvent.setup();

    let release: (() => void) | undefined;
    canvas.holdToBlob(
      new Promise<void>((resolve) => {
        release = resolve;
      }),
    );

    renderTool('image-to-pdf');
    await user.upload(
      screen.getByLabelText('Choose images'),
      fakeImageFile('page.jpg', 900_000),
    );
    await user.click(await screen.findByRole('button', { name: /create pdf/i }));

    await screen.findByRole('status');
    // Adding a page mid-build would either be silently dropped from the
    // finished document or land in a queue the user cannot see.
    expect(screen.queryByLabelText('Choose images')).toBeNull();

    release?.();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument(),
    );
  });
});

describe('crop', () => {
  test('shows a working state while the crop is applied', async () => {
    const user = userEvent.setup();

    let release: (() => void) | undefined;
    canvas.holdToBlob(
      new Promise<void>((resolve) => {
        release = resolve;
      }),
    );

    renderTool('crop-image');
    await user.upload(screen.getByLabelText('Choose image'), fakeImageFile());

    await user.click(await screen.findByRole('button', { name: /crop/i }));

    const status = await screen.findByRole('status');
    expect(status.textContent).not.toMatch(/\d+\s*%/);

    release?.();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument(),
    );
  });
});

describe('the metadata viewer', () => {
  /*
   * Dropped rather than picked.
   *
   * The file input carries accept="image/*,...", so the picker never offers a
   * .txt and userEvent.upload honours that filter -- an earlier version of
   * this test drove the input and failed for that reason, not because the
   * page was wrong. Drag and drop ignores accept entirely, which makes it the
   * only route a non-image can actually arrive by, and therefore the only
   * route worth asserting on.
   */
  test('reports a dropped file it cannot read rather than ignoring it', async () => {
    renderTool('exif-viewer');

    fireEvent.drop(screen.getByTestId('dropzone'), {
      dataTransfer: {
        files: [new File([new Uint8Array(8)], 'notes.txt', { type: 'text/plain' })],
        items: [{ kind: 'file', type: 'text/plain' }],
        types: ['Files'],
      },
    });

    expect(await screen.findByRole('alert')).toHaveTextContent('notes.txt');
  });
});
