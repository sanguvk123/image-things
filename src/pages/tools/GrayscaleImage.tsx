import { useState } from 'react';
import { ToolLayout } from '@/components/ToolLayout';
import { ActionButton } from '@/components/controls';
import { useImageTool } from '@/image/useImageTool';
import { applyFilter } from '@/image/operations';
import { grayscaleFilter } from '@/image/filters';
import type { Tool } from '@/tools/registry';

/**
 * Grayscale (spec §26): one click, no settings.
 *
 * Hovering the button previews the effect, so the user can see what they're
 * about to get without committing to it.
 */
export function GrayscaleImage({ tool }: { tool: Tool }) {
  const { image, result, busy, error, selectFile, run, reset } = useImageTool();
  const [previewing, setPreviewing] = useState(false);

  return (
    <ToolLayout
      tool={tool}
      image={image}
      result={result}
      error={error}
      onSelectFile={selectFile}
      onReset={reset}
      hideSavings
      previewFilter={previewing ? grayscaleFilter() : undefined}
    >
      <div
        onMouseEnter={() => setPreviewing(true)}
        onMouseLeave={() => setPreviewing(false)}
        onFocus={() => setPreviewing(true)}
        onBlur={() => setPreviewing(false)}
      >
        <ActionButton
          busy={busy}
          onClick={() =>
            run((img) => applyFilter(img, grayscaleFilter(), 'grayscale'))
          }
        >
          Convert to Grayscale
        </ActionButton>
      </div>
    </ToolLayout>
  );
}
