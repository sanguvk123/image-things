/**
 * Supporting content for tool pages: how it works, why you'd do it, and FAQs.
 *
 * Why this is derived rather than hand-written 63 times: the pages must differ
 * *substantively*, not by find-and-replace. So the copy is built from real
 * facts about the formats and the intent -- PNG is lossless and larger, JPG
 * has no transparency, HEIC is an iPhone format Windows often cannot open --
 * which means each page says something true and specific about its own job.
 * Boilerplate with the nouns swapped is exactly the thin-content pattern that
 * gets a large page set filtered out of the index.
 *
 * Two hard rules, both enforced by tests:
 *
 * 1. Never claim files are uploaded, stored or later deleted. Nothing leaves
 *    the browser. "We delete your files after an hour" is both false here and
 *    a weaker promise than the truth.
 *
 * 2. Never promise a format is better in every way. PNG really is bigger than
 *    JPG; saying otherwise is a lie the user discovers on the next screen.
 */

import type { Tool } from './registry';

export interface Faq {
  question: string;
  answer: string;
}

export interface ToolContent {
  /** Numbered "how to" steps. */
  steps: string[];
  /** One or two paragraphs on why someone does this. */
  why: string[];
  faqs: Faq[];
}

export interface FormatFact {
  /** Plain-English name used in prose. */
  name: string;
  summary: string;
  /** True if the format keeps every pixel exactly. */
  lossless: boolean;
  /** True if the format supports an alpha channel. */
  transparency: boolean;
}

export const FORMAT_FACTS: Record<string, FormatFact> = {
  jpg: {
    name: 'JPG',
    summary:
      'JPG is the most widely supported photo format. It uses lossy compression, which keeps files small but discards some detail.',
    lossless: false,
    transparency: false,
  },
  jpeg: {
    name: 'JPG',
    summary:
      'JPG is the most widely supported photo format. It uses lossy compression, which keeps files small but discards some detail.',
    lossless: false,
    transparency: false,
  },
  png: {
    name: 'PNG',
    summary:
      'PNG is lossless and supports transparency, which makes it the right choice for logos, screenshots and graphics with sharp edges.',
    lossless: true,
    transparency: true,
  },
  webp: {
    name: 'WebP',
    summary:
      'WebP produces smaller files than JPG or PNG at similar quality and supports transparency, but a few older apps still cannot open it.',
    lossless: false,
    transparency: true,
  },
  heic: {
    name: 'HEIC',
    summary:
      'HEIC is the format iPhones use by default. It saves space on the phone, but Windows, many websites and older software often refuse to open it.',
    lossless: false,
    transparency: false,
  },
  avif: {
    name: 'AVIF',
    summary:
      'AVIF compresses better than almost anything else, but support outside modern browsers is still patchy.',
    lossless: false,
    transparency: true,
  },
  bmp: {
    name: 'BMP',
    summary:
      'BMP stores pixels with little or no compression, so files are very large compared with any modern format.',
    lossless: true,
    transparency: false,
  },
  tiff: {
    name: 'TIFF',
    summary:
      'TIFF is common in scanning and print work. Files are large and most web browsers will not display them at all.',
    lossless: true,
    transparency: true,
  },
};

function fact(label: string): FormatFact | undefined {
  return FORMAT_FACTS[label.toLowerCase()];
}

const PRIVACY_FAQ: Faq = {
  question: 'Are my images uploaded to a server?',
  answer:
    'No. Every image is processed by your own browser, so the file never leaves your device and there is nothing for us to store or see.',
};

const COST_FAQ: Faq = {
  question: 'Is this tool free?',
  answer:
    'Yes, completely free with no signup, no watermark and no limit on how many images you process.',
};

