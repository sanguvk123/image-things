/// <reference lib="webworker" />

/**
 * The pixel worker.
 *
 * Deliberately thin: it receives a job, runs the same `executeJob` the main
 * thread would have run, and posts the result back. All the actual image logic
 * stays in sharpen.ts and background.ts, where it is unit tested without a
 * worker in the picture.
 *
 * Nothing here touches the network. The image data arrives by structured
 * clone from the page and leaves the same way -- the privacy guarantee is
 * unchanged by moving the work to another thread.
 */

import { executeJob, type JobRequest, type JobResponse } from './jobs';

self.onmessage = async (event: MessageEvent<JobRequest>) => {
  const { id, job } = event.data;

  try {
    const pixels = await executeJob(job);
    const response: JobResponse = { id, ok: true, pixels };
    // Transfer the buffer rather than copying it. At 24 MP that is 96 MB the
    // browser does not have to duplicate on the way back.
    (self as unknown as Worker).postMessage(response, [pixels.buffer]);
  } catch (error) {
    const response: JobResponse = {
      id,
      ok: false,
      message: error instanceof Error ? error.message : 'Pixel job failed',
    };
    (self as unknown as Worker).postMessage(response);
  }
};
