import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { installCanvasStubs, fakeImageFile, type CanvasStub } from '@/test/canvas';
import { renderTool } from '@/test/tool';

let canvas: CanvasStub;

beforeEach(() => {
  canvas = installCanvasStubs({ width: 1920, height: 1080 });
});

afterEach(() => canvas.restore());

const chooser = () => screen.getByLabelText('Choose images');

describe('Image to PDF', () => {
  test('accepts several images at once', async () => {
    const user = userEvent.setup();
    renderTool('image-to-pdf');

    await user.upload(chooser(), [
      fakeImageFile('one.jpg', 1000),
      fakeImageFile('two.jpg', 1000),
    ]);

    expect(await screen.findByText('one.jpg')).toBeInTheDocument();
    expect(screen.getByText('two.jpg')).toBeInTheDocument();
  });

  test('numbers the pages in the order they were added', async () => {
    const user = userEvent.setup();
    renderTool('image-to-pdf');

    await user.upload(chooser(), [
      fakeImageFile('first.jpg', 1000),
      fakeImageFile('second.jpg', 1000),
    ]);

    expect(await screen.findByText(/Page 1 · 1920 × 1080/)).toBeInTheDocument();
    expect(screen.getByText(/Page 2 · 1920 × 1080/)).toBeInTheDocument();
  });

  test('the action names how many pages will be created', async () => {
    const user = userEvent.setup();
    renderTool('image-to-pdf');

    await user.upload(chooser(), [fakeImageFile('only.jpg', 1000)]);
    expect(
      await screen.findByRole('button', { name: 'Create PDF (1 page)' }),
    ).toBeInTheDocument();

    await user.upload(chooser(), [fakeImageFile('another.jpg', 1000)]);
    expect(
      await screen.findByRole('button', { name: 'Create PDF (2 pages)' }),
    ).toBeInTheDocument();
  });

  test('an image can be removed before creating the PDF', async () => {
    const user = userEvent.setup();
    renderTool('image-to-pdf');

    await user.upload(chooser(), [
      fakeImageFile('keep.jpg', 1000),
      fakeImageFile('drop.jpg', 1000),
    ]);

    await user.click(await screen.findByRole('button', { name: 'Remove drop.jpg' }));

    expect(screen.queryByText('drop.jpg')).not.toBeInTheDocument();
    expect(screen.getByText('keep.jpg')).toBeInTheDocument();
  });

  test('creating the PDF offers it for download', async () => {
    const user = userEvent.setup();
    renderTool('image-to-pdf');

    await user.upload(chooser(), [
      fakeImageFile('a.jpg', 1000),
      fakeImageFile('b.jpg', 1000),
    ]);
    await user.click(
      await screen.findByRole('button', { name: 'Create PDF (2 pages)' }),
    );

    expect(await screen.findByText('PDF ready · 2 pages')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download PDF' })).toBeInTheDocument();
  });

  test('every page is encoded as JPEG, which is what PDF embeds', async () => {
    const user = userEvent.setup();
    renderTool('image-to-pdf');

    await user.upload(chooser(), [
      fakeImageFile('a.png', 1000, 'image/png'),
      fakeImageFile('b.png', 1000, 'image/png'),
    ]);
    await user.click(
      await screen.findByRole('button', { name: 'Create PDF (2 pages)' }),
    );

    await screen.findByText('PDF ready · 2 pages');
    expect(canvas.encodeCalls).toHaveLength(2);
    expect(canvas.encodeCalls.every((call) => call.type === 'image/jpeg')).toBe(true);
  });
});
