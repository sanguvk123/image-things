import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Dropzone } from './Dropzone';
import { ImagePreview } from './ImagePreview';
import { ResultPanel } from './ResultPanel';
import { ErrorNote } from './controls';
import type { LoadedImage, ProcessedImage } from '@/image/pipeline';
import type { Tool } from '@/tools/registry';

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
  resultNote,
  hideSavings,
  acceptHint,
}: ToolLayoutProps) {
  return (
    <div className="mx-auto max-w-2xl px-6 pt-12 pb-24">
      <Link
        to="/"
        className="text-sm text-ink-faint transition-colors duration-150 hover:text-ink"
      >
        ← All tools
      </Link>

      <h1 className="mt-5 text-3xl font-semibold tracking-[-0.025em] text-ink">
        {tool.title}
      </h1>
      <p className="mt-2 text-ink-soft">{tool.description}</p>

      <div className="mt-8">
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
            <ImagePreview image={image} onRemove={onReset} overlayUrl={overlayUrl} />
            {error && <ErrorNote>{error}</ErrorNote>}
            {children}
          </div>
        ) : (
          <div className="space-y-4">
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
    </div>
  );
}
