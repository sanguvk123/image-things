import { useCallback, useEffect, useRef, useState } from 'react';
import {
  loadImage,
  releaseImage,
  releaseResult,
  UnsupportedImageError,
  type LoadedImage,
  type ProcessedImage,
} from './pipeline';

/**
 * Shared state machine for every tool page.
 *
 * One image in, one action, one result out (spec §2). Centralising it here
 * means each tool file only has to describe its own operation, and object URLs
 * get revoked in exactly one place instead of twenty.
 */
export function useImageTool() {
  const [image, setImage] = useState<LoadedImage | null>(null);
  const [result, setResult] = useState<ProcessedImage | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs let cleanup and replacement release the previous objects without
  // making every caller thread the old value back in.
  const imageRef = useRef<LoadedImage | null>(null);
  const resultRef = useRef<ProcessedImage | null>(null);

  const clearResult = useCallback(() => {
    if (resultRef.current) releaseResult(resultRef.current);
    resultRef.current = null;
    setResult(null);
  }, []);

  const reset = useCallback(() => {
    clearResult();
    if (imageRef.current) releaseImage(imageRef.current);
    imageRef.current = null;
    setImage(null);
    setError(null);
  }, [clearResult]);

  // Release everything when the user navigates to another tool.
  useEffect(() => reset, [reset]);

  const selectFile = useCallback(
    async (file: File) => {
      clearResult();
      if (imageRef.current) releaseImage(imageRef.current);
      imageRef.current = null;
      setImage(null);
      setError(null);

      try {
        const loaded = await loadImage(file);
        imageRef.current = loaded;
        setImage(loaded);
      } catch (cause) {
        setError(
          cause instanceof UnsupportedImageError
            ? cause.message
            : 'Something went wrong opening that image.',
        );
      }
    },
    [clearResult],
  );

  /**
   * Run a tool's operation against the loaded image.
   *
   * Errors are surfaced as readable copy rather than thrown, because a failed
   * encode should never blank the page the user is standing on.
   */
  const run = useCallback(
    async (operation: (image: LoadedImage) => Promise<ProcessedImage>) => {
      const current = imageRef.current;
      if (!current) return;

      setBusy(true);
      setError(null);
      try {
        const produced = await operation(current);
        if (resultRef.current) releaseResult(resultRef.current);
        resultRef.current = produced;
        setResult(produced);
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : 'Something went wrong processing that image.',
        );
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  return { image, result, busy, error, selectFile, run, reset, clearResult };
}
