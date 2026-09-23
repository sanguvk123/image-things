import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { installCanvasStubs, type CanvasStub } from '@/test/canvas';
import { choosePhoto, renderTool } from '@/test/tool';

let canvas: CanvasStub;

beforeEach(() => {
  canvas = installCanvasStubs({ width: 1920, height: 1080 });
});

afterEach(() => canvas.restore());

describe('Sharpen Image', () => {
  test('defaults to Recommended', async () => {
    const user = userEvent.setup();
    renderTool('sharpen-image');
    await choosePhoto(user);

    expect(await screen.findByRole('radio', { name: 'Recommended' })).toBeChecked();
  });

  test('offers exactly the three strengths from the spec', async () => {
    const user = userEvent.setup();
    renderTool('sharpen-image');
    await choosePhoto(user);

    await screen.findByRole('radio', { name: 'Recommended' });
    expect(screen.getAllByRole('radio')).toHaveLength(3);
    for (const label of ['Light', 'Recommended', 'Strong']) {
      expect(screen.getByRole('radio', { name: label })).toBeInTheDocument();
    }
  });

  test('sharpening produces a downloadable image at the same size', async () => {
    const user = userEvent.setup();
    renderTool('sharpen-image');
    await choosePhoto(user);

    await user.click(await screen.findByRole('button', { name: 'Sharpen Image' }));

    await waitFor(() => expect(canvas.encodeCalls).toHaveLength(1));
    expect(canvas.encodeCalls[0]).toMatchObject({ width: 1920, height: 1080 });
    expect(await screen.findByRole('button', { name: 'Download' })).toBeInTheDocument();
  });

  test('a different strength can be chosen before sharpening', async () => {
    const user = userEvent.setup();
    renderTool('sharpen-image');
    await choosePhoto(user);

    await user.click(await screen.findByRole('radio', { name: 'Strong' }));
    expect(screen.getByRole('radio', { name: 'Strong' })).toBeChecked();

    await user.click(screen.getByRole('button', { name: 'Sharpen Image' }));
    expect(await screen.findByRole('button', { name: 'Download' })).toBeInTheDocument();
  });
});
