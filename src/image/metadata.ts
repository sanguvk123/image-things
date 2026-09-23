/**
 * Metadata detection (spec §29).
 *
 * The point of this tool is a privacy promise, and a privacy promise the user
 * can't verify is worthless. So rather than silently re-encoding, we read the
 * JPEG's EXIF block and name what is actually in there — "Camera", "GPS",
 * "Date", "Device information" — before removing it.
 *
 * This is a deliberately small reader: it walks the APP1/EXIF IFD looking for
 * a handful of well-known tags. It is not a general EXIF library, because the
 * UI only ever needs these four categories.
 */

export type MetadataCategory = 'Camera' | 'GPS' | 'Date' | 'Device information';

/** EXIF tag IDs, grouped by what they mean to a person rather than a spec. */
const TAGS: { id: number; category: MetadataCategory }[] = [
  { id: 0x010f, category: 'Camera' }, // Make
  { id: 0x0110, category: 'Device information' }, // Model
  { id: 0x0131, category: 'Device information' }, // Software
  { id: 0x0132, category: 'Date' }, // DateTime
  { id: 0x9003, category: 'Date' }, // DateTimeOriginal
  { id: 0x9004, category: 'Date' }, // DateTimeDigitized
  { id: 0x829a, category: 'Camera' }, // ExposureTime
  { id: 0x829d, category: 'Camera' }, // FNumber
  { id: 0x8827, category: 'Camera' }, // ISO
  { id: 0x920a, category: 'Camera' }, // FocalLength
  { id: 0x8825, category: 'GPS' }, // GPS IFD pointer
];

const SOI = 0xffd8;
const APP1 = 0xffe1;
const EXIF_HEADER = 0x45786966; // "Exif"

/**
 * Read the metadata categories present in a file.
 *
 * Returns an empty list for formats we don't parse (PNG, WebP) or for images
 * that genuinely carry nothing — the UI treats both the same way, because
 * from the user's point of view there is nothing to remove either way.
 */
export async function detectMetadata(file: File): Promise<MetadataCategory[]> {
  // EXIF lives near the start of the file; reading the whole photo would be
  // wasteful for something we only need the header of.
  const head = await file.slice(0, 128 * 1024).arrayBuffer();
  const view = new DataView(head);

  if (view.byteLength < 4 || view.getUint16(0) !== SOI) return [];

  let offset = 2;
  while (offset + 4 <= view.byteLength) {
    const marker = view.getUint16(offset);
    const segmentLength = view.getUint16(offset + 2);

    if ((marker & 0xff00) !== 0xff00) break;

    if (marker === APP1 && offset + 10 <= view.byteLength) {
      if (view.getUint32(offset + 4) === EXIF_HEADER) {
        return readExifCategories(view, offset + 10);
      }
    }

    offset += 2 + segmentLength;
  }

  return [];
}

function readExifCategories(view: DataView, tiffStart: number): MetadataCategory[] {
  if (tiffStart + 8 > view.byteLength) return [];

  // TIFF header declares its own byte order: "II" little-endian, "MM" big.
  const littleEndian = view.getUint16(tiffStart) === 0x4949;
  const ifdOffset = view.getUint32(tiffStart + 4, littleEndian);
  const ifdStart = tiffStart + ifdOffset;

  if (ifdStart + 2 > view.byteLength) return [];

  const found = new Set<MetadataCategory>();
  const entryCount = view.getUint16(ifdStart, littleEndian);

  for (let i = 0; i < entryCount; i += 1) {
    const entry = ifdStart + 2 + i * 12;
    if (entry + 12 > view.byteLength) break;

    const tagId = view.getUint16(entry, littleEndian);
    const match = TAGS.find((tag) => tag.id === tagId);
    if (match) found.add(match.category);
  }

  // Order the categories the way the spec's example lists them, so the panel
  // reads consistently rather than in EXIF tag order.
  const order: MetadataCategory[] = ['Camera', 'GPS', 'Date', 'Device information'];
  return order.filter((category) => found.has(category));
}
