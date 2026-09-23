import { useEffect, useState } from 'react';
import { ToolLayout } from '@/components/ToolLayout';
import { ActionButton } from '@/components/controls';
import { useImageTool } from '@/image/useImageTool';
import { removeMetadata } from '@/image/operations';
import { detectMetadata, type MetadataCategory } from '@/image/metadata';
import type { Tool } from '@/tools/registry';

/**
 * Remove Metadata (spec §29).
 *
 * The tool names what it found before removing it. Telling the user their
 * photo carries GPS coordinates is most of the value here — the removal
 * itself is the easy part.
 */
export function RemoveMetadata({ tool }: { tool: Tool }) {
  const { image, result, busy, error, selectFile, run, reset } = useImageTool();
  const [found, setFound] = useState<MetadataCategory[] | null>(null);

  useEffect(() => {
    if (!image) {
      setFound(null);
      return;
    }

    let active = true;
    detectMetadata(image.file).then((categories) => {
      if (active) setFound(categories);
    });
    return () => {
      active = false;
    };
  }, [image]);

  return (
    <ToolLayout
      tool={tool}
      image={image}
      result={result}
      error={error}
      onSelectFile={selectFile}
      onReset={reset}
      hideSavings
      resultNote="✓ Metadata removed"
    >
      <div>
        <p className="mb-2 text-[13px] font-medium tracking-wide text-ink-faint uppercase">
          {found && found.length > 0 ? 'Metadata found' : 'Metadata'}
        </p>

        {found === null ? (
          <p className="text-sm text-ink-faint">Checking…</p>
        ) : found.length === 0 ? (
          <p className="rounded-2xl border border-line bg-surface px-4 py-3 text-[15px] text-ink-soft">
            No camera, location or device information found in this image.
          </p>
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
            {found.map((category) => (
              <li key={category} className="px-4 py-3 text-[15px] text-ink">
                {category}
              </li>
            ))}
          </ul>
        )}
      </div>

      <ActionButton busy={busy} onClick={() => run(removeMetadata)}>
        Remove Metadata
      </ActionButton>
    </ToolLayout>
  );
}
