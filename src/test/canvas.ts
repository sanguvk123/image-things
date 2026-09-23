import { vi } from 'vitest';

/**
 * Minimal canvas + ImageBitmap stubs for jsdom.
 *
 * jsdom has no rendering engine, so `createImageBitmap` and `canvas.toBlob`
 * do not exist. These stubs let us test the full user flow of every tool —
 * choose a file, pick options, act, download — without a real browser. They
 * model size and dimensions faithfully, which is what the UI actually asserts
 * on; pixel output is verified by the pure operation tests instead.
 */

export interface CanvasStub {
  /** Bytes the fake encoder reports for the next encode. */
  encodedSize: number;
  /** Every (mimeType, quality, pixels) triple passed to toBlob, in order. */
  encodeCalls: {
    type: string;
    quality: number | undefined;
    width: number;
    height: number;
  }[];
  /** Filter strings assigned to the 2D context, in order. */
  filtersUsed: string[];
  restore: () => void;
}

export function installCanvasStubs(
  options: {
    width?: number;
    height?: number;
    encodedSize?: number;
    /**
     * When set, encoded size scales with quality and pixel count instead of
     * being fixed. Required for testing anything that searches for a size.
     */
    sizeModel?: (quality: number, width: number, height: number) => number;
  } = {},
): CanvasStub {
  const width = options.width ?? 1920;
  const height = options.height ?? 1080;

  const stub: CanvasStub = {
    encodedSize: options.encodedSize ?? 120_000,
    encodeCalls: [],
    filtersUsed: [],
    restore: () => {},
  };

  const originalCreateImageBitmap = globalThis.createImageBitmap;
  const originalGetContext = HTMLCanvasElement.prototype.getContext;
  const originalToBlob = HTMLCanvasElement.prototype.toBlob;
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;

  globalThis.createImageBitmap = vi.fn(async () => ({
    width,
    height,
    close: vi.fn(),
  })) as unknown as typeof createImageBitmap;

  HTMLCanvasElement.prototype.getContext = vi.fn(function (
    this: HTMLCanvasElement,
  ) {
    return {
      canvas: this,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high',
      fillStyle: '#000000',
      // Record filters so tests can assert the saved image matches the preview.
      _filter: 'none',
      get filter() {
        return this._filter;
      },
      set filter(value: string) {
        this._filter = value;
        stub.filtersUsed.push(value);
      },
      globalCompositeOperation: 'source-over',
      save: vi.fn(),
      restore: vi.fn(),
      scale: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      fillRect: vi.fn(),
      drawImage: vi.fn(),
      getImageData: vi.fn(() => ({
        data: new Uint8ClampedArray(this.width * this.height * 4),
        width: this.width,
        height: this.height,
      })),
      putImageData: vi.fn(),
      createImageData: vi.fn((w: number, h: number) => ({
        data: new Uint8ClampedArray(w * h * 4),
        width: w,
        height: h,
      })),
    };
  }) as unknown as typeof HTMLCanvasElement.prototype.getContext;

  HTMLCanvasElement.prototype.toBlob = function (
    this: HTMLCanvasElement,
    callback: BlobCallback,
    type?: string,
    quality?: number,
  ) {
    stub.encodeCalls.push({
      type: type ?? 'image/png',
      quality,
      width: this.width,
      height: this.height,
    });

    const size = options.sizeModel
      ? options.sizeModel(quality ?? 1, this.width, this.height)
      : stub.encodedSize;

    const bytes = new Uint8Array(Math.max(1, Math.round(size)));
    callback(new Blob([bytes], { type: type ?? 'image/png' }));
  };

  let urlCounter = 0;
  URL.createObjectURL = vi.fn(() => `blob:stub/${++urlCounter}`);
  URL.revokeObjectURL = vi.fn();

  stub.restore = () => {
    globalThis.createImageBitmap = originalCreateImageBitmap;
    HTMLCanvasElement.prototype.getContext = originalGetContext;
    HTMLCanvasElement.prototype.toBlob = originalToBlob;
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  };

  return stub;
}

/**
 * A File that looks like a real photo to the code under test.
 *
 * The bytes are actually allocated because `File.size` reports real content
 * length, and the UI displays that size to the user.
 */
export function fakeImageFile(
  name = 'photo.jpg',
  sizeBytes = 2_800_000,
  type = 'image/jpeg',
): File {
  return new File([new Uint8Array(sizeBytes)], name, { type });
}
