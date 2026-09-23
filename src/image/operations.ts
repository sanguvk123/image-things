import type { OutputFormat } from '@/tools/registry';
import {
  context2d,
  createCanvas,
  drawToCanvas,
  encode,
  fillBackgroundIfOpaque,
  preservedFormat,
  toResult,
  type LoadedImage,
  type ProcessedImage,
} from './pipeline';
import { scaleToFit } from './format';
import { searchForTargetSize } from './targetSize';

/**
 * The actual image operations, one exported function per user intent.
 *
 * Each takes a loaded image plus plain-language settings and returns a
 * finished result. Keeping them free of React means they stay easy to reason
 * about and to test.
 */

export type CompressionLevel = 'smaller' | 'recommended' | 'best';

/**
 * Quality per preset (spec §15 hides these numbers from the user).
 * 0.82 is the sweet spot where JPEG artefacts stay invisible on photos while
 * the file typically drops by well over half.
 */
const COMPRESSION_QUALITY: Record<CompressionLevel, number> = {
  smaller: 0.55,
  recommended: 0.82,
  best: 0.94,
};

export async function compressImage(
  image: LoadedImage,
  level: CompressionLevel,
): Promise<ProcessedImage> {
  // PNG is lossless, so a quality setting would do nothing. Routing PNG
  // through JPEG is what actually makes the file smaller, which is what the
  // user asked for by opening a tool called "Compress Image".
  const source = preservedFormat(image.file);
  const format: OutputFormat = source === 'png' ? 'jpeg' : source;

  const { canvas } = drawToCanvas(image.bitmap, image.width, image.height, format);
  const blob = await encode(canvas, format, COMPRESSION_QUALITY[level]);

  return toResult(blob, {
    width: image.width,
    height: image.height,
    format,
    sourceName: image.file.name,
    suffix: 'compressed',
  });
}

export interface TargetSizeResult {
  result: ProcessedImage;
  /** False when even the smallest encode could not reach the target. */
  metTarget: boolean;
}

/**
 * Compress to an exact target size (spec §16).
 *
 * Always encodes as JPEG: it is the only widely supported format with a
 * quality dial fine enough to land on a specific byte budget.
 */
export async function compressToTargetSize(
  image: LoadedImage,
  targetBytes: number,
): Promise<TargetSizeResult> {
  const format: OutputFormat = 'jpeg';

  const dimensionsFor = (maxEdge: number | null) =>
    maxEdge
      ? scaleToFit(image.width, image.height, maxEdge)
      : { width: image.width, height: image.height };

  const render = async (quality: number, maxEdge: number | null) => {
    const { width, height } = dimensionsFor(maxEdge);
    const { canvas } = drawToCanvas(image.bitmap, width, height, format);
    return { blob: await encode(canvas, format, quality), width, height };
  };

  const search = await searchForTargetSize(
    async (quality, maxEdge) => (await render(quality, maxEdge)).blob.size,
    targetBytes,
  );

  // If nothing fit, hand back the smallest we managed rather than an error —
  // a 120KB result against a 100KB goal is still useful, and the UI says so.
  const chosen = search.best ?? search.smallest;
  const { blob, width, height } = await render(chosen.quality, chosen.maxEdge);

  return {
    metTarget: blob.size <= targetBytes,
    result: toResult(blob, {
      width,
      height,
      format,
      sourceName: image.file.name,
      suffix: 'compressed',
    }),
  };
}

/** Quality for tools whose job is not compression. High enough to be invisible. */
const EDIT_QUALITY = 0.92;

export async function resizeImage(
  image: LoadedImage,
  width: number,
  height: number,
): Promise<ProcessedImage> {
  const format = preservedFormat(image.file);
  const { canvas } = drawToCanvas(image.bitmap, width, height, format);
  const blob = await encode(canvas, format, EDIT_QUALITY);

  return toResult(blob, {
    width: canvas.width,
    height: canvas.height,
    format,
    sourceName: image.file.name,
    suffix: 'resized',
  });
}

/**
 * Convert between formats (spec §30).
 *
 * No suffix on the filename: the extension already changed, so photo.jpg
 * becomes photo.png without colliding with the original.
 */
export async function convertImage(
  image: LoadedImage,
  format: OutputFormat,
): Promise<ProcessedImage> {
  const { canvas } = drawToCanvas(image.bitmap, image.width, image.height, format);
  // PNG ignores quality; passing it anyway is harmless and keeps one path.
  const blob = await encode(canvas, format, EDIT_QUALITY);

  return toResult(blob, {
    width: image.width,
    height: image.height,
    format,
    sourceName: image.file.name,
  });
}

/** Clockwise rotation in degrees. Only right angles — no arbitrary skewing. */
export type RotationDegrees = 90 | 180 | 270;

export async function rotateImage(
  image: LoadedImage,
  degrees: RotationDegrees,
): Promise<ProcessedImage> {
  const format = preservedFormat(image.file);
  // A quarter turn swaps the canvas dimensions; a half turn does not.
  const swap = degrees === 90 || degrees === 270;
  const width = swap ? image.height : image.width;
  const height = swap ? image.width : image.height;

  const canvas = createCanvas(width, height);
  const ctx = context2d(canvas);
  fillBackgroundIfOpaque(ctx, format);

  // Rotate about the canvas centre, then draw the image centred on the origin.
  ctx.translate(width / 2, height / 2);
  ctx.rotate((degrees * Math.PI) / 180);
  ctx.drawImage(image.bitmap, -image.width / 2, -image.height / 2);

  const blob = await encode(canvas, format, EDIT_QUALITY);
  return toResult(blob, {
    width,
    height,
    format,
    sourceName: image.file.name,
    suffix: 'rotated',
  });
}

export interface FlipAxes {
  horizontal: boolean;
  vertical: boolean;
}

/** Mirror the image. Both axes can be flipped in a single pass. */
export async function flipImage(
  image: LoadedImage,
  axes: FlipAxes,
): Promise<ProcessedImage> {
  const format = preservedFormat(image.file);
  const canvas = createCanvas(image.width, image.height);
  const ctx = context2d(canvas);
  fillBackgroundIfOpaque(ctx, format);

  // Mirror by scaling negatively, then shifting back into view.
  ctx.translate(axes.horizontal ? image.width : 0, axes.vertical ? image.height : 0);
  ctx.scale(axes.horizontal ? -1 : 1, axes.vertical ? -1 : 1);
  ctx.drawImage(image.bitmap, 0, 0);

  const blob = await encode(canvas, format, EDIT_QUALITY);
  return toResult(blob, {
    width: image.width,
    height: image.height,
    format,
    sourceName: image.file.name,
    suffix: 'flipped',
  });
}
