import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { installCanvasStubs, fakeImageFile, type CanvasStub } from '@/test/canvas';
import { choosePhoto, renderTool } from '@/test/tool';

/**
 * Pages named after the user's problem rather than after a tool.
 *
 * Someone typing "make image smaller" has described a situation, not chosen an
 * operation. These pages have to land them on something that solves it
 * immediately.
 */

let canvas: CanvasStub;

beforeEach(() => {
  canvas = installCanvasStubs({ width: 4000, height: 3000 });
});

afterEach(() => canvas.restore());

describe('size-problem pages', () => {
  test.each([
    ['reduce-image-size', 'Reduce your image size'],
    ['make-image-smaller', 'Make your image smaller'],
    ['make-jpg-smaller', 'Make your JPG smaller'],
  ])('/%s leads with the problem in the visitor’s own words', (slug, heading) => {
    renderTool(slug);

    expect(
      screen.getByRole('heading', { level: 1, name: heading }),
    ).toBeInTheDocument();
  });

  test.each(['reduce-image-size', 'make-image-smaller', 'make-jpg-smaller'])(
    '/%s actually produces a smaller file',
    async (slug) => {
      const user = userEvent.setup();
      renderTool(slug);
      await choosePhoto(user);

      await user.click(screen.getByRole('button', { name: /^compress/i }));

      // The promise in the URL is a smaller file, so the page has to deliver
      // one rather than merely offering a compression control.
      expect(await screen.findByText(/% smaller/)).toBeInTheDocument();
      expect(canvas.encodeCalls.at(-1)?.quality).toBeLessThan(1);
    },
  );
});

describe('change-image-size', () => {
  test('opens the resize tool, not the compressor', async () => {
    // "Change size" means dimensions, even though "size" could mean bytes.
    const user = userEvent.setup();
    renderTool('change-image-size');
    await choosePhoto(user);

    expect(screen.getByLabelText('Width')).toHaveValue(4000);
    expect(screen.getByLabelText('Height')).toHaveValue(3000);
  });
});

describe('format-specific PDF pages', () => {
  test.each([
    ['jpg-to-pdf', 'Convert your JPG to PDF'],
    ['png-to-pdf', 'Convert your PNG to PDF'],
  ])('/%s leads with that format', (slug, heading) => {
    renderTool(slug);

    expect(
      screen.getByRole('heading', { level: 1, name: heading }),
    ).toBeInTheDocument();
  });

  test.each(['jpg-to-pdf', 'png-to-pdf'])('/%s produces a PDF', async (slug) => {
    const user = userEvent.setup();
    renderTool(slug);

    await user.upload(
      screen.getByLabelText('Choose images'),
      fakeImageFile('scan.jpg', 900_000),
    );
    await user.click(await screen.findByRole('button', { name: /create pdf/i }));

    expect(await screen.findByText(/pdf ready/i)).toBeInTheDocument();
  });

  test('the PDF pages still accept several images at once', async () => {
    const user = userEvent.setup();
    renderTool('jpg-to-pdf');

    await user.upload(screen.getByLabelText('Choose images'), [
      fakeImageFile('one.jpg', 500_000),
      fakeImageFile('two.jpg', 500_000),
    ]);
    await user.click(await screen.findByRole('button', { name: /create pdf/i }));

    expect(await screen.findByText(/2 pages/i)).toBeInTheDocument();
  });
});
