import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { installCanvasStubs, fakeImageFile, type CanvasStub } from '@/test/canvas';
import { choosePhoto, renderTool } from '@/test/tool';

let canvas: CanvasStub;

beforeEach(() => {
  canvas = installCanvasStubs({ width: 1920, height: 1080 });
});

afterEach(() => canvas.restore());

describe('Format conversion', () => {
  test('JPG → PNG states the output format and encodes PNG', async () => {
    const user = userEvent.setup();
    renderTool('jpg-to-png');
    await choosePhoto(user);

    await user.click(await screen.findByRole('button', { name: 'Convert to PNG' }));

    await waitFor(() => expect(canvas.encodeCalls).toHaveLength(1));
    expect(canvas.encodeCalls[0].type).toBe('image/png');
  });

  test('PNG → JPG encodes JPEG', async () => {
    const user = userEvent.setup();
    renderTool('png-to-jpg');
    await choosePhoto(user, fakeImageFile('logo.png', 500_000, 'image/png'));

    await user.click(await screen.findByRole('button', { name: 'Convert to JPG' }));

    await waitFor(() => expect(canvas.encodeCalls).toHaveLength(1));
    expect(canvas.encodeCalls[0].type).toBe('image/jpeg');
  });

  test('WebP → JPG encodes JPEG', async () => {
    const user = userEvent.setup();
    renderTool('webp-to-jpg');
    await choosePhoto(user, fakeImageFile('shot.webp', 400_000, 'image/webp'));

    await user.click(await screen.findByRole('button', { name: 'Convert to JPG' }));

    await waitFor(() => expect(canvas.encodeCalls).toHaveLength(1));
    expect(canvas.encodeCalls[0].type).toBe('image/jpeg');
  });

  test('PNG → WebP encodes WebP', async () => {
    const user = userEvent.setup();
    renderTool('png-to-webp');
    await choosePhoto(user, fakeImageFile('logo.png', 500_000, 'image/png'));

    await user.click(await screen.findByRole('button', { name: 'Convert to WebP' }));

    await waitFor(() => expect(canvas.encodeCalls).toHaveLength(1));
    expect(canvas.encodeCalls[0].type).toBe('image/webp');
  });

  test('conversion keeps the original dimensions', async () => {
    const user = userEvent.setup();
    renderTool('jpg-to-png');
    await choosePhoto(user);

    await user.click(await screen.findByRole('button', { name: 'Convert to PNG' }));

    expect(await screen.findByText(/1920 × 1080/)).toBeInTheDocument();
  });

  test('the page offers no settings beyond the single action', async () => {
    const user = userEvent.setup();
    renderTool('jpg-to-png');
    await choosePhoto(user);

    // Spec §30: "No unnecessary settings."
    await screen.findByRole('button', { name: 'Convert to PNG' });
    expect(screen.queryAllByRole('radio')).toHaveLength(0);
    expect(screen.queryAllByRole('slider')).toHaveLength(0);
  });
});
