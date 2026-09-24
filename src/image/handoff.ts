/**
 * Passing a finished result to the next tool ("Continue with this image").
 *
 * The journey the product is built around is one image, one task, one result.
 * The step after that is nearly always another task on the same image --
 * convert the HEIC, then resize it, then compress it under a limit -- and
 * today each of those means finding the file again.
 *
 * Deliberately a module-level variable rather than storage:
 *
 * - sessionStorage cannot hold a File, so the bytes would have to be
 *   base64-encoded. A 4 MB photo becomes a 5.5 MB string, copied twice,
 *   which is slower than asking the user to pick the file again.
 * - It also survives reloads, and an image reappearing in a tab opened
 *   tomorrow is a small privacy surprise. Nothing here is uploaded; nothing
 *   here should outlive the tab either.
 *
 * So the handoff lives for exactly one client-side navigation, which is all
 * the feature needs. A full page load starts empty, and that is correct.
 */

let pending: File | null = null;

/** Offer a result as the next tool's input. Replaces any earlier offer. */
export function offerHandoff(file: File): void {
  pending = file;
}

/**
 * Take the waiting image, if there is one.
 *
 * Consumed on read: the receiving tool loads it once, and a later visit to
 * that same tool starts empty rather than silently reopening an old photo.
 */
export function takeHandoff(): File | null {
  const file = pending;
  pending = null;
  return file;
}

/** Discard anything waiting. */
export function clearHandoff(): void {
  pending = null;
}
