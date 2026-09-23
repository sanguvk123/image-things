import { useState } from 'react';
import { ToolLayout } from '@/components/ToolLayout';
import { ActionButton, Slider } from '@/components/controls';
import { useImageTool } from '@/image/useImageTool';
import { applyFilter } from '@/image/operations';
import {
  ADJUSTMENT_RANGE,
  filterFor,
  type AdjustmentKind,
} from '@/image/filters';
import type { Tool } from '@/tools/registry';

interface AdjustConfig {
  kind: AdjustmentKind;
  sliderLabel: string;
  actionLabel: string;
  /** Filename suffix, e.g. photo-brightened.jpg */
  suffix: string;
  /**
   * Where the slider starts.
   *
   * Directional pages need this: someone on /darken-image has already said
   * which way they want to go, so opening at 0 (no change) would make them
   * state their intent twice. Defaults to 0 for neutral pages.
   */
  defaultAmount?: number;
}

/**
 * The slider-and-preview adjustments (spec §23–25, §28).
 *
 * All of them are the same interaction: drag, watch the image change, apply.
 * One component keeps that promise identical across every tool.
 */
export function AdjustImage({
  tool,
  config,
}: {
  tool: Tool;
  config: AdjustConfig;
}) {
  const { image, result, busy, error, selectFile, run, reset } = useImageTool();
  const range = ADJUSTMENT_RANGE[config.kind as keyof typeof ADJUSTMENT_RANGE];
  const initialAmount = config.defaultAmount ?? 0;
  const [amount, setAmount] = useState(initialAmount);

  const filter = filterFor(config.kind, amount);

  function startOver() {
    setAmount(initialAmount);
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
      // Spec §23: "Use a live preview." Same filter string the canvas will use.
      previewFilter={filter ?? undefined}
    >
      <Slider
        label={config.sliderLabel}
        value={amount}
        min={range.min}
        max={range.max}
        step={range.step}
        suffix={range.suffix}
        onChange={setAmount}
      />

      <ActionButton
        busy={busy}
        disabled={!filter}
        onClick={() => filter && run((img) => applyFilter(img, filter, config.suffix))}
      >
        {config.actionLabel}
      </ActionButton>
    </ToolLayout>
  );
}

export function BrightenImage({ tool }: { tool: Tool }) {
  return (
    <AdjustImage
      tool={tool}
      config={{
        kind: 'brightness',
        sliderLabel: 'Brightness',
        actionLabel: 'Apply',
        suffix: 'brightened',
      }}
    />
  );
}

/**
 * The opposite intent to Brighten, so it opens already darkened. The slider
 * still spans the full range if the user overshoots.
 */
export function DarkenImage({ tool }: { tool: Tool }) {
  return (
    <AdjustImage
      tool={tool}
      config={{
        kind: 'brightness',
        sliderLabel: 'Brightness',
        actionLabel: 'Darken',
        suffix: 'darkened',
        defaultAmount: -25,
      }}
    />
  );
}

export function AdjustContrast({ tool }: { tool: Tool }) {
  return (
    <AdjustImage
      tool={tool}
      config={{
        kind: 'contrast',
        sliderLabel: 'Contrast',
        actionLabel: 'Apply',
        suffix: 'contrast',
      }}
    />
  );
}

export function IncreaseContrast({ tool }: { tool: Tool }) {
  return (
    <AdjustImage
      tool={tool}
      config={{
        kind: 'contrast',
        sliderLabel: 'Contrast',
        actionLabel: 'Increase Contrast',
        suffix: 'contrast',
        defaultAmount: 25,
      }}
    />
  );
}

export function AdjustSaturation({ tool }: { tool: Tool }) {
  return (
    <AdjustImage
      tool={tool}
      config={{
        kind: 'saturation',
        sliderLabel: 'Saturation',
        actionLabel: 'Apply',
        suffix: 'saturated',
      }}
    />
  );
}

export function BlurImage({ tool }: { tool: Tool }) {
  return (
    <AdjustImage
      tool={tool}
      config={{
        kind: 'blur',
        sliderLabel: 'Blur',
        actionLabel: 'Apply Blur',
        suffix: 'blurred',
      }}
    />
  );
}
