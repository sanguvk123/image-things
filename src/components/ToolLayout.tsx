import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Dropzone } from './Dropzone';
import { ImagePreview } from './ImagePreview';
import { ResultPanel } from './ResultPanel';
import { ErrorNote } from './controls';
import { ToolIcon, categoryStyle } from './ToolIcon';
import type { LoadedImage, ProcessedImage } from '@/image/pipeline';
import { TOOLS, headingFor, type Tool } from '@/tools/registry';

interface ToolLayoutProps {
  tool: Tool;
  image: LoadedImage | null;
  result: ProcessedImage | null;
  error: string | null;
  onSelectFile: (file: File) => void;
  onReset: () => void;
  /** The tool's own controls, shown beside the preview once an image is in. */
  children?: ReactNode;
  /** Live-preview URL to show instead of the original while adjusting. */
  overlayUrl?: string;
  /** CSS transform previewing a pending change, e.g. "rotate(90deg)". */
  previewTransform?: string;
  /** CSS filter previewing a pending adjustment, e.g. "brightness(1.2)". */
  previewFilter?: string;
  resultNote?: string;
  hideSavings?: boolean;
  acceptHint?: string;
}

/**
 * The universal tool page (spec §11).
 *
 * Every tool looks the same: title, one sentence, then either the upload area
 * or the image with that tool's single action. The user learns the shape once.
 */
export function ToolLayout({
  tool,
  image,
  result,
  error,
  onSelectFile,
  onReset,
  children,
  overlayUrl,
  previewTransform,
  previewFilter,
  resultNote,
  hideSavings,
  acceptHint,
}: ToolLayoutProps) {
  const style = categoryStyle(tool.category);

  return (
    <div className="mx-auto max-w-2xl px-5 pt-6 pb-16 sm:px-6">
      <Link
        to="/"
        className="text-sm text-ink-faint transition-colors duration-150 hover:text-ink"
      >
        ← All tools
      </Link>

      {/* The icon repeats the category colour from the grid, so arriving from
          the homepage or from Google both land on a recognisable page. */}
      <div className="mt-4 flex items-center gap-3">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${style.tile} ${style.text}`}
        >
          <ToolIcon tool={tool} className="h-6 w-6" />
        </span>
        <h1 className="text-[1.75rem] leading-tight font-semibold tracking-[-0.025em] text-ink sm:text-3xl">
          {headingFor(tool)}
        </h1>
      </div>
      <p className="mt-2 text-[15px] text-ink-soft">{tool.description}</p>

      <div className="mt-6">
        {result ? (
          <ResultPanel
            result={result}
            originalBytes={image?.file.size ?? 0}
            onStartOver={onReset}
            note={resultNote}
            hideSavings={hideSavings}
          />
        ) : image ? (
          <div className="space-y-7">
            <ImagePreview
              image={image}
              onRemove={onReset}
              overlayUrl={overlayUrl}
              previewTransform={previewTransform}
              previewFilter={previewFilter}
            />
            {error && <ErrorNote>{error}</ErrorNote>}
            {children}
          </div>
        ) : (
          <div className="space-y-3">
            <Dropzone
              onFiles={(files) => files[0] && onSelectFile(files[0])}
              hint={acceptHint}
            />
            {error && <ErrorNote>{error}</ErrorNote>}
            <p className="text-center text-xs text-ink-faint">
              Private • Secure • No signup
            </p>
          </div>
        )}
      </div>

      <RelatedTools tool={tool} />
    </div>
  );
}

/**
 * Other tools in the same category.
 *
 * Most visitors arrive from a search for one narrow need and leave without
 * discovering the other sixty tools. This also gives every landing page
 * internal links, which is how crawlers find pages that nothing else links to.
 */
function RelatedTools({ tool }: { tool: Tool }) {
  const related = TOOLS.filter(
    (other) =>
      other.category === tool.category && other.slug !== tool.slug && !other.aliasOf,
  ).slice(0, 6);

  if (related.length === 0) return null;

  return (
    <section aria-labelledby="related-tools" className="mt-12 border-t border-line pt-6">
      <h2
        id="related-tools"
        className="mb-3 text-[12px] font-semibold tracking-[0.06em] text-ink-faint uppercase"
      >
        Related tools
      </h2>
      <div className="grid gap-2 sm:grid-cols-2">
        {related.map((other) => {
          const style = categoryStyle(other.category);
          return (
            <Link
              key={other.slug}
              to={`/${other.slug}`}
              className={`flex items-center gap-2.5 rounded-lg border border-line bg-surface px-3 py-2.5 transition-colors duration-150 hover:bg-canvas ${style.ring}`}
            >
              <span className={`shrink-0 ${style.text}`}>
                <ToolIcon tool={other} className="h-[18px] w-[18px]" />
              </span>
              <span className="truncate text-[13.5px] text-ink">{other.title}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
