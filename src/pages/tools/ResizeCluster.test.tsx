import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { installCanvasStubs, type CanvasStub } from '@/test/canvas';
import { choosePhoto, renderTool } from '@/test/tool';

let canvas: CanvasStub;

beforeEach(() => {
  canvas = installCanvasStubs({ width: 4000, height: 3000 });
});

afterEach(() => canvas.restore());

const EXACT_SIZES = [
  ['resize-image-to-1080x1080', 1080, 1080],
  ['resize-image-to-1920x1080', 1920, 1080],
  ['resize-image-to-1280x720', 1280, 720],
  ['resize-image-to-1200x630', 1200, 630],
  ['resize-image-to-512x512', 512, 512],
  ['resize-image-to-800x800', 800, 800],
] as const;

describe('exact-dimension landing pages', () => {
  test.each(EXACT_SIZES)(
    '/%s opens with %i × %i already filled in',
    async (slug, width, height) => {
      const user = userEvent.setup();
      renderTool(slug);
      await choosePhoto(user);

      expect(screen.getByLabelText('Width')).toHaveValue(width);
      expect(screen.getByLabelText('Height')).toHaveValue(height);
    },
  );

  test.each(EXACT_SIZES)(
    '/%s produces exactly %i × %i',
    async (slug, width, height) => {
      const user = userEvent.setup();
      renderTool(slug);
      await choosePhoto(user);

      await user.click(screen.getByRole('button', { name: /^resize to/i }));

      const encoded = canvas.encodeCalls.at(-1);
      expect(encoded?.width).toBe(width);
      expect(encoded?.height).toBe(height);
    },
  );

  test('the promised size survives a source with a different aspect ratio', async () => {
    // A 4000x3000 source is 4:3. If the ratio lock were left on, a page
    // promising a 1080 square would quietly deliver 1080x810 instead.
    const user = userEvent.setup();
    renderTool('resize-image-to-1080x1080');
    await choosePhoto(user);

    expect(screen.getByLabelText('Maintain aspect ratio')).not.toBeChecked();
    await user.click(screen.getByRole('button', { name: /^resize to/i }));

    expect(canvas.encodeCalls.at(-1)).toMatchObject({ width: 1080, height: 1080 });
  });

  test('the action button names the size the page promised', async () => {
    const user = userEvent.setup();
    renderTool('resize-image-to-512x512');
    await choosePhoto(user);

    expect(
      screen.getByRole('button', { name: 'Resize to 512 × 512' }),
    ).toBeInTheDocument();
  });

  test('the preset can still be overridden by the user', async () => {
    const user = userEvent.setup();
    renderTool('resize-image-to-800x800');
    await choosePhoto(user);

    const width = screen.getByLabelText('Width');
    await user.clear(width);
    await user.type(width, '640');

    expect(width).toHaveValue(640);
  });
});

describe('general resize pages', () => {
  test.each(['resize-image', 'resize-jpg', 'resize-png', 'resize-image-by-pixels'])(
    '/%s starts from the image’s own dimensions',
    async (slug) => {
      // No size is promised by these URLs, so the sensible default is the
      // image the user just chose.
      const user = userEvent.setup();
      renderTool(slug);
      await choosePhoto(user);

      expect(screen.getByLabelText('Width')).toHaveValue(4000);
      expect(screen.getByLabelText('Height')).toHaveValue(3000);
    },
  );

  test('general pages keep the aspect ratio locked by default', async () => {
    const user = userEvent.setup();
    renderTool('resize-image');
    await choosePhoto(user);

    expect(screen.getByLabelText('Maintain aspect ratio')).toBeChecked();
  });
});
