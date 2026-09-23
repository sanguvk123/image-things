import type { ReactNode } from 'react';

/**
 * The shared control vocabulary. Every tool is built from these so the
 * platform reads as one product rather than twenty separate utilities.
 */

export function ActionButton({
  children,
  onClick,
  busy = false,
  disabled = false,
}: {
  children: ReactNode;
  onClick: () => void;
  busy?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy || disabled}
      aria-busy={busy}
      className="w-full rounded-full bg-accent px-5 py-3 text-[15px] font-medium text-white transition-all duration-150 hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:scale-100"
    >
      {busy ? 'Working…' : children}
    </button>
  );
}

export interface Option<T extends string> {
  value: T;
  label: string;
  description?: string;
}

/**
 * The stacked option cards from the spec (§15): a plain-language choice
 * instead of codec settings.
 */
export function OptionCards<T extends string>({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-[13px] font-medium tracking-wide text-ink-faint uppercase">
        {legend}
      </legend>

      <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
        {options.map((option) => {
          const selected = option.value === value;
          const descriptionId = `${legend}-${option.value}-description`;
          return (
            <label
              key={option.value}
              className={`flex cursor-pointer items-start gap-3 px-4 py-3.5 transition-colors duration-150 ${
                selected ? 'bg-accent-soft' : 'hover:bg-canvas'
              }`}
            >
              <input
                type="radio"
                name={legend}
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                // The description is referenced rather than nested so each
                // option's accessible name stays exactly its label. Otherwise
                // "Smaller" and "…smaller file" become indistinguishable.
                aria-label={option.label}
                aria-describedby={option.description ? descriptionId : undefined}
                className="mt-1 accent-[#0a84ff]"
              />
              <span>
                <span className="block text-[15px] text-ink">{option.label}</span>
                {option.description && (
                  <span id={descriptionId} className="block text-sm text-ink-faint">
                    {option.description}
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/** A row of small pill buttons, used for presets and quick sizes. */
export function PillGroup({
  legend,
  children,
}: {
  legend: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-[13px] font-medium tracking-wide text-ink-faint uppercase">
        {legend}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export function Pill({
  children,
  onClick,
  selected = false,
  label,
}: {
  children: ReactNode;
  onClick: () => void;
  selected?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={label}
      className={`tabular rounded-full border px-3.5 py-1.5 text-sm transition-all duration-150 ${
        selected
          ? 'border-accent bg-accent-soft text-accent'
          : 'border-line bg-surface text-ink hover:border-line-strong'
      }`}
    >
      {children}
    </button>
  );
}

/** A labelled slider with a live numeric readout (spec §23–25, §28). */
export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  suffix = '',
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <label
          htmlFor={`slider-${label}`}
          className="text-[13px] font-medium tracking-wide text-ink-faint uppercase"
        >
          {label}
        </label>
        <span className="tabular text-sm text-ink-soft">
          {value}
          {suffix}
        </span>
      </div>
      <input
        id={`slider-${label}`}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-[#0a84ff]"
      />
    </div>
  );
}

/**
 * The one-line reassurance shown under every upload control.
 *
 * "Secure" used to sit in the middle of this line. It is the kind of word
 * every site claims and none can be held to, and it was doing the weakest
 * work in a sentence whose other two parts are literally verifiable. What is
 * actually distinctive here is that the file never leaves the device, so the
 * line says that instead.
 *
 * Exported because the same string appeared in four files and had to stay
 * identical in all of them.
 */
export const PRIVACY_LINE = 'Private • Runs in your browser • No signup';

export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="text-sm text-[#c0392b]">
      {children}
    </p>
  );
}
