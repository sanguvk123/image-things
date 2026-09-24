import { ToolLayout } from '@/components/ToolLayout';
import { ActionButton } from '@/components/controls';
import { useImageTool } from '@/image/useImageTool';
import { convertImage } from '@/image/operations';
import { formatLabel } from '@/image/format';
import type { Tool } from '@/tools/registry';

/**
 * Format conversion (spec §30).
 *
 * One component serves every conversion tool — the direction comes from the
 * registry, so adding "AVIF → JPG" later is a data change, not a code change.
 */
export function ConvertImage({ tool }: { tool: Tool }) {
  const { image, result, busy, error, selectFile, run, reset } = useImageTool();

  // Every tool routed here declares a conversion; this keeps TypeScript happy
  // and fails loudly in development if the registry and router disagree.
  if (!tool.convert) throw new Error(`${tool.slug} has no conversion configured`);
  const { fromLabel, to } = tool.convert;
  const outputLabel = formatLabel(to);

  return (
    <ToolLayout
      tool={tool}
      image={image}
      result={result}
      error={error}
      onSelectFile={selectFile}
      onReset={reset}
      acceptHint={`${fromLabel} • or any image`}
      hideSavings
    >
      <div>
        <p className="mb-2 text-meta font-medium tracking-wide text-ink-faint uppercase">
          Output
        </p>
        <p className="rounded-2xl border border-line bg-surface px-4 py-3 text-ui text-ink">
          {outputLabel}
        </p>
      </div>

      <ActionButton busy={busy} onClick={() => run((img) => convertImage(img, to))}>
        {`Convert to ${outputLabel}`}
      </ActionButton>
    </ToolLayout>
  );
}
