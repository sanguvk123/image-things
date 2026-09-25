/**
 * Runs pixel work off the main thread.
 *
 * Why: sharpening a 24 MP photo is a synchronous 232 ms loop. For that whole
 * time the page cannot paint, scroll or respond to a click -- a spinner added
 * to that state would itself be frozen. Moving the loop to a Worker is the
 * only way the UI stays alive, which is why this exists rather than a nicer
 * progress animation.
 *
 * Design notes:
 *
 * - One worker, created on first use and reused. These jobs are sequential
 *   from the user's point of view (you sharpen one image at a time), so a pool
 *   of several would add complexity and memory for no gain.
 * - Pixel buffers are transferred, not copied. A 24 MP RGBA image is 96 MB;
 *   copying it twice per operation would cost more than the work itself.
 *   Transferring neuters the sender's copy, so callers must hand over a buffer
 *   they no longer intend to read.
 * - If Workers are unavailable -- jsdom under test, or a locked-down browser --
 *   the same job runs inline. The result is identical because both paths call
 *   the same executeJob; only the thread differs.
 */

import { executeJob, type JobRequest, type JobResponse, type PixelJob } from './jobs';

export class JobCancelled extends Error {
  constructor() {
    super('The operation was cancelled.');
    this.name = 'JobCancelled';
  }
}

let worker: Worker | null = null;
let nextId = 1;
/** Resolvers for jobs currently in flight, keyed by request id. */
const pending = new Map<
  number,
  { resolve: (pixels: Uint8ClampedArray) => void; reject: (error: Error) => void }
>();

export function isWorkerSupported(): boolean {
  return typeof Worker !== 'undefined';
}

function ensureWorker(): Worker | null {
  if (!isWorkerSupported()) return null;
  if (worker) return worker;

  try {
    worker = new Worker(new URL('./pixels.worker.ts', import.meta.url), {
      type: 'module',
    });
  } catch {
    // Some environments expose Worker but refuse module workers or blob URLs.
    // Falling back inline is slower but correct, which is the right trade.
    worker = null;
    return null;
  }

  worker.onmessage = (event: MessageEvent<JobResponse>) => {
    const message = event.data;
    const waiting = pending.get(message.id);
    if (!waiting) return; // Cancelled before the answer arrived.
    pending.delete(message.id);
    if (message.ok) waiting.resolve(message.pixels);
    else waiting.reject(new Error(message.message));
  };

  worker.onerror = () => {
    // The worker died. Fail everything waiting on it rather than hanging, and
    // drop the reference so the next call starts a fresh one.
    for (const waiting of pending.values()) {
      waiting.reject(new Error('The image worker stopped unexpectedly.'));
    }
    pending.clear();
    worker?.terminate();
    worker = null;
  };

  return worker;
}

/**
 * Run a pixel job, off-thread when possible.
 *
 * `signal` cancels the wait. The worker cannot be interrupted mid-loop -- there
 * is no yield point inside a tight pixel loop -- so cancellation abandons the
 * result rather than stopping the work. That is honest: the promise rejects
 * immediately, the UI moves on, and the orphaned computation finishes unseen
 * on a thread nobody is watching.
 */
export async function runPixelJob(
  job: PixelJob,
  signal?: AbortSignal,
): Promise<Uint8ClampedArray> {
  if (signal?.aborted) throw new JobCancelled();

  const active = ensureWorker();

  if (!active) {
    // Inline path. Still yields once so a caller that just set a "working"
    // state gets one frame to paint it before the thread locks up.
    await new Promise((resolve) => setTimeout(resolve, 0));
    if (signal?.aborted) throw new JobCancelled();
    return executeJob(job);
  }

  const id = nextId;
  nextId += 1;

  return new Promise<Uint8ClampedArray>((resolve, reject) => {
    pending.set(id, { resolve, reject });

    const onAbort = () => {
      pending.delete(id);
      reject(new JobCancelled());
    };
    signal?.addEventListener('abort', onAbort, { once: true });

    const request: JobRequest = { id, job };
    try {
      active.postMessage(request, [job.pixels.buffer]);
    } catch (error) {
      pending.delete(id);
      reject(
        error instanceof Error ? error : new Error('Could not start the image worker.'),
      );
    }
  });
}

/** Test seam: drops the cached worker so the next call re-evaluates support. */
export function __resetPoolForTests(): void {
  worker?.terminate();
  worker = null;
  pending.clear();
  nextId = 1;
}
