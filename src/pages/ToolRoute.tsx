import { Suspense } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getTool, headingFor, type Tool } from '@/tools/registry';
import { toolMeta } from '@/tools/seo';
import { DocumentHead } from '@/components/DocumentHead';
import type { PageMap } from './pageMap';
import { LAZY_PAGES } from './pages';

export function ToolRoute({ pages = LAZY_PAGES }: { pages?: PageMap }) {
  const { slug = '' } = useParams();
  const tool = getTool(slug);

  if (!tool) return <NotFound />;

  const Page = pages[tool.slug];
  return (
    <>
      <DocumentHead {...toolMeta(tool)} />
      {/*
        The prerendered HTML is already in the DOM, so the fallback is only
        ever seen on a client-side navigation between tools -- and it is
        deliberately blank rather than a spinner, which would flash for the
        few milliseconds a chunk takes to arrive on a warm connection.
      */}
      {Page ? (
        <Suspense fallback={<ToolSkeleton tool={tool} />}>
          <Page tool={tool} />
        </Suspense>
      ) : (
        <ComingSoon tool={tool} />
      )}
    </>
  );
}

/**
 * Holds the page's shape while its chunk loads.
 *
 * Shows the real heading immediately, because that is known from the registry
 * without loading anything -- so a navigation never looks like a blank page.
 */
function ToolSkeleton({ tool }: { tool: Tool }) {
  return (
    <div className="mx-auto max-w-2xl px-5 pt-6 pb-16 sm:px-6">
      <h1 className="text-[1.75rem] leading-tight font-semibold tracking-[-0.025em] text-ink sm:text-3xl">
        {headingFor(tool)}
      </h1>
      <p className="mt-2 text-ui text-ink-soft">{tool.description}</p>
      <div
        className="mt-6 h-64 animate-pulse rounded-2xl bg-line/40"
        aria-hidden="true"
      />
    </div>
  );
}

function ComingSoon({ tool }: { tool: Tool }) {
  return (
    <div className="mx-auto max-w-xl px-6 py-24 text-center">
      <h1 className="text-3xl font-semibold tracking-[-0.02em] text-ink">
        {tool.title}
      </h1>
      <p className="mt-3 text-ink-faint">This tool is coming next.</p>
      <Link to="/" className="mt-5 inline-block text-sm text-accent">
        Back to all tools
      </Link>
    </div>
  );
}

function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-6 py-24 text-center">
      {/* noindex: an unknown slug must never enter the index as a real page. */}
      <title>Tool not found — Image Tools</title>
      <meta name="robots" content="noindex" />
      <h1 className="text-3xl font-semibold tracking-[-0.02em] text-ink">
        Tool not found
      </h1>
      <Link to="/" className="mt-4 inline-block text-accent">
        Back to all tools
      </Link>
    </div>
  );
}
