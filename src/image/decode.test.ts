import { describe, expect, it } from 'vitest';
import { detectSpecialFormat, readHeader } from './decode';

/** Builds a header with an ISO-BMFF ftyp box of the given brand. */
function ftypHeader(brand: string): Uint8Array {
  const bytes = new Uint8Array(16);
  bytes.set([0x00, 0x00, 0x00, 0x18], 0); // box size
  bytes.set([0x66, 0x74, 0x79, 0x70], 4); // "ftyp"
  for (let i = 0; i < 4; i += 1) bytes[8 + i] = brand.charCodeAt(i);
  return bytes;
}

describe('detectSpecialFormat', () => {
  it('detects little-endian TIFF', () => {
    expect(detectSpecialFormat(new Uint8Array([0x49, 0x49, 0x2a, 0x00, 0x08]))).toBe(
      'tiff',
    );
  });

  it('detects big-endian TIFF', () => {
    expect(detectSpecialFormat(new Uint8Array([0x4d, 0x4d, 0x00, 0x2a, 0x00]))).toBe(
      'tiff',
    );
  });

  it.each(['heic', 'heix', 'mif1', 'msf1'])('detects the %s HEIF brand', (brand) => {
    expect(detectSpecialFormat(ftypHeader(brand))).toBe('heic');
  });

  it('ignores other ISO-BMFF files such as MP4 video', () => {
    // isom is a video brand; treating it as an image would fail confusingly.
    expect(detectSpecialFormat(ftypHeader('isom'))).toBeNull();
  });

  it('returns null for JPEG, which the browser decodes natively', () => {
    expect(detectSpecialFormat(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBeNull();
  });

  it('returns null for PNG', () => {
    expect(
      detectSpecialFormat(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a])),
    ).toBeNull();
  });

  it('returns null for an empty or truncated file', () => {
    expect(detectSpecialFormat(new Uint8Array([]))).toBeNull();
    expect(detectSpecialFormat(new Uint8Array([0x49, 0x49]))).toBeNull();
  });
});

describe('readHeader', () => {
  it('reads only the leading bytes, not the whole file', async () => {
    const blob = new Blob([new Uint8Array(5_000_000)]);
    const header = await readHeader(blob);
    expect(header).toHaveLength(16);
  });

  it('reads the real leading bytes', async () => {
    const blob = new Blob([new Uint8Array([0x49, 0x49, 0x2a, 0x00])]);
    expect(detectSpecialFormat(await readHeader(blob))).toBe('tiff');
  });
});
