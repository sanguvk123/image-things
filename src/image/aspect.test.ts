import { matchAspectRatio } from './aspect';

describe('matchAspectRatio', () => {
  test('derives the height when the width changes', () => {
    // Spec §19: 1080×1080 with width set to 1200 becomes 1200×675... but only
    // because the source is 16:9. For a square source it stays square.
    expect(matchAspectRatio({ width: 1200 }, 1080, 1080)).toEqual({
      width: 1200,
      height: 1200,
    });
    expect(matchAspectRatio({ width: 1200 }, 1920, 1080)).toEqual({
      width: 1200,
      height: 675,
    });
  });

  test('derives the width when the height changes', () => {
    expect(matchAspectRatio({ height: 540 }, 1920, 1080)).toEqual({
      width: 960,
      height: 540,
    });
  });

  test('rounds to whole pixels', () => {
    const { width, height } = matchAspectRatio({ width: 1000 }, 1920, 1080);
    expect(Number.isInteger(width)).toBe(true);
    expect(Number.isInteger(height)).toBe(true);
    expect(height).toBe(563);
  });

  test('never collapses a dimension to zero', () => {
    expect(matchAspectRatio({ width: 1 }, 10_000, 5).height).toBe(1);
  });

  test('treats a cleared or invalid field as no change', () => {
    expect(matchAspectRatio({ width: 0 }, 1920, 1080)).toEqual({
      width: 1920,
      height: 1080,
    });
    expect(matchAspectRatio({ width: Number.NaN }, 1920, 1080)).toEqual({
      width: 1920,
      height: 1080,
    });
  });
});
