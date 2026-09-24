import { Link } from 'react-router-dom';
import { getTool, type Tool, type ToolCategory } from '@/tools/registry';
import { offerHandoff } from '@/image/handoff';
import type { ProcessedImage } from '@/image/pipeline';

/**
 * "Continue with this image" (review §15, brief §12).
 *
 * One task is rarely the whole job. Converting an iPhone photo is followed by
 * resizing it, which is followed by getting it under an upload limit, and
 * each of those steps currently means finding the file again -- now with a
 * name the user did not choose, in a downloads folder, on a phone.
 *
 * The result already holds everything the next tool needs, so it is handed
 * straight over. This is the step that turns a set of tools into a workflow,
 * without adding a workspace, a project, or an account.
 */

/**
 * What tends to follow what.
 *
 * Deliberately short lists rather than "every other tool": the point is a
 * next step someone can decide on immediately. Four links is a choice; forty
 * is the directory they already scrolled past.
 */
const NEXT_STEPS: Record<ToolCategory, string[]> = {
  optimize: ['resize-image', 'crop-image', 'jpg-to-png', 'remove-metadata'],
  convert: ['compress-image', 'resize-image', 'crop-image', 'remove-metadata'],
  transform: ['compress-image', 'jpg-to-png', 'remove-background', 'sharpen-image'],
  adjust: ['compress-image', 'crop-image', 'resize-image', 'jpg-to-png'],
  privacy: ['compress-image', 'resize-image', 'jpg-to-png', 'crop-image'],
};

/** The processed bytes as a file, so the next tool loads it like any upload. */
function resultAsFile(result: ProcessedImage): File {
  return new File([result.blob], result.fileName, { type: result.blob.type });
}

export function ContinueWith({
  tool,
  result,
}: {
  tool: Tool;
  result: ProcessedImage;
}) {
  const next = (NEXT_STEPS[tool.category] ?? [])
    .filter((slug) => slug !== tool.slug)
    .map((slug) => getTool(slug))
    .filter((candidate): candidate is Tool => Boolean(candidate))
    // An alias would send the user to the same UI under a different name.
    .filter((candidate) => candidate.slug !== tool.slug)
    .slice(0, 4);

  if (next.length === 0) return null;

  return (
    <section aria-labelledby="continue-with" className="mt-8">
      <h2 id="continue-with" className="text-sm font-medium text-ink-soft">
        Continue with this image
      </h2>

      <div className="mt-3 flex flex-wrap gap-2">
        {next.map((candidate) => (
          <Link
            key={candidate.slug}
            to={`/${candidate.slug}`}
            // Handed over on the way out, so the destination finds it already
            // waiting rather than showing an empty dropzone first.
            onClick={() => offerHandoff(resultAsFile(result))}
            className="rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm text-ink transition-colors duration-150 hover:border-accent/50 hover:text-accent"
          >
            {candidate.title}
          </Link>
        ))}
      </div>
    </section>
  );
}
