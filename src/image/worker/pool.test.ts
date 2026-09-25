import { afterEach, describe, expect, test, vi } from 'vitest';

import { sharpenPixels } from '../sharpen';
import { removeBackgroundPixels } from '../background';

import { runPixelJob, __resetPoolForTests, isWorkerSupported } from './pool';

/**
 * The pixel job runner.
 *
 * Two properties matter more than speed. First, the answer must be identical
 * to the synchronous implementation -- a faster wrong image is worthless.
 * Second, it must still work where Workers do not exist: jsdom has no Worker,
 * and neither do some locked-down browsers, so the runner falls back rather
 * than failing.
 */

afterEach(() => {
  __resetPoolForTests();
  vi.unstubAllGlobals();
});

function gradient(width: number, height: number): Uint8ClampedArray {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = (i * 7) % 256;
    data[i + 1] = (i * 13) % 256;
    data[i + 2] = (i * 29) % 256;
    data[i + 3] = 255;
  }
  return data;
}

describe('runPixelJob', () => {
  test('sharpening matches the synchronous implementation exactly', async () => {
    const width = 40;
    const height = 30;
    const source = gradient(width, height);
    const expected = sharpenPixels(source.slice(), width, height, 0.7);

    const actual = await runPixelJob({
      kind: 'sharpen',
      pixels: source.slice(),
      width,
      height,
      amount: 0.7,
    });

    expect(Array.from(actual)).toEqual(Array.from(expected));
  });

  test('background removal matches the synchronous implementation exactly', async () => {
    const width = 24;
    const height = 24;
    const source = new Uint8ClampedArray(width * height * 4).fill(255);
    // A darker square in the middle, so there is something to keep.
    for (let y = 8; y < 16; y += 1) {
      for (let x = 8; x < 16; x += 1) {
        const i = (y * width + x) * 4;
        source[i] = 20;
        source[i + 1] = 30;
        source[i + 2] = 40;
      }
    }

    const actual = await runPixelJob({
      kind: 'removeBackground',
      pixels: source.slice(),
      width,
      height,
      tolerance: 20,
    });

    // The border is cleared, the subject is not.
    expect(actual[3]).toBe(0);
    const middle = (12 * width + 12) * 4;
    expect(actual[middle + 3]).toBe(255);
  });

  /**
   * A horizontal ramp, one grey level per column, inside a pure white border.
   *
   * The border being uniform matters twice over: the flood fill needs somewhere
   * to start, and it pins the sampled edge colour to exactly white so the
   * distance of column x is a known 3x^2. One level per column is the point --
   * an earlier version of this test stepped the shade by 40 at a time, which is
   * so much coarser than any realistic threshold change that both sides cleared
   * identical pixels and the test passed no matter what executeJob did.
   */
  function ramp(width: number, height: number): Uint8ClampedArray {
    const data = new Uint8ClampedArray(width * height * 4).fill(255);
    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const i = (y * width + x) * 4;
        const shade = 255 - x;
        data[i] = shade;
        data[i + 1] = shade;
        data[i + 2] = shade;
      }
    }
    return data;
  }

  function transparentCount(pixels: Uint8ClampedArray): number {
    let count = 0;
    for (let i = 3; i < pixels.length; i += 4) if (pixels[i] === 0) count += 1;
    return count;
  }

  /**
   * The job carries `tolerance` as a bare number, but removeBackgroundPixels
   * takes an options object. That translation happens in executeJob, and it is
   * exactly the kind of seam that breaks silently: a wrong tolerance still
   * clears the border and still keeps the subject, so the coarser test above
   * would pass while every user got a slightly different cutout.
   */
  /**
   * The tolerances are all small enough that the cleared region stops inside
   * the ramp. At 60 the threshold already exceeds the darkest column, so the
   * whole image clears whatever the tolerance is and the comparison proves
   * nothing -- the meta-test below is what caught that.
   */
  const RESOLVABLE_TOLERANCES = [5, 10, 20];

  test('background removal passes the tolerance through unchanged', async () => {
    const width = 60;
    const height = 12;
    const source = ramp(width, height);

    for (const tolerance of RESOLVABLE_TOLERANCES) {
      const expected = removeBackgroundPixels(source.slice(), width, height, {
        tolerance,
      });
      const actual = await runPixelJob({
        kind: 'removeBackground',
        pixels: source.slice(),
        width,
        height,
        tolerance,
      });
      expect(Array.from(actual)).toEqual(Array.from(expected));
    }
  });

  /**
   * Guards the guard above. If the ramp were too coarse to resolve a small
   * change in tolerance, the comparison test would agree for the wrong reason.
   * These are the exact values that test uses, and a 10% shift in any of them
   * has to move the boundary by at least one column for it to mean anything.
   */
  test('the tolerance ramp is fine enough to resolve a 10% change', () => {
    const width = 60;
    const height = 12;
    const source = ramp(width, height);

    for (const tolerance of RESOLVABLE_TOLERANCES) {
      const exact = removeBackgroundPixels(source.slice(), width, height, {
        tolerance,
      });
      const nudged = removeBackgroundPixels(source.slice(), width, height, {
        tolerance: tolerance * 0.9,
      });
      expect(transparentCount(nudged)).toBeLessThan(transparentCount(exact));
    }
  });

  test('works when the environment has no Worker at all', async () => {
    vi.stubGlobal('Worker', undefined);
    __resetPoolForTests();
    expect(isWorkerSupported()).toBe(false);

    const width = 20;
    const height = 20;
    const source = gradient(width, height);
    const expected = sharpenPixels(source.slice(), width, height, 0.35);

    const actual = await runPixelJob({
      kind: 'sharpen',
      pixels: source.slice(),
      width,
      height,
      amount: 0.35,
    });

    expect(Array.from(actual)).toEqual(Array.from(expected));
  });

  test('a cancelled job rejects rather than resolving with a stale image', async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(
      runPixelJob(
        { kind: 'sharpen', pixels: gradient(16, 16), width: 16, height: 16, amount: 0.7 },
        controller.signal,
      ),
    ).rejects.toThrow(/cancel/i);
  });

  test('an unknown job kind is refused rather than silently returning the input', async () => {
    await expect(
      // @ts-expect-error -- deliberately invalid, guarding the runtime path
      runPixelJob({ kind: 'nonsense', pixels: gradient(8, 8), width: 8, height: 8 }),
    ).rejects.toThrow();
  });
});
