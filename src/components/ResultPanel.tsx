import { formatBytes, percentSmaller } from '@/image/format';
import { downloadResult, type ProcessedImage } from '@/image/pipeline';

interface ResultPanelProps {
  result: ProcessedImage;
  originalBytes: number;
  onStartOver: () => void;
  /** Optional line such as "✓ Under 100KB". */
  note?: string;
  /** Set for tools where a size change isn't the point (rotate, crop, …). */
  hideSavings?: boolean;
}

/**
 * The end of every tool's one-action flow: what happened, and the download.
 */
export function ResultPanel({
  result,
  originalBytes,
  onStartOver,
  note,
  hideSavings = false,
}: ResultPanelProps) {
  const saved = percentSmaller(originalBytes, result.blob.size);
  const dimensions = `${result.width} × ${result.height}`;

  return (
    <div className="rounded-2xl border border-line bg-surface p-6">
      <div className="flex items-center justify-center overflow-hidden rounded-xl bg-canvas p-3">
        <img
          src={result.url}
          alt="Result"
          className="max-h-[320px] w-auto max-w-full rounded-lg object-contain"
        />
      </div>

      {/*
        The result replaces the controls in place, with no navigation and no
        focus change, so without a live region a screen reader user presses
        the button and hears nothing at all.

        role="status" is polite by default: it waits for a pause rather than
        cutting off whatever is being read. The whole summary is one region so
        it is announced as a single sentence instead of three fragments.
      */}
      <div role="status" className="mt-5 text-center">
        {/*
          Name the outcome (review §7). "120 KB -> 40 KB" states two facts and
          leaves the user to infer the important one: that it worked. Saying so
          costs one line and is the first thing both a reader and a screen
          reader reach.
        */}
        <p className="text-sm font-medium text-good">✓ Done</p>

        <p className="tabular mt-1 text-lg text-ink">
          {hideSavings
            ? `${dimensions} · ${formatBytes(result.blob.size)}`
            : `${formatBytes(originalBytes)} → ${formatBytes(result.blob.size)}`}
        </p>

        {/*
          Dimensions matter even when the size change is the headline: someone
          compressing for an upload limit needs to know the image was not
          quietly downscaled to get there.
        */}
        {!hideSavings && <p className="tabular mt-1 text-sm text-ink-faint">{dimensions}</p>}

        {note ? (
          <p className="mt-1.5 text-sm text-good">{note}</p>
        ) : (
          !hideSavings &&
          saved > 0 && (
            <p className="mt-1.5 text-sm text-good">{saved}% smaller</p>
          )
        )}

        <span className="sr-only">Ready to download.</span>
      </div>

      <div className="mt-6 flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => downloadResult(result)}
          className="w-full rounded-full bg-accent px-5 py-3 text-ui font-medium text-white transition-transform duration-150 hover:scale-[1.01] active:scale-[0.99]"
        >
          Download
        </button>
        <button
          type="button"
          onClick={onStartOver}
          className="text-sm text-ink-faint transition-colors duration-150 hover:text-ink"
        >
          Start over
        </button>
      </div>
    </div>
  );
}
