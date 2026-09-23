import {
  formatBytes,
  extensionFor,
  outputFileName,
  formatLabel,
  scaleToFit,
  percentSmaller,
} from './format';

describe('formatBytes', () => {
  test('uses KB below a megabyte and MB above it', () => {
    expect(formatBytes(0)).toBe('0 KB');
    expect(formatBytes(950)).toBe('1 KB');
    expect(formatBytes(96_000)).toBe('96 KB');
    expect(formatBytes(2_800_000)).toBe('2.8 MB');
  });

  test('never reports a non-empty file as 0 KB', () => {
    // A 12-byte file is real; showing "0 KB" would look like a bug to the user.
    expect(formatBytes(12)).toBe('1 KB');
  });
});

describe('outputFileName', () => {
  test('keeps the base name and applies the new extension', () => {
    expect(outputFileName('photo.jpg', 'png')).toBe('photo.png');
    expect(outputFileName('holiday.snap.webp', 'jpeg')).toBe('holiday.snap.jpg');
  });

  test('handles a name with no extension', () => {
    expect(outputFileName('screenshot', 'png')).toBe('screenshot.png');
  });

  test('adds a suffix when asked, so downloads do not collide with the source', () => {
    expect(outputFileName('photo.jpg', 'jpeg', 'compressed')).toBe(
      'photo-compressed.jpg',
    );
  });
});

describe('extensionFor and formatLabel', () => {
  test('jpeg is presented to users as jpg', () => {
    expect(extensionFor('jpeg')).toBe('jpg');
    expect(formatLabel('jpeg')).toBe('JPG');
  });

  test('other formats keep their names', () => {
    expect(extensionFor('png')).toBe('png');
    expect(formatLabel('webp')).toBe('WebP');
  });
});

describe('scaleToFit', () => {
  test('leaves an image smaller than the box untouched', () => {
    expect(scaleToFit(400, 300, 1000)).toEqual({ width: 400, height: 300 });
  });

  test('scales the long edge down to the limit and keeps the ratio', () => {
    expect(scaleToFit(4000, 2000, 1000)).toEqual({ width: 1000, height: 500 });
    expect(scaleToFit(2000, 4000, 1000)).toEqual({ width: 500, height: 1000 });
  });

  test('never rounds a dimension down to zero', () => {
    expect(scaleToFit(10_000, 5, 100).height).toBe(1);
  });
});

describe('percentSmaller', () => {
  test('reports the saving as a whole percentage', () => {
    expect(percentSmaller(2_800_000, 96_000)).toBe(97);
    expect(percentSmaller(1000, 500)).toBe(50);
  });

  test('reports zero rather than a negative saving when output grew', () => {
    expect(percentSmaller(500, 1000)).toBe(0);
  });

  test('is safe when the original is empty', () => {
    expect(percentSmaller(0, 0)).toBe(0);
  });
});
