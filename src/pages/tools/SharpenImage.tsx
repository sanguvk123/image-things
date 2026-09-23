import { useState } from 'react';
import { ToolLayout } from '@/components/ToolLayout';
import { ActionButton, OptionCards, type Option } from '@/components/controls';
import { useImageTool } from '@/image/useImageTool';
import { sharpenImage } from '@/image/operations';
import type { SharpenLevel } from '@/image/sharpen';
import type { Tool } from '@/tools/registry';

const LEVELS: Option<SharpenLevel>[] = [
  { value: 'light', label: 'Light' },
  { value: 'recommended', label: 'Recommended' },
  { value: 'strong', label: 'Strong' },
];

/** Sharpen (spec §27): three strengths, Recommended by default. */
export function SharpenImage({ tool }: { tool: Tool }) {
  const { image, result, busy, error, selectFile, run, reset } = useImageTool();
  const [level, setLevel] = useState<SharpenLevel>('recommended');

  return (
    <ToolLayout
      tool={tool}
      image={image}
      result={result}
      error={error}
      onSelectFile={selectFile}
      onReset={reset}
      hideSavings
    >
      <OptionCards
        legend="Amount"
        options={LEVELS}
        value={level}
        onChange={setLevel}
      />

      <ActionButton busy={busy} onClick={() => run((img) => sharpenImage(img, level))}>
        Sharpen Image
      </ActionButton>
    </ToolLayout>
  );
}
