import { Link } from 'react-router-dom';
import { ToolSearch } from '@/components/ToolSearch';
import { DocumentHead } from '@/components/DocumentHead';
import { popularTools, type Tool } from '@/tools/registry';
import { HOME_META } from '@/tools/seo';

export function Home() {
  const tools = popularTools();

  return (
    <div className="mx-auto max-w-5xl px-6 pb-24">
      <DocumentHead {...HOME_META} />
      <section className="flex flex-col items-center pt-20 pb-14 text-center sm:pt-28">
        <h1 className="max-w-2xl text-4xl font-semibold tracking-[-0.03em] text-ink sm:text-5xl">
          Image tools that just work.
        </h1>
        <p className="mt-4 max-w-lg text-lg text-ink-soft">
          Resize, compress, convert, edit and optimize your images in seconds.
        </p>

        <div className="mt-9 flex w-full justify-center">
          <ToolSearch />
        </div>

        <p className="mt-4 text-[13px] text-ink-faint">
          Private • Secure • No signup
        </p>
      </section>

      <section aria-labelledby="popular-tools">
        <h2
          id="popular-tools"
          className="mb-4 text-[13px] font-medium tracking-wide text-ink-faint uppercase"
        >
          Popular tools
        </h2>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      </section>
    </div>
  );
}

function ToolCard({ tool }: { tool: Tool }) {
  return (
    <Link
      to={`/${tool.slug}`}
      className="group flex flex-col justify-between rounded-2xl border border-line bg-surface p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lg"
    >
      <div>
        <h3 className="text-[15px] font-medium text-ink">{tool.title}</h3>
        <p className="mt-1 text-sm text-ink-faint">{tool.tagline}</p>
      </div>
      <span
        aria-hidden="true"
        className="mt-8 self-end text-ink-faint transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-accent"
      >
        →
      </span>
    </Link>
  );
}
