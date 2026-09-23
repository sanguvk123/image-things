import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { Home } from '@/pages/Home';
import { TOOLS } from '@/tools/registry';

export function App() {
  return (
    <BrowserRouter>
      <SiteHeader />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          {TOOLS.map((tool) => (
            <Route
              key={tool.slug}
              path={`/${tool.slug}`}
              element={<ToolPlaceholder title={tool.title} />}
            />
          ))}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

function SiteHeader() {
  return (
    <header className="border-b border-line bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center px-6 py-3.5">
        <Link
          to="/"
          className="text-[15px] font-medium tracking-[-0.01em] text-ink"
        >
          Image Tools
        </Link>
      </div>
    </header>
  );
}

/**
 * Temporary: tool pages are implemented one slice at a time. Until a tool has
 * its own page, routing to it still works and says so honestly.
 */
function ToolPlaceholder({ title }: { title: string }) {
  return (
    <div className="mx-auto max-w-xl px-6 py-24 text-center">
      <h1 className="text-3xl font-semibold tracking-[-0.02em] text-ink">
        {title}
      </h1>
      <p className="mt-3 text-ink-faint">This tool is coming next.</p>
    </div>
  );
}

function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-6 py-24 text-center">
      <h1 className="text-3xl font-semibold tracking-[-0.02em] text-ink">
        Tool not found
      </h1>
      <Link to="/" className="mt-4 inline-block text-accent">
        Back to all tools
      </Link>
    </div>
  );
}
