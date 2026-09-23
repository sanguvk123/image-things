/**
 * Crop geometry (spec §20).
 *
 * The crop rectangle is stored in normalised units (0–1 of the image) so it
 * survives the preview being displayed at any size, and converts to pixels
 * only at the moment we actually cut.
 */

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type AspectRatio = number | null;

export const ASPECT_RATIOS: { label: string; value: AspectRatio }[] = [
  { label: 'Free', value: null },
  { label: '1:1', value: 1 },
  { label: '4:5', value: 4 / 5 },
  { label: '16:9', value: 16 / 9 },
];

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/** Keep a rectangle fully inside the image without changing its size. */
export function clampToBounds(rect: CropRect): CropRect {
  const width = Math.min(rect.width, 1);
  const height = Math.min(rect.height, 1);
  return {
    width,
    height,
    x: clamp01(Math.min(rect.x, 1 - width)),
    y: clamp01(Math.min(rect.y, 1 - height)),
  };
}

/**
 * Build the largest centred rectangle with the given ratio.
 *
 * `imageRatio` is needed because the crop is stored in normalised units: a
 * square crop of a 16:9 image is not a square in that coordinate space.
 */
export function centeredRect(ratio: AspectRatio, imageRatio: number): CropRect {
  if (ratio === null) {
    // Free crop starts as a generous centred box rather than the whole image,
    // so the handles are visible and obviously draggable.
    return { x: 0.1, y: 0.1, width: 0.8, height: 0.8 };
  }

  // Normalised width/height ratio differs from the on-screen ratio by the
  // image's own aspect; solve for the box that fills one axis completely.
  const normalisedRatio = ratio / imageRatio;

  const rect =
    normalisedRatio >= 1
      ? { width: 1, height: 1 / normalisedRatio }
      : { width: normalisedRatio, height: 1 };

  return {
    width: rect.width,
    height: rect.height,
    x: (1 - rect.width) / 2,
    y: (1 - rect.height) / 2,
  };
}

/** Convert a normalised crop to whole pixels, guaranteeing at least 1×1. */
export function toPixels(
  rect: CropRect,
  imageWidth: number,
  imageHeight: number,
): CropRect {
  const safe = clampToBounds(rect);
  return {
    x: Math.round(safe.x * imageWidth),
    y: Math.round(safe.y * imageHeight),
    width: Math.max(1, Math.round(safe.width * imageWidth)),
    height: Math.max(1, Math.round(safe.height * imageHeight)),
  };
}

/** Move a crop rectangle by a normalised delta, stopping at the edges. */
export function moveRect(rect: CropRect, dx: number, dy: number): CropRect {
  return clampToBounds({ ...rect, x: rect.x + dx, y: rect.y + dy });
}
