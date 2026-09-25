/**
 * What the tool shows while an operation is running.
 *
 * Every operation here is indeterminate, and the UI says so rather than
 * inventing a number. A convolution over a pixel buffer has no natural
 * checkpoint to report from, and encoding is a single opaque call into the
 * browser; there is genuinely nothing to measure. A bar that advances on a
 * timer would be a lie about the one thing the user wants to know, and the
 * lie gets worse exactly when it matters most -- on the slow, large image
 * where the invented estimate drifts furthest from the truth.
 *
 * So: a moving indicator that conveys "running" and claims nothing else.
 * If an operation ever gains real progress, it should be given a determinate
 * bar with a real aria-valuenow, not this.
 *
 * This became worth building only after the Worker migration. Before that the
 * main thread was blocked for the whole operation, so an animation here would
 * have sat frozen -- a spinner that stops spinning is worse than no spinner,
 * because it reads as a crash. Now the work happens off-thread and this can
 * actually move.
 */

interface ProcessingStateProps {
  /** What is happening, in the tool's own words. */
  label: string;
  /**
   * Supplied only where the work can genuinely be abandoned. Cancellation
   * does not interrupt a pixel loop -- there is no yield point inside one --
   * it abandons the result, so the button is honest about stopping the wait
   * rather than promising to stop the work.
   */
  onCancel?: () => void;
}

export function ProcessingState({ label, onCancel }: ProcessingStateProps) {
  return (
    <div className="rounded-2xl border border-line bg-surface px-6 py-10">
      {/*
        role="status" is polite: it waits for a pause rather than interrupting.
        The controls are replaced in place with no navigation and no focus
        change, so without this a screen reader user presses the button and
        hears nothing at all.
      */}
      <div role="status" className="flex flex-col items-center text-center">
        <IndeterminateBar />

        <p className="mt-5 text-ui text-ink">{label}</p>

        {/*
          The moment a user most wonders whether their photo is being uploaded
          is the moment it appears to be "sending". Saying so here costs one
          line and answers the question before it is asked.
        */}
        <p className="mt-1.5 text-meta text-ink-faint">
          Processing locally in your browser
        </p>
      </div>

      {onCancel ? (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full px-4 py-2 text-meta text-ink-faint transition-colors duration-150 hover:bg-canvas hover:text-ink"
          >
            Cancel
          </button>
        </div>
      ) : null}
    </div>
  );
}

/**
 * A track with a segment sliding along it.
 *
 * Carries no role and no ARIA: it is decorative, and the surrounding
 * role="status" already announces the text. Marking it as a progressbar
 * would invite an aria-valuenow that does not exist.
 *
 * Under prefers-reduced-motion the slide is replaced by a gentle opacity
 * pulse -- still clearly "something is happening", without lateral movement
 * for users who asked not to see it. The animations are defined in index.css
 * because Tailwind has no arbitrary keyframe syntax.
 */
function IndeterminateBar() {
  return (
    <div
      aria-hidden="true"
      className="h-1 w-40 overflow-hidden rounded-full bg-canvas"
    >
      <div className="processing-bar h-full w-1/3 rounded-full bg-accent" />
    </div>
  );
}
