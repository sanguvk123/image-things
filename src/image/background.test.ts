import { removeBackgroundPixels, sampleEdgeColor } from './background';

/** Build RGBA pixels from a grid of [r,g,b] triples. */
function image(rows: number[][][]) {
  const height = rows.length;
  const width = rows[0].length;
  const data = new Uint8ClampedArray(width * height * 4);

  rows.forEach((row, y) =>
    row.forEach(([r, g, b], x) => {
      const i = (y * width + x) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }),
  );

  return { data, width, height };
}

const WHITE = [255, 255, 255];
const BLACK = [0, 0, 0];
const RED = [220, 30, 30];

const alphaAt = (data: Uint8ClampedArray, width: number, x: number, y: number) =>
  data[(y * width + x) * 4 + 3];

describe('sampleEdgeColor', () => {
  test('reads the colour that surrounds the subject', () => {
    const { data, width, height } = image([
      [WHITE, WHITE, WHITE],
      [WHITE, BLACK, WHITE],
      [WHITE, WHITE, WHITE],
    ]);

    expect(sampleEdgeColor(data, width, height)).toEqual({ r: 255, g: 255, b: 255 });
  });

  test('ignores the interior when sampling', () => {
    const { data, width, height } = image([
      [RED, RED, RED],
      [RED, WHITE, RED],
      [RED, RED, RED],
    ]);

    expect(sampleEdgeColor(data, width, height)).toEqual({ r: 220, g: 30, b: 30 });
  });
});

describe('removeBackgroundPixels', () => {
  test('clears a plain background and keeps the subject', () => {
    const { data, width, height } = image([
      [WHITE, WHITE, WHITE],
      [WHITE, BLACK, WHITE],
      [WHITE, WHITE, WHITE],
    ]);

    const result = removeBackgroundPixels(data, width, height, { tolerance: 20 });

    expect(alphaAt(result, width, 0, 0)).toBe(0);
    expect(alphaAt(result, width, 1, 1)).toBe(255);
  });

  test('keeps background-coloured pixels enclosed by the subject', () => {
    // A white pixel walled in by black: not reachable from the border, so it
    // is part of the subject — punching a hole there would be wrong.
    const { data, width, height } = image([
      [WHITE, WHITE, WHITE, WHITE, WHITE],
      [WHITE, BLACK, BLACK, BLACK, WHITE],
      [WHITE, BLACK, WHITE, BLACK, WHITE],
      [WHITE, BLACK, BLACK, BLACK, WHITE],
      [WHITE, WHITE, WHITE, WHITE, WHITE],
    ]);

    const result = removeBackgroundPixels(data, width, height, { tolerance: 20 });

    expect(alphaAt(result, width, 0, 0)).toBe(0);
    expect(alphaAt(result, width, 2, 2)).toBe(255);
  });

  test('preserves the colour channels of removed pixels', () => {
    const { data, width, height } = image([
      [WHITE, WHITE],
      [WHITE, WHITE],
    ]);

    const result = removeBackgroundPixels(data, width, height, { tolerance: 20 });

    // Only alpha changes; RGB is left alone so nothing turns black if the
    // result is later flattened onto a background.
    expect(result[0]).toBe(255);
    expect(result[3]).toBe(0);
  });

  test('a higher tolerance removes shades that a lower one keeps', () => {
    const NEAR_WHITE = [225, 225, 225];
    const rows = [
      [WHITE, WHITE, WHITE],
      [WHITE, NEAR_WHITE, WHITE],
      [WHITE, WHITE, WHITE],
    ];

    const strict = removeBackgroundPixels(image(rows).data, 3, 3, { tolerance: 1 });
    const loose = removeBackgroundPixels(image(rows).data, 3, 3, { tolerance: 60 });

    expect(alphaAt(strict, 3, 1, 1)).toBe(255);
    expect(alphaAt(loose, 3, 1, 1)).toBe(0);
  });

  test('a fully uniform image is removed entirely', () => {
    const { data, width, height } = image([
      [WHITE, WHITE],
      [WHITE, WHITE],
    ]);

    const result = removeBackgroundPixels(data, width, height, { tolerance: 20 });

    for (let i = 3; i < result.length; i += 4) expect(result[i]).toBe(0);
  });

  test('does not modify the source pixels', () => {
    const { data, width, height } = image([
      [WHITE, WHITE],
      [WHITE, BLACK],
    ]);
    const before = Uint8ClampedArray.from(data);

    removeBackgroundPixels(data, width, height, { tolerance: 50 });

    expect(Array.from(data)).toEqual(Array.from(before));
  });
});
