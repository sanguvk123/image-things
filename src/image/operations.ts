import type { OutputFormat } from '@/tools/registry';
import {
  drawToCanvas,
  encode,
  preservedFormat,
  toResult,
  type LoadedImage,
  type ProcessedImage,
} from './pipeline';

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
