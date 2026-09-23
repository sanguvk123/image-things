import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { installCanvasStubs, type CanvasStub } from '@/test/canvas';
import { choosePhoto, renderTool } from '@/test/tool';

let canvas: CanvasStub;

beforeEach(() => {
  canvas = installCanvasStubs({ width: 1920, height: 1080 });
});

afterEach(() => canvas.restore());

describe('Resize Image', () => {
  test('prefills the fields with the image’s current dimensions', async () => {
    const user = userEvent.setup();
    renderTool('resize-image');
    await choosePhoto(user);

    expect(await screen.findByLabelText('Width')).toHaveValue(1920);
    expect(screen.getByLabelText('Height')).toHaveValue(1080);
  });

  test('changing the width recalculates the height automatically', async () => {
    const user = userEvent.setup();
    renderTool('resize-image');
    await choosePhoto(user);

    const width = await screen.findByLabelText('Width');
    await user.clear(width);
    await user.type(width, '1200');

    // Spec §19: the user should never have to do this arithmetic.
    expect(screen.getByLabelText('Height')).toHaveValue(675);
  });

  test('changing the height recalculates the width automatically', async () => {
    const user = userEvent.setup();
    renderTool('resize-image');
    await choosePhoto(user);

    const height = await screen.findByLabelText('Height');
    await user.clear(height);
    await user.type(height, '540');

    expect(screen.getByLabelText('Width')).toHaveValue(960);
  });

  test('unchecking aspect ratio allows a free stretch', async () => {
    const user = userEvent.setup();
    renderTool('resize-image');
    await choosePhoto(user);

    await user.click(await screen.findByLabelText('Maintain aspect ratio'));
    const width = screen.getByLabelText('Width');
    await user.clear(width);
    await user.type(width, '800');

    expect(screen.getByLabelText('Height')).toHaveValue(1080);
  });

  test('a quick size fills both fields at once', async () => {
    const user = userEvent.setup();
    renderTool('resize-image');
    await choosePhoto(user);

    await user.click(await screen.findByRole('button', { name: '1200 × 630' }));

    expect(screen.getByLabelText('Width')).toHaveValue(1200);
    expect(screen.getByLabelText('Height')).toHaveValue(630);
  });

  test('resizing renders at the requested dimensions', async () => {
    const user = userEvent.setup();
    renderTool('resize-image');
    await choosePhoto(user);

    await user.click(await screen.findByRole('button', { name: '1200 × 630' }));
    await user.click(screen.getByRole('button', { name: 'Resize Image' }));

    await waitFor(() => expect(canvas.encodeCalls).toHaveLength(1));
    expect(canvas.encodeCalls[0]).toMatchObject({ width: 1200, height: 630 });
    expect(await screen.findByText(/1200 × 630/)).toBeInTheDocument();
  });
});
