import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { installCanvasStubs, type CanvasStub } from '@/test/canvas';
import { choosePhoto, renderTool } from '@/test/tool';

let canvas: CanvasStub;

beforeEach(() => {
  canvas = installCanvasStubs({ width: 1200, height: 800 });
});

afterEach(() => canvas.restore());

/** The last CSS filter the canvas was asked to render with. */
const lastFilter = () => canvas.filtersUsed.at(-1) ?? '';

/** Reads the brightness/contrast multiplier out of a filter string. */
function multiplierIn(filter: string, fn: string): number {
  const match = new RegExp(`${fn}\\(([\\d.]+)\\)`).exec(filter);
  return match ? Number(match[1]) : NaN;
}

describe('darken-image', () => {
  test('opens already darkened, so the intent is not stated twice', async () => {
    const user = userEvent.setup();
    renderTool('darken-image');
    await choosePhoto(user);

    expect(screen.getByLabelText('Brightness')).toHaveValue('-25');
  });

  test('applies a brightness below 1, actually darkening the image', async () => {
    const user = userEvent.setup();
    renderTool('darken-image');
    await choosePhoto(user);

    await user.click(screen.getByRole('button', { name: 'Darken' }));

    expect(multiplierIn(lastFilter(), 'brightness')).toBeLessThan(1);
  });

  test('is the inverse of brighten-image, which opens neutral', async () => {
    const user = userEvent.setup();
    renderTool('brighten-image');
    await choosePhoto(user);

    expect(screen.getByLabelText('Brightness')).toHaveValue('0');
  });
});

describe('increase-contrast', () => {
  test('opens with contrast already raised', async () => {
    const user = userEvent.setup();
    renderTool('increase-contrast');
    await choosePhoto(user);

    expect(screen.getByLabelText('Contrast')).toHaveValue('25');
  });

  test('applies a contrast above 1', async () => {
    const user = userEvent.setup();
    renderTool('increase-contrast');
    await choosePhoto(user);

    await user.click(screen.getByRole('button', { name: 'Increase Contrast' }));

    expect(multiplierIn(lastFilter(), 'contrast')).toBeGreaterThan(1);
  });

  test('the neutral contrast page still opens at no change', async () => {
    const user = userEvent.setup();
    renderTool('adjust-contrast');
    await choosePhoto(user);

    expect(screen.getByLabelText('Contrast')).toHaveValue('0');
  });
});
