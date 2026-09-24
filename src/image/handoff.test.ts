import { beforeEach, describe, expect, test } from 'vitest';
import { clearHandoff, takeHandoff, offerHandoff } from './handoff';

/**
 * Review §15 / brief §12: "Continue with this image".
 *
 * A result should be able to become the next tool's input without the user
 * finding the file again. The awkward part is that moving between tools is a
 * route change, so the image has to survive one navigation -- but no longer,
 * or a stale image ambushes an unrelated visit later.
 */

function resultFile(name = 'photo-compressed.jpg'): File {
  return new File(['x'.repeat(2000)], name, { type: 'image/jpeg' });
}

beforeEach(() => clearHandoff());

describe('handing an image to the next tool', () => {
  test('the offered file is what the next tool receives', () => {
    const file = resultFile();

    offerHandoff(file);

    expect(takeHandoff()?.name).toBe('photo-compressed.jpg');
  });

  test('nothing is waiting when no image was offered', () => {
    expect(takeHandoff()).toBeNull();
  });

  test('it is consumed once, so a later visit starts empty', () => {
    // Otherwise someone who opens Crop tomorrow finds yesterday's photo
    // already loaded, with no memory of putting it there.
    offerHandoff(resultFile());

    expect(takeHandoff()).not.toBeNull();
    expect(takeHandoff()).toBeNull();
  });

  test('a second offer replaces the first rather than queueing', () => {
    offerHandoff(resultFile('first.jpg'));
    offerHandoff(resultFile('second.jpg'));

    expect(takeHandoff()?.name).toBe('second.jpg');
    expect(takeHandoff()).toBeNull();
  });

  test('clearing discards a pending image', () => {
    offerHandoff(resultFile());

    clearHandoff();

    expect(takeHandoff()).toBeNull();
  });
});
