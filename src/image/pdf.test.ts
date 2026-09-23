import { buildPdf, layoutPage, type PdfPage } from './pdf';

const A4 = { width: 595.28, height: 841.89 };

function page(width: number, height: number): PdfPage {
  return { jpeg: new Uint8Array([0xff, 0xd8, 0xff, 0xd9]), width, height };
}

async function pdfText(pages: PdfPage[]): Promise<string> {
  const blob = buildPdf(pages);
  const buffer = await blob.arrayBuffer();
  // Latin1 keeps byte values intact so structure is readable alongside binary.
  return new TextDecoder('latin1').decode(buffer);
}

describe('layoutPage', () => {
  test('centres the image on the page', () => {
    const box = layoutPage(1000, 1000);

    expect(box.x).toBeCloseTo((A4.width - box.width) / 2, 2);
    expect(box.y).toBeCloseTo((A4.height - box.height) / 2, 2);
  });

  test('keeps the aspect ratio when fitting a wide image', () => {
    const box = layoutPage(4000, 2000);

    expect(box.width / box.height).toBeCloseTo(2, 5);
  });

  test('fits inside the page margins', () => {
    const box = layoutPage(8000, 8000);

    expect(box.width).toBeLessThan(A4.width);
    expect(box.height).toBeLessThan(A4.height);
    expect(box.x).toBeGreaterThan(0);
  });

  test('does not upscale an image that already fits', () => {
    const box = layoutPage(100, 80);

    expect(box.width).toBe(100);
    expect(box.height).toBe(80);
  });

  test('a tall image is limited by page height, a wide one by width', () => {
    const tall = layoutPage(1000, 5000);
    const wide = layoutPage(5000, 1000);

    expect(tall.height).toBeLessThanOrEqual(A4.height);
    expect(wide.width).toBeLessThanOrEqual(A4.width);
  });
});

describe('buildPdf', () => {
  test('produces a file that identifies itself as a PDF', async () => {
    const text = await pdfText([page(1920, 1080)]);

    expect(text.startsWith('%PDF-1.4')).toBe(true);
    expect(text.trimEnd().endsWith('%%EOF')).toBe(true);
  });

  test('has the application/pdf content type', () => {
    expect(buildPdf([page(800, 600)]).type).toBe('application/pdf');
  });

  test('embeds the JPEG without re-encoding it', async () => {
    const text = await pdfText([page(1920, 1080)]);

    // DCTDecode is what lets the original JPEG bytes pass through untouched.
    expect(text).toContain('/Filter /DCTDecode');
    expect(text).toContain('/Width 1920');
    expect(text).toContain('/Height 1080');
  });

  test('creates one page per image', async () => {
    const single = await pdfText([page(800, 600)]);
    const triple = await pdfText([page(800, 600), page(640, 480), page(100, 100)]);

    expect(single).toContain('/Count 1');
    expect(triple).toContain('/Count 3');
    expect(triple.match(/\/Type \/Page[^s]/g)).toHaveLength(3);
  });

  test('declares a cross-reference table sized to its objects', async () => {
    const text = await pdfText([page(800, 600)]);

    // One page means catalog + tree + 3 page objects = 5, plus the free entry.
    expect(text).toContain('xref\n0 6');
    expect(text).toContain('/Size 6');
  });

  test('refuses to build an empty document', () => {
    expect(() => buildPdf([])).toThrow(/at least one image/i);
  });
});
