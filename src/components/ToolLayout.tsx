import { useEffect, useRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Dropzone } from './Dropzone';
import { ImagePreview } from './ImagePreview';
import { ResultPanel } from './ResultPanel';
import { ContinueWith } from './ContinueWith';
import { ErrorNote } from './controls';
import { ToolIcon, categoryStyle } from './ToolIcon';
import { ToolContent } from './ToolContent';
import { takeHandoff } from '@/image/handoff';
import type { LoadedImage, ProcessedImage } from '@/image/pipeline';
import { headingFor, type Tool } from '@/tools/registry';
import { relatedTools } from '@/seo/internalLinks';

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
  /*
   * Pick up an image handed over by the previous tool.
   *
   * Runs once per mount, and the handoff is consumed on read, so removing the
   * image does not cause it to reappear on the next render. onSelectFile is
   * intentionally not a dependency: it is redefined every render by the
   * calling page, and depending on it would re-run this on every keystroke.
   */
  const collected = useRef(false);
  useEffect(() => {
    if (collected.current) return;
    collected.current = true;

    const handed = takeHandoff();
    if (handed) onSelectFile(handed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ToolPage tool={tool}>
      <div className="mt-6">
        {result ? (
          <>
            <ResultPanel
              result={result}
              originalBytes={image?.file.size ?? 0}
              onStartOver={onReset}
              note={resultNote}
              hideSavings={hideSavings}
            />
            <ContinueWith tool={tool} result={result} />
          </>
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
            <TrustBadges />
          </div>
        )}
      </div>
    </ToolPage>
  );
}

/**
 * The shell every tool page wears: back link, category icon, heading,
 * description, then the supporting content and onward links.
 *
 * Most tools get this via ToolLayout. Three need their own body -- crop has a
 * drag surface, image-to-pdf takes many files, the metadata viewer has no
 * action to perform -- and before this existed they each kept a copy of the
 * header. The copies drifted: all three lost the category icon and used
 * different padding, and two forgot the related-tools section entirely, which
 * left six pages with one outbound link between them.
 *
 * A bespoke body is legitimate. A bespoke shell is not.
 */
export function ToolPage({
  tool,
  children,
  contentExcludes = [],
}: {
  tool: Tool;
  children: ReactNode;
  /** Tools the page already links to prominently; see RelatedTools. */
  contentExcludes?: string[];
}) {
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
      <p className="mt-2 text-ui text-ink-soft">{tool.description}</p>

      {children}

      <ToolContent tool={tool} />
      <RelatedTools tool={tool} exclude={contentExcludes} />
    </div>
  );
}

/**
 * The reassurance row under the upload area.
 *
 * Deliberately does NOT say "files deleted after an hour", which is the
 * standard line on tools of this kind. Nothing is uploaded here, so that
 * claim would be false -- and it is a weaker promise than the true one.
 */
function TrustBadges() {
  const badges = [
    'Free',
    'No signup',
    'No watermark',
    'Never uploaded',
  ];

  return (
    <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
      {badges.map((badge) => (
        <li key={badge} className="flex items-center gap-1.5 text-xs text-ink-faint">
          <svg
            viewBox="0 0 24 24"
            className="h-3.5 w-3.5 text-good"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m5 12 5 5L20 7" />
          </svg>
          {badge}
        </li>
      ))}
    </ul>
  );
}

/**
 * Other tools worth a click from here.
 *
 * Most visitors arrive from a search for one narrow need and leave without
 * discovering the other sixty tools. This also gives every landing page
 * internal links, which is how crawlers find pages that nothing else links to.
 *
 * The selection lives in seo/internalLinks so the whole link graph can be
 * asserted on as a graph -- taking the first six of a category, which is what
 * this did before, left a quarter of the site orphaned.
 *
 * Exported because three tools (crop, image-to-pdf, the metadata viewer) need
 * layouts of their own. They were silently missing this section, which cost
 * six pages every onward link they had.
 *
 * `exclude` drops a tool the page already links to more prominently. The
 * metadata viewer offers "Want this gone? Remove metadata" right beside the
 * data, and repeating it in a list below would give the page two identical
 * links to the same place.
 */
export function RelatedTools({
  tool,
  exclude = [],
}: {
  tool: Tool;
  exclude?: string[];
}) {
  const related = relatedTools(tool).filter(
    (other) => !exclude.includes(other.slug),
  );

  if (related.length === 0) return null;

  return (
    <section aria-labelledby="related-tools" className="mt-12 border-t border-line pt-6">
      <h2
        id="related-tools"
        className="mb-3 text-xs font-semibold tracking-[0.06em] text-ink-faint uppercase"
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
              <span className="truncate text-meta text-ink">{other.title}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
