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
  /** Every (mimeType, quality) pair passed to toBlob, in order. */
  encodeCalls: { type: string; quality: number | undefined }[];
  restore: () => void;
}

export function installCanvasStubs(
  options: { width?: number; height?: number; encodedSize?: number } = {},
): CanvasStub {
  const width = options.width ?? 1920;
  const height = options.height ?? 1080;

  const stub: CanvasStub = {
    encodedSize: options.encodedSize ?? 120_000,
    encodeCalls: [],
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
      filter: 'none',
      fillStyle: '#000000',
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
    callback: BlobCallback,
    type?: string,
    quality?: number,
  ) {
    stub.encodeCalls.push({ type: type ?? 'image/png', quality });
    const bytes = new Uint8Array(Math.max(1, stub.encodedSize));
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
