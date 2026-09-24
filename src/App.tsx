import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { Home } from '@/pages/Home';
import { ToolRoute } from '@/pages/ToolRoute';
import type { PageMap } from '@/pages/pageMap';

/**
 * Everything inside the router.
 *
 * Kept separate from <App> so the prerender step can mount the same tree
 * under a StaticRouter. The browser and the build therefore render the same
 * markup and cannot drift apart.
 */
export function AppRoutes({ pages }: { pages?: PageMap }) {
  return (
    <>
      <SiteHeader />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          {/* `pages` is only passed by the prerender, which needs eagerly
              imported components because it cannot wait on Suspense. */}
          <Route path="/:slug" element={<ToolRoute pages={pages} />} />
        </Routes>
      </main>
      <SiteFooter />
    </>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center px-5 py-3 sm:px-6">
        <Link
          to="/"
          className="flex items-center gap-2 text-ui font-semibold tracking-[-0.01em] text-ink"
        >
          <span
            aria-hidden="true"
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-optimize via-convert to-privacy text-white"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="4" />
              <circle cx="9" cy="9" r="1.6" />
              <path d="m4 17 5-5 5 5 2-2 4 4" />
            </svg>
          </span>
          Image Tools
        </Link>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="mt-4 border-t border-line bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-1 px-5 py-6 text-meta text-ink-faint sm:px-6">
        <p>
          Every tool runs entirely in your browser. Your images are never
          uploaded to a server.
        </p>
        <p>Free • No signup • No watermarks</p>
      </div>
    </footer>
  );
}
