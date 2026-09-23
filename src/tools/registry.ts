/**
 * The single source of truth for every tool in the platform.
 *
 * Product rule: one problem -> one tool -> one action -> one result.
 * Each entry therefore describes exactly one user intent, and the copy here is
 * what the user reads in search results, on the homepage grid, and on the tool
 * page itself. Keeping it in one place keeps those three surfaces honest.
 *
 * SEO rule: `seo` is required, not optional. A slug that cannot justify its own
 * distinct title and description is not a page -- it is duplicate content. The
 * tests in seo.test.ts enforce that structurally.
 */

export type OutputFormat = 'jpeg' | 'png' | 'webp';

export type ToolCategory = 'optimize' | 'convert' | 'transform' | 'adjust' | 'privacy';

/** Compression presets, mirrored in operations.ts as CompressionLevel. */
export type CompressionPreset = 'smaller' | 'recommended' | 'best';

/** Search-result copy. Both fields are length-checked by seo.test.ts. */
export interface ToolSeo {
  /** <title>, kept under 60 characters so Google shows it in full. */
  title: string;
  /** <meta name="description">, 110-160 characters. */
  description: string;
}

export interface Tool {
  /** URL path segment, e.g. "compress-image" -> /compress-image */
  slug: string;
  /** Page title and card title, e.g. "Compress Image" */
  title: string;
  /**
   * On-page <h1>, when it should differ from the card title.
   *
   * Landing pages need a heading that matches the search intent word for word
   * ("Compress your image to 100KB"), while the homepage grid needs a short
   * label ("Compress to 100KB"). Defaults to `title`.
   */
  h1?: string;
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
  /**
   * The input format a landing page is written for, e.g. 'JPG' on
   * /compress-jpg. Only changes copy -- every tool still accepts any image,
   * because turning away a PNG on a page titled "Compress JPG" would be
   * hostile to someone who simply picked the wrong link.
   */
  sourceLabel?: string;
  /** Preselected compression preset, for intent-specific landing pages. */
  defaultCompression?: CompressionPreset;
  /** Format conversion pair, set only for conversion tools. */
  convert?: { fromLabel: string; to: OutputFormat };
  /** Search-result copy. Required: see the SEO rule above. */
  seo: ToolSeo;
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
    seo: {
      title: 'Compress Image Online — Free, Fast, No Quality Loss',
      description:
        'Compress JPG, PNG and WebP images in seconds. Reduce file size while keeping your photo sharp. Runs in your browser — free, no signup.',
    },
  },
  {
    slug: 'compress-image-to-size',
    title: 'Compress to Exact Size',
    h1: 'Compress your image to an exact size',
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
    seo: {
      title: 'Compress Image to Exact File Size (KB or MB)',
      description:
        'Set an exact target like 100KB and get an image just under it. Ideal for upload limits on forms, portals and job applications.',
    },
  },
  {
    slug: 'compress-image-to-50kb',
    title: 'Compress to 50KB',
    h1: 'Compress your image to 50KB',
    tagline: 'Exact target size',
    description: 'Compress your image to under 50KB.',
    category: 'optimize',
    keywords: ['smaller', '50kb', 'target size', 'exact size', 'upload limit'],
    targetKB: 50,
    seo: {
      title: 'Compress Image to 50KB Online — Free Tool',
      description:
        'Reduce any photo to under 50KB instantly. Perfect for strict upload limits on forms and government portals. Free and private.',
    },
  },
  {
    slug: 'compress-image-to-100kb',
    title: 'Compress to 100KB',
    h1: 'Compress your image to 100KB',
    tagline: 'Exact target size',
    description: 'Compress your image to under 100KB.',
    category: 'optimize',
    keywords: ['smaller', '100kb', 'target size', 'exact size', 'upload limit'],
    targetKB: 100,
    seo: {
      title: 'Compress Image to 100KB Online — Free Tool',
      description:
        'Compress any image to under 100KB in one click. Meets the most common upload limit for forms, portals and applications. Free.',
    },
  },
  {
    slug: 'compress-image-to-200kb',
    title: 'Compress to 200KB',
    h1: 'Compress your image to 200KB',
    tagline: 'Exact target size',
    description: 'Compress your image to under 200KB.',
    category: 'optimize',
    keywords: ['smaller', '200kb', 'target size', 'exact size', 'upload limit'],
    targetKB: 200,
    seo: {
      title: 'Compress Image to 200KB Online — Free Tool',
      description:
        'Shrink your photo to under 200KB while keeping it clear. Great for document uploads that allow a little more room. Free, private.',
    },
  },
  {
    slug: 'compress-image-to-300kb',
    title: 'Compress to 300KB',
    h1: 'Compress your image to 300KB',
    tagline: 'Exact target size',
    description: 'Compress your image to under 300KB.',
    category: 'optimize',
    keywords: ['smaller', '300kb', 'target size', 'exact size', 'upload limit'],
    targetKB: 300,
    seo: {
      title: 'Compress Image to 300KB Online — Free Tool',
      description:
        'Reduce your photo to under 300KB while keeping detail sharp. A good balance for uploads that allow a moderate file size.',
    },
  },
  {
    slug: 'compress-image-to-500kb',
    title: 'Compress to 500KB',
    h1: 'Compress your image to 500KB',
    tagline: 'Exact target size',
    description: 'Compress your image to under 500KB.',
    category: 'optimize',
    keywords: ['smaller', '500kb', 'target size', 'exact size', 'upload limit'],
    targetKB: 500,
    seo: {
      title: 'Compress Image to 500KB Online — Free Tool',
      description:
        'Bring large photos under 500KB with barely visible quality loss. Ideal for email attachments and website uploads. No signup.',
    },
  },
  {
    slug: 'compress-image-to-1mb',
    title: 'Compress to 1MB',
    h1: 'Compress your image to 1MB',
    tagline: 'Exact target size',
    description: 'Compress your image to under 1MB.',
    category: 'optimize',
    keywords: ['smaller', '1mb', '1 mb', 'target size', 'exact size', 'upload limit'],
    targetKB: 1000,
    seo: {
      title: 'Compress Image to 1MB Online — Free Tool',
      description:
        'Get a large photo under 1MB with almost no visible quality loss. Ideal for email limits and high quality web uploads. Free.',
    },
  },

  // Format-specific compression. Same engine, copy written for the search
  // term; every page still accepts any image the user happens to drop in.
  {
    slug: 'compress-jpg',
    title: 'Compress JPG',
    h1: 'Compress your JPG',
    tagline: 'Reduce JPG size',
    description: 'Reduce the file size of your JPG without visible quality loss.',
    category: 'optimize',
    keywords: ['jpg', 'jpeg', 'smaller', 'compressor', 'reduce', 'file size'],
    sourceLabel: 'JPG',
    seo: {
      title: 'Compress JPG Online — Free JPEG Compressor',
      description:
        'Shrink JPG and JPEG photos fast while keeping them sharp. Choose how much to compress and see the saving before you download.',
    },
  },
  {
    slug: 'compress-png',
    title: 'Compress PNG',
    h1: 'Compress your PNG',
    tagline: 'Reduce PNG size',
    description: 'Make your PNG dramatically smaller.',
    category: 'optimize',
    keywords: ['png', 'smaller', 'compressor', 'reduce', 'file size', 'transparent'],
    sourceLabel: 'PNG',
    seo: {
      title: 'Compress PNG Online — Free PNG Compressor',
      description:
        'Make PNG files much smaller in one click. Great for screenshots and web images that are slowing your page down. Free and private.',
    },
  },
  {
    slug: 'compress-webp',
    title: 'Compress WebP',
    h1: 'Compress your WebP',
    tagline: 'Reduce WebP size',
    description: 'Reduce the file size of your WebP image.',
    category: 'optimize',
    keywords: ['webp', 'smaller', 'compressor', 'reduce', 'file size'],
    sourceLabel: 'WebP',
    seo: {
      title: 'Compress WebP Online — Free WebP Compressor',
      description:
        'Squeeze WebP images down further while keeping them crisp. Useful for speeding up an already optimised website. Free tool.',
    },
  },
  {
    slug: 'compress-image-without-losing-quality',
    title: 'Compress Without Quality Loss',
    h1: 'Compress your image without losing quality',
    tagline: 'Maximum quality',
    description:
      'Reduce your file size while keeping the image visually identical to the original.',
    category: 'optimize',
    keywords: [
      'without losing quality',
      'no quality loss',
      'lossless',
      'high quality',
      'smaller',
      'keep quality',
    ],
    // The whole promise of this page is quality, so it opens on 'best'
    // rather than the usual 'recommended'.
    defaultCompression: 'best',
    seo: {
      title: 'Compress Image Without Losing Quality — Free',
      description:
        'Reduce image file size while keeping it looking identical. Uses the highest quality setting so the difference stays invisible.',
    },
  },
  {
    slug: 'compress-jpg-to-100kb',
    title: 'Compress JPG to 100KB',
    h1: 'Compress your JPG to 100KB',
    tagline: 'Exact target size',
    description: 'Compress your JPG to under 100KB.',
    category: 'optimize',
    keywords: ['jpg', 'jpeg', '100kb', 'target size', 'upload limit', 'smaller'],
    targetKB: 100,
    sourceLabel: 'JPG',
    seo: {
      title: 'Compress JPG to 100KB Online — Free Tool',
      description:
        'Get your JPG under 100KB in one click. Built for upload limits on application forms and government portals. Free and private.',
    },
  },
  {
    slug: 'compress-jpg-to-200kb',
    title: 'Compress JPG to 200KB',
    h1: 'Compress your JPG to 200KB',
    tagline: 'Exact target size',
    description: 'Compress your JPG to under 200KB.',
    category: 'optimize',
    keywords: ['jpg', 'jpeg', '200kb', 'target size', 'upload limit', 'smaller'],
    targetKB: 200,
    sourceLabel: 'JPG',
    seo: {
      title: 'Compress JPG to 200KB Online — Free Tool',
      description:
        'Reduce your JPG to under 200KB while keeping it clear enough to read and print. Ideal for document and photo uploads.',
    },
  },
  {
    slug: 'compress-jpg-to-500kb',
    title: 'Compress JPG to 500KB',
    h1: 'Compress your JPG to 500KB',
    tagline: 'Exact target size',
    description: 'Compress your JPG to under 500KB.',
    category: 'optimize',
    keywords: ['jpg', 'jpeg', '500kb', 'target size', 'upload limit', 'smaller'],
    targetKB: 500,
    sourceLabel: 'JPG',
    seo: {
      title: 'Compress JPG to 500KB Online — Free Tool',
      description:
        'Bring a large JPG under 500KB with barely any visible change. Good for email attachments and website uploads. No signup.',
    },
  },
  {
    slug: 'compress-png-to-100kb',
    title: 'Compress PNG to 100KB',
    h1: 'Compress your PNG to 100KB',
    tagline: 'Exact target size',
    description: 'Compress your PNG to under 100KB.',
    category: 'optimize',
    keywords: ['png', '100kb', 'target size', 'upload limit', 'smaller'],
    targetKB: 100,
    sourceLabel: 'PNG',
    seo: {
      title: 'Compress PNG to 100KB Online — Free Tool',
      description:
        'Get a PNG under 100KB for strict upload limits. Saved as JPG, since PNG cannot reach that size for most photos. Free tool.',
    },
  },

  // ----------------------------------------------------------------- convert
  {
    slug: 'jpg-to-png',
    title: 'JPG → PNG',
    h1: 'Convert JPG to PNG',
    tagline: 'Convert format',
    description: 'Convert your JPG image to PNG.',
    category: 'convert',
    keywords: ['jpg', 'jpeg', 'png', 'convert', 'change format', 'transparent'],
    popular: true,
    convert: { fromLabel: 'JPG', to: 'png' },
    seo: {
      title: 'JPG to PNG Converter — Free and Instant',
      description:
        'Convert JPG images to PNG format instantly in your browser. Keeps full quality and supports transparency. Free, private, no signup.',
    },
  },
  {
    slug: 'png-to-jpg',
    title: 'PNG → JPG',
    h1: 'Convert PNG to JPG',
    tagline: 'Convert format',
    description: 'Convert your PNG image to JPG.',
    category: 'convert',
    keywords: ['png', 'jpg', 'jpeg', 'convert', 'change format'],
    popular: true,
    convert: { fromLabel: 'PNG', to: 'jpeg' },
    seo: {
      title: 'PNG to JPG Converter — Free and Instant',
      description:
        'Convert PNG images to JPG in one click and get a much smaller file. Transparent areas become white. Free, private, no signup.',
    },
  },
  {
    slug: 'webp-to-jpg',
    title: 'WebP → JPG',
    h1: 'Convert WebP to JPG',
    tagline: 'Convert format',
    description: 'Convert your WebP image to JPG.',
    category: 'convert',
    keywords: ['webp', 'jpg', 'jpeg', 'convert', 'change format'],
    popular: true,
    convert: { fromLabel: 'WebP', to: 'jpeg' },
    seo: {
      title: 'WebP to JPG Converter — Free Online Tool',
      description:
        'Turn WebP images into universally supported JPG files instantly. Works with any WebP photo you downloaded. Free and private.',
    },
  },
  {
    slug: 'jpg-to-webp',
    title: 'JPG → WebP',
    h1: 'Convert JPG to WebP',
    tagline: 'Convert format',
    description: 'Convert your JPG image to WebP.',
    category: 'convert',
    keywords: ['jpg', 'jpeg', 'webp', 'convert', 'change format', 'smaller'],
    convert: { fromLabel: 'JPG', to: 'webp' },
    seo: {
      title: 'JPG to WebP Converter — Smaller Image Files',
      description:
        'Convert JPG photos to WebP and cut file size significantly. Ideal for faster websites and lighter page loads. Free, no signup.',
    },
  },
  {
    slug: 'png-to-webp',
    title: 'PNG → WebP',
    h1: 'Convert PNG to WebP',
    tagline: 'Convert format',
    description: 'Convert your PNG image to WebP.',
    category: 'convert',
    keywords: ['png', 'webp', 'convert', 'change format', 'smaller'],
    convert: { fromLabel: 'PNG', to: 'webp' },
    seo: {
      title: 'PNG to WebP Converter — Shrink PNG Files',
      description:
        'Convert PNG images to WebP for dramatically smaller files with transparency intact. Perfect for web use. Free and private.',
    },
  },
  {
    slug: 'image-to-pdf',
    title: 'Image → PDF',
    h1: 'Convert images to PDF',
    tagline: 'Create PDF',
    description: 'Turn your images into a single PDF document.',
    category: 'convert',
    keywords: ['pdf', 'document', 'convert', 'jpg to pdf', 'png to pdf'],
    popular: true,
    seo: {
      title: 'Image to PDF Converter — Combine Photos Free',
      description:
        'Turn one or many images into a single PDF document. Pages are sized and centred automatically. Free, private, runs in your browser.',
    },
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
    seo: {
      title: 'Resize Image Online — Exact Width and Height',
      description:
        'Resize any photo to the exact pixel dimensions you need. Aspect ratio is locked by default so nothing looks stretched. Free tool.',
    },
  },
  {
    slug: 'crop-image',
    title: 'Crop Image',
    tagline: 'Crop precisely',
    description: 'Crop your image to the exact area you want.',
    category: 'transform',
    keywords: ['crop', 'trim', 'cut', 'square', 'aspect ratio', 'frame'],
    popular: true,
    seo: {
      title: 'Crop Image Online — Free Visual Crop Tool',
      description:
        'Drag to crop your photo to the exact area you want, with square and widescreen presets. Simple, visual and free. No signup needed.',
    },
  },
  {
    slug: 'rotate-image',
    title: 'Rotate Image',
    tagline: 'Turn it around',
    description: 'Rotate your image left, right, or upside down.',
    category: 'transform',
    keywords: ['rotate', 'turn', '90', '180', 'sideways', 'straighten'],
    seo: {
      title: 'Rotate Image Online — 90°, 180° or Upside Down',
      description:
        'Rotate a sideways photo left, right or fully around in one click. See the result before you download. Free, private, no signup.',
    },
  },
  {
    slug: 'flip-image',
    title: 'Flip Image',
    tagline: 'Mirror it',
    description: 'Flip your image horizontally or vertically.',
    category: 'transform',
    keywords: ['flip', 'mirror', 'reverse', 'horizontal', 'vertical'],
    seo: {
      title: 'Flip Image — Mirror Horizontally or Vertically',
      description:
        'Mirror your photo horizontally, vertically or both at once. Useful for selfies and scanned images. Free, runs in your browser.',
    },
  },
  {
    slug: 'upscale-image',
    title: 'Upscale Image',
    tagline: 'Make it bigger',
    description: 'Enlarge your image while keeping edges as clean as possible.',
    category: 'transform',
    keywords: ['upscale', 'enlarge', 'bigger', 'increase resolution', '2x', '4x'],
    seo: {
      title: 'Upscale Image Online — Enlarge Without Blur',
      description:
        'Enlarge small images 2x or 4x with clean, sharpened edges instead of a blurry stretch. Free, private, runs in your browser.',
    },
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
    seo: {
      title: 'Brighten Image Online — Fix Dark Photos Free',
      description:
        'Lighten an underexposed photo with a live preview as you drag. See exactly what you get before downloading. Free, no signup.',
    },
  },
  {
    slug: 'adjust-contrast',
    title: 'Adjust Contrast',
    tagline: 'Add punch',
    description: 'Increase or reduce the contrast of your image.',
    category: 'adjust',
    keywords: ['contrast', 'punch', 'flat', 'pop'],
    seo: {
      title: 'Adjust Image Contrast Online — Free Tool',
      description:
        'Add punch to a flat photo or soften a harsh one, with a live preview as you adjust. Free, private, runs in your browser.',
    },
  },
  {
    slug: 'adjust-saturation',
    title: 'Adjust Saturation',
    tagline: 'Tune the colour',
    description: 'Make the colours in your image richer or more muted.',
    category: 'adjust',
    keywords: ['saturation', 'colour', 'color', 'vivid', 'muted', 'vibrance'],
    seo: {
      title: 'Adjust Image Saturation — Vivid or Muted Colour',
      description:
        'Make the colours in your photo more vivid or more muted, with a live preview as you drag the slider. Free and private.',
    },
  },
  {
    slug: 'grayscale-image',
    title: 'Make Grayscale',
    h1: 'Convert your image to black and white',
    tagline: 'Black and white',
    description: 'Convert your image to black and white.',
    category: 'adjust',
    keywords: ['grayscale', 'greyscale', 'black and white', 'mono', 'desaturate'],
    seo: {
      title: 'Convert Image to Black and White — Free Tool',
      description:
        'Turn any photo grayscale in one click, with a hover preview before you commit. Free, private, and runs in your browser.',
    },
  },
  {
    slug: 'sharpen-image',
    title: 'Sharpen Image',
    tagline: 'Crisp up detail',
    description: 'Sharpen a soft image to bring back detail.',
    category: 'adjust',
    keywords: ['sharpen', 'crisp', 'detail', 'soft', 'blurry', 'focus'],
    seo: {
      title: 'Sharpen Image Online — Fix Soft, Blurry Photos',
      description:
        'Bring back detail in a soft photo with real sharpening, not a filter. Choose light or strong. Free, private, no signup needed.',
    },
  },
  {
    slug: 'blur-image',
    title: 'Blur Image',
    tagline: 'Soften it',
    description: 'Apply a smooth blur to your image.',
    category: 'adjust',
    keywords: ['blur', 'soften', 'gaussian', 'hide', 'censor', 'background'],
    seo: {
      title: 'Blur Image Online — Soften or Censor for Free',
      description:
        'Apply a smooth blur to your photo to soften it or hide sensitive details. Live preview as you adjust. Free, runs in browser.',
    },
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
    seo: {
      title: 'Remove Image Metadata and EXIF Data — Free',
      description:
        'Strip camera, device and GPS location data from your photos before sharing them. Your file never leaves your device. Free tool.',
    },
  },
  {
    slug: 'remove-background',
    title: 'Remove Background',
    tagline: 'One-click',
    description: 'Remove the background from your image.',
    category: 'privacy',
    keywords: ['background', 'transparent', 'cutout', 'remove bg', 'isolate'],
    popular: true,
    seo: {
      title: 'Remove Image Background — Free, One Click',
      description:
        'Cut out the background from your image and download a transparent PNG. One click, no editing skills needed. Free and private.',
    },
  },
];

const BY_SLUG = new Map(TOOLS.map((tool) => [tool.slug, tool]));

export function getTool(slug: string): Tool | undefined {
  return BY_SLUG.get(slug);
}

export function popularTools(): Tool[] {
  return TOOLS.filter((tool) => tool.popular);
}

/** The on-page heading for a tool, falling back to its card title. */
export function headingFor(tool: Tool): string {
  return tool.h1 ?? tool.title;
}
