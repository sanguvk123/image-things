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

/**
 * EXIF tag IDs, grouped by what they mean to a person rather than a spec.
 * The label is what the viewer shows; it is deliberately plain English.
 */
const TAGS: { id: number; category: MetadataCategory; label: string }[] = [
  { id: 0x010f, category: 'Camera', label: 'Camera make' },
  { id: 0x0110, category: 'Device information', label: 'Camera model' },
  { id: 0x0131, category: 'Device information', label: 'Software' },
  { id: 0x0132, category: 'Date', label: 'Date modified' },
  { id: 0x9003, category: 'Date', label: 'Date taken' },
  { id: 0x9004, category: 'Date', label: 'Date digitised' },
  { id: 0x829a, category: 'Camera', label: 'Exposure time' },
  { id: 0x829d, category: 'Camera', label: 'Aperture' },
  { id: 0x8827, category: 'Camera', label: 'ISO' },
  { id: 0x920a, category: 'Camera', label: 'Focal length' },
  { id: 0x8825, category: 'GPS', label: 'Location data' },
];

/** EXIF field types we can render. */
const TYPE = { ascii: 2, short: 3, long: 4, rational: 5 } as const;

const SOI = 0xffd8;
const APP1 = 0xffe1;
const EXIF_HEADER = 0x45786966; // "Exif"

/** A single human-readable EXIF entry, for the metadata viewer. */
export interface MetadataEntry {
  label: string;
  value: string;
  category: MetadataCategory;
}

/**
 * Locate the start of the TIFF block inside a JPEG's APP1/EXIF segment.
 *
 * Returns null when the file is not a JPEG or carries no EXIF at all.
 */
function findTiffStart(view: DataView): number | null {
  if (view.byteLength < 4 || view.getUint16(0) !== SOI) return null;

  let offset = 2;
  while (offset + 4 <= view.byteLength) {
    const marker = view.getUint16(offset);
    const segmentLength = view.getUint16(offset + 2);

    if ((marker & 0xff00) !== 0xff00) break;

    if (marker === APP1 && offset + 10 <= view.byteLength) {
      if (view.getUint32(offset + 4) === EXIF_HEADER) return offset + 10;
    }

    offset += 2 + segmentLength;
  }

  return null;
}

/**
 * EXIF lives near the start of the file; reading the whole photo would be
 * wasteful for something we only need the header of.
 */
async function readHead(file: File): Promise<DataView> {
  return new DataView(await file.slice(0, 128 * 1024).arrayBuffer());
}

/**
 * Read the metadata categories present in a file.
 *
 * Returns an empty list for formats we don't parse (PNG, WebP) or for images
 * that genuinely carry nothing — the UI treats both the same way, because
 * from the user's point of view there is nothing to remove either way.
 */
export async function detectMetadata(file: File): Promise<MetadataCategory[]> {
  const view = await readHead(file);
  const tiffStart = findTiffStart(view);
  return tiffStart === null ? [] : readExifCategories(view, tiffStart);
}

/**
 * Read EXIF entries with their actual values, for the viewer tools.
 *
 * detectMetadata answers "is there anything in here?", which is all the
 * removal tool needs. A viewer has to show what it actually says, so this
 * decodes values too.
 */
export async function readMetadata(file: File): Promise<MetadataEntry[]> {
  const view = await readHead(file);
  const tiffStart = findTiffStart(view);
  return tiffStart === null ? [] : readExifEntries(view, tiffStart);
}

/**
 * Decode a single IFD entry's value.
 *
 * Values longer than four bytes are stored elsewhere in the block and the
 * entry holds an offset instead, which is why this needs tiffStart.
 */
function readValue(
  view: DataView,
  entry: number,
  tiffStart: number,
  littleEndian: boolean,
): string | null {
  const type = view.getUint16(entry + 2, littleEndian);
  const count = view.getUint32(entry + 4, littleEndian);
  const sizes: Record<number, number> = { 2: 1, 3: 2, 4: 4, 5: 8 };
  const byteLength = (sizes[type] ?? 0) * count;
  if (byteLength === 0) return null;

  const inlineOffset = entry + 8;
  const start =
    byteLength <= 4 ? inlineOffset : tiffStart + view.getUint32(inlineOffset, littleEndian);
  if (start + byteLength > view.byteLength) return null;

  if (type === TYPE.ascii) {
    let text = '';
    for (let i = 0; i < count; i += 1) {
      const code = view.getUint8(start + i);
      if (code === 0) break;
      text += String.fromCharCode(code);
    }
    return text.trim() || null;
  }

  if (type === TYPE.short) return String(view.getUint16(start, littleEndian));
  if (type === TYPE.long) return String(view.getUint32(start, littleEndian));

  if (type === TYPE.rational) {
    const numerator = view.getUint32(start, littleEndian);
    const denominator = view.getUint32(start + 4, littleEndian);
    if (denominator === 0) return null;
    const ratio = numerator / denominator;
    // Exposure times are conventionally read as 1/250, not 0.004.
    return ratio < 1 ? `1/${Math.round(denominator / numerator)}` : String(ratio);
  }

  return null;
}

function readExifEntries(view: DataView, tiffStart: number): MetadataEntry[] {
  if (tiffStart + 8 > view.byteLength) return [];

  const littleEndian = view.getUint16(tiffStart) === 0x4949;
  const ifdStart = tiffStart + view.getUint32(tiffStart + 4, littleEndian);
  if (ifdStart + 2 > view.byteLength) return [];

  const entries: MetadataEntry[] = [];
  const entryCount = view.getUint16(ifdStart, littleEndian);

  for (let i = 0; i < entryCount; i += 1) {
    const entry = ifdStart + 2 + i * 12;
    if (entry + 12 > view.byteLength) break;

    const tagId = view.getUint16(entry, littleEndian);
    const tag = TAGS.find((candidate) => candidate.id === tagId);
    if (!tag) continue;

    // The GPS tag is a pointer to another IFD, not a readable value. Saying
    // location data is present matters far more than the coordinates.
    if (tag.category === 'GPS') {
      entries.push({ label: tag.label, value: 'Present', category: 'GPS' });
      continue;
    }

    const value = readValue(view, entry, tiffStart, littleEndian);
    if (value) entries.push({ label: tag.label, value, category: tag.category });
  }

  return entries;
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
