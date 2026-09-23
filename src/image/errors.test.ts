import { describe, expect, test } from 'vitest';
import { messageForLoadFailure, messageForRunFailure } from './errors';
import { UnsupportedImageError } from './pipeline';

/**
 * Spec §17: an error must say what went wrong and what to do next. The tests
 * below check that property rather than pinning exact wording, so the copy can
 * be improved without a test edit -- except where a specific fact matters.
 */

const NEXT_STEP = /\b(try|choose|pick|use|convert|save|reload|close)\b/i;

describe('messageForLoadFailure', () => {
  test.each([
    ['an unrecognised error', new Error('boom')],
    ['an unsupported type', new UnsupportedImageError()],
    [
      'a damaged file',
      new UnsupportedImageError(
        "We couldn't read that image. It may be damaged or use an unusual variant.",
      ),
    ],
    ['a file too large to decode', new RangeError('Array buffer allocation failed')],
  ])('names the file after %s', (_case, cause) => {
    // Image -> PDF loads several files in a row, so "we couldn't read that
    // image" leaves the user with no idea which of them to replace.
    expect(messageForLoadFailure(cause, 'holiday.xyz')).toContain('holiday.xyz');
  });

  test('tells the user what to do next', () => {
    const message = messageForLoadFailure(new Error('boom'), 'holiday.xyz');

    expect(message).toMatch(NEXT_STEP);
  });

  test('keeps the specific reason when the pipeline supplied one', () => {
    // A damaged HEIC is a different problem from an unreadable file type,
    // and the pipeline already knows which it was.
    const cause = new UnsupportedImageError(
      "We couldn't read that image. It may be damaged or use an unusual variant.",
    );

    expect(messageForLoadFailure(cause, 'photo.heic')).toContain('damaged');
  });

  test('suggests the formats that will work when the type is unsupported', () => {
    const message = messageForLoadFailure(new UnsupportedImageError(), 'notes.pdf');

    expect(message).toMatch(/JPG|PNG|WebP/i);
  });

  test('never says only that something went wrong', () => {
    const message = messageForLoadFailure(new Error('boom'), 'holiday.xyz');

    expect(message).not.toMatch(/^something went wrong/i);
  });
});

describe('messageForRunFailure', () => {
  test('tells the user what to do next', () => {
    expect(messageForRunFailure(new Error('boom'))).toMatch(NEXT_STEP);
  });

  test('does not leak an internal error string to the user', () => {
    // Regression guard. `run` used to surface cause.message for any Error,
    // so internals like "TIFF image could not be decoded." reached the UI.
    const message = messageForRunFailure(new Error('TIFF image could not be decoded.'));

    expect(message).not.toContain('TIFF image could not be decoded.');
  });

  test('explains an out-of-memory failure in terms the user can act on', () => {
    const cause = new RangeError('Array buffer allocation failed');

    expect(messageForRunFailure(cause)).toMatch(/large|memory|smaller/i);
  });

  test('never says only that something went wrong', () => {
    expect(messageForRunFailure(new Error('boom'))).not.toMatch(/^something went wrong/i);
  });
});
