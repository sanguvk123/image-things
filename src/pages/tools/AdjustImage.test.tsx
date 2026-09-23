import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { installCanvasStubs, type CanvasStub } from '@/test/canvas';
import { choosePhoto, renderTool } from '@/test/tool';

let canvas: CanvasStub;

beforeEach(() => {
  canvas = installCanvasStubs({ width: 1920, height: 1080 });
});

afterEach(() => canvas.restore());

/** The preview image the user is looking at while adjusting. */
const previewImage = () => screen.getByAltText('photo.jpg');

/**
 * Drag a slider to a value.
 *
 * jsdom does not implement arrow-key or pointer behaviour for range inputs,
 * so a change event is the faithful stand-in for the user dragging the thumb.
 */
async function dragSlider(label: string, value: number) {
  const slider = await screen.findByLabelText(label);
  fireEvent.change(slider, { target: { value: String(value) } });
  return slider;
}

describe('Brighten Image', () => {
  test('cannot apply until the slider has actually moved', async () => {
    const user = userEvent.setup();
    renderTool('brighten-image');
    await choosePhoto(user);

    expect(await screen.findByRole('button', { name: 'Apply' })).toBeDisabled();
  });

  test('moving the slider previews the change live on the image', async () => {
    const user = userEvent.setup();
    renderTool('brighten-image');
    await choosePhoto(user);

    await dragSlider('Brightness', 40);

    // Spec §23: "Use a live preview."
    expect(previewImage()).toHaveStyle({ filter: 'brightness(1.4)' });
  });

  test('applying renders with the same filter the preview showed', async () => {
    const user = userEvent.setup();
    renderTool('brighten-image');
    await choosePhoto(user);

    await dragSlider('Brightness', 25);
    expect(previewImage()).toHaveStyle({ filter: 'brightness(1.25)' });

    await user.click(screen.getByRole('button', { name: 'Apply' }));

    await waitFor(() => expect(canvas.encodeCalls).toHaveLength(1));
    // What you saw is what you downloaded.
    expect(canvas.filtersUsed).toContain('brightness(1.25)');
  });

  test('the slider can darken as well as brighten', async () => {
    const user = userEvent.setup();
    renderTool('brighten-image');
    await choosePhoto(user);

    await dragSlider('Brightness', -50);

    expect(previewImage()).toHaveStyle({ filter: 'brightness(0.5)' });
  });

  test('returning the slider to zero disables applying again', async () => {
    const user = userEvent.setup();
    renderTool('brighten-image');
    await choosePhoto(user);

    await dragSlider('Brightness', 30);
    expect(screen.getByRole('button', { name: 'Apply' })).toBeEnabled();

    await dragSlider('Brightness', 0);
    expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();
  });
});

describe('Adjust Contrast', () => {
  test('previews and applies a contrast filter', async () => {
    const user = userEvent.setup();
    renderTool('adjust-contrast');
    await choosePhoto(user);

    await dragSlider('Contrast', 20);
    expect(previewImage()).toHaveStyle({ filter: 'contrast(1.2)' });

    await user.click(screen.getByRole('button', { name: 'Apply' }));
    await waitFor(() => expect(canvas.filtersUsed).toContain('contrast(1.2)'));
  });
});

describe('Adjust Saturation', () => {
  test('previews and applies a saturation filter', async () => {
    const user = userEvent.setup();
    renderTool('adjust-saturation');
    await choosePhoto(user);

    await dragSlider('Saturation', -100);
    expect(previewImage()).toHaveStyle({ filter: 'saturate(0)' });

    await user.click(screen.getByRole('button', { name: 'Apply' }));
    await waitFor(() => expect(canvas.filtersUsed).toContain('saturate(0)'));
  });

  test('exposes a single slider, not HSL curves or channels', async () => {
    const user = userEvent.setup();
    renderTool('adjust-saturation');
    await choosePhoto(user);

    // Spec §25: "Do not expose HSL curves, RGB channels, etc."
    await screen.findByLabelText('Saturation');
    expect(screen.getAllByRole('slider')).toHaveLength(1);
  });
});

describe('Make Grayscale', () => {
  test('is a single click with no settings', async () => {
    const user = userEvent.setup();
    renderTool('grayscale-image');
    await choosePhoto(user);

    // Spec §26: "No unnecessary settings."
    await screen.findByRole('button', { name: 'Convert to Grayscale' });
    expect(screen.queryAllByRole('slider')).toHaveLength(0);
    expect(screen.queryAllByRole('radio')).toHaveLength(0);
  });

  test('converts the image to grayscale', async () => {
    const user = userEvent.setup();
    renderTool('grayscale-image');
    await choosePhoto(user);

    await user.click(
      await screen.findByRole('button', { name: 'Convert to Grayscale' }),
    );

    await waitFor(() => expect(canvas.filtersUsed).toContain('grayscale(1)'));
    expect(await screen.findByRole('button', { name: 'Download' })).toBeInTheDocument();
  });
});

describe('Blur Image', () => {
  test('starts with no blur and enables once the slider moves', async () => {
    const user = userEvent.setup();
    renderTool('blur-image');
    await choosePhoto(user);

    expect(await screen.findByRole('button', { name: 'Apply Blur' })).toBeDisabled();

    await dragSlider('Blur', 6);

    expect(previewImage()).toHaveStyle({ filter: 'blur(6px)' });
    expect(screen.getByRole('button', { name: 'Apply Blur' })).toBeEnabled();
  });

  test('applies the blur radius shown in the preview', async () => {
    const user = userEvent.setup();
    renderTool('blur-image');
    await choosePhoto(user);

    await dragSlider('Blur', 12);
    await user.click(screen.getByRole('button', { name: 'Apply Blur' }));

    await waitFor(() => expect(canvas.filtersUsed).toContain('blur(12px)'));
  });
});
