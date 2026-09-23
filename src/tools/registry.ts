/**
 * The single source of truth for every tool in the platform.
 *
 * Product rule: one problem -> one tool -> one action -> one result.
 * Each entry therefore describes exactly one user intent, and the copy here is
 * what the user reads in search results, on the homepage grid, and on the tool
 * page itself. Keeping it in one place keeps those three surfaces honest.
 */

export type OutputFormat = 'jpeg' | 'png' | 'webp';

export type ToolCategory = 'optimize' | 'convert' | 'transform' | 'adjust' | 'privacy';

export interface Tool {
  /** URL path segment, e.g. "compress-image" -> /compress-image */
  slug: string;
  /** Page title and card title, e.g. "Compress Image" */
  title: string;
  /** One-line card subtitle, e.g. "Reduce file size" */
  tagline: string;
  /** Sentence shown under the tool page heading */
  description: string;
  category: ToolCategory;
  /** Extra search terms users actually type. Title words are matched already. */
  keywords: string[];
  /** Shown on the homepage grid. Keep this list small (8-12). */
  popular?: boolean;
  /** Preset target for the "compress to N KB" family. */
  targetKB?: number;
  /** Format conversion pair, set only for conversion tools. */
  convert?: { fromLabel: string; to: OutputFormat };
}

