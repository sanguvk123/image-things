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
    expect(screen.getByText('Never uploaded')).toBeInTheDocument();
    expect(screen.getByText('No signup')).toBeInTheDocument();
    expect(screen.queryByText('Compression')).not.toBeInTheDocument();
  });

  test('keeps the tool above the supporting content', () => {
    // The failure mode for SEO copy is an article with the tool buried under
    // it. Someone searching "compress image" wants the upload box first.
    renderTool('compress-image');

    const upload = screen.getByText('Drop image here');
    const howTo = screen.getByRole('heading', { name: /^how to/i });

    expect(upload.compareDocumentPosition(howTo)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
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

  // Spec §17. Asserted through the rendered page rather than against the copy
  // helper, because the helper being correct proves nothing if the page never
  // shows what it returns.
  test('the failure names the file and says what to do next', async () => {
    const user = userEvent.setup();
    globalThis.createImageBitmap = (() =>
      Promise.reject(new Error('decode failed'))) as unknown as typeof createImageBitmap;

    renderTool('compress-image');
    await user.upload(
      screen.getByLabelText('Choose image'),
      fakeImageFile('broken.jpg'),
    );

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('broken.jpg');
    expect(alert).toHaveTextContent(/try saving it as/i);
  });

  test('an operation that fails does not show the user an internal error', async () => {
    const user = userEvent.setup();

    renderTool('compress-image');
    await uploadPhoto(user);

    // A failing encoder is the real path here: pipeline.encode rejects with
    // "The browser could not encode this image." -- accurate, and useless to
    // someone who just wants a smaller file.
    HTMLCanvasElement.prototype.toBlob = function (callback: BlobCallback) {
      callback(null);
    };

    await user.click(await screen.findByRole('button', { name: 'Compress Image' }));

    const alert = await screen.findByRole('alert');
    expect(alert).not.toHaveTextContent(/could not encode this image/i);
    expect(alert).toHaveTextContent(/try/i);
  });
});
