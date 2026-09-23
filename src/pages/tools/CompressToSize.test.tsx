import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { installCanvasStubs, type CanvasStub } from '@/test/canvas';
import { choosePhoto as uploadPhoto, renderTool } from '@/test/tool';

let canvas: CanvasStub;

/** Encoded size falls with quality and with pixel count, like a real encoder. */
const realisticEncoder = (quality: number, width: number, height: number) =>
  width * height * quality * 0.9;

beforeEach(() => {
  canvas = installCanvasStubs({
    width: 1920,
    height: 1080,
    sizeModel: realisticEncoder,
  });
});

afterEach(() => canvas.restore());

describe('Compress to exact size', () => {
  test('a size-specific tool arrives with its target already selected', async () => {
    const user = userEvent.setup();
    renderTool('compress-image-to-100kb');
    await uploadPhoto(user);

    // Spec §17: presets eliminate typing; the URL already said 100KB.
    expect(await screen.findByRole('button', { name: '100 KB' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByLabelText('Custom target')).toHaveValue(100);
  });

  test('compresses under the requested size and confirms it', async () => {
    const user = userEvent.setup();
    renderTool('compress-image-to-100kb');
    await uploadPhoto(user);

    await user.click(await screen.findByRole('button', { name: 'Compress' }));

    expect(await screen.findByText('✓ Under 100 KB')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download' })).toBeInTheDocument();
  });

  test('choosing a preset changes the target that gets applied', async () => {
    const user = userEvent.setup();
    renderTool('compress-image-to-size');
    await uploadPhoto(user);

    await user.click(await screen.findByRole('button', { name: '50 KB' }));
    await user.click(screen.getByRole('button', { name: 'Compress' }));

    expect(await screen.findByText('✓ Under 50 KB')).toBeInTheDocument();
  });

  test('a custom target is respected', async () => {
    const user = userEvent.setup();
    renderTool('compress-image-to-size');
    await uploadPhoto(user);

    const input = await screen.findByLabelText('Custom target');
    await user.clear(input);
    await user.type(input, '250');
    await user.click(screen.getByRole('button', { name: 'Compress' }));

    expect(await screen.findByText('✓ Under 250 KB')).toBeInTheDocument();
  });

  test('always encodes as JPEG, the only format with a usable quality dial', async () => {
    const user = userEvent.setup();
    renderTool('compress-image-to-100kb');
    await uploadPhoto(user);

    await user.click(await screen.findByRole('button', { name: 'Compress' }));
    await screen.findByRole('button', { name: 'Download' });

    expect(canvas.encodeCalls.every((call) => call.type === 'image/jpeg')).toBe(true);
  });

  test('says so honestly when the target cannot be reached', async () => {
    canvas.restore();
    // An encoder whose output never shrinks: no quality or scale reaches 1KB.
    canvas = installCanvasStubs({ sizeModel: () => 5_000_000 });

    const user = userEvent.setup();
    renderTool('compress-image-to-size');
    await uploadPhoto(user);

    const input = await screen.findByLabelText('Custom target');
    await user.clear(input);
    await user.type(input, '1');
    await user.click(screen.getByRole('button', { name: 'Compress' }));

    expect(await screen.findByText(/smallest possible/i)).toBeInTheDocument();
  });
});
