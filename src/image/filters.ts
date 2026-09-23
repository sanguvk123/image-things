/**
 * Image adjustments expressed as CSS filter strings.
 *
 * The same string drives both the live preview (as a CSS `filter` on an <img>)
 * and the final render (as `ctx.filter` on the canvas). Sharing one definition
 * is what guarantees the saved file matches the preview — the spec asks for a
 * live preview, and a preview that lies is worse than none.
 */

export type AdjustmentKind =
  | 'brightness'
  | 'contrast'
  | 'saturation'
  | 'grayscale'
  | 'blur';

/**
 * Slider ranges in plain user terms: 0 means "leave it alone", and the number
 * shown is a percentage change, not a codec parameter.
 */
export const ADJUSTMENT_RANGE: Record<
  Exclude<AdjustmentKind, 'grayscale'>,
  { min: number; max: number; step: number; suffix: string }
> = {
  brightness: { min: -100, max: 100, step: 1, suffix: '%' },
  contrast: { min: -100, max: 100, step: 1, suffix: '%' },
  saturation: { min: -100, max: 100, step: 1, suffix: '%' },
  blur: { min: 0, max: 20, step: 1, suffix: 'px' },
};

/**
 * Map a -100..100 user value onto a CSS filter multiplier.
 *
 * -100 collapses the effect entirely (0), 0 is untouched (1), and +100 doubles
 * it (2). Linear in both directions so dragging feels predictable.
 */
function multiplier(amount: number): number {
  return 1 + amount / 100;
}

export function brightnessFilter(amount: number): string {
  return `brightness(${multiplier(amount)})`;
}

export function contrastFilter(amount: number): string {
  return `contrast(${multiplier(amount)})`;
}

export function saturationFilter(amount: number): string {
  return `saturate(${multiplier(amount)})`;
}

export function grayscaleFilter(): string {
  return 'grayscale(1)';
}

export function blurFilter(radiusPx: number): string {
  return `blur(${radiusPx}px)`;
}

/** The filter for a given adjustment, or null when it would do nothing. */
export function filterFor(kind: AdjustmentKind, amount: number): string | null {
  switch (kind) {
    case 'grayscale':
      return grayscaleFilter();
    case 'blur':
      return amount > 0 ? blurFilter(amount) : null;
    case 'brightness':
      return amount === 0 ? null : brightnessFilter(amount);
    case 'contrast':
      return amount === 0 ? null : contrastFilter(amount);
    case 'saturation':
      return amount === 0 ? null : saturationFilter(amount);
  }
}
