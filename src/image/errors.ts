/**
 * User-facing copy for the two ways a tool can fail.
 *
 * Spec §17: say what went wrong and what to do next. "Something went wrong"
 * does neither -- it leaves the user staring at a file picker with no idea
 * whether to retry, pick a different file, or give up.
 *
 * Raw Error.message is never shown. Those strings are written for developers
 * ("Array buffer allocation failed", "TIFF image could not be decoded.") and
 * describe internals the user cannot act on. Only UnsupportedImageError
 * carries deliberately written copy, so only that one is passed through.
 */

import { UnsupportedImageError } from './pipeline';

/** The formats worth naming when someone picks a file we cannot open. */
const SUGGESTED_FORMATS = 'JPG, PNG, WebP, GIF, BMP, AVIF, HEIC or TIFF';

/**
 * True when the browser failed because the image was too big to hold in
 * memory. Detected by shape rather than message text, which varies by engine.
 */
function looksLikeOutOfMemory(cause: unknown): boolean {
  if (cause instanceof RangeError) return true;
  if (!(cause instanceof Error)) return false;
  return /allocation failed|out of memory|maximum call stack/i.test(cause.message);
}

/**
 * Copy for a file that could not be opened.
 *
 * The filename is included because a batch of similar names is otherwise
 * impossible to tell apart, and because it makes clear the failure is about
 * the file rather than the tool.
 */
export function messageForLoadFailure(cause: unknown, fileName: string): string {
  if (looksLikeOutOfMemory(cause)) {
    return (
      `${fileName} is too large for this browser to open. ` +
      `Try a smaller copy, or close other tabs and reload.`
    );
  }

  // The pipeline distinguishes "damaged or unusual variant" from "not an image
  // we recognise". That distinction is useful, so keep its wording -- but the
  // file still has to be named. Rewriting the sentence's opening words was too
  // fragile: only one of the two messages began with "That file", so the other
  // silently lost the filename, which is worst in Image -> PDF where several
  // files are queued and the user cannot tell which one to replace.
  if (cause instanceof UnsupportedImageError) {
    const reason = cause.message.replace(/^That file\b/, 'It');
    return `${fileName}: ${reason} Try saving it as ${SUGGESTED_FORMATS}, then upload it again.`;
  }

  return (
    `${fileName} could not be opened. ` +
    `Check the file is a complete image, or try ${SUGGESTED_FORMATS}.`
  );
}

/**
 * Copy for an operation that failed after the image was already loaded.
 *
 * The image is still on screen and still valid, so the advice is to retry or
 * adjust settings -- not to pick a different file.
 */
export function messageForRunFailure(cause: unknown): string {
  if (looksLikeOutOfMemory(cause)) {
    return (
      'This image is too large to process in the browser. ' +
      'Try resizing it smaller first, or close other tabs and reload.'
    );
  }

  return (
    'That step could not be completed. ' +
    'Try again, or choose a different format or size.'
  );
}
