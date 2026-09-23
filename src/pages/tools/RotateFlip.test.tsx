import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { installCanvasStubs, type CanvasStub } from '@/test/canvas';
import { choosePhoto, renderTool } from '@/test/tool';

let canvas: CanvasStub;

beforeEach(() => {
  canvas = installCanvasStubs({ width: 1920, height: 1080 });
});

afterEach(() => canvas.restore());

describe('Rotate Image', () => {
  test('cannot save until something has actually been rotated', async () => {
    const user = userEvent.setup();
    renderTool('rotate-image');
    await choosePhoto(user);

    expect(await screen.findByRole('button', { name: 'Save Image' })).toBeDisabled();
    expect(screen.getByText('No rotation')).toBeInTheDocument();
  });

  test('a quarter turn swaps the output dimensions', async () => {
    const user = userEvent.setup();
    renderTool('rotate-image');
    await choosePhoto(user);

    await user.click(await screen.findByRole('button', { name: 'Rotate right 90°' }));
    expect(screen.getByText('Rotated 90°')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Save Image' }));

    await waitFor(() => expect(canvas.encodeCalls).toHaveLength(1));
    // A landscape photo becomes portrait.
    expect(canvas.encodeCalls[0]).toMatchObject({ width: 1080, height: 1920 });
  });

  test('180° keeps the dimensions', async () => {
    const user = userEvent.setup();
    renderTool('rotate-image');
    await choosePhoto(user);

    await user.click(await screen.findByRole('button', { name: 'Rotate 180°' }));
    await user.click(screen.getByRole('button', { name: 'Save Image' }));

    await waitFor(() => expect(canvas.encodeCalls).toHaveLength(1));
    expect(canvas.encodeCalls[0]).toMatchObject({ width: 1920, height: 1080 });
  });

  test('four right turns return to the original orientation', async () => {
    const user = userEvent.setup();
    renderTool('rotate-image');
    await choosePhoto(user);

    const right = await screen.findByRole('button', { name: 'Rotate right 90°' });
    for (let i = 0; i < 4; i += 1) await user.click(right);

    expect(screen.getByText('No rotation')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save Image' })).toBeDisabled();
  });

  test('rotating left from zero shows 270°', async () => {
    const user = userEvent.setup();
    renderTool('rotate-image');
    await choosePhoto(user);

    await user.click(await screen.findByRole('button', { name: 'Rotate left 90°' }));
    expect(screen.getByText('Rotated 270°')).toBeInTheDocument();
  });
});

describe('Flip Image', () => {
  test('cannot save until an axis is chosen', async () => {
    const user = userEvent.setup();
    renderTool('flip-image');
    await choosePhoto(user);

    expect(await screen.findByRole('button', { name: 'Save Image' })).toBeDisabled();
  });

  test('flipping horizontally keeps dimensions and produces a result', async () => {
    const user = userEvent.setup();
    renderTool('flip-image');
    await choosePhoto(user);

    await user.click(await screen.findByRole('button', { name: /horizontal/i }));
    await user.click(screen.getByRole('button', { name: 'Save Image' }));

    await waitFor(() => expect(canvas.encodeCalls).toHaveLength(1));
    expect(canvas.encodeCalls[0]).toMatchObject({ width: 1920, height: 1080 });
    expect(await screen.findByRole('button', { name: 'Download' })).toBeInTheDocument();
  });

  test('both axes can be flipped in a single save', async () => {
    const user = userEvent.setup();
    renderTool('flip-image');
    await choosePhoto(user);

    await user.click(await screen.findByRole('button', { name: /horizontal/i }));
    await user.click(screen.getByRole('button', { name: /vertical/i }));
    await user.click(screen.getByRole('button', { name: 'Save Image' }));

    // One pass, not two: both mirrors happen in the same draw.
    await waitFor(() => expect(canvas.encodeCalls).toHaveLength(1));
  });

  test('toggling an axis off again disables saving', async () => {
    const user = userEvent.setup();
    renderTool('flip-image');
    await choosePhoto(user);

    const horizontal = await screen.findByRole('button', { name: /horizontal/i });
    await user.click(horizontal);
    expect(screen.getByRole('button', { name: 'Save Image' })).toBeEnabled();

    await user.click(horizontal);
    expect(screen.getByRole('button', { name: 'Save Image' })).toBeDisabled();
  });
});
