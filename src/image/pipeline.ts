import type { OutputFormat } from '@/tools/registry';
import { outputFileName } from './format';
import { decodeSpecialFormat } from './decode';

/**
 * The image processing core.
 *
 * Everything runs in the browser on a canvas — nothing is uploaded. That is
 * both the privacy promise ("Private • Secure • No signup") and the reason the
 * tools feel instant: there is no network round trip.
 */

export interface LoadedImage {
  file: File;
  /** Decoded pixels, ready to draw. */
  bitmap: ImageBitmap;
  width: number;
  height: number;
  /** Object URL for showing the original. Revoke when discarding the image. */
  previewUrl: string;
}

export interface ProcessedImage {
  blob: Blob;
  url: string;
  width: number;
  height: number;
  format: OutputFormat;
  fileName: string;
}

export const ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/avif',
  'image/heic',
  'image/heif',
  'image/tiff',
] as const;

export class UnsupportedImageError extends Error {
  constructor(message = "That file doesn't look like an image we can open.") {
    super(message);
    this.name = 'UnsupportedImageError';
  }
}

/** Decode a user-selected file into pixels we can draw. */
export async function loadImage(file: File): Promise<LoadedImage> {
  let bitmap: ImageBitmap | null = null;
  let decodedOurselves = false;

  // HEIC and TIFF are decoded by us; everything else by the browser.
  try {
    bitmap = await decodeSpecialFormat(file);
    decodedOurselves = bitmap !== null;
  } catch {
    throw new UnsupportedImageError(
      "We couldn't read that image. It may be damaged or use an unusual variant.",
    );
  }

  if (!bitmap) {
    try {
      bitmap = await createImageBitmap(file);
    } catch {
      throw new UnsupportedImageError();
    }
  }

  return {
    file,
    bitmap,
    width: bitmap.width,
    height: bitmap.height,
    // A browser that cannot decode the file cannot display it either, so the
    // preview has to come from the pixels we decoded, not the original file.
    previewUrl: decodedOurselves
      ? await previewUrlFromBitmap(bitmap)
      : URL.createObjectURL(file),
  };
}

/** Renders decoded pixels to a PNG object URL so they can be previewed. */
async function previewUrlFromBitmap(bitmap: ImageBitmap): Promise<string> {
  const canvas = createCanvas(bitmap.width, bitmap.height);
  context2d(canvas).drawImage(bitmap, 0, 0);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/png'),
  );
  if (!blob) throw new UnsupportedImageError();
  return URL.createObjectURL(blob);
}

/** Release the memory held by a loaded image. */
export function releaseImage(image: LoadedImage): void {
  image.bitmap.close();
  URL.revokeObjectURL(image.previewUrl);
}

/** Release the object URL behind a result. */
export function releaseResult(result: ProcessedImage): void {
  URL.revokeObjectURL(result.url);
}

export function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  return canvas;
}

export function context2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d', { willReadFrequently: false });
  if (!ctx) throw new Error('Canvas 2D is unavailable in this browser.');
  return ctx;
}

/**
 * JPEG has no alpha channel, so transparent pixels would otherwise encode as
 * black. Painting white first matches what users expect to see.
 */
export function fillBackgroundIfOpaque(
  ctx: CanvasRenderingContext2D,
  format: OutputFormat,
): void {
  if (format !== 'jpeg') return;
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.restore();
}

export function encode(
  canvas: HTMLCanvasElement,
  format: OutputFormat,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('The browser could not encode this image.'));
      },
      `image/${format}`,
      quality,
    );
  });
}

/** Wrap an encoded blob with everything the result UI needs. */
export function toResult(
  blob: Blob,
  options: {
    width: number;
    height: number;
    format: OutputFormat;
    sourceName: string;
    suffix?: string;
  },
): ProcessedImage {
  return {
    blob,
    url: URL.createObjectURL(blob),
    width: options.width,
    height: options.height,
    format: options.format,
    fileName: outputFileName(options.sourceName, options.format, options.suffix),
  };
}

/**
 * Draw a loaded image to a fresh canvas.
 *
 * `imageSmoothingQuality: 'high'` matters when downscaling: without it the
 * browser point-samples and resized photos look visibly crunchy.
 */
export function drawToCanvas(
  source: CanvasImageSource,
  width: number,
  height: number,
  format: OutputFormat,
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = createCanvas(width, height);
  const ctx = context2d(canvas);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  fillBackgroundIfOpaque(ctx, format);
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return { canvas, ctx };
}

/** Trigger a browser download for a finished result. */
export function downloadResult(result: ProcessedImage): void {
  const link = document.createElement('a');
  link.href = result.url;
  link.download = result.fileName;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/**
 * Pick a sensible output format for tools that simply edit an image in place.
 * PNG and WebP sources keep their format (and their transparency); everything
 * else becomes JPEG, which is what the source almost always already was.
 */
export function preservedFormat(file: File): OutputFormat {
  if (file.type === 'image/png') return 'png';
  if (file.type === 'image/webp') return 'webp';
  return 'jpeg';
}
