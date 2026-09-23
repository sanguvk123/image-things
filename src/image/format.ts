import type { OutputFormat } from '@/tools/registry';

/**
 * Small presentation helpers shared by every tool.
 *
 * These are deliberately user-facing rather than technically precise: the spec
 * asks for zero cognitive load, so we show "2.8 MB", not "2,791,233 bytes".
 */

/**
 * Bytes per kilobyte.
 *
 * Decimal (1000), not binary (1024), on purpose. When a user asks to "compress
 * to 100KB" they are almost always satisfying an upload limit, and the stricter
 * decimal reading is under the limit on either interpretation. Using the same
 * unit for display keeps "96 KB" and "under 100KB" consistent with each other.
 */
export const BYTES_PER_KB = 1000;
const BYTES_PER_MB = BYTES_PER_KB * 1000;

/** Human file size, e.g. "96 KB" or "2.8 MB". */
export function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 KB';

  if (bytes < BYTES_PER_MB) {
    // Round up so a real, tiny file never displays as "0 KB".
    return `${Math.max(1, Math.round(bytes / BYTES_PER_KB))} KB`;
  }

  const mb = bytes / BYTES_PER_MB;
  // One decimal below 10 MB ("2.8 MB"), none above ("14 MB") — less noise.
  return mb < 10 ? `${mb.toFixed(1)} MB` : `${Math.round(mb)} MB`;
}

/** File extension for a format. Users know "jpg", not "jpeg". */
export function extensionFor(format: OutputFormat): string {
  return format === 'jpeg' ? 'jpg' : format;
}

/** Badge label for a format, e.g. "JPG", "PNG", "WebP". */
export function formatLabel(format: OutputFormat): string {
  if (format === 'webp') return 'WebP';
  return extensionFor(format).toUpperCase();
}

/**
 * Download name derived from the source name, e.g. photo.jpg -> photo.png.
 * The optional suffix keeps the result from overwriting the original in the
 * user's downloads folder when the extension is unchanged.
 */
export function outputFileName(
  sourceName: string,
  format: OutputFormat,
  suffix?: string,
): string {
  const lastDot = sourceName.lastIndexOf('.');
  const base = lastDot > 0 ? sourceName.slice(0, lastDot) : sourceName;
  const tail = suffix ? `-${suffix}` : '';
  return `${base}${tail}.${extensionFor(format)}`;
}

/** Fit dimensions inside a square box without distorting the aspect ratio. */
export function scaleToFit(
  width: number,
  height: number,
  maxEdge: number,
): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= maxEdge) return { width, height };

  const ratio = maxEdge / longest;
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

/** Whole-percent size saving, floored at 0 so results never read as negative. */
export function percentSmaller(originalBytes: number, resultBytes: number): number {
  if (originalBytes <= 0) return 0;
  const saved = ((originalBytes - resultBytes) / originalBytes) * 100;
  return Math.max(0, Math.round(saved));
}
