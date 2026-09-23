import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { installCanvasStubs, fakeImageFile, type CanvasStub } from '@/test/canvas';
import { renderTool } from '@/test/tool';

let canvas: CanvasStub;

beforeEach(() => {
  canvas = installCanvasStubs({ width: 1920, height: 1080 });
});

afterEach(() => canvas.restore());

/** A DataTransfer-shaped object; jsdom has no real implementation. */
function transferWith(files: File[]) {
  return {
    files,
    items: files.map((file) => ({ kind: 'file', type: file.type })),
    types: ['Files'],
  };
}

const dropzone = () => screen.getByText('Drop image here').closest('div')!;

describe('drag and drop', () => {
  // The drag highlight is an applied class, not a substring. Matching on
  // substrings confused `border-accent` with the `hover:border-accent/50`
  // variant, which meant the "cleared" assertion could never fail.
  const isHighlighted = (zone: HTMLElement) =>
    zone.classList.contains('border-accent');

  test('the interface reacts the moment a file is dragged over it', () => {
    renderTool('compress-image');
    const zone = dropzone();

    fireEvent.dragEnter(zone, { dataTransfer: transferWith([fakeImageFile()]) });

    // Spec §12: "The interface should immediately react."
    expect(isHighlighted(zone)).toBe(true);
  });

  test('the highlight clears when the file is dragged away again', () => {
    renderTool('compress-image');
    const zone = dropzone();
    const dataTransfer = transferWith([fakeImageFile()]);

    fireEvent.dragEnter(zone, { dataTransfer });
    expect(isHighlighted(zone)).toBe(true);

    fireEvent.dragLeave(zone, { dataTransfer });
    expect(isHighlighted(zone)).toBe(false);
  });

  test('dropping an image loads it', async () => {
    renderTool('compress-image');

    fireEvent.drop(dropzone(), {
      dataTransfer: transferWith([fakeImageFile('dropped.jpg', 2_800_000)]),
    });

    expect(await screen.findByText('dropped.jpg')).toBeInTheDocument();
  });

  test('dropping a non-image is ignored rather than erroring', () => {
    renderTool('compress-image');

    fireEvent.drop(dropzone(), {
      dataTransfer: transferWith([
        new File(['notes'], 'notes.txt', { type: 'text/plain' }),
      ]),
    });

    expect(screen.getByText('Drop image here')).toBeInTheDocument();
  });

  test.each([
    ['photo.heic', 'HEIC'],
    ['scan.tiff', 'TIFF'],
  ])('accepts %s even when the browser reports no MIME type', async (name) => {
    // Browsers often report an empty type for HEIC and TIFF. Filtering on
    // file.type alone would reject the exact files these tools exist for.
    renderTool('compress-image');

    fireEvent.drop(dropzone(), {
      dataTransfer: transferWith([fakeImageFile(name, 2_000_000, '')]),
    });

    expect(await screen.findByText(name)).toBeInTheDocument();
  });

  test('a typeless file that is not an image is still ignored', () => {
    renderTool('compress-image');

    fireEvent.drop(dropzone(), {
      dataTransfer: transferWith([new File(['data'], 'archive.zip', { type: '' })]),
    });

    expect(screen.getByText('Drop image here')).toBeInTheDocument();
  });
});

describe('clipboard paste', () => {
  test('pasting a screenshot loads it with no file picker', async () => {
    renderTool('compress-image');

    // Spec §13: screenshot → paste → the image is simply there.
    fireEvent.paste(window, {
      clipboardData: transferWith([fakeImageFile('screenshot.png', 500_000, 'image/png')]),
    });

    expect(await screen.findByText('screenshot.png')).toBeInTheDocument();
  });

  test('pasting text is ignored', () => {
    renderTool('compress-image');

    fireEvent.paste(window, { clipboardData: { files: [], types: ['text/plain'] } });

    expect(screen.getByText('Drop image here')).toBeInTheDocument();
  });

  test('the page tells the user that pasting is possible', () => {
    renderTool('compress-image');

    expect(screen.getByText(/paste from your clipboard/i)).toBeInTheDocument();
  });
});

describe('file picker', () => {
  test('the same file can be chosen again after removing it', async () => {
    const user = userEvent.setup();
    renderTool('compress-image');

    await user.upload(
      screen.getByLabelText('Choose image'),
      fakeImageFile('same.jpg', 1000),
    );
    expect(await screen.findByText('same.jpg')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Remove ×' }));

    // The dropzone comes back, so the picker must be looked up afresh.
    await user.upload(
      await screen.findByLabelText('Choose image'),
      fakeImageFile('same.jpg', 1000),
    );

    expect(await screen.findByText('same.jpg')).toBeInTheDocument();
  });

  test('lists the formats that are accepted', () => {
    renderTool('compress-image');

    // TIFF is advertised now that we decode it ourselves; promising a format
    // we cannot open would be worse than not listing it.
    expect(screen.getByText('JPG • PNG • WebP • HEIC • TIFF')).toBeInTheDocument();
  });
});
