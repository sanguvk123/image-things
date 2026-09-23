import { Link, useParams } from 'react-router-dom';
import { getTool, type Tool } from '@/tools/registry';
import { CompressImage } from './tools/CompressImage';
import { CompressToSize } from './tools/CompressToSize';
import { ResizeImage } from './tools/ResizeImage';
import { ConvertImage } from './tools/ConvertImage';
import { RotateImage } from './tools/RotateImage';
import { FlipImage } from './tools/FlipImage';
import { CropImage } from './tools/CropImage';

/**
 * Maps a tool slug to its page component.
 *
 * Tools are implemented one slice at a time; anything not listed here still
 * routes and renders an honest placeholder rather than a 404.
 */
const PAGES: Record<string, (props: { tool: Tool }) => React.ReactElement> = {
  'compress-image': CompressImage,
  'compress-image-to-size': CompressToSize,
  'compress-image-to-50kb': CompressToSize,
  'compress-image-to-100kb': CompressToSize,
  'compress-image-to-200kb': CompressToSize,
  'compress-image-to-500kb': CompressToSize,
  'resize-image': ResizeImage,
  'jpg-to-png': ConvertImage,
  'png-to-jpg': ConvertImage,
  'webp-to-jpg': ConvertImage,
  'jpg-to-webp': ConvertImage,
  'png-to-webp': ConvertImage,
  'rotate-image': RotateImage,
  'flip-image': FlipImage,
  'crop-image': CropImage,
};

export function ToolRoute() {
  const { slug = '' } = useParams();
  const tool = getTool(slug);

  if (!tool) return <NotFound />;

  const Page = PAGES[tool.slug];
  return Page ? <Page tool={tool} /> : <ComingSoon tool={tool} />;
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
      <h1 className="text-3xl font-semibold tracking-[-0.02em] text-ink">
        Tool not found
      </h1>
      <Link to="/" className="mt-4 inline-block text-accent">
        Back to all tools
      </Link>
    </div>
  );
}
