import { centeredRect, clampToBounds, moveRect, toPixels } from './crop';

describe('centeredRect', () => {
  test('a square crop of a 16:9 image fills the height and is centred', () => {
    const rect = centeredRect(1, 16 / 9);

    expect(rect.height).toBe(1);
    expect(rect.width).toBeCloseTo(9 / 16, 5);
    expect(rect.x).toBeCloseTo((1 - 9 / 16) / 2, 5);
    expect(rect.y).toBe(0);
  });

  test('a 16:9 crop of a square image fills the width', () => {
    const rect = centeredRect(16 / 9, 1);

    expect(rect.width).toBe(1);
    expect(rect.height).toBeCloseTo(9 / 16, 5);
  });

  test('a matching ratio selects the whole image', () => {
    const rect = centeredRect(16 / 9, 16 / 9);

    expect(rect).toEqual({ x: 0, y: 0, width: 1, height: 1 });
  });

  test('free crop starts as a visible centred box, not the entire image', () => {
    const rect = centeredRect(null, 16 / 9);

    expect(rect.width).toBeLessThan(1);
    expect(rect.x).toBeGreaterThan(0);
  });

  test('the produced rectangle always stays inside the image', () => {
    for (const ratio of [1, 4 / 5, 16 / 9, 0.2, 5]) {
      const rect = centeredRect(ratio, 16 / 9);
      expect(rect.x).toBeGreaterThanOrEqual(0);
      expect(rect.y).toBeGreaterThanOrEqual(0);
      expect(rect.x + rect.width).toBeLessThanOrEqual(1.0001);
      expect(rect.y + rect.height).toBeLessThanOrEqual(1.0001);
    }
  });
});

describe('clampToBounds', () => {
  test('pulls a rectangle that hangs off the edge back inside', () => {
    expect(clampToBounds({ x: 0.8, y: 0.9, width: 0.5, height: 0.5 })).toEqual({
      x: 0.5,
      y: 0.5,
      width: 0.5,
      height: 0.5,
    });
  });

  test('a negative origin is pushed to zero', () => {
    expect(clampToBounds({ x: -0.2, y: -0.1, width: 0.5, height: 0.5 })).toMatchObject(
      { x: 0, y: 0 },
    );
  });

  test('an oversized rectangle is capped at the full image', () => {
    expect(clampToBounds({ x: 0, y: 0, width: 2, height: 3 })).toEqual({
      x: 0,
      y: 0,
      width: 1,
      height: 1,
    });
  });
});

describe('moveRect', () => {
  test('moves by the given delta', () => {
    expect(moveRect({ x: 0.2, y: 0.2, width: 0.5, height: 0.5 }, 0.1, -0.1)).toEqual({
      x: 0.30000000000000004,
      y: 0.1,
      width: 0.5,
      height: 0.5,
    });
  });

  test('stops at the edge instead of sliding the crop off the image', () => {
    const moved = moveRect({ x: 0.4, y: 0.4, width: 0.5, height: 0.5 }, 0.9, 0.9);
    expect(moved.x).toBeCloseTo(0.5, 5);
    expect(moved.y).toBeCloseTo(0.5, 5);
  });
});

describe('toPixels', () => {
  test('converts a normalised crop into whole pixels', () => {
    expect(toPixels({ x: 0.25, y: 0.5, width: 0.5, height: 0.25 }, 1920, 1080)).toEqual(
      { x: 480, y: 540, width: 960, height: 270 },
    );
  });

  test('never produces an empty crop', () => {
    const rect = toPixels({ x: 0, y: 0, width: 0.0001, height: 0.0001 }, 100, 100);
    expect(rect.width).toBe(1);
    expect(rect.height).toBe(1);
  });
});
