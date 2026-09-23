import { useEffect, useState } from 'react';
import { ToolLayout } from '@/components/ToolLayout';
import { ActionButton, Pill, PillGroup } from '@/components/controls';
import { useImageTool } from '@/image/useImageTool';
import { resizeImage } from '@/image/operations';
import { matchAspectRatio } from '@/image/aspect';
import type { Tool } from '@/tools/registry';

const QUICK_SIZES = [
  { width: 1080, height: 1080 },
  { width: 1920, height: 1080 },
  { width: 1200, height: 630 },
];

export function ResizeImage({ tool }: { tool: Tool }) {
  const { image, result, busy, error, selectFile, run, reset } = useImageTool();
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [keepRatio, setKeepRatio] = useState(true);

  // Start from the image's own dimensions: the common case is a small tweak,
  // not typing two numbers from scratch.
  useEffect(() => {
    if (!image) return;
    setWidth(image.width);
    setHeight(image.height);
  }, [image]);

  function changeWidth(value: number) {
    if (!image || !keepRatio) {
      setWidth(value);
      return;
    }
    const next = matchAspectRatio({ width: value }, image.width, image.height);
    setWidth(value);
    setHeight(next.height);
  }

  function changeHeight(value: number) {
    if (!image || !keepRatio) {
      setHeight(value);
      return;
    }
    const next = matchAspectRatio({ height: value }, image.width, image.height);
    setHeight(value);
    setWidth(next.width);
  }

  const valid = width >= 1 && height >= 1;

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
      <div className="grid grid-cols-2 gap-3">
        <NumberField label="Width" value={width} onChange={changeWidth} />
        <NumberField label="Height" value={height} onChange={changeHeight} />
      </div>

      <label className="flex cursor-pointer items-center gap-2.5 text-[15px] text-ink">
        <input
          type="checkbox"
          checked={keepRatio}
          onChange={(event) => setKeepRatio(event.target.checked)}
          className="accent-[#0a84ff]"
        />
        Maintain aspect ratio
      </label>

      <PillGroup legend="Quick sizes">
        {QUICK_SIZES.map((size) => (
          <Pill
            key={`${size.width}x${size.height}`}
            selected={width === size.width && height === size.height}
            onClick={() => {
              setWidth(size.width);
              setHeight(size.height);
            }}
            label={`${size.width} × ${size.height}`}
          >
            {size.width} × {size.height}
          </Pill>
        ))}
      </PillGroup>

      <ActionButton
        busy={busy}
        disabled={!valid}
        onClick={() => run((img) => resizeImage(img, width, height))}
      >
        Resize Image
      </ActionButton>
    </ToolLayout>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <label
        htmlFor={`field-${label}`}
        className="mb-2 block text-[13px] font-medium tracking-wide text-ink-faint uppercase"
      >
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={`field-${label}`}
          type="number"
          min={1}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="tabular w-full rounded-xl border border-line bg-surface px-3 py-2 text-[15px] text-ink outline-none transition-colors duration-150 focus:border-accent"
        />
        <span className="text-sm text-ink-faint">px</span>
      </div>
    </div>
  );
}
