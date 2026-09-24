import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Dropzone } from '@/components/Dropzone';
import { ImagePreview } from '@/components/ImagePreview';
import { ToolPage } from '@/components/ToolLayout';
import { ErrorNote, PRIVACY_LINE } from '@/components/controls';
import { useImageTool } from '@/image/useImageTool';
import { readMetadata, type MetadataEntry } from '@/image/metadata';
import type { Tool } from '@/tools/registry';

/**
 * The EXIF viewer.
 *
 * A different intent from Remove Metadata: the question here is "what does
 * this photo say about me?", and the answer is the whole product. There is no
 * action button and nothing to download -- showing the data is the result,
 * so this uses its own layout rather than ToolLayout.
 */
export function ViewMetadata({ tool }: { tool: Tool }) {
  const { image, error, selectFile, reset } = useImageTool();
  const [entries, setEntries] = useState<MetadataEntry[] | null>(null);

  useEffect(() => {
    if (!image) {
      setEntries(null);
      return;
    }

    let active = true;
    readMetadata(image.file).then((found) => {
      if (active) setEntries(found);
    });
    return () => {
      active = false;
    };
  }, [image]);

  return (
    // The page already links to Remove Metadata beside the data itself, so it
    // is kept out of the related-tools list rather than appearing twice.
    <ToolPage tool={tool} contentExcludes={['remove-metadata']}>
      <div className="mt-6">
        {image ? (
          <div className="space-y-7">
            <ImagePreview image={image} onRemove={reset} />
            {error && <ErrorNote>{error}</ErrorNote>}
            <MetadataTable entries={entries} />
            <p className="text-center text-sm text-ink-faint">
              Want this gone?{' '}
              <Link to="/remove-metadata" className="text-accent">
                Remove metadata
              </Link>
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <Dropzone onFiles={(files) => files[0] && selectFile(files[0])} />
            {error && <ErrorNote>{error}</ErrorNote>}
            <p className="text-center text-xs text-ink-faint">{PRIVACY_LINE}</p>
          </div>
        )}
      </div>
    </ToolPage>
  );
}

function MetadataTable({ entries }: { entries: MetadataEntry[] | null }) {
  if (entries === null) {
    return <p className="text-sm text-ink-faint">Reading…</p>;
  }

  if (entries.length === 0) {
    return (
      <div>
        <p className="mb-2 text-meta font-medium tracking-wide text-ink-faint uppercase">
          Metadata
        </p>
        <p className="rounded-2xl border border-line bg-surface px-4 py-3 text-ui text-ink-soft">
          No metadata found. This image carries no camera, date or location
          information.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-2 text-meta font-medium tracking-wide text-ink-faint uppercase">
        Metadata found
      </p>
      <dl className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
        {entries.map((entry) => (
          <div
            key={entry.label}
            className="flex items-baseline justify-between gap-4 px-4 py-3"
          >
            <dt className="text-sm text-ink-faint">{entry.label}</dt>
            <dd className="tabular text-right text-ui text-ink">{entry.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
