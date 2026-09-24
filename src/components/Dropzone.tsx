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
}: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
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
      const files = Array.from(event.clipboardData?.files ?? []).filter(
        looksLikeImage,
      );
      if (files.length === 0) return;
      event.preventDefault();
      onFiles(multiple ? files : files.slice(0, 1));
    }

    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [onFiles, multiple]);

  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    dragDepth.current = 0;
    setIsDragging(false);

    const files = Array.from(event.dataTransfer.files).filter(looksLikeImage);
    if (files.length > 0) onFiles(multiple ? files : files.slice(0, 1));
  }

  return (
    <div
      onDragEnter={(event) => {
        event.preventDefault();
        dragDepth.current += 1;
        setIsDragging(true);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={() => {
        dragDepth.current -= 1;
        if (dragDepth.current <= 0) setIsDragging(false);
      }}
      onDrop={handleDrop}
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-10 text-center transition-all duration-200 ${
        isDragging
          ? 'scale-[1.01] border-accent bg-accent-soft'
          : 'border-line-strong bg-surface hover:border-accent/50 hover:bg-accent-soft/30'
      }`}
    >
      <UploadIcon active={isDragging} />

      <p className="mt-3 text-ui text-ink">Drop image here</p>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="mt-3 rounded-full bg-gradient-to-r from-accent to-convert px-5 py-2.5 text-sm font-medium text-white shadow-[0_4px_14px_-4px_rgba(10,132,255,0.5)] transition-transform duration-150 hover:scale-[1.02] active:scale-[0.99]"
      >
        {multiple ? 'Choose images' : 'Choose image'}
      </button>

      <p className="mt-4 text-xs text-ink-faint">{hint}</p>
      {/*
        Naming the key teaches it (review §18). Someone who has just taken a
        screenshot is one keystroke from done -- but only if they know the
        keystroke is there.
      */}
      {/*
        Naming the key teaches it (review §18). Someone who has just taken a
        screenshot is one keystroke from done -- but only if they know the
        keystroke is there.
      */}
      <p className="mt-1 text-xs text-ink-faint">
        or paste an image with {shortcut}
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif,.tif,.tiff"
        multiple={multiple}
        aria-label={multiple ? 'Choose images' : 'Choose image'}
        className="hidden"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          if (files.length > 0) onFiles(files);
          // Reset so picking the same file twice still fires a change event.
          event.target.value = '';
        }}
      />
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
