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
  /**
   * The canonical tool this page is a differently-phrased entry point to,
   * e.g. /make-image-smaller -> compress-image.
   *
   * These pages earn their place in Google, where people search in their own
   * words. On the site's own search they are noise: someone already here does
   * not need three ways to say "compress", so search ranks them below the
   * canonical tool.
   */
  aliasOf?: string;
  /**
   * Exact output dimensions a page is built for, e.g. /resize-image-to-1080x1080.
   * The tool opens with these already filled in.
   */
  presetSize?: { width: number; height: number };
  /** Format conversion pair, set only for conversion tools. */
  convert?: { fromLabel: string; to: OutputFormat };
  /** Search-result copy. Required: see the SEO rule above. */
  seo: ToolSeo;
}

export const TOOLS: Tool[] = [
  // ---------------------------------------------------------------- optimize
  // Problem-phrased pages. Someone typing "make image smaller" has described
  // a problem, not chosen a tool, so these open on the tool that solves it.
  {
    slug: 'reduce-image-size',
    title: 'Reduce Image Size',
    h1: 'Reduce your image size',
    tagline: 'Smaller file',
    description: 'Reduce the file size of your image in one click.',
    category: 'optimize',
    keywords: ['reduce', 'reduce size', 'smaller', 'file size', 'shrink', 'lighter'],
    aliasOf: 'compress-image',
    seo: {
      title: 'Reduce Image Size Online — Free and Instant',
      description:
        'Reduce an image file size in one click while keeping it looking sharp. No signup, no upload, works in your browser.',
    },
  },
  {
    slug: 'make-image-smaller',
    title: 'Make Image Smaller',
    h1: 'Make your image smaller',
    tagline: 'Smaller file',
    description: 'Make your image file smaller without it looking worse.',
    category: 'optimize',
    keywords: ['make smaller', 'smaller', 'shrink', 'reduce', 'too big', 'file size'],
    aliasOf: 'compress-image',
    seo: {
      title: 'Make an Image Smaller — Free Online Tool',
      description:
        'Got an image that is too big to send or upload? Make it smaller in one click, without it turning blurry. Free tool.',
    },
  },
  {
    slug: 'make-jpg-smaller',
    title: 'Make JPG Smaller',
    h1: 'Make your JPG smaller',
    tagline: 'Smaller JPG',
    description: 'Make your JPG file smaller without it looking worse.',
    category: 'optimize',
    keywords: ['jpg', 'jpeg', 'make smaller', 'smaller', 'shrink', 'too big'],
    sourceLabel: 'JPG',
    aliasOf: 'compress-image',
    seo: {
      title: 'Make a JPG Smaller — Free JPEG Size Reducer',
      description:
        'Shrink a JPG that is too large to email or upload. Pick how much to compress and see the saving before downloading.',
    },
  },
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
    slug: 'webp-to-png',
    title: 'WebP → PNG',
    h1: 'Convert WebP to PNG',
    tagline: 'Convert format',
    description: 'Convert your WebP image to PNG.',
    category: 'convert',
    keywords: ['webp', 'png', 'convert', 'change format', 'transparent'],
    convert: { fromLabel: 'WebP', to: 'png' },
    seo: {
      title: 'WebP to PNG Converter — Keep Transparency',
      description:
        'Convert WebP images to PNG with transparency preserved. Useful when an app or site will not accept WebP files. Free tool.',
    },
  },
  {
    slug: 'heic-to-jpg',
    title: 'HEIC → JPG',
    h1: 'Convert HEIC to JPG',
    tagline: 'iPhone photos',
    description: 'Convert your iPhone HEIC photo to a JPG anything can open.',
    category: 'convert',
    keywords: ['heic', 'heif', 'iphone', 'apple', 'jpg', 'jpeg', 'convert', 'photo'],
    popular: true,
    convert: { fromLabel: 'HEIC', to: 'jpeg' },
    seo: {
      title: 'HEIC to JPG Converter — iPhone Photos, Free',
      description:
        'Convert iPhone HEIC photos to JPG so any device can open them. Works in every browser, and your photo never leaves it.',
    },
  },
  {
    slug: 'heic-to-png',
    title: 'HEIC → PNG',
    h1: 'Convert HEIC to PNG',
    tagline: 'iPhone photos',
    description: 'Convert your iPhone HEIC photo to PNG.',
    category: 'convert',
    keywords: ['heic', 'heif', 'iphone', 'apple', 'png', 'convert', 'photo'],
    convert: { fromLabel: 'HEIC', to: 'png' },
    seo: {
      title: 'HEIC to PNG Converter — Free iPhone Photo Tool',
      description:
        'Turn iPhone HEIC photos into lossless PNG files. Runs entirely in your browser, so nothing is uploaded anywhere. Free.',
    },
  },
  {
    slug: 'avif-to-jpg',
    title: 'AVIF → JPG',
    h1: 'Convert AVIF to JPG',
    tagline: 'Convert format',
    description: 'Convert your AVIF image to JPG.',
    category: 'convert',
    keywords: ['avif', 'jpg', 'jpeg', 'convert', 'change format'],
    convert: { fromLabel: 'AVIF', to: 'jpeg' },
    seo: {
      title: 'AVIF to JPG Converter — Free and Instant',
      description:
        'Convert AVIF images into widely supported JPG files. Handy when older software refuses to open an AVIF. Free, no signup.',
    },
  },
  {
    slug: 'avif-to-png',
    title: 'AVIF → PNG',
    h1: 'Convert AVIF to PNG',
    tagline: 'Convert format',
    description: 'Convert your AVIF image to PNG.',
    category: 'convert',
    keywords: ['avif', 'png', 'convert', 'change format', 'transparent'],
    convert: { fromLabel: 'AVIF', to: 'png' },
    seo: {
      title: 'AVIF to PNG Converter — Lossless and Free',
      description:
        'Convert AVIF images to PNG without quality loss and with transparency kept intact. Runs in your browser. Free tool.',
    },
  },
  {
    slug: 'bmp-to-jpg',
    title: 'BMP → JPG',
    h1: 'Convert BMP to JPG',
    tagline: 'Convert format',
    description: 'Convert your BMP image to a much smaller JPG.',
    category: 'convert',
    keywords: ['bmp', 'bitmap', 'jpg', 'jpeg', 'convert', 'smaller'],
    convert: { fromLabel: 'BMP', to: 'jpeg' },
    seo: {
      title: 'BMP to JPG Converter — Free Bitmap Converter',
      description:
        'Convert old BMP bitmap files to JPG and cut the file size dramatically. Fast, free, and private in your browser.',
    },
  },
  {
    slug: 'tiff-to-jpg',
    title: 'TIFF → JPG',
    h1: 'Convert TIFF to JPG',
    tagline: 'Scans and archives',
    description: 'Convert your TIFF scan to a JPG anything can open.',
    category: 'convert',
    keywords: ['tiff', 'tif', 'scan', 'jpg', 'jpeg', 'convert', 'archive'],
    convert: { fromLabel: 'TIFF', to: 'jpeg' },
    seo: {
      title: 'TIFF to JPG Converter — Free Online Tool',
      description:
        'Convert TIFF scans and archive images to JPG, which every device can open. Decoded in your browser, never uploaded.',
    },
  },
  {
    slug: 'jpg-to-pdf',
    title: 'JPG → PDF',
    h1: 'Convert your JPG to PDF',
    tagline: 'Create PDF',
    description: 'Turn your JPG photos into a single PDF document.',
    category: 'convert',
    keywords: ['jpg', 'jpeg', 'pdf', 'document', 'convert', 'scan'],
    sourceLabel: 'JPG',
    seo: {
      title: 'JPG to PDF Converter — Combine Photos Free',
      description:
        'Turn one or many JPG photos into a single PDF. Pages are sized and centred for you. Free, private, nothing is uploaded.',
    },
  },
  {
    slug: 'png-to-pdf',
    title: 'PNG → PDF',
    h1: 'Convert your PNG to PDF',
    tagline: 'Create PDF',
    description: 'Turn your PNG images into a single PDF document.',
    category: 'convert',
    keywords: ['png', 'pdf', 'document', 'convert', 'screenshot'],
    sourceLabel: 'PNG',
    seo: {
      title: 'PNG to PDF Converter — Free, No Watermark',
      description:
        'Turn PNG images and screenshots into a single tidy PDF. Runs in your browser with no watermark and no signup. Free.',
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
    slug: 'change-image-size',
    title: 'Change Image Size',
    h1: 'Change your image size',
    tagline: 'New dimensions',
    description: 'Change the width and height of your image.',
    category: 'transform',
    keywords: [
      'change size',
      'change dimensions',
      'resize',
      'width',
      'height',
      'bigger',
      'smaller',
    ],
    aliasOf: 'resize-image',
    seo: {
      title: 'Change Image Size Online — Width and Height',
      description:
        'Change the width and height of any image to whatever you need. Keep the proportions locked or set each side yourself.',
    },
  },
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
    slug: 'resize-jpg',
    title: 'Resize JPG',
    h1: 'Resize your JPG',
    tagline: 'Change JPG dimensions',
    description: 'Resize your JPG to exactly the dimensions you need.',
    category: 'transform',
    keywords: ['jpg', 'jpeg', 'resize', 'dimensions', 'width', 'height', 'pixels'],
    sourceLabel: 'JPG',
    seo: {
      title: 'Resize JPG Online — Exact Width and Height',
      description:
        'Resize JPG photos to the exact pixel size you need. Aspect ratio stays locked so nothing looks stretched. Free, no signup.',
    },
  },
  {
    slug: 'resize-png',
    title: 'Resize PNG',
    h1: 'Resize your PNG',
    tagline: 'Change PNG dimensions',
    description: 'Resize your PNG to exactly the dimensions you need.',
    category: 'transform',
    keywords: ['png', 'resize', 'dimensions', 'width', 'height', 'pixels', 'logo'],
    sourceLabel: 'PNG',
    seo: {
      title: 'Resize PNG Online — Keep Transparency Intact',
      description:
        'Resize PNG images to any pixel size with transparency preserved. Ideal for logos, icons and screenshots. Free and private.',
    },
  },
  {
    slug: 'resize-image-by-pixels',
    title: 'Resize by Pixels',
    h1: 'Resize your image by pixels',
    tagline: 'Exact pixel control',
    description: 'Set the exact pixel width and height you need.',
    category: 'transform',
    keywords: ['pixels', 'px', 'exact', 'dimensions', 'width', 'height', 'resize'],
    seo: {
      title: 'Resize Image by Pixels — Exact Pixel Dimensions',
      description:
        'Type an exact pixel width and height and get precisely that. Lock the ratio or set both sides independently. Free tool.',
    },
  },
  {
    slug: 'resize-image-to-1080x1080',
    title: 'Resize to 1080×1080',
    h1: 'Resize your image to 1080 × 1080',
    tagline: 'Square, 1080px',
    description: 'Resize your image to a 1080 × 1080 square.',
    category: 'transform',
    keywords: ['1080x1080', 'square', 'instagram', 'post', 'social', 'resize'],
    presetSize: { width: 1080, height: 1080 },
    seo: {
      title: 'Resize Image to 1080x1080 — Square Post Size',
      description:
        'Make any photo a perfect 1080 by 1080 square, the standard size for social posts. Opens ready to go. Free, no signup.',
    },
  },
  {
    slug: 'resize-image-to-1920x1080',
    title: 'Resize to 1920×1080',
    h1: 'Resize your image to 1920 × 1080',
    tagline: 'Full HD',
    description: 'Resize your image to 1920 × 1080, full HD.',
    category: 'transform',
    keywords: ['1920x1080', 'full hd', '1080p', 'wallpaper', 'desktop', 'resize'],
    presetSize: { width: 1920, height: 1080 },
    seo: {
      title: 'Resize Image to 1920x1080 — Full HD Size',
      description:
        'Resize any picture to 1920 by 1080, the standard full HD size for wallpapers, slides and video backgrounds. Free tool.',
    },
  },
  {
    slug: 'resize-image-to-1280x720',
    title: 'Resize to 1280×720',
    h1: 'Resize your image to 1280 × 720',
    tagline: 'HD 720p',
    description: 'Resize your image to 1280 × 720, HD.',
    category: 'transform',
    keywords: ['1280x720', '720p', 'hd', 'thumbnail', 'youtube', 'resize'],
    presetSize: { width: 1280, height: 720 },
    seo: {
      title: 'Resize Image to 1280x720 — HD 720p Size',
      description:
        'Resize your image to 1280 by 720, the usual size for video thumbnails and HD slides. Opens preset and ready. Free.',
    },
  },
  {
    slug: 'resize-image-to-1200x630',
    title: 'Resize to 1200×630',
    h1: 'Resize your image to 1200 × 630',
    tagline: 'Link preview',
    description: 'Resize your image to 1200 × 630 for link previews.',
    category: 'transform',
    keywords: ['1200x630', 'og image', 'open graph', 'link preview', 'share', 'resize'],
    presetSize: { width: 1200, height: 630 },
    seo: {
      title: 'Resize Image to 1200x630 — Social Preview Size',
      description:
        'Resize your image to 1200 by 630, the size used for link previews on social media and messaging apps. Free and instant.',
    },
  },
  {
    slug: 'resize-image-to-512x512',
    title: 'Resize to 512×512',
    h1: 'Resize your image to 512 × 512',
    tagline: 'Icon size',
    description: 'Resize your image to a 512 × 512 square.',
    category: 'transform',
    keywords: ['512x512', 'icon', 'app icon', 'avatar', 'square', 'resize'],
    presetSize: { width: 512, height: 512 },
    seo: {
      title: 'Resize Image to 512x512 — App Icon Size',
      description:
        'Resize any image to 512 by 512 pixels, the standard square for app icons and avatars. Opens ready to use. Free tool.',
    },
  },
  {
    slug: 'resize-image-to-800x800',
    title: 'Resize to 800×800',
    h1: 'Resize your image to 800 × 800',
    tagline: 'Square, 800px',
    description: 'Resize your image to an 800 × 800 square.',
    category: 'transform',
    keywords: ['800x800', 'square', 'product', 'listing', 'shop', 'resize'],
    presetSize: { width: 800, height: 800 },
    seo: {
      title: 'Resize Image to 800x800 — Square Product Size',
      description:
        'Resize your photo to 800 by 800 pixels, a common square for product listings and shop images. Free, runs in browser.',
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
    slug: 'darken-image',
    title: 'Darken Image',
    h1: 'Darken your image',
    tagline: 'Reduce brightness',
    description: 'Make your image darker, with a live preview as you adjust.',
    category: 'adjust',
    keywords: ['darken', 'darker', 'too bright', 'overexposed', 'dim', 'reduce light'],
    seo: {
      title: 'Darken Image Online — Fix Overexposed Photos',
      description:
        'Make a too-bright photo darker with a live preview as you drag. Opens already darkened so you can fine tune. Free tool.',
    },
  },
  {
    slug: 'increase-contrast',
    title: 'Increase Contrast',
    h1: 'Increase your image contrast',
    tagline: 'Add punch',
    description: 'Give a flat image more punch, with a live preview.',
    category: 'adjust',
    keywords: ['increase contrast', 'more contrast', 'flat', 'dull', 'punch', 'pop'],
    seo: {
      title: 'Increase Image Contrast Online — Free Tool',
      description:
        'Add punch to a flat, dull photo by increasing contrast. Live preview as you drag, so you see it before you save it.',
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
    slug: 'remove-exif',
    title: 'Remove EXIF Data',
    h1: 'Remove EXIF data from your photo',
    tagline: 'Strip EXIF',
    description:
      'Remove the EXIF block your camera wrote into the photo, including any location.',
    category: 'privacy',
    keywords: ['exif', 'remove exif', 'strip exif', 'privacy', 'gps', 'camera data'],
    aliasOf: 'remove-metadata',
    seo: {
      title: 'Remove EXIF Data From Photos — Free and Private',
      description:
        'Strip EXIF data, including GPS location, from your photos before sharing. Runs in your browser so the file is never uploaded.',
    },
  },
  {
    slug: 'remove-image-metadata',
    title: 'Remove Image Metadata',
    h1: 'Remove metadata from your image',
    tagline: 'Clean the file',
    description: 'Remove the hidden information stored inside your image file.',
    category: 'privacy',
    keywords: [
      'image metadata',
      'remove metadata',
      'hidden data',
      'clean',
      'privacy',
      'strip',
    ],
    aliasOf: 'remove-metadata',
    seo: {
      title: 'Remove Image Metadata Online — Free Tool',
      description:
        'Clear the hidden data stored inside an image file, from camera details to GPS location. Free, private, nothing uploaded.',
    },
  },
  {
    slug: 'image-metadata-viewer',
    title: 'Metadata Viewer',
    h1: 'See the metadata inside your image',
    tagline: 'Inspect hidden data',
    description:
      'See exactly what your image file records about the camera, date and location.',
    category: 'privacy',
    keywords: [
      'metadata viewer',
      'view metadata',
      'check metadata',
      'inspect',
      'see hidden data',
      'what data',
    ],
    seo: {
      title: 'Image Metadata Viewer — See Hidden Photo Data',
      description:
        'Check what your photo reveals about the camera, date and location before you share it. Nothing is uploaded anywhere.',
    },
  },
  {
    slug: 'exif-viewer',
    title: 'EXIF Viewer',
    h1: 'View the EXIF data in your photo',
    tagline: 'Read EXIF tags',
    description: 'Read the EXIF tags your camera wrote into the photo.',
    category: 'privacy',
    keywords: ['exif viewer', 'read exif', 'exif data', 'check exif', 'camera tags'],
    aliasOf: 'image-metadata-viewer',
    seo: {
      title: 'EXIF Viewer Online — Read Photo EXIF Data Free',
      description:
        'View the EXIF tags in any JPEG, including camera, lens settings, date and whether location data is attached. Free tool.',
    },
  },
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
