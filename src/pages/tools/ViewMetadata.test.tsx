import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { installCanvasStubs, type CanvasStub } from '@/test/canvas';
import { renderTool } from '@/test/tool';

let canvas: CanvasStub;

beforeEach(() => {
  canvas = installCanvasStubs({ width: 1200, height: 800 });
});

afterEach(() => canvas.restore());

/** A JPEG carrying a camera make, model and a GPS pointer. */
function jpegWithExif(): File {
  const tags = [
    { id: 0x010f, value: 'Canon' },
    { id: 0x0110, value: 'EOS R6' },
    { id: 0x8825, value: 'x' },
  ];
  const entryBytes = tags.length * 12;
  const heap = tags.filter((tag) => tag.value.length + 1 > 4);
  const heapBytes = heap.reduce((sum, tag) => sum + tag.value.length + 1, 0);
  const tiffLength = 8 + 2 + entryBytes + 4 + heapBytes;
  const app1Length = 2 + 6 + tiffLength;
  const buffer = new ArrayBuffer(2 + 2 + app1Length);
  const view = new DataView(buffer);

  let offset = 0;
  view.setUint16(offset, 0xffd8);
  offset += 2;
  view.setUint16(offset, 0xffe1);
  offset += 2;
  view.setUint16(offset, app1Length);
  offset += 2;
  view.setUint32(offset, 0x45786966);
  view.setUint16(offset + 4, 0);
  offset += 6;

  const tiffStart = offset;
  view.setUint16(offset, 0x4d4d);
  view.setUint16(offset + 2, 42);
  view.setUint32(offset + 4, 8);
  offset += 8;
  view.setUint16(offset, tags.length);
  offset += 2;

  let heapOffset = 2 + entryBytes + 4 + 8;
  for (const tag of tags) {
    const bytes = tag.value.length + 1;
    view.setUint16(offset, tag.id);
    view.setUint16(offset + 2, 2);
    view.setUint32(offset + 4, bytes);
    if (bytes <= 4) {
      for (let i = 0; i < tag.value.length; i += 1) {
        view.setUint8(offset + 8 + i, tag.value.charCodeAt(i));
      }
    } else {
      view.setUint32(offset + 8, heapOffset);
      for (let i = 0; i < tag.value.length; i += 1) {
        view.setUint8(tiffStart + heapOffset + i, tag.value.charCodeAt(i));
      }
      heapOffset += bytes;
    }
    offset += 12;
  }
  view.setUint32(offset, 0);

  return new File([buffer], 'holiday.jpg', { type: 'image/jpeg' });
}

async function upload(user: ReturnType<typeof userEvent.setup>, file: File) {
  await user.upload(screen.getByLabelText('Choose image'), file);
}

describe.each(['image-metadata-viewer', 'exif-viewer'])('/%s', (slug) => {
  test('shows the camera make and model the photo records', async () => {
    const user = userEvent.setup();
    renderTool(slug);
    await upload(user, jpegWithExif());

    expect(await screen.findByText('Camera make')).toBeInTheDocument();
    expect(screen.getByText('Canon')).toBeInTheDocument();
    expect(screen.getByText('EOS R6')).toBeInTheDocument();
  });

  test('flags that location data is attached', async () => {
    // The reason most people look: does this photo say where I was?
    const user = userEvent.setup();
    renderTool(slug);
    await upload(user, jpegWithExif());

    expect(await screen.findByText('Location data')).toBeInTheDocument();
    expect(screen.getByText('Present')).toBeInTheDocument();
  });

  test('says plainly when an image carries nothing', async () => {
    const user = userEvent.setup();
    renderTool(slug);
    await upload(
      user,
      new File([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], 'clean.jpg', {
        type: 'image/jpeg',
      }),
    );

    expect(await screen.findByText(/no metadata found/i)).toBeInTheDocument();
  });

  test('offers the removal tool once the user has seen the data', async () => {
    // Seeing GPS data on your own photo creates the intent to strip it; the
    // next step should be one click away.
    const user = userEvent.setup();
    renderTool(slug);
    await upload(user, jpegWithExif());

    const link = await screen.findByRole('link', { name: /remove metadata/i });
    expect(link).toHaveAttribute('href', '/remove-metadata');
  });

  test('does not offer a download, because there is nothing to save', async () => {
    const user = userEvent.setup();
    renderTool(slug);
    await upload(user, jpegWithExif());

    await screen.findByText('Camera make');
    expect(screen.queryByRole('button', { name: /download/i })).not.toBeInTheDocument();
  });
});

describe('metadata removal aliases', () => {
  test.each(['remove-exif', 'remove-image-metadata'])(
    '/%s offers the removal action',
    async (slug) => {
      const user = userEvent.setup();
      renderTool(slug);
      await upload(user, jpegWithExif());

      expect(
        await screen.findByRole('button', { name: /remove metadata/i }),
      ).toBeInTheDocument();
    },
  );
});
