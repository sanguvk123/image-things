import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { installCanvasStubs, fakeImageFile, type CanvasStub } from '@/test/canvas';
import { choosePhoto, renderTool } from '@/test/tool';

let canvas: CanvasStub;

beforeEach(() => {
  canvas = installCanvasStubs({ width: 1920, height: 1080, encodedSize: 96_000 });
});

afterEach(() => canvas.restore());

const uploadPhoto = choosePhoto;

describe('Compress Image', () => {
  test('starts with the upload area, not a form', () => {
    renderTool('compress-image');

    expect(
      screen.getByRole('heading', { level: 1, name: 'Compress Image' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Drop image here')).toBeInTheDocument();
    expect(screen.getByText(/private • secure • no signup/i)).toBeInTheDocument();
    expect(screen.queryByText('Compression')).not.toBeInTheDocument();
  });

  test('choosing an image immediately shows its name, size and dimensions', async () => {
    const user = userEvent.setup();
    renderTool('compress-image');
    await uploadPhoto(user);

    // Spec §4: the facts appear straight away, with no upload wait.
    expect(await screen.findByText('photo.jpg')).toBeInTheDocument();
    expect(screen.getByText(/2\.8 MB · 1920 × 1080 · JPG/)).toBeInTheDocument();
  });

  test('defaults to the Recommended compression level', async () => {
    const user = userEvent.setup();
    renderTool('compress-image');
    await uploadPhoto(user);

    expect(await screen.findByRole('radio', { name: /recommended/i })).toBeChecked();
    expect(screen.getByRole('radio', { name: /smaller/i })).not.toBeChecked();
  });

  test('compressing produces a downloadable, smaller result', async () => {
    const user = userEvent.setup();
    renderTool('compress-image');
    await uploadPhoto(user);

    await user.click(await screen.findByRole('button', { name: 'Compress Image' }));

    expect(await screen.findByText('2.8 MB → 96 KB')).toBeInTheDocument();
    expect(screen.getByText('97% smaller')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download' })).toBeInTheDocument();
  });

  test('the chosen level changes the encoder quality', async () => {
    const user = userEvent.setup();
    renderTool('compress-image');
    await uploadPhoto(user);

    await user.click(await screen.findByRole('radio', { name: /smaller/i }));
    await user.click(screen.getByRole('button', { name: 'Compress Image' }));

    await waitFor(() => expect(canvas.encodeCalls).toHaveLength(1));
    const [call] = canvas.encodeCalls;
    expect(call.type).toBe('image/jpeg');
    // "Smaller" must compress harder than "Recommended" (0.82).
    expect(call.quality).toBeLessThan(0.82);
  });

  test('start over returns to the upload area', async () => {
    const user = userEvent.setup();
    renderTool('compress-image');
    await uploadPhoto(user);

    await user.click(await screen.findByRole('button', { name: 'Compress Image' }));
    await user.click(await screen.findByRole('button', { name: 'Start over' }));

    expect(screen.getByText('Drop image here')).toBeInTheDocument();
  });

  test('an undecodable file explains itself instead of failing silently', async () => {
    const user = userEvent.setup();
    globalThis.createImageBitmap = (() =>
      Promise.reject(new Error('decode failed'))) as unknown as typeof createImageBitmap;

    renderTool('compress-image');
    await user.upload(
      screen.getByLabelText('Choose image'),
      fakeImageFile('broken.jpg'),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /doesn't look like an image we can open/i,
    );
  });
});
