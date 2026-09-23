/**
 * Decoding for formats the browser itself cannot open.
 *
 * createImageBitmap handles JPEG, PNG, WebP, GIF, BMP and (in current
 * browsers) AVIF. It does not handle HEIC outside Safari, and does not handle
 * TIFF anywhere. Those two need real decoders, which are large, so they are
 * imported lazily -- a visitor compressing a JPEG never downloads them.
 */

/** Formats we must decode ourselves. */
export type SpecialFormat = 'heic' | 'tiff';

const MAGIC_BYTES = {
  /** TIFF is little-endian "II*\0" or big-endian "MM\0*". */
  tiffLittle: [0x49, 0x49, 0x2a, 0x00],
  tiffBig: [0x4d, 0x4d, 0x00, 0x2a],
} as const;

function startsWith(bytes: Uint8Array, expected: readonly number[]): boolean {
  return expected.every((byte, index) => bytes[index] === byte);
}

/**
 * Identifies HEIC and TIFF from the file's own bytes.
 *
 * Extensions and MIME types are unreliable here: browsers report HEIC as an
 * empty type on some platforms, and photos exported from phones often arrive
 * as .jpg containing HEIC data.
 */
export function detectSpecialFormat(header: Uint8Array): SpecialFormat | null {
  if (
    startsWith(header, MAGIC_BYTES.tiffLittle) ||
    startsWith(header, MAGIC_BYTES.tiffBig)
  ) {
    return 'tiff';
  }

  // ISO-BMFF: bytes 4-8 are "ftyp", then a brand such as heic/heix/mif1.
  const isFtyp =
    header[4] === 0x66 &&
    header[5] === 0x74 &&
    header[6] === 0x79 &&
    header[7] === 0x70;
  if (isFtyp) {
    const brand = String.fromCharCode(
      header[8] ?? 0,
      header[9] ?? 0,
      header[10] ?? 0,
      header[11] ?? 0,
    );
    // mif1/msf1 are the generic HEIF brands Apple also emits.
    if (['heic', 'heix', 'hevc', 'hevx', 'heif', 'mif1', 'msf1'].includes(brand)) {
      return 'heic';
    }
  }

  return null;
}

/** Reads just enough of a file to identify it. */
export async function readHeader(file: Blob, bytes = 16): Promise<Uint8Array> {
  const slice = await file.slice(0, bytes).arrayBuffer();
  return new Uint8Array(slice);
}

async function decodeHeic(file: Blob): Promise<ImageBitmap> {
  const { heicTo } = await import('heic-to');
  return heicTo({ blob: file, type: 'bitmap' });
}

async function decodeTiff(file: Blob): Promise<ImageBitmap> {
  const UTIF = await import('utif2');
  const buffer = await file.arrayBuffer();

  const pages = UTIF.decode(buffer);
  const page = pages[0];
  if (!page) throw new Error('TIFF file contains no images.');

  UTIF.decodeImage(buffer, page);
  const rgba = UTIF.toRGBA8(page);
  if (!rgba.length) throw new Error('TIFF image could not be decoded.');

  // Copy rather than view: UTIF's buffer is typed as possibly shared, and we
  // do not want ImageData aliasing memory the decoder still owns.
  const pixels = new Uint8ClampedArray(rgba.length);
  pixels.set(rgba);

  const data = new ImageData(pixels, page.width, page.height);
  return createImageBitmap(data);
}

/**
 * Decodes a file the browser cannot, or returns null if it is not one of ours.
 *
 * Returning null (rather than throwing) lets the caller fall back to
 * createImageBitmap for everything normal.
 */
export async function decodeSpecialFormat(file: Blob): Promise<ImageBitmap | null> {
  const format = detectSpecialFormat(await readHeader(file));
  if (format === 'heic') return decodeHeic(file);
  if (format === 'tiff') return decodeTiff(file);
  return null;
}
