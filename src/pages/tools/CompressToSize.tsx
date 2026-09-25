import { useState } from 'react';
import { ToolLayout } from '@/components/ToolLayout';
import { ActionButton, Pill, PillGroup } from '@/components/controls';
import { useImageTool } from '@/image/useImageTool';
import { compressToTargetSize } from '@/image/operations';
import { BYTES_PER_KB, formatBytes } from '@/image/format';
import type { Tool } from '@/tools/registry';

/** Quick presets so the common cases need no typing at all (spec §17). */
const PRESETS_KB = [50, 100, 200, 300, 500, 1000];

function sizeLabel(kb: number): string {
  return kb >= 1000 ? `${kb / 1000} MB` : `${kb} KB`;
}

export function CompressToSize({ tool }: { tool: Tool }) {
  const { image, result, busy, error, selectFile, run, reset } = useImageTool();
  // A tool like /compress-image-to-100kb arrives with its target already set.
  const [targetKB, setTargetKB] = useState<number>(tool.targetKB ?? 100);
  const [missedTarget, setMissedTarget] = useState(false);

  const targetBytes = Math.max(1, targetKB) * BYTES_PER_KB;

  async function compress() {
    await run(async (img) => {
      const { result: produced, metTarget } = await compressToTargetSize(
        img,
        targetBytes,
      );
      setMissedTarget(!metTarget);
      return produced;
    });
  }

  const note = result
    ? missedTarget
      ? `Smallest possible — ${formatBytes(targetBytes)} wasn't reachable`
      : `✓ Under ${formatBytes(targetBytes)}`
    : undefined;

  // Hitting an exact byte budget requires JPEG, so a PNG page has to say up
  // front that transparency will not survive. Better than a silent surprise
  // after the download.
  const transparencyWarning =
    tool.sourceLabel === 'PNG'
      ? 'Saved as JPG to reach this size. Transparent areas become white.'
      : undefined;

  return (
    <ToolLayout
      tool={tool}
      image={image}
      result={result}
      error={error}
      busy={busy}
      onSelectFile={selectFile}
      onReset={reset}
      resultNote={note}
    >
      {transparencyWarning && (
        <p className="text-sm text-ink-faint">{transparencyWarning}</p>
      )}

      <PillGroup legend="Target size">
        {PRESETS_KB.map((kb) => (
          <Pill
            key={kb}
            selected={targetKB === kb}
            onClick={() => setTargetKB(kb)}
            label={sizeLabel(kb)}
          >
            {sizeLabel(kb)}
          </Pill>
        ))}
      </PillGroup>

      <div>
        <label
          htmlFor="target-size"
          className="mb-2 block text-meta font-medium tracking-wide text-ink-faint uppercase"
        >
          Custom target
        </label>
        <div className="flex items-center gap-2">
          <input
            id="target-size"
            type="number"
            min={1}
            value={targetKB}
            onChange={(event) => setTargetKB(Number(event.target.value))}
            className="tabular w-32 rounded-xl border border-line bg-surface px-3 py-2 text-ui text-ink outline-none transition-colors duration-150 focus:border-accent"
          />
          <span className="text-sm text-ink-faint">KB</span>
        </div>
      </div>

      <ActionButton busy={busy} disabled={targetKB < 1} onClick={compress}>
        Compress
      </ActionButton>
    </ToolLayout>
  );
}
