import { sharpenPixels, SHARPEN_AMOUNT } from './sharpen';

/** Build an RGBA buffer from a grid of gray levels. */
function grayImage(rows: number[][]): {
  data: Uint8ClampedArray;
  width: number;
  height: number;
} {
  const height = rows.length;
  const width = rows[0].length;
  const data = new Uint8ClampedArray(width * height * 4);

  rows.forEach((row, y) =>
    row.forEach((value, x) => {
      const i = (y * width + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = value;
      data[i + 3] = 255;
    }),
  );

  return { data, width, height };
}

const centerPixel = (data: Uint8ClampedArray, width: number, x: number, y: number) =>
  data[(y * width + x) * 4];

describe('sharpenPixels', () => {
  test('leaves a flat area of colour unchanged', () => {
    // The kernel weights sum to 1, so uniform regions must not shift in
    // brightness — otherwise skies and walls would visibly change tone.
    const { data, width, height } = grayImage([
      [128, 128, 128],
      [128, 128, 128],
      [128, 128, 128],
    ]);

    const result = sharpenPixels(data, width, height, SHARPEN_AMOUNT.recommended);

    expect(centerPixel(result, width, 1, 1)).toBe(128);
  });

  test('increases local contrast at an edge', () => {
    const { data, width, height } = grayImage([
      [100, 100, 100],
      [100, 200, 100],
      [100, 100, 100],
    ]);

    const result = sharpenPixels(data, width, height, SHARPEN_AMOUNT.recommended);

    // A bright pixel among darker neighbours should get brighter still.
    expect(centerPixel(result, width, 1, 1)).toBeGreaterThan(200);
  });

  test('a stronger amount sharpens more than a lighter one', () => {
    // A gentle edge, chosen so neither result clamps at 255 and the two
    // strengths stay genuinely comparable.
    const rows = [
      [100, 100, 100],
      [100, 120, 100],
      [100, 100, 100],
    ];

    const light = sharpenPixels(
      grayImage(rows).data,
      3,
      3,
      SHARPEN_AMOUNT.light,
    );
    const strong = sharpenPixels(
      grayImage(rows).data,
      3,
      3,
      SHARPEN_AMOUNT.strong,
    );

    expect(centerPixel(strong, 3, 1, 1)).toBeGreaterThan(centerPixel(light, 3, 1, 1));
  });

  test('clamps rather than wrapping around at full white', () => {
    const { data, width, height } = grayImage([
      [0, 0, 0],
      [0, 255, 0],
      [0, 0, 0],
    ]);

    const result = sharpenPixels(data, width, height, SHARPEN_AMOUNT.strong);

    // Overflowing to 0 would put a black dot in the middle of a highlight.
    expect(centerPixel(result, width, 1, 1)).toBe(255);
  });

  test('preserves the alpha channel exactly', () => {
    const { data, width, height } = grayImage([
      [10, 20, 30],
      [40, 200, 60],
      [70, 80, 90],
    ]);
    data[(1 * 3 + 1) * 4 + 3] = 128;

    const result = sharpenPixels(data, width, height, SHARPEN_AMOUNT.recommended);

    expect(result[(1 * 3 + 1) * 4 + 3]).toBe(128);
  });

  test('copies border pixels instead of inventing neighbours', () => {
    const { data, width, height } = grayImage([
      [10, 20, 30],
      [40, 200, 60],
      [70, 80, 90],
    ]);

    const result = sharpenPixels(data, width, height, SHARPEN_AMOUNT.strong);

    expect(centerPixel(result, width, 0, 0)).toBe(10);
    expect(centerPixel(result, width, 2, 2)).toBe(90);
  });

  test('does not modify the source buffer', () => {
    const { data, width, height } = grayImage([
      [100, 100, 100],
      [100, 200, 100],
      [100, 100, 100],
    ]);
    const before = Uint8ClampedArray.from(data);

    sharpenPixels(data, width, height, SHARPEN_AMOUNT.strong);

    expect(Array.from(data)).toEqual(Array.from(before));
  });
});
