import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { installCanvasStubs, type CanvasStub } from '@/test/canvas';
import { choosePhoto, renderTool } from '@/test/tool';

let canvas: CanvasStub;

beforeEach(() => {
  canvas = installCanvasStubs({ width: 1920, height: 1080 });
});

afterEach(() => canvas.restore());

describe('Crop Image', () => {
  test('shows a draggable crop selection over the image', async () => {
    const user = userEvent.setup();
    renderTool('crop-image');
    await choosePhoto(user);

    expect(await screen.findByLabelText('Crop selection')).toBeInTheDocument();
  });

  test('reports the crop size in pixels as the user adjusts it', async () => {
    const user = userEvent.setup();
    renderTool('crop-image');
    await choosePhoto(user);

    // Default free crop is the centred 80% box.
    expect(await screen.findByText('1536 × 864')).toBeInTheDocument();
  });

  test('choosing 1:1 makes the crop square in real pixels', async () => {
    const user = userEvent.setup();
    renderTool('crop-image');
    await choosePhoto(user);

    await user.click(await screen.findByRole('button', { name: '1:1' }));

    // The full height of a 1920×1080 image, squared off.
    expect(screen.getByText('1080 × 1080')).toBeInTheDocument();
  });

  test('choosing 16:9 on a 16:9 image selects the whole frame', async () => {
    const user = userEvent.setup();
    renderTool('crop-image');
    await choosePhoto(user);

    await user.click(await screen.findByRole('button', { name: '16:9' }));

    expect(screen.getByText('1920 × 1080')).toBeInTheDocument();
  });

  test('cropping renders a canvas of exactly the selected size', async () => {
    const user = userEvent.setup();
    renderTool('crop-image');
    await choosePhoto(user);

    await user.click(await screen.findByRole('button', { name: '1:1' }));
    await user.click(screen.getByRole('button', { name: 'Crop Image' }));

    await waitFor(() => expect(canvas.encodeCalls).toHaveLength(1));
    expect(canvas.encodeCalls[0]).toMatchObject({ width: 1080, height: 1080 });
  });

  test('offers ratio presets rather than a full editor', async () => {
    const user = userEvent.setup();
    renderTool('crop-image');
    await choosePhoto(user);

    // Spec §20: "Don't build a full Photoshop-style editor."
    await screen.findByRole('button', { name: 'Free' });
    for (const label of ['Free', '1:1', '4:5', '16:9']) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }
    expect(screen.queryAllByRole('slider')).toHaveLength(0);
  });
});
