/**
 * Per-tool glyphs and per-category colour.
 *
 * Two rules shape this file:
 *
 * 1. Colour encodes category, never the individual tool. Sixty-three bespoke
 *    palettes would be noise; five consistent ones let someone scanning the
 *    grid separate compression from conversion before reading a word.
 *
 * 2. Shape distinguishes tools inside a category. Colour alone is not a safe
 *    signal -- colour-blind users and greyscale rendering both collapse it --
 *    so resize and rotate must not differ by hue alone.
 *
 * Icons resolve by intent keyword rather than by an exhaustive slug map, so a
 * new landing page inherits a sensible glyph as registry data without needing
 * a code change here. The category glyph is the backstop.
 */

import type { Tool, ToolCategory } from '@/tools/registry';

export interface CategoryStyle {
  /** Icon tile background. */
  tile: string;
  /** Icon and accent text colour. */
  text: string;
  /** Hover border colour for the card. */
  ring: string;
}

const STYLES: Record<ToolCategory, CategoryStyle> = {
  optimize: {
    tile: 'bg-optimize-soft',
    text: 'text-optimize',
    ring: 'group-hover:border-optimize/40',
  },
  convert: {
    tile: 'bg-convert-soft',
    text: 'text-convert',
    ring: 'group-hover:border-convert/40',
  },
  transform: {
    tile: 'bg-transform-soft',
    text: 'text-transform',
    ring: 'group-hover:border-transform/40',
  },
  adjust: {
    tile: 'bg-adjust-soft',
    text: 'text-adjust',
    ring: 'group-hover:border-adjust/40',
  },
  privacy: {
    tile: 'bg-privacy-soft',
    text: 'text-privacy',
    ring: 'group-hover:border-privacy/40',
  },
};

export function categoryStyle(category: ToolCategory): CategoryStyle {
  return STYLES[category];
}

/* Glyphs are stroked 1.75 at 24px so they stay legible at the 20px used in
 * the grid, and inherit currentColor from the category text class. */
const S = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const GLYPHS = {
  compress: (
    <>
      <path {...S} d="M12 3v6m0 0 2.5-2.5M12 9 9.5 6.5" />
      <path {...S} d="M12 21v-6m0 0 2.5 2.5M12 15l-2.5 2.5" />
      <path {...S} d="M4 12h16" />
    </>
  ),
  target: (
    <>
      <circle {...S} cx="12" cy="12" r="8" />
      <circle {...S} cx="12" cy="12" r="3.5" />
      <path {...S} d="M12 4v2m0 12v2M4 12h2m12 0h2" />
    </>
  ),
  convert: (
    <>
      <path {...S} d="M4 8h12m0 0-3-3m3 3-3 3" />
      <path {...S} d="M20 16H8m0 0 3-3m-3 3 3 3" />
    </>
  ),
  pdf: (
    <>
      <path {...S} d="M6 3h8l4 4v14H6z" />
      <path {...S} d="M14 3v4h4" />
      <path {...S} d="M9 13h6M9 17h4" />
    </>
  ),
  resize: (
    <>
      <rect {...S} x="3" y="3" width="11" height="11" rx="2" />
      <path {...S} d="M10 21h11V10" />
      <path {...S} d="M14 17.5 21 10.5" />
    </>
  ),
  crop: (
    <>
      <path {...S} d="M7 3v14h14" />
      <path {...S} d="M3 7h14v14" />
    </>
  ),
  rotate: (
    <>
      <path {...S} d="M20 12a8 8 0 1 1-2.6-5.9" />
      <path {...S} d="M20 4v4h-4" />
    </>
  ),
  flip: (
    <>
      <path {...S} d="M12 3v18" />
      <path {...S} d="M9 7 4 12l5 5z" />
      <path {...S} d="m15 7 5 5-5 5z" />
    </>
  ),
  upscale: (
    <>
      <rect {...S} x="3" y="3" width="8" height="8" rx="1.5" />
      <path {...S} d="M13 21h8v-8" />
      <path {...S} d="m12 20 9-9" />
    </>
  ),
  brightness: (
    <>
      <circle {...S} cx="12" cy="12" r="4" />
      <path
        {...S}
        d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8"
      />
    </>
  ),
  contrast: (
    <>
      <circle {...S} cx="12" cy="12" r="8.5" />
      <path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor" />
    </>
  ),
  saturation: (
    <>
      <path {...S} d="M12 3.5c3.5 4 5.5 6.6 5.5 9.2A5.5 5.5 0 0 1 12 18a5.5 5.5 0 0 1-5.5-5.3c0-2.6 2-5.2 5.5-9.2z" />
    </>
  ),
  grayscale: (
    <>
      <circle {...S} cx="9" cy="12" r="5.5" />
      <circle {...S} cx="15" cy="12" r="5.5" />
    </>
  ),
  sharpen: (
    <>
      <path {...S} d="m12 3 8 16H4z" />
      <path {...S} d="M12 9v6" />
    </>
  ),
  blur: (
    <>
      <circle {...S} cx="12" cy="12" r="8" strokeDasharray="2.5 2.5" />
      <circle {...S} cx="12" cy="12" r="3" />
    </>
  ),
  shield: (
    <>
      <path {...S} d="M12 3l7 3v5.5c0 4.3-2.9 8-7 9.5-4.1-1.5-7-5.2-7-9.5V6z" />
      <path {...S} d="m9 12 2 2 4-4" />
    </>
  ),
  inspect: (
    <>
      <circle {...S} cx="11" cy="11" r="6.5" />
      <path {...S} d="m16 16 4.5 4.5" />
      <path {...S} d="M11 8.5v.01M11 11v3" />
    </>
  ),
  scissors: (
    <>
      <circle {...S} cx="6" cy="6" r="2.5" />
      <circle {...S} cx="6" cy="18" r="2.5" />
      <path {...S} d="M8.2 7.5 19 18M19 6 8.2 16.5" />
    </>
  ),
} as const;

