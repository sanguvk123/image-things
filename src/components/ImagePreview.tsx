import { formatBytes, formatLabel } from '@/image/format';
import type { LoadedImage } from '@/image/pipeline';
import type { OutputFormat } from '@/tools/registry';

interface ImagePreviewProps {
  image: LoadedImage;
  onRemove: () => void;
  /** Optional live-preview source that replaces the original while adjusting. */
  overlayUrl?: string;
}

/**
 * The universal image preview (spec §14): always the real image, never a
 * generic file icon, with the facts the user needs directly underneath.
 */
export function ImagePreview({ image, onRemove, overlayUrl }: ImagePreviewProps) {
  const label = badgeFor(image.file.type);

  return (
    <div>
      <div className="flex items-center justify-center overflow-hidden rounded-2xl border border-line bg-[repeating-conic-gradient(#f4f4f6_0%_25%,#ffffff_0%_50%)] bg-[length:16px_16px] p-3">
        <img
          src={overlayUrl ?? image.previewUrl}
          alt={image.file.name}
          className="max-h-[420px] w-auto max-w-full rounded-lg object-contain"
        />
      </div>

      <div className="mt-3 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-[15px] text-ink">{image.file.name}</p>
          <p className="tabular mt-0.5 text-sm text-ink-faint">
            {formatBytes(image.file.size)} · {image.width} × {image.height}
            {label ? ` · ${label}` : ''}
          </p>
        </div>

        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 rounded-full px-2.5 py-1 text-sm text-ink-faint transition-colors duration-150 hover:bg-canvas hover:text-ink"
        >
          Remove ×
        </button>
      </div>
    </div>
  );
}

function badgeFor(mimeType: string): string {
  const subtype = mimeType.split('/')[1];
  if (!subtype) return '';
  if (subtype === 'jpeg' || subtype === 'png' || subtype === 'webp') {
    return formatLabel(subtype as OutputFormat);
  }
  return subtype.toUpperCase();
}