function conversionContent(tool: Tool): ToolContent | null {
  if (!tool.convert) return null;

  const from = fact(tool.convert.fromLabel);
  const to = fact(tool.convert.to);
  if (!from || !to) return null;

  const steps = [
    `Upload your ${from.name} file, or paste it straight from your clipboard.`,
    `The image is decoded and re-encoded as ${to.name} in your browser.`,
    `Download the ${to.name} file.`,
  ];

  const why = [to.summary, from.summary];

  const faqs: Faq[] = [
    {
      question: `Does converting ${from.name} to ${to.name} reduce quality?`,
      answer: to.lossless
        ? `No. ${to.name} is lossless, so every pixel from the original is kept exactly. The file will usually be larger than the ${from.name} you started with, which is the trade-off for that.`
        : `${to.name} uses lossy compression, so the conversion re-encodes the image. This tool encodes at high quality, and for a single conversion the difference is very hard to see.`,
    },
    {
      question: `Can I convert ${from.name} to ${to.name} on Windows or a phone?`,
      answer: `Yes. The converter runs in any modern browser on Windows, macOS, Android, iPhone and iPad. There is nothing to install.`,
    },
  ];

  // Only state a transparency consequence when one actually exists.
  if (from.transparency && !to.transparency) {
    faqs.push({
      question: `What happens to transparent areas?`,
      answer: `${to.name} has no transparency, so any transparent part of your ${from.name} is filled with white. If you need to keep transparency, convert to PNG or WebP instead.`,
    });
  } else if (!from.transparency && to.transparency) {
    faqs.push({
      question: `Will converting to ${to.name} add transparency?`,
      answer: `No. ${to.name} supports transparency, but a ${from.name} file has none to begin with, so the result is fully opaque. Converting cannot invent a transparent background.`,
    });
  } else {
    faqs.push({
      question: `Is there a limit on file size or number of files?`,
      answer: `There is no artificial limit. Because the work happens on your own device, the only real constraint is how much memory your browser has available.`,
    });
  }

  faqs.push(PRIVACY_FAQ, COST_FAQ);
  return { steps, why, faqs };
}

function compressionContent(tool: Tool): ToolContent | null {
  if (tool.category !== 'optimize') return null;

  const source = tool.sourceLabel ?? 'image';
  const target = tool.targetKB
    ? tool.targetKB >= 1000
      ? `${tool.targetKB / 1000}MB`
      : `${tool.targetKB}KB`
    : null;

  const steps = target
    ? [
        `Upload the ${source} you need under ${target}.`,
        `Quality is adjusted automatically until the file fits within ${target}.`,
        `Download the compressed image.`,
      ]
    : [
        `Upload your ${source}, or paste it from your clipboard.`,
        `Pick how hard to compress: recommended, smaller, or smallest.`,
        `Download the result and compare the saving.`,
      ];

  const why = target
    ? [
        `Upload limits are the usual reason for needing an exact size. Job portals, government forms and university applications very often cap attachments at a specific figure such as ${target}, and reject anything above it without explaining why.`,
        `Rather than guessing at a quality slider, this page searches for the highest quality that still fits under ${target}, so you get the best-looking image that will actually be accepted.`,
      ]
    : [
        `Photos straight from a phone or camera are often several megabytes, which makes pages slow to load, emails slow to send, and uploads fail on forms with size limits.`,
        `Compression re-encodes the image at a lower quality setting. Most of the saving comes from detail the eye does not notice, which is why a file can often shrink by 70-80% and still look the same on screen.`,
      ];

  const faqs: Faq[] = [
    {
      question: target
        ? `Will my image still look good at ${target}?`
        : 'Will compressing make my image look worse?',
      answer: target
        ? `Usually yes. The tool tries the highest quality that fits, and only reduces the dimensions if quality alone cannot reach ${target}. A very large photo squeezed into a small target will show some softening.`
        : 'At the recommended setting most photos are indistinguishable from the original at normal viewing size. The smallest setting trades visible quality for the largest saving.',
    },
    {
      question: 'Are the original dimensions kept?',
      answer:
        'Yes in almost every case. Compression changes how the image is encoded, not how many pixels it has. Dimensions are only reduced when a size target cannot be met any other way.',
    },
    {
      question: 'Which formats can I compress?',
      answer:
        'JPG, PNG, WebP, HEIC and TIFF are all accepted. HEIC photos from an iPhone are decoded in the browser, so they work here even though many desktop apps cannot open them.',
    },
    PRIVACY_FAQ,
    COST_FAQ,
  ];

  return { steps, why, faqs };
}

