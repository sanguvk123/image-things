import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { Home } from '@/pages/Home';
import { ToolRoute } from '@/pages/ToolRoute';

export function App() {
  return (
    <BrowserRouter>
      <SiteHeader />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/:slug" element={<ToolRoute />} />
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
