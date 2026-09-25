import type { OutputFormat } from '@/tools/registry';
import type { CropRect } from './crop';
import { SHARPEN_AMOUNT, type SharpenLevel } from './sharpen';
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
import { runPixelJob } from './worker/pool';

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

/** Cut out a pixel rectangle of the image (spec §20). */
export async function cropImage(
  image: LoadedImage,
  rect: CropRect,
): Promise<ProcessedImage> {
  const format = preservedFormat(image.file);
  const canvas = createCanvas(rect.width, rect.height);
  const ctx = context2d(canvas);
  fillBackgroundIfOpaque(ctx, format);

  // Draw only the selected source region, at 1:1 into the new canvas.
  ctx.drawImage(
    image.bitmap,
    rect.x,
    rect.y,
    rect.width,
    rect.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  const blob = await encode(canvas, format, EDIT_QUALITY);
  return toResult(blob, {
    width: canvas.width,
    height: canvas.height,
    format,
    sourceName: image.file.name,
    suffix: 'cropped',
  });
}

/**
 * Apply a CSS filter string to the whole image (spec §23–26, §28).
 *
 * The caller passes the exact filter used for the on-screen preview, so the
 * downloaded file is what the user was looking at.
 */
export async function applyFilter(
  image: LoadedImage,
  filter: string,
  suffix: string,
): Promise<ProcessedImage> {
  const format = preservedFormat(image.file);
  const canvas = createCanvas(image.width, image.height);
  const ctx = context2d(canvas);
  fillBackgroundIfOpaque(ctx, format);

  ctx.filter = filter;
  ctx.drawImage(image.bitmap, 0, 0);

  const blob = await encode(canvas, format, EDIT_QUALITY);
  return toResult(blob, {
    width: image.width,
    height: image.height,
    format,
    sourceName: image.file.name,
    suffix,
  });
}

/**
 * Sharpen (spec §27).
 *
 * Unlike the other adjustments this needs the actual pixels, since CSS has no
 * sharpen filter — hence the read/convolve/write round trip.
 */
export async function sharpenImage(
  image: LoadedImage,
  level: SharpenLevel,
): Promise<ProcessedImage> {
  const format = preservedFormat(image.file);
  const canvas = createCanvas(image.width, image.height);
  const ctx = context2d(canvas);
  fillBackgroundIfOpaque(ctx, format);
  ctx.drawImage(image.bitmap, 0, 0);

  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  // Off the main thread: a 3x3 convolution over 24 MP is a 232 ms synchronous
  // loop, and the page cannot paint for the whole of it. The buffer is copied
  // once here because transferring neuters it, and the canvas still needs its
  // own ImageData to write back into.
  const sharpened = await runPixelJob({
    kind: 'sharpen',
    pixels: new Uint8ClampedArray(pixels.data),
    width: canvas.width,
    height: canvas.height,
    amount: SHARPEN_AMOUNT[level],
  });
  pixels.data.set(sharpened);
  ctx.putImageData(pixels, 0, 0);

  const blob = await encode(canvas, format, EDIT_QUALITY);
  return toResult(blob, {
    width: image.width,
    height: image.height,
    format,
    sourceName: image.file.name,
    suffix: 'sharpened',
  });
}

/**
 * Strip metadata (spec §29).
 *
 * Drawing to a canvas and re-encoding produces pixels only — EXIF, GPS and
 * device tags cannot survive the round trip. Quality is kept high because the
 * user asked for privacy, not for a smaller file.
 */
export async function removeMetadata(image: LoadedImage): Promise<ProcessedImage> {
  const format = preservedFormat(image.file);
  const { canvas } = drawToCanvas(image.bitmap, image.width, image.height, format);
  const blob = await encode(canvas, format, 0.96);

  return toResult(blob, {
    width: image.width,
    height: image.height,
    format,
    sourceName: image.file.name,
    suffix: 'clean',
  });
}

/** How much bigger to make the image. */
export type UpscaleFactor = 2 | 3 | 4;

/**
 * Enlarge an image.
 *
 * The browser's high-quality smoothing does the interpolation; a light
 * sharpening pass afterwards counteracts the softness that any upscale
 * introduces, which is what makes the result look deliberate rather than
 * merely stretched.
 */
export async function upscaleImage(
  image: LoadedImage,
  factor: UpscaleFactor,
): Promise<ProcessedImage> {
  const format = preservedFormat(image.file);
  const width = image.width * factor;
  const height = image.height * factor;

  const { canvas, ctx } = drawToCanvas(image.bitmap, width, height, format);

  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  // This is the largest convolution the app ever runs: a 4x upscale makes the
  // canvas sixteen times the source area, so a 3 MP photo becomes a 48 MP
  // sharpen pass. It belongs off the main thread more than any other job.
  const sharpened = await runPixelJob({
    kind: 'sharpen',
    pixels: new Uint8ClampedArray(pixels.data),
    width: canvas.width,
    height: canvas.height,
    amount: SHARPEN_AMOUNT.light,
  });
  pixels.data.set(sharpened);
  ctx.putImageData(pixels, 0, 0);

  const blob = await encode(canvas, format, EDIT_QUALITY);
  return toResult(blob, {
    width,
    height,
    format,
    sourceName: image.file.name,
    suffix: `${factor}x`,
  });
}

/**
 * Remove the background.
 *
 * Always outputs PNG: the whole point is transparency, and JPEG has no alpha
 * channel to put it in.
 */
export async function removeBackground(
  image: LoadedImage,
  tolerance: number,
): Promise<ProcessedImage> {
  const format: OutputFormat = 'png';
  const canvas = createCanvas(image.width, image.height);
  const ctx = context2d(canvas);
  ctx.drawImage(image.bitmap, 0, 0);

  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const cleared = await runPixelJob({
    kind: 'removeBackground',
    pixels: new Uint8ClampedArray(pixels.data),
    width: canvas.width,
    height: canvas.height,
    tolerance,
  });
  pixels.data.set(cleared);
  ctx.putImageData(pixels, 0, 0);

  const blob = await encode(canvas, format);
  return toResult(blob, {
    width: image.width,
    height: image.height,
    format,
    sourceName: image.file.name,
    suffix: 'no-bg',
  });
}
