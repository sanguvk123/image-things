import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Dropzone } from '@/components/Dropzone';
import { ToolContent } from '@/components/ToolContent';
import { RelatedTools } from '@/components/ToolLayout';
import { ActionButton, ErrorNote, PRIVACY_LINE } from '@/components/controls';
import { formatBytes } from '@/image/format';
import {
  createCanvas,
  context2d,
  downloadResult,
  encode,
  loadImage,
  releaseImage,
  type LoadedImage,
  type ProcessedImage,
} from '@/image/pipeline';
import { messageForLoadFailure } from '@/image/errors';
import { buildPdf, type PdfPage } from '@/image/pdf';
import { outputFileName } from '@/image/format';
import { headingFor, type Tool } from '@/tools/registry';

/**
 * Image → PDF (spec §9).
 *
 * The one tool that is genuinely multi-file: a PDF of a single page is useful,
 * but "scan these five receipts into one document" is the real job.
 */
export function ImageToPdf({ tool }: { tool: Tool }) {
  const [images, setImages] = useState<LoadedImage[]>([]);
  const [result, setResult] = useState<ProcessedImage | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const imagesRef = useRef<LoadedImage[]>([]);
  imagesRef.current = images;

  // Release every decoded image when leaving the page.
  useEffect(
    () => () => {
      imagesRef.current.forEach(releaseImage);
    },
    [],
  );

  const addFiles = useCallback(async (files: File[]) => {
    setError(null);
    const loaded: LoadedImage[] = [];

    for (const file of files) {
      try {
        loaded.push(await loadImage(file));
      } catch (cause) {
        setError(messageForLoadFailure(cause, file.name));
      }
    }

    if (loaded.length > 0) setImages((current) => [...current, ...loaded]);
  }, []);

  function removeAt(index: number) {
    setImages((current) => {
      const target = current[index];
      if (target) releaseImage(target);
      return current.filter((_, i) => i !== index);
    });
  }

  function startOver() {
    images.forEach(releaseImage);
    setImages([]);
    setResult(null);
    setError(null);
  }

  async function createPdf() {
    setBusy(true);
    setError(null);

    try {
      const pages: PdfPage[] = [];

      for (const image of images) {
        // PDF embeds JPEG directly, so every page is encoded as JPEG first.
        const canvas = createCanvas(image.width, image.height);
        const ctx = context2d(canvas);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image.bitmap, 0, 0);

        const blob = await encode(canvas, 'jpeg', 0.9);
        pages.push({
          jpeg: new Uint8Array(await blob.arrayBuffer()),
          width: canvas.width,
          height: canvas.height,
        });
      }

      const pdf = buildPdf(pages);
      setResult({
        blob: pdf,
        url: URL.createObjectURL(pdf),
        width: pages[0].width,
        height: pages[0].height,
        format: 'jpeg',
        fileName: outputFileName(images[0].file.name, 'jpeg').replace(
          /\.jpg$/,
          '.pdf',
        ),
      });
    } catch {
      setError(
        'The PDF could not be created. Try again, or remove the largest image and retry.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 pt-12 pb-24">
      <Link
        to="/"
        className="text-sm text-ink-faint transition-colors duration-150 hover:text-ink"
      >
        ← All tools
      </Link>

      <h1 className="mt-5 text-3xl font-semibold tracking-[-0.025em] text-ink">
        {headingFor(tool)}
      </h1>
      <p className="mt-2 text-ink-soft">{tool.description}</p>

      <div className="mt-8 space-y-6">
        {result ? (
          <div className="rounded-2xl border border-line bg-surface p-6 text-center">
            <p className="text-lg text-ink">
              {`PDF ready · ${images.length} ${images.length === 1 ? 'page' : 'pages'}`}
            </p>
            <p className="tabular mt-1 text-sm text-ink-faint">
              {formatBytes(result.blob.size)}
            </p>

            <button
              type="button"
              onClick={() => downloadResult(result)}
              className="mt-6 w-full rounded-full bg-accent px-5 py-3 text-ui font-medium text-white transition-transform duration-150 hover:scale-[1.01] active:scale-[0.99]"
            >
              Download PDF
            </button>
            <button
              type="button"
              onClick={startOver}
              className="mt-3 text-sm text-ink-faint transition-colors duration-150 hover:text-ink"
            >
              Start over
            </button>
          </div>
        ) : (
          <>
            {images.length > 0 && (
              <ul className="space-y-2">
                {images.map((image, index) => (
                  <li
                    key={`${image.file.name}-${index}`}
                    className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3"
                  >
                    <img
                      src={image.previewUrl}
                      alt={image.file.name}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-ui text-ink">
                        {image.file.name}
                      </span>
                      <span className="tabular block text-sm text-ink-faint">
                        {`Page ${index + 1} · ${image.width} × ${image.height}`}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => removeAt(index)}
                      aria-label={`Remove ${image.file.name}`}
                      className="rounded-full px-2.5 py-1 text-sm text-ink-faint transition-colors duration-150 hover:bg-canvas hover:text-ink"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <Dropzone onFiles={addFiles} multiple />
            {error && <ErrorNote>{error}</ErrorNote>}

            {images.length > 0 ? (
              <ActionButton busy={busy} onClick={createPdf}>
                {`Create PDF (${images.length} ${images.length === 1 ? 'page' : 'pages'})`}
              </ActionButton>
            ) : (
              <p className="text-center text-xs text-ink-faint">{PRIVACY_LINE}</p>
            )}
          </>
        )}
      </div>

      <ToolContent tool={tool} />
      <RelatedTools tool={tool} />
    </div>
  );
}
