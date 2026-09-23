/**
 * Background removal (spec §9, "one-click").
 *
 * This runs entirely in the browser with no ML model, so it does what is
 * honestly achievable that way: it samples the colour at the image border and
 * flood-fills inward, clearing pixels that match within a tolerance.
 *
 * That makes it genuinely good at product shots, logos and screenshots on a
 * plain background, and poor at busy photographs. The UI says as much rather
 * than pretending otherwise — an honest limit beats a surprising result.
 */

export interface BackgroundOptions {
  /** 0–100. How different a pixel may be and still count as background. */
  tolerance: number;
}

/** Squared RGB distance; avoids a square root in the inner loop. */
function distanceSquared(
  data: Uint8ClampedArray,
  a: number,
  r: number,
  g: number,
  b: number,
): number {
  const dr = data[a] - r;
  const dg = data[a + 1] - g;
  const db = data[a + 2] - b;
  return dr * dr + dg * dg + db * db;
}

/** The dominant colour around the border, used as the background reference. */
export function sampleEdgeColor(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): { r: number; g: number; b: number } {
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;

  const sample = (x: number, y: number) => {
    const i = (y * width + x) * 4;
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    count += 1;
  };

  for (let x = 0; x < width; x += 1) {
    sample(x, 0);
    sample(x, height - 1);
  }
  for (let y = 1; y < height - 1; y += 1) {
    sample(0, y);
    sample(width - 1, y);
  }

  return {
    r: Math.round(r / count),
    g: Math.round(g / count),
    b: Math.round(b / count),
  };
}

/**
 * Clear the background, returning new RGBA pixels with alpha 0 where removed.
 *
 * Flood-filling from the edges rather than replacing every matching pixel is
 * what protects a white shirt in the middle of the subject: only background
 * connected to the border is removed.
 */
export function removeBackgroundPixels(
  source: Uint8ClampedArray,
  width: number,
  height: number,
  options: BackgroundOptions,
): Uint8ClampedArray {
  const output = Uint8ClampedArray.from(source);
  const { r, g, b } = sampleEdgeColor(source, width, height);

  // Tolerance is squared distance across three channels, so scale the 0-100
  // slider to something perceptually reasonable rather than linear in bytes.
  const threshold = (options.tolerance / 100) * 3 * 120 * 120;

  const visited = new Uint8Array(width * height);
  const queue: number[] = [];

  const enqueue = (x: number, y: number) => {
    const pixel = y * width + x;
    if (visited[pixel]) return;
    visited[pixel] = 1;
    if (distanceSquared(source, pixel * 4, r, g, b) <= threshold) queue.push(pixel);
  };

  for (let x = 0; x < width; x += 1) {
    enqueue(x, 0);
    enqueue(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    enqueue(0, y);
    enqueue(width - 1, y);
  }

  while (queue.length > 0) {
    const pixel = queue.pop()!;
    output[pixel * 4 + 3] = 0;

    const x = pixel % width;
    const y = (pixel - x) / width;

    if (x > 0) enqueue(x - 1, y);
    if (x < width - 1) enqueue(x + 1, y);
    if (y > 0) enqueue(x, y - 1);
    if (y < height - 1) enqueue(x, y + 1);
  }

  return output;
}
