import { searchForTargetSize, type SizeProbe } from './targetSize';

/**
 * A stand-in encoder whose output size falls as quality falls and as the
 * image is scaled down — the same monotonic relationship real encoders have,
 * which is the property the search relies on.
 */
function fakeEncoder(baseBytes: number): SizeProbe {
  return async (quality, maxEdge) => {
    const scale = maxEdge ? (maxEdge / 4000) ** 2 : 1;
    return Math.round(baseBytes * quality * Math.min(1, scale));
  };
}

const KB = 1000;

describe('searchForTargetSize', () => {
  test('finds an encode that fits under the target', async () => {
    const result = await searchForTargetSize(fakeEncoder(1_000_000), 100 * KB);

    expect(result.best).not.toBeNull();
    expect(result.best!.bytes).toBeLessThanOrEqual(100 * KB);
  });

  test('gets close to the target rather than overshooting into mush', async () => {
    const target = 100 * KB;
    const result = await searchForTargetSize(fakeEncoder(1_000_000), target);

    // A result far under target means needlessly destroyed quality.
    expect(result.best!.bytes).toBeGreaterThan(target * 0.8);
  });

  test('does not scale the image when quality alone is enough', async () => {
    const result = await searchForTargetSize(fakeEncoder(1_000_000), 500 * KB);
    expect(result.best!.maxEdge).toBeNull();
  });

  test('falls back to scaling when even the lowest quality is too big', async () => {
    // 50MB base: no quality setting alone reaches 100KB.
    const result = await searchForTargetSize(fakeEncoder(50_000_000), 100 * KB);

    expect(result.best).not.toBeNull();
    expect(result.best!.maxEdge).not.toBeNull();
    expect(result.best!.bytes).toBeLessThanOrEqual(100 * KB);
  });

  test('reports the smallest attempt when the target is impossible', async () => {
    // Every encode returns the same huge size, whatever we ask for.
    const stubborn: SizeProbe = async () => 5_000_000;
    const result = await searchForTargetSize(stubborn, 10 * KB);

    expect(result.best).toBeNull();
    expect(result.smallest.bytes).toBe(5_000_000);
  });

  test('bounds how long the user waits', async () => {
    let calls = 0;
    const counting: SizeProbe = async (quality) => {
      calls += 1;
      return Math.round(50_000_000 * quality);
    };

    await searchForTargetSize(counting, 1 * KB);

    // Worst case: the full quality sweep plus every downscale fallback.
    expect(calls).toBeLessThanOrEqual(48);
  });

  test('prefers the highest quality among encodes that fit', async () => {
    const result = await searchForTargetSize(fakeEncoder(1_000_000), 400 * KB);

    // Fitting at 0.4 but returning 0.25 would waste available quality.
    expect(result.best!.quality).toBeGreaterThan(0.35);
  });
});
