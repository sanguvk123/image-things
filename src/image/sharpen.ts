/**
 * Sharpening (spec §27).
 *
 * CSS has no sharpen filter, so this is a real 3×3 convolution over the pixel
 * data. The kernel is the classic unsharp shape — a positive centre against
 * negative neighbours — scaled by `amount` so "Light" and "Strong" are the
 * same operation at different strengths rather than different algorithms.
 */

export type SharpenLevel = 'light' | 'recommended' | 'strong';

export const SHARPEN_AMOUNT: Record<SharpenLevel, number> = {
  light: 0.35,
  recommended: 0.7,
  strong: 1.2,
};

const clampByte = (value: number) => (value < 0 ? 0 : value > 255 ? 255 : value);

/**
 * Sharpen RGBA pixels in place-safe fashion, returning new pixel data.
 *
 * Alpha is copied untouched: sharpening transparency produces halos around
 * cut-out edges, which is never what the user wants.
 */
export function sharpenPixels(
  source: Uint8ClampedArray,
  width: number,
  height: number,
  amount: number,
): Uint8ClampedArray {
  const output = new Uint8ClampedArray(source.length);

  // Centre weight grows with amount while neighbours push back equally, so a
  // flat area of colour keeps its original brightness (weights sum to 1).
  const centre = 1 + 4 * amount;
  const side = -amount;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;

      // Edge pixels have no neighbours to compare against; copying them keeps
      // the border from developing a bright rim.
      const onEdge = x === 0 || y === 0 || x === width - 1 || y === height - 1;
      if (onEdge) {
        output[index] = source[index];
        output[index + 1] = source[index + 1];
        output[index + 2] = source[index + 2];
        output[index + 3] = source[index + 3];
        continue;
      }

      const up = index - width * 4;
      const down = index + width * 4;
      const left = index - 4;
      const right = index + 4;

      for (let channel = 0; channel < 3; channel += 1) {
        const value =
          source[index + channel] * centre +
          (source[up + channel] +
            source[down + channel] +
            source[left + channel] +
            source[right + channel]) *
            side;
        output[index + channel] = clampByte(value);
      }

      output[index + 3] = source[index + 3];
    }
  }

  return output;
}
