import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { installCanvasStubs, type CanvasStub } from '@/test/canvas';
import { choosePhoto, renderTool } from '@/test/tool';

/**
 * The rule these tests enforce: a landing page must arrive pre-configured for
 * the search that produced it. Changing the URL and the title alone is not a
 * page -- the tool itself has to be set up for that intent.
 */

let canvas: CanvasStub;

beforeEach(() => {
  canvas = installCanvasStubs({
    width: 4000,
    height: 3000,
    // Bytes roughly proportional to quality and area, so target search behaves
    // like the real encoder.
    sizeModel: (quality, width, height) =>
      Math.round(width * height * quality * 0.12),
  });
});

afterEach(() => canvas.restore());

describe('exact-size landing pages', () => {
  test.each([
    ['compress-image-to-50kb', '50 KB'],
    ['compress-image-to-100kb', '100 KB'],
    ['compress-image-to-200kb', '200 KB'],
    ['compress-image-to-300kb', '300 KB'],
    ['compress-image-to-500kb', '500 KB'],
    ['compress-image-to-1mb', '1 MB'],
    ['compress-jpg-to-100kb', '100 KB'],
    ['compress-jpg-to-200kb', '200 KB'],
    ['compress-jpg-to-500kb', '500 KB'],
    ['compress-png-to-100kb', '100 KB'],
  ])('/%s opens with %s already selected', async (slug, label) => {
    const user = userEvent.setup();
    renderTool(slug);
    await choosePhoto(user);

    // aria-pressed / checked state, not just the label being present.
    const selected = screen.getByRole('button', { name: label, pressed: true });
    expect(selected).toBeInTheDocument();
  });

  test('the 300KB page compresses to its own target, not a default', async () => {
    const user = userEvent.setup();
    renderTool('compress-image-to-300kb');
    await choosePhoto(user);

    await user.click(screen.getByRole('button', { name: /^compress$/i }));

    expect(await screen.findByText(/under 300 KB/i)).toBeInTheDocument();
  });

  test('the 1MB page states its target in megabytes, as the user typed it', async () => {
    const user = userEvent.setup();
    renderTool('compress-image-to-1mb');
    await choosePhoto(user);

    await user.click(screen.getByRole('button', { name: /^compress$/i }));

    // Rendered as "1.0 MB": megabytes carry one decimal throughout the app,
    // matching the "2.8 MB" style used everywhere else.
    expect(await screen.findByText(/under 1\.0 MB/i)).toBeInTheDocument();
  });

  test('the PNG page warns that transparency will be lost before the user commits', async () => {
    const user = userEvent.setup();
    renderTool('compress-png-to-100kb');
    await choosePhoto(user);

    // Reaching an exact size requires JPEG. Saying so up front is kinder than
    // a surprise after download.
    expect(screen.getByText(/transparent areas become white/i)).toBeInTheDocument();
  });

  test('a JPG page does not show the PNG transparency warning', async () => {
    const user = userEvent.setup();
    renderTool('compress-jpg-to-100kb');
    await choosePhoto(user);

    expect(screen.queryByText(/transparent areas become white/i)).not.toBeInTheDocument();
  });
});

describe('format-specific compression pages', () => {
  test.each([
    ['compress-jpg', 'Compress your JPG', 'Compress JPG'],
    ['compress-png', 'Compress your PNG', 'Compress PNG'],
    ['compress-webp', 'Compress your WebP', 'Compress WebP'],
  ])('/%s leads with the format in its heading and action', async (slug, heading, action) => {
    const user = userEvent.setup();
    renderTool(slug);

    expect(
      screen.getByRole('heading', { level: 1, name: heading }),
    ).toBeInTheDocument();

    await choosePhoto(user);
    expect(screen.getByRole('button', { name: action })).toBeInTheDocument();
  });

  test('a format-specific page still accepts a different format', async () => {
    // Someone landing on /compress-png with a JPG should be helped, not
    // turned away over a detail they did not choose.
    const user = userEvent.setup();
    renderTool('compress-png');
    await choosePhoto(user);

    await user.click(screen.getByRole('button', { name: 'Compress PNG' }));

    expect(
      await screen.findByRole('button', { name: /^download$/i }),
    ).toBeInTheDocument();
  });
});

describe('compress without losing quality', () => {
  test('opens on the highest quality setting, matching its promise', async () => {
    const user = userEvent.setup();
    renderTool('compress-image-without-losing-quality');
    await choosePhoto(user);

    expect(screen.getByRole('radio', { name: 'Best quality' })).toBeChecked();
  });

  test('encodes at a higher quality than the standard compress page', async () => {
    const user = userEvent.setup();
    renderTool('compress-image-without-losing-quality');
    await choosePhoto(user);
    await user.click(screen.getByRole('button', { name: /compress image/i }));

    const quality = canvas.encodeCalls.at(-1)?.quality ?? 0;
    expect(quality).toBeGreaterThan(0.9);
  });
});
