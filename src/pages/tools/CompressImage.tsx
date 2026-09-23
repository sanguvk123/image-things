import { useState } from 'react';
import { ToolLayout } from '@/components/ToolLayout';
import { ActionButton, OptionCards, type Option } from '@/components/controls';
import { useImageTool } from '@/image/useImageTool';
import { compressImage, type CompressionLevel } from '@/image/operations';
import type { Tool } from '@/tools/registry';

const LEVELS: Option<CompressionLevel>[] = [
  {
    value: 'recommended',
    label: 'Recommended',
    description: 'Great quality / smaller file',
  },
  { value: 'smaller', label: 'Smaller', description: 'Prioritize file size' },
  { value: 'best', label: 'Best quality', description: 'Keep maximum quality' },
];

export function CompressImage({ tool }: { tool: Tool }) {
  const { image, result, busy, error, selectFile, run, reset } = useImageTool();
  const [level, setLevel] = useState<CompressionLevel>('recommended');

  return (
    <ToolLayout
      tool={tool}
      image={image}
      result={result}
      error={error}
      onSelectFile={selectFile}
      onReset={reset}
    >
      <OptionCards
        legend="Compression"
        options={LEVELS}
        value={level}
        onChange={setLevel}
      />

      <ActionButton busy={busy} onClick={() => run((img) => compressImage(img, level))}>
        Compress Image
      </ActionButton>
    </ToolLayout>
  );
}
