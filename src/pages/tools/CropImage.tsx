import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ToolContent } from '@/components/ToolContent';
import { RelatedTools } from '@/components/ToolLayout';
import { Dropzone } from '@/components/Dropzone';
import { ResultPanel } from '@/components/ResultPanel';
import {
  ActionButton,
  ErrorNote,
  Pill,
  PillGroup,
  PRIVACY_LINE,
} from '@/components/controls';
import { useImageTool } from '@/image/useImageTool';
import { cropImage } from '@/image/operations';
import {
  ASPECT_RATIOS,
  centeredRect,
  moveRect,
  toPixels,
  type AspectRatio,
  type CropRect,
} from '@/image/crop';
import { headingFor, type Tool } from '@/tools/registry';

/**
 * Crop (spec §20): a simple visual crop, explicitly not a Photoshop editor.
 *
 * The selection is dragged as a whole and sized by aspect ratio presets. That
 * covers what people actually come here to do — "make this square", "crop the
 * edges off" — without corner-handle complexity.
 */
export function CropImage({ tool }: { tool: Tool }) {
  const { image, result, busy, error, selectFile, run, reset } = useImageTool();
  const [ratio, setRatio] = useState<AspectRatio>(null);
  const [rect, setRect] = useState<CropRect>({
    x: 0.1,
    y: 0.1,
    width: 0.8,
    height: 0.8,
  });

  const frameRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ pointerId: number; startX: number; startY: number } | null>(
    null,
  );

  // Reset the selection whenever the image or the chosen ratio changes.
  useEffect(() => {
    if (!image) return;
    setRect(centeredRect(ratio, image.width / image.height));
  }, [image, ratio]);

  function startDrag(event: React.PointerEvent) {
    const frame = frameRef.current;
    if (!frame) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
    };
  }

  function onDrag(event: React.PointerEvent) {
    const frame = frameRef.current;
    const state = drag.current;
    if (!frame || !state || state.pointerId !== event.pointerId) return;

    const bounds = frame.getBoundingClientRect();
    if (bounds.width === 0 || bounds.height === 0) return;

    // Convert the pointer movement into the crop's normalised space.
    const dx = (event.clientX - state.startX) / bounds.width;
    const dy = (event.clientY - state.startY) / bounds.height;

    setRect((current) => moveRect(current, dx, dy));
    state.startX = event.clientX;
    state.startY = event.clientY;
  }

  function endDrag(event: React.PointerEvent) {
    if (drag.current?.pointerId === event.pointerId) drag.current = null;
  }

  function startOver() {
    setRatio(null);
    reset();
  }

  const pixels = image ? toPixels(rect, image.width, image.height) : null;

  return (
    <div className="mx-auto max-w-2xl px-6 pt-12 pb-24">
      <Link
        to="/"
        className="text-sm text-ink-faint transition-colors duration-150 hover:text-ink"
      >
        ← All tools
      </Link>

      <h1 className="mt-5 text-3xl font-semibold tracking-[-0.025em] text-ink">
        {headingFor(tool)}
      </h1>
      <p className="mt-2 text-ink-soft">{tool.description}</p>

      <div className="mt-8">
        {result ? (
          <ResultPanel
            result={result}
            originalBytes={image?.file.size ?? 0}
            onStartOver={startOver}
            hideSavings
          />
        ) : image ? (
          <div className="space-y-7">
            <div
              ref={frameRef}
              className="relative overflow-hidden rounded-2xl border border-line bg-surface select-none"
            >
              <img
                src={image.previewUrl}
                alt={image.file.name}
                draggable={false}
                className="block max-h-[420px] w-full object-contain"
              />

              {/* Dim everything outside the selection so the crop reads clearly. */}
              <div
                className="pointer-events-none absolute inset-0 bg-black/45"
                style={{
                  clipPath: `polygon(0% 0%, 0% 100%, ${pct(rect.x)} 100%, ${pct(rect.x)} ${pct(rect.y)}, ${pct(rect.x + rect.width)} ${pct(rect.y)}, ${pct(rect.x + rect.width)} ${pct(rect.y + rect.height)}, ${pct(rect.x)} ${pct(rect.y + rect.height)}, ${pct(rect.x)} 100%, 100% 100%, 100% 0%)`,
                }}
              />

              <div
                role="application"
                aria-label="Crop selection"
                onPointerDown={startDrag}
                onPointerMove={onDrag}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                className="absolute cursor-move border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.25)]"
                style={{
                  left: pct(rect.x),
                  top: pct(rect.y),
                  width: pct(rect.width),
                  height: pct(rect.height),
                }}
              >
                <Corner className="-top-1 -left-1" />
                <Corner className="-top-1 -right-1" />
                <Corner className="-bottom-1 -left-1" />
                <Corner className="-right-1 -bottom-1" />
              </div>
            </div>

            <div className="flex items-baseline justify-between">
              <p className="truncate text-[15px] text-ink">{image.file.name}</p>
              {pixels && (
                <p className="tabular text-sm text-ink-faint">
                  {`${pixels.width} × ${pixels.height}`}
                </p>
              )}
            </div>

            {error && <ErrorNote>{error}</ErrorNote>}

            <PillGroup legend="Aspect ratio">
              {ASPECT_RATIOS.map((option) => (
                <Pill
                  key={option.label}
                  selected={ratio === option.value}
                  onClick={() => setRatio(option.value)}
                >
                  {option.label}
                </Pill>
              ))}
            </PillGroup>

            <ActionButton
              busy={busy}
              onClick={() =>
                run((img) => cropImage(img, toPixels(rect, img.width, img.height)))
              }
            >
              Crop Image
            </ActionButton>

            <button
              type="button"
              onClick={startOver}
              className="w-full text-sm text-ink-faint transition-colors duration-150 hover:text-ink"
            >
              Remove ×
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <Dropzone onFiles={(files) => files[0] && selectFile(files[0])} />
            {error && <ErrorNote>{error}</ErrorNote>}
            <p className="text-center text-xs text-ink-faint">{PRIVACY_LINE}</p>
          </div>
        )}
      </div>

      <ToolContent tool={tool} />
      <RelatedTools tool={tool} />
    </div>
  );
}

const pct = (value: number) => `${value * 100}%`;

function Corner({ className }: { className: string }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute h-2.5 w-2.5 rounded-[2px] bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.25)] ${className}`}
    />
  );
}
