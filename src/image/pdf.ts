/**
 * Minimal PDF writer for the Image → PDF tool (spec §9).
 *
 * A PDF that embeds JPEGs is a small, well-defined subset of the format: the
 * DCTDecode filter lets the JPEG bytes go in verbatim, with no re-encoding and
 * no compression library. Writing those few hundred bytes of structure by hand
 * is far lighter than shipping a general PDF dependency for one tool.
 */

export interface PdfPage {
  /** Raw JPEG bytes, embedded as-is. */
  jpeg: Uint8Array;
  width: number;
  height: number;
}

/** A4 at 72dpi, the unit PDF uses natively. */
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 24;

/**
 * Fit an image inside the printable area without distorting or upscaling it,
 * and centre what is left over.
 */
export function layoutPage(imageWidth: number, imageHeight: number) {
  const maxWidth = PAGE_WIDTH - MARGIN * 2;
  const maxHeight = PAGE_HEIGHT - MARGIN * 2;

  const scale = Math.min(maxWidth / imageWidth, maxHeight / imageHeight, 1);
  const width = imageWidth * scale;
  const height = imageHeight * scale;

  return {
    width,
    height,
    x: (PAGE_WIDTH - width) / 2,
    y: (PAGE_HEIGHT - height) / 2,
  };
}

const encoder = new TextEncoder();

/** Build a PDF containing one image per page. */
export function buildPdf(pages: PdfPage[]): Blob {
  if (pages.length === 0) throw new Error('A PDF needs at least one image.');

  const chunks: (string | Uint8Array)[] = [];
  const offsets: number[] = [];
  let length = 0;

  const push = (chunk: string | Uint8Array) => {
    chunks.push(chunk);
    length += typeof chunk === 'string' ? encoder.encode(chunk).length : chunk.length;
  };

  // Objects are numbered from 1; the cross-reference table at the end needs
  // the byte offset of each, so record the position before writing.
  const startObject = (id: number) => {
    offsets[id] = length;
    push(`${id} 0 obj\n`);
  };

  push('%PDF-1.4\n');
  // A binary comment marks the file as containing binary data, which keeps
  // naive tools from mangling it as text.
  push(new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));

  const pageCount = pages.length;
  // 1 = catalog, 2 = page tree, then 3 objects per page.
  const pageObjectId = (index: number) => 3 + index * 3;

  startObject(1);
  push('<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  const kids = pages.map((_, i) => `${pageObjectId(i)} 0 R`).join(' ');
  startObject(2);
  push(`<< /Type /Pages /Kids [${kids}] /Count ${pageCount} >>\nendobj\n`);

  pages.forEach((page, index) => {
    const pageId = pageObjectId(index);
    const contentId = pageId + 1;
    const imageId = pageId + 2;
    const box = layoutPage(page.width, page.height);

    startObject(pageId);
    push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
        `/Resources << /XObject << /Im0 ${imageId} 0 R >> >> ` +
        `/Contents ${contentId} 0 R >>\nendobj\n`,
    );

    // The content stream places the image via a scaled transformation matrix.
    const content = `q\n${box.width.toFixed(2)} 0 0 ${box.height.toFixed(2)} ${box.x.toFixed(2)} ${box.y.toFixed(2)} cm\n/Im0 Do\nQ\n`;
    startObject(contentId);
    push(`<< /Length ${content.length} >>\nstream\n${content}endstream\nendobj\n`);

    startObject(imageId);
    push(
      `<< /Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} ` +
        `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode ` +
        `/Length ${page.jpeg.length} >>\nstream\n`,
    );
    push(page.jpeg);
    push('\nendstream\nendobj\n');
  });

  const totalObjects = 2 + pageCount * 3;
  const xrefOffset = length;

  push(`xref\n0 ${totalObjects + 1}\n`);
  push('0000000000 65535 f \n');
  for (let id = 1; id <= totalObjects; id += 1) {
    push(`${String(offsets[id]).padStart(10, '0')} 00000 n \n`);
  }

  push(
    `trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`,
  );

  const parts = chunks.map((chunk) =>
    typeof chunk === 'string' ? encoder.encode(chunk) : chunk,
  );
  return new Blob(parts as BlobPart[], { type: 'application/pdf' });
}
