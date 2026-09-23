import { useState } from 'react';
import { ToolLayout } from '@/components/ToolLayout';
import { ActionButton, Pill, PillGroup } from '@/components/controls';
import { useImageTool } from '@/image/useImageTool';
import { upscaleImage, type UpscaleFactor } from '@/image/operations';
import type { Tool } from '@/tools/registry';

const FACTORS: UpscaleFactor[] = [2, 3, 4];

export function UpscaleImage({ tool }: { tool: Tool }) {
  const { image, result, busy, error, selectFile, run, reset } = useImageTool();
  const [factor, setFactor] = useState<UpscaleFactor>(2);

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
      <PillGroup legend="Size">
        {FACTORS.map((value) => (
          <Pill
            key={value}
            selected={factor === value}
            onClick={() => setFactor(value)}
          >
            {`${value}×`}
          </Pill>
        ))}
      </PillGroup>

      {image && (
        <p className="tabular text-sm text-ink-faint">
          {`${image.width} × ${image.height} → ${image.width * factor} × ${image.height * factor}`}
        </p>
      )}

      <ActionButton busy={busy} onClick={() => run((img) => upscaleImage(img, factor))}>
        Upscale Image
      </ActionButton>
    </ToolLayout>
  );
}