export const TOOLS: Tool[] = [
  // ---------------------------------------------------------------- optimize
  {
    slug: 'compress-image',
    title: 'Compress Image',
    tagline: 'Reduce file size',
    description:
      'Reduce your image size without unnecessarily sacrificing quality.',
    category: 'optimize',
    keywords: [
      'smaller',
      'reduce image size',
      'shrink',
      'optimize',
      'optimise',
      'file size',
      'lighter',
      'jpg compressor',
      'png compressor',
      'save space',
    ],
    popular: true,
  },
  {
    slug: 'compress-image-to-size',
    title: 'Compress to Exact Size',
    tagline: 'Hit a size limit',
    description: 'Compress your image down to an exact target file size.',
    category: 'optimize',
    keywords: [
      'smaller',
      'target size',
      'exact size',
      'under limit',
      'upload limit',
      'max size',
      'kb',
      'mb',
    ],
  },
  {
    slug: 'compress-image-to-50kb',
    title: 'Compress to 50KB',
    tagline: 'Exact target size',
    description: 'Compress your image to under 50KB.',
    category: 'optimize',
    keywords: ['smaller', '50kb', 'target size', 'exact size', 'upload limit'],
    targetKB: 50,
  },
  {
    slug: 'compress-image-to-100kb',
    title: 'Compress to 100KB',
    tagline: 'Exact target size',
    description: 'Compress your image to under 100KB.',
    category: 'optimize',
    keywords: ['smaller', '100kb', 'target size', 'exact size', 'upload limit'],
    targetKB: 100,
  },
  {
    slug: 'compress-image-to-200kb',
    title: 'Compress to 200KB',
    tagline: 'Exact target size',
    description: 'Compress your image to under 200KB.',
    category: 'optimize',
    keywords: ['smaller', '200kb', 'target size', 'exact size', 'upload limit'],
    targetKB: 200,
  },
  {
    slug: 'compress-image-to-500kb',
    title: 'Compress to 500KB',
    tagline: 'Exact target size',
    description: 'Compress your image to under 500KB.',
    category: 'optimize',
    keywords: ['smaller', '500kb', 'target size', 'exact size', 'upload limit'],
    targetKB: 500,
  },

  // ----------------------------------------------------------------- convert
  {
    slug: 'jpg-to-png',
    title: 'JPG → PNG',
    tagline: 'Convert format',
    description: 'Convert your JPG image to PNG.',
    category: 'convert',
    keywords: ['jpg', 'jpeg', 'png', 'convert', 'change format', 'transparent'],
    popular: true,
    convert: { fromLabel: 'JPG', to: 'png' },
  },
  {
    slug: 'png-to-jpg',
    title: 'PNG → JPG',
    tagline: 'Convert format',
    description: 'Convert your PNG image to JPG.',
    category: 'convert',
    keywords: ['png', 'jpg', 'jpeg', 'convert', 'change format'],
    popular: true,
    convert: { fromLabel: 'PNG', to: 'jpeg' },
  },
  {
    slug: 'webp-to-jpg',
    title: 'WebP → JPG',
    tagline: 'Convert format',
    description: 'Convert your WebP image to JPG.',
    category: 'convert',
    keywords: ['webp', 'jpg', 'jpeg', 'convert', 'change format'],
    popular: true,
    convert: { fromLabel: 'WebP', to: 'jpeg' },
  },
  {
    slug: 'jpg-to-webp',
    title: 'JPG → WebP',
    tagline: 'Convert format',
    description: 'Convert your JPG image to WebP.',
    category: 'convert',
    keywords: ['jpg', 'jpeg', 'webp', 'convert', 'change format', 'smaller'],
    convert: { fromLabel: 'JPG', to: 'webp' },
  },
  {
    slug: 'png-to-webp',
    title: 'PNG → WebP',
    tagline: 'Convert format',
    description: 'Convert your PNG image to WebP.',
    category: 'convert',
    keywords: ['png', 'webp', 'convert', 'change format', 'smaller'],
    convert: { fromLabel: 'PNG', to: 'webp' },
  },
  {
    slug: 'image-to-pdf',
    title: 'Image → PDF',
    tagline: 'Create PDF',
    description: 'Turn your images into a single PDF document.',
    category: 'convert',
    keywords: ['pdf', 'document', 'convert', 'jpg to pdf', 'png to pdf'],
    popular: true,
  },

  // --------------------------------------------------------------- transform
  {
    slug: 'resize-image',
    title: 'Resize Image',
    tagline: 'Change dimensions',
    description: 'Resize your image to exactly the dimensions you need.',
    category: 'transform',
    keywords: [
      'smaller',
      'bigger',
      'dimensions',
      'width',
      'height',
      'scale',
      'exact dimensions',
      'pixels',
      'px',
    ],
    popular: true,
  },
  {
    slug: 'crop-image',
    title: 'Crop Image',
    tagline: 'Crop precisely',
    description: 'Crop your image to the exact area you want.',
    category: 'transform',
    keywords: ['crop', 'trim', 'cut', 'square', 'aspect ratio', 'frame'],
    popular: true,
  },
  {
    slug: 'rotate-image',
    title: 'Rotate Image',
    tagline: 'Turn it around',
    description: 'Rotate your image left, right, or upside down.',
    category: 'transform',
    keywords: ['rotate', 'turn', '90', '180', 'sideways', 'straighten'],
  },
  {
    slug: 'flip-image',
    title: 'Flip Image',
    tagline: 'Mirror it',
    description: 'Flip your image horizontally or vertically.',
    category: 'transform',
    keywords: ['flip', 'mirror', 'reverse', 'horizontal', 'vertical'],
  },
  {
    slug: 'upscale-image',
    title: 'Upscale Image',
    tagline: 'Make it bigger',
    description: 'Enlarge your image while keeping edges as clean as possible.',
    category: 'transform',
    keywords: ['upscale', 'enlarge', 'bigger', 'increase resolution', '2x', '4x'],
  },

  // ------------------------------------------------------------------ adjust
  {
    slug: 'brighten-image',
    title: 'Brighten Image',
    tagline: 'Adjust lighting',
    description: 'Make your image brighter or darker.',
    category: 'adjust',
    keywords: ['brighten', 'brightness', 'lighting', 'dark', 'light', 'exposure'],
    popular: true,
  },
  {
    slug: 'adjust-contrast',
    title: 'Adjust Contrast',
    tagline: 'Add punch',
    description: 'Increase or reduce the contrast of your image.',
    category: 'adjust',
    keywords: ['contrast', 'punch', 'flat', 'pop'],
  },
  {
    slug: 'adjust-saturation',
    title: 'Adjust Saturation',
    tagline: 'Tune the colour',
    description: 'Make the colours in your image richer or more muted.',
    category: 'adjust',
    keywords: ['saturation', 'colour', 'color', 'vivid', 'muted', 'vibrance'],
  },
  {
    slug: 'grayscale-image',
    title: 'Make Grayscale',
    tagline: 'Black and white',
    description: 'Convert your image to black and white.',
    category: 'adjust',
    keywords: ['grayscale', 'greyscale', 'black and white', 'mono', 'desaturate'],
  },
  {
    slug: 'sharpen-image',
    title: 'Sharpen Image',
    tagline: 'Crisp up detail',
    description: 'Sharpen a soft image to bring back detail.',
    category: 'adjust',
    keywords: ['sharpen', 'crisp', 'detail', 'soft', 'blurry', 'focus'],
  },
  {
    slug: 'blur-image',
    title: 'Blur Image',
    tagline: 'Soften it',
    description: 'Apply a smooth blur to your image.',
    category: 'adjust',
    keywords: ['blur', 'soften', 'gaussian', 'hide', 'censor', 'background'],
  },

  // ----------------------------------------------------------------- privacy
  {
    slug: 'remove-metadata',
    title: 'Remove Metadata',
    tagline: 'Strip EXIF data',
    description:
      'Remove camera, location and device information stored inside your image.',
    category: 'privacy',
    keywords: ['metadata', 'exif', 'gps', 'location', 'privacy', 'camera', 'strip'],
  },
  {
    slug: 'remove-background',
    title: 'Remove Background',
    tagline: 'One-click',
    description: 'Remove the background from your image.',
    category: 'privacy',
    keywords: ['background', 'transparent', 'cutout', 'remove bg', 'isolate'],
    popular: true,
  },
];

const BY_SLUG = new Map(TOOLS.map((tool) => [tool.slug, tool]));

export function getTool(slug: string): Tool | undefined {
  return BY_SLUG.get(slug);
}

export function popularTools(): Tool[] {
  return TOOLS.filter((tool) => tool.popular);
}
