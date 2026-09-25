import { useEffect, useRef, useState } from 'react';

/** Extensions to trust when the browser reports no MIME type at all. */
const IMAGE_EXTENSIONS =
  /\.(jpe?g|png|gif|bmp|webp|avif|heic|heif|tiff?)$/i;

/**
 * Whether a dropped or pasted file looks like an image.
 *
 * file.type alone is not enough: browsers frequently report an empty type for
 * HEIC and TIFF, so filtering on it would silently reject the exact files the
 * HEIC and TIFF tools exist to handle.
 */
/**
 * Whether this looks like an Apple machine, for naming the paste shortcut.
 *
 * Guarded for the prerender, which has no navigator.
 */
function isApplePlatform(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
}

function looksLikeImage(file: File): boolean {
  if (file.type.startsWith('image/')) return true;
  return file.type === '' && IMAGE_EXTENSIONS.test(file.name);
}

interface DropzoneProps {
  onFiles: (files: File[]) => void;
  /** Formats line under the button, e.g. "JPG • PNG • WebP • HEIC". */
  hint?: string;
  multiple?: boolean;
  /**
   * Turns the whole area off while the tool is working.
   *
   * Without this the picker stays live during an operation, so a second file
   * can be chosen mid-run and the finishing operation overwrites it.
   */
  disabled?: boolean;
}

/**
 * The primary visual element of every tool page (spec §11).
 *
 * Accepts drag & drop, the file picker, and clipboard paste. Paste is the
 * quiet standout: screenshot, Cmd+V, done — no file picker at all (spec §13).
 */
export function Dropzone({
  onFiles,
  hint = 'JPG • PNG • WebP • HEIC • TIFF',
  multiple = false,
  disabled = false,
}: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  /**
   * The file we turned away, if any.
   *
   * Rejection used to be silent: drop a PDF and the page simply did nothing,
   * which is indistinguishable from a drop that missed the target or a page
   * that has hung. Naming the file makes clear which of the three happened.
   */
  const [rejected, setRejected] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /*
   * Resolved after mount rather than during render.
   *
   * The prerender has no navigator, so it always writes "Ctrl+V" into the
   * HTML. If the first client render disagreed -- as it would on a Mac --
   * that is a hydration mismatch on all 64 prerendered pages. Starting from
   * the same value the server produced and correcting it in an effect keeps
   * the two renders identical.
   */
  const [shortcut, setShortcut] = useState('Ctrl+V');
  useEffect(() => {
    if (isApplePlatform()) setShortcut('⌘V');
  }, []);
  // Drag events fire for every child element; counting keeps the highlight
  // from flickering as the pointer moves across the zone's contents.
  const dragDepth = useRef(0);

  useEffect(() => {
    function onPaste(event: ClipboardEvent) {
      if (disabled) return;
      const files = Array.from(event.clipboardData?.files ?? []).filter(
        looksLikeImage,
      );
      if (files.length === 0) return;
      event.preventDefault();
      setRejected(null);
      onFiles(multiple ? files : files.slice(0, 1));
    }

    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [onFiles, multiple, disabled]);

  /**
   * Take the images from a drop or a pick, and say so when there are none.
   *
   * Pasting deliberately does not report rejection: a paste carries whatever
   * happened to be on the clipboard and is often aimed at something else
   * entirely, so complaining about it would fire on ordinary text copying.
   * A drop or a pick, by contrast, is unambiguously aimed at this control.
   */
  function accept(candidates: File[]) {
    const files = candidates.filter(looksLikeImage);

    if (files.length === 0) {
      const first = candidates[0];
      setRejected(first ? first.name : 'That file');
      return;
    }

    setRejected(null);
    onFiles(multiple ? files : files.slice(0, 1));
  }

  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    dragDepth.current = 0;
    setIsDragging(false);
    if (disabled) return;

    accept(Array.from(event.dataTransfer.files));
  }

  const label = multiple ? 'Choose images' : 'Choose image';

  return (
    <div>
      <div
        data-testid="dropzone"
        onDragEnter={(event) => {
          event.preventDefault();
          if (disabled) return;
          dragDepth.current += 1;
          setIsDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => {
          dragDepth.current -= 1;
          if (dragDepth.current <= 0) setIsDragging(false);
        }}
        onDrop={handleDrop}
        /*
         * The upload area is the tool, so it is sized like the tool rather
         * than like a form field: taller than it was, and the first thing the
         * eye lands on after the heading.
         *
         * Not focusable and carrying no role. Everything it offers is also
         * offered by the button inside it, and a focus stop that duplicates
         * the next focus stop just makes the page longer to get through --
         * worse for the keyboard users it would appear to be helping.
         */
        className={`flex flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-14 text-center transition-all duration-200 sm:py-16 ${
          disabled
            ? 'cursor-not-allowed border-line bg-surface opacity-60'
            : isDragging
              ? 'scale-[1.01] border-accent bg-accent-soft'
              : rejected
                ? 'border-bad/60 bg-surface'
                : 'border-line-strong bg-surface hover:border-accent/50 hover:bg-accent-soft/30'
        }`}
      >
        <UploadIcon active={isDragging} />

        <p className="mt-4 text-lg font-medium text-ink">Drop image here</p>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className="mt-4 rounded-full bg-gradient-to-r from-accent to-convert px-6 py-3 text-ui font-medium text-white shadow-[0_4px_14px_-4px_rgba(10,132,255,0.5)] transition-transform duration-150 hover:scale-[1.02] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:scale-100"
        >
          {label}
        </button>

        {/*
          Naming the key teaches it (review §18). Someone who has just taken a
          screenshot is one keystroke from done -- but only if they know the
          keystroke is there.
        */}
        <p className="mt-5 text-meta text-ink-faint">
          Paste with {shortcut} • Drop • Browse
        </p>
        <p className="mt-1 text-meta text-ink-faint">{hint}</p>

        <input
          ref={inputRef}
          type="file"
          accept="image/*,.heic,.heif,.tif,.tiff"
          multiple={multiple}
          disabled={disabled}
          aria-label={label}
          className="hidden"
          onChange={(event) => {
            accept(Array.from(event.target.files ?? []));
            // Reset so picking the same file twice still fires a change event.
            event.target.value = '';
          }}
        />
      </div>

      {/*
        Sits outside the dashed area so it cannot be mistaken for part of the
        instructions, and carries role="alert" so it is announced rather than
        silently appearing below the fold.
      */}
      {rejected ? (
        <p role="alert" className="mt-3 text-center text-meta text-bad">
          {rejected} is not an image this tool can open. Try {hint}.
        </p>
      ) : null}
    </div>
  );
}

function UploadIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`transition-colors duration-200 ${
        active ? 'text-accent' : 'text-ink-faint'
      }`}
    >
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </svg>
  );
}
