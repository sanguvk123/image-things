import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { installCanvasStubs, type CanvasStub } from '@/test/canvas';
import { choosePhoto, renderTool } from '@/test/tool';

let canvas: CanvasStub;

beforeEach(() => {
  canvas = installCanvasStubs({ width: 800, height: 600 });
});

afterEach(() => canvas.restore());

describe('Upscale Image', () => {
  test('defaults to 2× and says what the new size will be', async () => {
    const user = userEvent.setup();
    renderTool('upscale-image');
    await choosePhoto(user);

    expect(await screen.findByRole('button', { name: '2×' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByText('800 × 600 → 1600 × 1200')).toBeInTheDocument();
  });

  test('choosing a larger factor updates the promised size', async () => {
    const user = userEvent.setup();
    renderTool('upscale-image');
    await choosePhoto(user);

    await user.click(await screen.findByRole('button', { name: '4×' }));

    expect(screen.getByText('800 × 600 → 3200 × 2400')).toBeInTheDocument();
  });

  test('upscaling renders at the enlarged dimensions', async () => {
    const user = userEvent.setup();
    renderTool('upscale-image');
    await choosePhoto(user);

    await user.click(await screen.findByRole('button', { name: '3×' }));
    await user.click(screen.getByRole('button', { name: 'Upscale Image' }));

    await waitFor(() => expect(canvas.encodeCalls).toHaveLength(1));
    expect(canvas.encodeCalls[0]).toMatchObject({ width: 2400, height: 1800 });
  });
});

describe('Remove Background', () => {
  test('sets expectations about what it can handle', async () => {
    const user = userEvent.setup();
    renderTool('remove-background');
    await choosePhoto(user);

    expect(
      await screen.findByText(/works best on photos with a plain, even background/i),
    ).toBeInTheDocument();
  });

  test('always saves as PNG so transparency survives', async () => {
    const user = userEvent.setup();
    renderTool('remove-background');
    await choosePhoto(user);

    await user.click(await screen.findByRole('button', { name: 'Remove Background' }));

    await waitFor(() => expect(canvas.encodeCalls).toHaveLength(1));
    // JPEG has no alpha channel, so PNG is the only correct output here.
    expect(canvas.encodeCalls[0].type).toBe('image/png');
    expect(await screen.findByText(/background removed/i)).toBeInTheDocument();
  });

  test('tolerance can be adjusted before removing', async () => {
    const user = userEvent.setup();
    renderTool('remove-background');
    await choosePhoto(user);

    const slider = await screen.findByLabelText('Tolerance');
    expect(slider).toHaveValue('20');

    await user.click(screen.getByRole('button', { name: 'Remove Background' }));
    expect(await screen.findByRole('button', { name: 'Download' })).toBeInTheDocument();
  });
});
