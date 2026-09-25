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
  // A page like /compress-image-without-losing-quality must open already set
  // to the promise its title makes.
  const [level, setLevel] = useState<CompressionLevel>(
    tool.defaultCompression ?? 'recommended',
  );

  return (
    <ToolLayout
      tool={tool}
      image={image}
      result={result}
      error={error}
      busy={busy}
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
        {tool.sourceLabel ? `Compress ${tool.sourceLabel}` : 'Compress Image'}
      </ActionButton>
    </ToolLayout>
  );
}
