import { detectMetadata, type MetadataCategory } from './metadata';

/**
 * Build a minimal JPEG containing an EXIF APP1 segment with the given tags.
 * Real photos carry far more, but the reader only cares about tag IDs.
 */
function jpegWithExifTags(tagIds: number[]): File {
  const entryBytes = tagIds.length * 12;
  const tiffLength = 8 + 2 + entryBytes + 4;
  const app1Length = 2 + 6 + tiffLength;
  const total = 2 + 2 + app1Length;

  const buffer = new ArrayBuffer(total);
  const view = new DataView(buffer);
  let offset = 0;

  view.setUint16(offset, 0xffd8); // SOI
  offset += 2;
  view.setUint16(offset, 0xffe1); // APP1
  offset += 2;
  view.setUint16(offset, app1Length);
  offset += 2;

  // "Exif\0\0"
  view.setUint32(offset, 0x45786966);
  view.setUint16(offset + 4, 0x0000);
  offset += 6;

  const tiffStart = offset;
  view.setUint16(offset, 0x4d4d); // "MM" big-endian
  view.setUint16(offset + 2, 42);
  view.setUint32(offset + 4, 8); // IFD immediately follows the header
  offset += 8;

  view.setUint16(offset, tagIds.length);
  offset += 2;

  for (const id of tagIds) {
    view.setUint16(offset, id);
    view.setUint16(offset + 2, 2); // ASCII
    view.setUint32(offset + 4, 1);
    view.setUint32(offset + 8, 0);
    offset += 12;
  }

  view.setUint32(offset, 0); // no next IFD
  void tiffStart;

  return new File([buffer], 'photo.jpg', { type: 'image/jpeg' });
}

const detect = (tagIds: number[]): Promise<MetadataCategory[]> =>
  detectMetadata(jpegWithExifTags(tagIds));

describe('detectMetadata', () => {
  test('reports the camera make as camera information', async () => {
    await expect(detect([0x010f])).resolves.toEqual(['Camera']);
  });

  test('reports GPS separately, since location is the sensitive one', async () => {
    await expect(detect([0x8825])).resolves.toEqual(['GPS']);
  });

  test('reports capture dates', async () => {
    await expect(detect([0x9003])).resolves.toEqual(['Date']);
  });

  test('reports the device model and software as device information', async () => {
    await expect(detect([0x0110, 0x0131])).resolves.toEqual(['Device information']);
  });

  test('lists every category found, in a stable reading order', async () => {
    // Deliberately supplied out of order.
    const categories = await detect([0x9003, 0x8825, 0x0110, 0x010f]);

    expect(categories).toEqual(['Camera', 'GPS', 'Date', 'Device information']);
  });

  test('does not repeat a category when several tags share it', async () => {
    await expect(detect([0x829a, 0x829d, 0x8827])).resolves.toEqual(['Camera']);
  });

  test('reports nothing for a JPEG with no EXIF segment', async () => {
    const bare = new File([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], 'bare.jpg', {
      type: 'image/jpeg',
    });

    await expect(detectMetadata(bare)).resolves.toEqual([]);
  });

  test('reports nothing for a format it does not parse', async () => {
    const png = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], 'logo.png', {
      type: 'image/png',
    });

    await expect(detectMetadata(png)).resolves.toEqual([]);
  });

  test('does not throw on a truncated file', async () => {
    const truncated = new File([new Uint8Array([0xff, 0xd8])], 'cut.jpg', {
      type: 'image/jpeg',
    });

    await expect(detectMetadata(truncated)).resolves.toEqual([]);
  });
});
