import { useState } from 'react';
import { ToolLayout } from '@/components/ToolLayout';
import { ActionButton, Slider } from '@/components/controls';
import { useImageTool } from '@/image/useImageTool';
import { removeBackground } from '@/image/operations';
import type { Tool } from '@/tools/registry';

/**
 * Remove Background.
 *
 * Works by clearing the colour that surrounds the subject, so it is excellent
 * on plain backgrounds and limited on busy ones. The page says so up front —
 * setting the expectation costs one line and avoids a baffling result.
 */
export function RemoveBackground({ tool }: { tool: Tool }) {
  const { image, result, busy, error, selectFile, run, reset } = useImageTool();
  const [tolerance, setTolerance] = useState(20);

  return (
    <ToolLayout
      tool={tool}
      image={image}
      result={result}
      error={error}
      busy={busy}
      onSelectFile={selectFile}
      onReset={reset}
      hideSavings
      resultNote="✓ Background removed · saved as PNG"
    >
      <p className="text-sm text-ink-faint">
        Works best on photos with a plain, even background.
      </p>

      <Slider
        label="Tolerance"
        value={tolerance}
        min={1}
        max={100}
        suffix="%"
        onChange={setTolerance}
      />

      <ActionButton
        busy={busy}
        onClick={() => run((img) => removeBackground(img, tolerance))}
      >
        Remove Background
      </ActionButton>
    </ToolLayout>
  );
}
