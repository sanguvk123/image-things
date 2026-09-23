export interface Dimensions {
  width: number;
  height: number;
}

/**
 * Smart aspect ratio (spec §19).
 *
 * The user edits one field; we work out the other from the source ratio so
 * nobody has to do arithmetic to avoid squashing their image.
 */
export function matchAspectRatio(
  change: { width: number } | { height: number },
  sourceWidth: number,
  sourceHeight: number,
): Dimensions {
  const ratio = sourceWidth / sourceHeight;

  if ('width' in change) {
    // An empty or half-typed field isn't a resize request yet — leaving the
    // source dimensions alone stops the other field jumping around mid-typing.
    if (!Number.isFinite(change.width) || change.width < 1) {
      return { width: sourceWidth, height: sourceHeight };
    }
    const width = Math.round(change.width);
    return { width, height: Math.max(1, Math.round(width / ratio)) };
  }

  if (!Number.isFinite(change.height) || change.height < 1) {
    return { width: sourceWidth, height: sourceHeight };
  }
  const height = Math.round(change.height);
  return { width: Math.max(1, Math.round(height * ratio)), height };
}
