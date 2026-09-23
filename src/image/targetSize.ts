/**
 * Hitting an exact target file size (spec §16).
 *
 * The browser gives us no way to ask for "a JPEG of at most 100KB" — only
 * "a JPEG at quality q". So we search for the best q that fits, then, if even
 * the ugliest quality is too big, we shrink the pixel dimensions and try
 * again. Scaling is the last resort because changing what the user sees is a
 * bigger intrusion than shedding some encoding fidelity.
 */

export interface SizeAttempt {
  quality: number;
  /** Longest-edge limit used for this attempt, or null for full size. */
  maxEdge: number | null;
  bytes: number;
}

export interface TargetSizeSearch {
  /** The best attempt that fit under the target, or null if none did. */
  best: SizeAttempt | null;
  /** The smallest attempt overall, used when nothing fits. */
  smallest: SizeAttempt;
  attempts: number;
}

/** Encode at a given quality and optional size cap, returning the byte count. */
export type SizeProbe = (quality: number, maxEdge: number | null) => Promise<number>;

const MIN_QUALITY = 0.2;
const MAX_QUALITY = 0.95;
/**
 * Eight steps narrow the quality range to under 1%, which is finer than the
 * encoder's own granularity. More steps would cost time without changing
 * the answer.
 */
const QUALITY_STEPS = 8;
/**
 * Progressive downscales tried only when quality alone cannot reach target.
 * The ladder reaches down to thumbnail size so that even "20KB from a 50MP
 * photo" has an answer instead of failing.
 */
const EDGE_FALLBACKS = [2400, 1600, 1080, 720, 480, 320, 200] as const;

/**
 * Find the highest-quality encode that fits within `targetBytes`.
 *
 * Quality and size relate monotonically for a given image, so a binary search
 * converges quickly and, crucially, predictably — the user waits a bounded
 * number of encodes rather than an open-ended loop.
 */
export async function searchForTargetSize(
  probe: SizeProbe,
  targetBytes: number,
): Promise<TargetSizeSearch> {
  let attempts = 0;
  let best: SizeAttempt | null = null;
  let smallest: SizeAttempt | null = null;

  const record = async (quality: number, maxEdge: number | null) => {
    const bytes = await probe(quality, maxEdge);
    attempts += 1;
    const attempt: SizeAttempt = { quality, maxEdge, bytes };

    // Among the encodes that fit, the largest is the best-looking one: it
    // spent the most of the available budget. Comparing bytes rather than
    // quality is what makes attempts at different scales comparable.
    if (bytes <= targetBytes && (!best || bytes > best.bytes)) best = attempt;
    if (!smallest || bytes < smallest.bytes) smallest = attempt;

    return attempt;
  };

  const searchQuality = async (maxEdge: number | null) => {
    let low = MIN_QUALITY;
    let high = MAX_QUALITY;
    let fitted = false;

    for (let step = 0; step < QUALITY_STEPS; step += 1) {
      const mid = (low + high) / 2;
      const attempt = await record(mid, maxEdge);

      if (attempt.bytes <= targetBytes) {
        fitted = true;
        low = mid; // Room to spare — try to look better.
      } else {
        high = mid; // Too big — compress harder.
      }
    }

    return fitted;
  };

  if (await searchQuality(null)) {
    return { best, smallest: smallest!, attempts };
  }

  // Quality alone was not enough; start giving up pixels. Each rung is first
  // probed at minimum quality — if even that does not fit, a full search at
  // this size cannot either, so we skip it for the price of one encode.
  for (const maxEdge of EDGE_FALLBACKS) {
    const floor = await record(MIN_QUALITY, maxEdge);
    if (floor.bytes > targetBytes) continue;

    await searchQuality(maxEdge);
    break;
  }

  return { best, smallest: smallest!, attempts };
}
