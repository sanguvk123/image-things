import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { installCanvasStubs, fakeImageFile, type CanvasStub } from '@/test/canvas';
import { choosePhoto, renderTool } from '@/test/tool';

let canvas: CanvasStub;

beforeEach(() => {
  canvas = installCanvasStubs({ width: 1920, height: 1080 });
});

afterEach(() => canvas.restore());

/** A JPEG carrying camera make, GPS and capture date in its EXIF block. */
function photoWithExif(): File {
  const tagIds = [0x010f, 0x8825, 0x9003];
  const tiffLength = 8 + 2 + tagIds.length * 12 + 4;
  const app1Length = 2 + 6 + tiffLength;
  const buffer = new ArrayBuffer(4 + app1Length);
  const view = new DataView(buffer);

  view.setUint16(0, 0xffd8);
  view.setUint16(2, 0xffe1);
  view.setUint16(4, app1Length);
  view.setUint32(6, 0x45786966);
  view.setUint16(10, 0);
  view.setUint16(12, 0x4d4d);
  view.setUint16(14, 42);
  view.setUint32(16, 8);
  view.setUint16(20, tagIds.length);

  tagIds.forEach((id, index) => {
    const entry = 22 + index * 12;
    view.setUint16(entry, id);
    view.setUint16(entry + 2, 2);
    view.setUint32(entry + 4, 1);
    view.setUint32(entry + 8, 0);
  });

  return new File([buffer], 'photo.jpg', { type: 'image/jpeg' });
}

describe('Remove Metadata', () => {
  test('names the metadata it found rather than just claiming to strip it', async () => {
    const user = userEvent.setup();
    renderTool('remove-metadata');
    await choosePhoto(user, photoWithExif());

    // Spec §29: the user sees Camera / GPS / Date before deciding.
    expect(await screen.findByText('Camera')).toBeInTheDocument();
    expect(screen.getByText('GPS')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
  });

  test('says plainly when an image carries nothing sensitive', async () => {
    const user = userEvent.setup();
    renderTool('remove-metadata');
    await choosePhoto(user, fakeImageFile('clean.png', 1000, 'image/png'));

    expect(
      await screen.findByText(/no camera, location or device information/i),
    ).toBeInTheDocument();
  });

  test('removing metadata confirms the result and offers the download', async () => {
    const user = userEvent.setup();
    renderTool('remove-metadata');
    await choosePhoto(user, photoWithExif());

    await user.click(await screen.findByRole('button', { name: 'Remove Metadata' }));

    expect(await screen.findByText('✓ Metadata removed')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download' })).toBeInTheDocument();
  });

  test('the cleaned image keeps its original dimensions', async () => {
    const user = userEvent.setup();
    renderTool('remove-metadata');
    await choosePhoto(user, photoWithExif());

    await user.click(await screen.findByRole('button', { name: 'Remove Metadata' }));

    expect(await screen.findByText(/1920 × 1080/)).toBeInTheDocument();
  });
});
