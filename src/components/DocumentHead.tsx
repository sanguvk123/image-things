import type { PageMeta } from '@/tools/seo';

/**
 * Per-route document metadata.
 *
 * React 19 hoists <title>, <meta> and <link> rendered anywhere in the tree
 * into <head>, and replaces them on navigation, so this needs no effects and
 * no external head library.
 *
 * Note this only covers client-side navigation. The metadata that crawlers
 * read on first load is baked into each page's HTML by the prerender step --
 * see scripts/prerender.mjs. Both read the same registry, so they cannot
 * disagree.
 */
export function DocumentHead({ title, description, canonical }: PageMeta) {
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />

      {/* Link previews in Slack, WhatsApp, iMessage and X. */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta name="twitter:card" content="summary" />
    </>
  );
}