function resizeContent(tool: Tool): ToolContent | null {
  if (!tool.slug.includes('resize') && tool.slug !== 'change-image-size') return null;

  const preset = tool.presetSize;
  const size = preset ? `${preset.width} × ${preset.height}` : null;

  const steps = size
    ? [
        `Upload the image you want at ${size}.`,
        `The target dimensions are already filled in for you.`,
        `Resize and download.`,
      ]
    : [
        `Upload your image, or paste it from your clipboard.`,
        `Enter the width or height you need. Keep the aspect ratio locked and the other value follows automatically.`,
        `Resize and download.`,
      ];

  const why = size
    ? [
        `${size} is a fixed requirement rather than a preference, which is why guessing at a slider does not help. Getting it wrong means the platform crops or stretches the image for you.`,
        `This page starts with ${size} already entered and the aspect ratio unlocked, so the output is exactly those dimensions.`,
      ]
    : [
        `Resizing changes the pixel dimensions of an image, which is what you need when something must fit a specific space: an upload that rejects large images, a profile picture, or a print at a set size.`,
        `Keeping the aspect ratio locked prevents the stretched, squashed look that comes from setting width and height independently.`,
      ];

  const faqs: Faq[] = [
    {
      question: size
        ? `Will my image be cropped to reach ${size}?`
        : 'Will resizing distort my image?',
      answer: size
        ? `No. The image is scaled to exactly ${size}. If your original has a different shape, scaling to a fixed size will change its proportions, so crop it to the right shape first if that matters.`
        : 'Not if you leave "keep aspect ratio" switched on, which is the default. Unlock it only when you deliberately want to stretch the image.',
    },
    {
      question: 'Can I make an image larger without it going blurry?',
      answer:
        'Only to a point. Enlarging has to invent pixels that were never captured, so detail cannot be recovered. Modest enlargement looks fine; doubling a small image will look soft.',
    },
    {
      question: 'Is the file size reduced too?',
      answer:
        'Usually yes, since fewer pixels means less data. If you need a specific file size rather than specific dimensions, use the compression tools instead.',
    },
    PRIVACY_FAQ,
    COST_FAQ,
  ];

  return { steps, why, faqs };
}

/**
 * A verb phrase for use mid-sentence, e.g. "an account to crop an image".
 *
 * Lowercasing the title is not enough: "EXIF Viewer" is a noun and "JPG → PDF"
 * contains an arrow, so both produce nonsense in a sentence. Titles that do
 * not read as actions fall back to wording that works for any tool.
 */
export function actionPhrase(tool: Tool): string {
  if (tool.convert) {
    return `convert ${tool.convert.fromLabel} to ${FORMAT_FACTS[tool.convert.to].name}`;
  }

  const title = tool.title;
  // A title that names a thing rather than a doing-word: "EXIF Viewer",
  // "Image Metadata Viewer", "JPG → PDF".
  if (/viewer$/i.test(title) || /→/.test(title)) return 'use this tool';

  return title.toLowerCase();
}

function genericContent(tool: Tool): ToolContent {
  const action = actionPhrase(tool);

  return {
    steps: [
      `Upload your image, or paste it from your clipboard.`,
      `Adjust the setting until the preview looks right.`,
      `Download the result.`,
    ],
    why: [
      tool.description,
      `Everything happens inside your browser, so the image is never uploaded, and the file you download is exactly what you saw in the preview.`,
    ],
    faqs: [
      {
        question: `Do I need an account to ${action}?`,
        answer: `No. There is no signup, no email, and no watermark on the result. Open the page, do the job, and close the tab.`,
      },
      {
        question: 'Which image formats are supported?',
        answer:
          'JPG, PNG, WebP, HEIC and TIFF. HEIC photos from an iPhone are decoded in the browser, so they work even where desktop software often fails.',
      },
      PRIVACY_FAQ,
      COST_FAQ,
    ],
  };
}

/** Supporting content for a tool page. Deterministic: same tool, same text. */
export function contentFor(tool: Tool): ToolContent {
  return (
    conversionContent(tool) ??
    compressionContent(tool) ??
    resizeContent(tool) ??
    genericContent(tool)
  );
}
