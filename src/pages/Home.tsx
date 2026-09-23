import { Link } from 'react-router-dom';
import { ToolSearch } from '@/components/ToolSearch';
import { DocumentHead } from '@/components/DocumentHead';
import { ToolIcon, categoryStyle } from '@/components/ToolIcon';
import {
  CATEGORY_LABELS,
  popularTools,
  toolsByCategory,
  type Tool,
} from '@/tools/registry';
import { HOME_META } from '@/tools/seo';

export function Home() {
  const popular = popularTools();
  const groups = toolsByCategory();

  return (
    <div className="mx-auto max-w-6xl px-5 pb-20 sm:px-6">
      <DocumentHead {...HOME_META} />

      {/*
        The hero used to run pt-20/pb-14 with only a headline and a search box
        in it, which pushed every actual tool below the fold. It is now sized
        to leave the first row of tools visible on a laptop.
      */}
      <section className="flex flex-col items-center pt-10 pb-8 text-center sm:pt-14">
        <h1 className="max-w-3xl text-[2rem] leading-[1.1] font-semibold tracking-[-0.03em] text-ink sm:text-[2.75rem]">
          Image tools that{' '}
          <span className="bg-gradient-to-r from-optimize via-convert to-privacy bg-clip-text text-transparent">
            just work.
          </span>
        </h1>
        <p className="mt-3 max-w-xl text-[15px] text-ink-soft sm:text-base">
          Resize, compress, convert, edit and optimize your images in seconds.
        </p>

        <div className="mt-6 flex w-full justify-center">
          <ToolSearch />
        </div>

        <p className="mt-3 text-[13px] text-ink-faint">Private • Secure • No signup</p>
      </section>

      <section aria-labelledby="popular-tools" className="pb-10">
        <SectionHeading id="popular-tools">Popular tools</SectionHeading>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {popular.map((tool) => (
            <PopularCard key={tool.slug} tool={tool} />
          ))}
        </div>
      </section>

      {/*
        Every tool, grouped. Previously the homepage showed 8 of 63 and the
        rest were reachable only by search or by landing on them from Google.
      */}
      <section aria-labelledby="all-tools">
        <SectionHeading id="all-tools">All tools</SectionHeading>

        <div className="space-y-7">
          {groups.map(({ category, tools }) => {
            const style = categoryStyle(category);
            return (
              <div key={category}>
                <h3 className="mb-2.5 flex items-center gap-2 text-[13px] font-semibold text-ink">
                  <span className={`h-2 w-2 rounded-full ${style.tile} ring-2 ${style.text} ring-current/30`} />
                  {CATEGORY_LABELS[category]}
                  <span className="text-[12px] font-normal text-ink-faint">
                    {tools.length}
                  </span>
                </h3>

                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {tools.map((tool) => (
                    <CompactCard key={tool.slug} tool={tool} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function SectionHeading({ id, children }: { id: string; children: string }) {
  return (
    <h2
      id={id}
      className="mb-3 text-[12px] font-semibold tracking-[0.06em] text-ink-faint uppercase"
    >
      {children}
    </h2>
  );
}

function PopularCard({ tool }: { tool: Tool }) {
  const style = categoryStyle(tool.category);

  return (
    <Link
      to={`/${tool.slug}`}
      className={`group flex items-start gap-3 rounded-xl border border-line bg-surface p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_-8px_rgba(11,11,15,0.18)] ${style.ring}`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${style.tile} ${style.text}`}
      >
        <ToolIcon tool={tool} />
      </span>
      <span className="min-w-0">
        <span className="block text-[14px] font-medium text-ink">{tool.title}</span>
        <span className="mt-0.5 block truncate text-[13px] text-ink-faint">
          {tool.tagline}
        </span>
      </span>
    </Link>
  );
}

function CompactCard({ tool }: { tool: Tool }) {
  const style = categoryStyle(tool.category);

  return (
    <Link
      to={`/${tool.slug}`}
      className={`group flex items-center gap-2.5 rounded-lg border border-line bg-surface px-3 py-2.5 transition-all duration-150 hover:bg-canvas ${style.ring}`}
    >
      <span className={`shrink-0 ${style.text}`}>
        <ToolIcon tool={tool} className="h-[18px] w-[18px]" />
      </span>
      <span className="truncate text-[13.5px] text-ink">{tool.title}</span>
    </Link>
  );
}
