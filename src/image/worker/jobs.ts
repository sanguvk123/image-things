/**
 * The contract between the page and the pixel worker.
 *
 * Kept in its own module with no DOM imports so both sides can use it: the
 * worker has no `window`, and importing anything that touches it would break
 * the worker build.
 */

export interface SharpenJob {
  kind: 'sharpen';
  pixels: Uint8ClampedArray;
  width: number;
  height: number;
  amount: number;
}

export interface RemoveBackgroundJob {
  kind: 'removeBackground';
  pixels: Uint8ClampedArray;
  width: number;
  height: number;
  tolerance: number;
}

export type PixelJob = SharpenJob | RemoveBackgroundJob;

export interface JobRequest {
  id: number;
  job: PixelJob;
}

export type JobResponse =
  | { id: number; ok: true; pixels: Uint8ClampedArray }
  | { id: number; ok: false; message: string };

/**
 * Runs a job in the current thread.
 *
 * Shared by the worker and by the fallback path, so there is exactly one
 * implementation of "what this job means" -- two would eventually disagree,
 * and the disagreement would show up as a subtly different image depending on
 * whether the browser supported Workers.
 */
export async function executeJob(job: PixelJob): Promise<Uint8ClampedArray> {
  switch (job.kind) {
    case 'sharpen': {
      const { sharpenPixels } = await import('../sharpen');
      return sharpenPixels(job.pixels, job.width, job.height, job.amount);
    }
    case 'removeBackground': {
      const { removeBackgroundPixels } = await import('../background');
      return removeBackgroundPixels(job.pixels, job.width, job.height, {
        tolerance: job.tolerance,
      });
    }
    default: {
      // Exhaustiveness: a new job kind must be handled here, not silently
      // returned unchanged.
      const unknown = job as { kind: string };
      throw new Error(`Unknown pixel job: ${unknown.kind}`);
    }
  }
}
