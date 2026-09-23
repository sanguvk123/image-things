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

  return (
    <div className="rounded-2xl border border-line bg-surface p-6">
      <div className="flex items-center justify-center overflow-hidden rounded-xl bg-canvas p-3">
        <img
          src={result.url}
          alt="Result"
          className="max-h-[320px] w-auto max-w-full rounded-lg object-contain"
        />
      </div>

      <div className="mt-5 text-center">
        {/* One string per line so the summary reads as a sentence, not as
            disconnected fragments, to both users and assistive tech. */}
        <p className="tabular text-lg text-ink">
          {hideSavings
            ? `${result.width} × ${result.height} · ${formatBytes(result.blob.size)}`
            : `${formatBytes(originalBytes)} → ${formatBytes(result.blob.size)}`}
        </p>

        {note ? (
          <p className="mt-1.5 text-sm text-good">{note}</p>
        ) : (
          !hideSavings &&
          saved > 0 && (
            <p className="mt-1.5 text-sm text-good">{saved}% smaller</p>
          )
        )}
      </div>

      <div className="mt-6 flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => downloadResult(result)}
          className="w-full rounded-full bg-accent px-5 py-3 text-[15px] font-medium text-white transition-transform duration-150 hover:scale-[1.01] active:scale-[0.99]"
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
