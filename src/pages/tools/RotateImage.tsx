import { useState } from 'react';
import { ToolLayout } from '@/components/ToolLayout';
import { ActionButton } from '@/components/controls';
import { useImageTool } from '@/image/useImageTool';
import { rotateImage, type RotationDegrees } from '@/image/operations';
import type { Tool } from '@/tools/registry';

/**
 * Rotate (spec §21): "almost ridiculously simple".
 *
 * Turns accumulate in the preview via a CSS transform, so the user sees the
 * result instantly; the pixels are only rewritten when they save.
 */
export function RotateImage({ tool }: { tool: Tool }) {
  const { image, result, busy, error, selectFile, run, reset } = useImageTool();
  const [turns, setTurns] = useState(0);

  const degrees = (((turns % 4) + 4) % 4) * 90;

  function startOver() {
    setTurns(0);
    reset();
  }

  return (
    <ToolLayout
      tool={tool}
      image={image}
      result={result}
      error={error}
      onSelectFile={selectFile}
      onReset={startOver}
      hideSavings
      // Show the pending rotation immediately; pixels are only rewritten on save.
      previewTransform={degrees === 0 ? undefined : `rotate(${degrees}deg)`}
    >
      <div className="flex justify-center gap-2">
        <TurnButton label="Rotate left 90°" onClick={() => setTurns((t) => t - 1)}>
          ↶ 90°
        </TurnButton>
        <TurnButton label="Rotate right 90°" onClick={() => setTurns((t) => t + 1)}>
          ↷ 90°
        </TurnButton>
        <TurnButton label="Rotate 180°" onClick={() => setTurns((t) => t + 2)}>
          180°
        </TurnButton>
      </div>

      <p className="tabular text-center text-sm text-ink-faint">
        {degrees === 0 ? 'No rotation' : `Rotated ${degrees}°`}
      </p>

      <ActionButton
        busy={busy}
        disabled={degrees === 0}
        onClick={() => run((img) => rotateImage(img, degrees as RotationDegrees))}
      >
        Save Image
      </ActionButton>
    </ToolLayout>
  );
}

function TurnButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="rounded-xl border border-line bg-surface px-5 py-3 text-ui text-ink transition-all duration-150 hover:border-line-strong active:scale-[0.98]"
    >
      {children}
    </button>
  );
}