type Glyph = keyof typeof GLYPHS;

/** Category backstop, used when no intent keyword matches. */
const BY_CATEGORY: Record<ToolCategory, Glyph> = {
  optimize: 'compress',
  convert: 'convert',
  transform: 'resize',
  adjust: 'brightness',
  privacy: 'shield',
};

/**
 * Slug substrings mapped to glyphs, most specific first.
 *
 * Order matters: 'remove-background' must be tested before 'remove-', and
 * 'to-pdf' before the generic conversion arrows.
 */
const BY_INTENT: [string, Glyph][] = [
  ['remove-background', 'scissors'],
  ['metadata-viewer', 'inspect'],
  ['exif-viewer', 'inspect'],
  ['remove-exif', 'shield'],
  ['remove-metadata', 'shield'],
  ['remove-image-metadata', 'shield'],
  ['to-pdf', 'pdf'],
  ['kb', 'target'],
  ['mb', 'target'],
  ['to-size', 'target'],
  ['upscale', 'upscale'],
  ['crop', 'crop'],
  ['rotate', 'rotate'],
  ['flip', 'flip'],
  ['resize', 'resize'],
  ['change-image-size', 'resize'],
  ['brighten', 'brightness'],
  ['darken', 'brightness'],
  ['contrast', 'contrast'],
  ['saturation', 'saturation'],
  ['grayscale', 'grayscale'],
  ['sharpen', 'sharpen'],
  ['blur', 'blur'],
  ['compress', 'compress'],
  ['reduce', 'compress'],
  ['smaller', 'compress'],
];

function glyphFor(tool: Tool): Glyph {
  for (const [needle, glyph] of BY_INTENT) {
    if (tool.slug.includes(needle)) return glyph;
  }
  // Conversions are identified by structure rather than by listing every pair.
  if (tool.convert) return 'convert';
  return BY_CATEGORY[tool.category];
}

export function ToolIcon({ tool, className = 'h-5 w-5' }: {
  tool: Tool;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {GLYPHS[glyphFor(tool)]}
    </svg>
  );
}
