import { Link, useParams } from 'react-router-dom';
import { getTool, type Tool } from '@/tools/registry';
import { toolMeta } from '@/tools/seo';
import { DocumentHead } from '@/components/DocumentHead';
import { CompressImage } from './tools/CompressImage';
import { CompressToSize } from './tools/CompressToSize';
import { ResizeImage } from './tools/ResizeImage';
import { ConvertImage } from './tools/ConvertImage';
import { RotateImage } from './tools/RotateImage';
import { FlipImage } from './tools/FlipImage';
import { CropImage } from './tools/CropImage';
import {
  AdjustContrast,
  AdjustSaturation,
  BlurImage,
  BrightenImage,
  DarkenImage,
  IncreaseContrast,
} from './tools/AdjustImage';
import { GrayscaleImage } from './tools/GrayscaleImage';
import { SharpenImage } from './tools/SharpenImage';
import { RemoveMetadata } from './tools/RemoveMetadata';
import { ViewMetadata } from './tools/ViewMetadata';
import { ImageToPdf } from './tools/ImageToPdf';
import { UpscaleImage } from './tools/UpscaleImage';
import { RemoveBackground } from './tools/RemoveBackground';

/**
 * Maps a tool slug to its page component.
 *
 * Tools are implemented one slice at a time; anything not listed here still
 * routes and renders an honest placeholder rather than a 404.
 */
const PAGES: Record<string, (props: { tool: Tool }) => React.ReactElement> = {
  'compress-image': CompressImage,
  'compress-jpg': CompressImage,
  'compress-png': CompressImage,
  'compress-webp': CompressImage,
  'compress-image-without-losing-quality': CompressImage,
  'compress-image-to-size': CompressToSize,
  'compress-image-to-50kb': CompressToSize,
  'compress-image-to-100kb': CompressToSize,
  'compress-image-to-200kb': CompressToSize,
  'compress-image-to-300kb': CompressToSize,
  'compress-image-to-500kb': CompressToSize,
  'compress-image-to-1mb': CompressToSize,
  'compress-jpg-to-100kb': CompressToSize,
  'compress-jpg-to-200kb': CompressToSize,
  'compress-jpg-to-500kb': CompressToSize,
  'compress-png-to-100kb': CompressToSize,
  'resize-image': ResizeImage,
  'resize-jpg': ResizeImage,
  'resize-png': ResizeImage,
  'resize-image-by-pixels': ResizeImage,
  'resize-image-to-1080x1080': ResizeImage,
  'resize-image-to-1920x1080': ResizeImage,
  'resize-image-to-1280x720': ResizeImage,
  'resize-image-to-1200x630': ResizeImage,
  'resize-image-to-512x512': ResizeImage,
  'resize-image-to-800x800': ResizeImage,
  'jpg-to-png': ConvertImage,
  'png-to-jpg': ConvertImage,
  'webp-to-jpg': ConvertImage,
  'webp-to-png': ConvertImage,
  'jpg-to-webp': ConvertImage,
  'png-to-webp': ConvertImage,
  'heic-to-jpg': ConvertImage,
  'heic-to-png': ConvertImage,
  'avif-to-jpg': ConvertImage,
  'avif-to-png': ConvertImage,
  'bmp-to-jpg': ConvertImage,
  'tiff-to-jpg': ConvertImage,
  'rotate-image': RotateImage,
  'flip-image': FlipImage,
  'crop-image': CropImage,
  'brighten-image': BrightenImage,
  'darken-image': DarkenImage,
  'adjust-contrast': AdjustContrast,
  'increase-contrast': IncreaseContrast,
  'adjust-saturation': AdjustSaturation,
  'grayscale-image': GrayscaleImage,
  'blur-image': BlurImage,
  'sharpen-image': SharpenImage,
  'remove-metadata': RemoveMetadata,
  'remove-exif': RemoveMetadata,
  'remove-image-metadata': RemoveMetadata,
  'image-metadata-viewer': ViewMetadata,
  'exif-viewer': ViewMetadata,
  'image-to-pdf': ImageToPdf,
  'upscale-image': UpscaleImage,
  'remove-background': RemoveBackground,
};

export function ToolRoute() {
  const { slug = '' } = useParams();
  const tool = getTool(slug);

  if (!tool) return <NotFound />;

  const Page = PAGES[tool.slug];
  return (
    <>
      <DocumentHead {...toolMeta(tool)} />
      {Page ? <Page tool={tool} /> : <ComingSoon tool={tool} />}
    </>
  );
}

function ComingSoon({ tool }: { tool: Tool }) {
  return (
    <div className="mx-auto max-w-xl px-6 py-24 text-center">
      <h1 className="text-3xl font-semibold tracking-[-0.02em] text-ink">
        {tool.title}
      </h1>
      <p className="mt-3 text-ink-faint">This tool is coming next.</p>
      <Link to="/" className="mt-5 inline-block text-sm text-accent">
        Back to all tools
      </Link>
    </div>
  );
}

function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-6 py-24 text-center">
      {/* noindex: an unknown slug must never enter the index as a real page. */}
      <title>Tool not found — Image Tools</title>
      <meta name="robots" content="noindex" />
      <h1 className="text-3xl font-semibold tracking-[-0.02em] text-ink">
        Tool not found
      </h1>
      <Link to="/" className="mt-4 inline-block text-accent">
        Back to all tools
      </Link>
    </div>
  );
}
