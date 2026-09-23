import { useEffect, useRef, useState } from 'react';

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
  hint = 'JPG • PNG • WebP • HEIC',
  multiple = false,
}: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // Drag events fire for every child element; counting keeps the highlight
  // from flickering as the pointer moves across the zone's contents.
  const dragDepth = useRef(0);

  useEffect(() => {
    function onPaste(event: ClipboardEvent) {
      const files = Array.from(event.clipboardData?.files ?? []).filter((file) =>
        file.type.startsWith('image/'),
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

    const files = Array.from(event.dataTransfer.files).filter((file) =>
      file.type.startsWith('image/'),
    );
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
      className={`flex flex-col items-center justify-center rounded-3xl border border-dashed px-6 py-16 text-center transition-all duration-200 ${
        isDragging
          ? 'scale-[1.01] border-accent bg-accent-soft'
          : 'border-line-strong bg-surface'
      }`}
    >
      <UploadIcon active={isDragging} />

      <p className="mt-4 text-[15px] text-ink">Drop image here</p>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="mt-4 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-white transition-transform duration-150 hover:scale-[1.02] active:scale-[0.99]"
      >
        {multiple ? 'Choose images' : 'Choose image'}
      </button>

      <p className="mt-5 text-xs text-ink-faint">{hint}</p>
      <p className="mt-1 text-xs text-ink-faint">or paste from your clipboard</p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
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
      width="26"
      height="26"
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
