import { useState } from 'react';
import { ToolLayout } from '@/components/ToolLayout';
import { ActionButton } from '@/components/controls';
import { useImageTool } from '@/image/useImageTool';
import { flipImage } from '@/image/operations';
import type { Tool } from '@/tools/registry';

/** Flip (spec §22): two buttons, a live preview, and save. */
export function FlipImage({ tool }: { tool: Tool }) {
  const { image, result, busy, error, selectFile, run, reset } = useImageTool();
  const [horizontal, setHorizontal] = useState(false);
  const [vertical, setVertical] = useState(false);

  function startOver() {
    setHorizontal(false);
    setVertical(false);
    reset();
  }

  const transform =
    horizontal || vertical
      ? `scale(${horizontal ? -1 : 1}, ${vertical ? -1 : 1})`
      : undefined;

  return (
    <ToolLayout
      tool={tool}
      image={image}
      result={result}
      error={error}
      onSelectFile={selectFile}
      onReset={startOver}
      hideSavings
      previewTransform={transform}
    >
      <div className="flex justify-center gap-2">
        <ToggleButton
          selected={horizontal}
          onClick={() => setHorizontal((value) => !value)}
        >
          ↔ Horizontal
        </ToggleButton>
        <ToggleButton
          selected={vertical}
          onClick={() => setVertical((value) => !value)}
        >
          ↕ Vertical
        </ToggleButton>
      </div>

      <ActionButton
        busy={busy}
        disabled={!horizontal && !vertical}
        onClick={() => run((img) => flipImage(img, { horizontal, vertical }))}
      >
        Save Image
      </ActionButton>
    </ToolLayout>
  );
}

function ToggleButton({
  children,
  selected,
  onClick,
}: {
  children: React.ReactNode;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-xl border px-5 py-3 text-ui transition-all duration-150 active:scale-[0.98] ${
        selected
          ? 'border-accent bg-accent-soft text-accent'
          : 'border-line bg-surface text-ink hover:border-line-strong'
      }`}
    >
      {children}
    </button>
  );
}
