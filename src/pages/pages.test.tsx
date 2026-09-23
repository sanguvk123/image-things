import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { TOOLS } from '@/tools/registry';
import { installCanvasStubs, type CanvasStub } from '@/test/canvas';
import { ToolRoute } from './ToolRoute';
import { LAZY_PAGES } from './pages';
import { EAGER_PAGES } from './pages.eager';

let canvas: CanvasStub;

beforeEach(() => {
  canvas = installCanvasStubs();
});

afterEach(() => canvas.restore());

describe('the page registry', () => {
  test('covers the same slugs whether eager or lazy', () => {
    // Two registries means two chances to forget a tool. They must agree.
    expect(Object.keys(LAZY_PAGES).sort()).toEqual(Object.keys(EAGER_PAGES).sort());
  });

  test('maps every implemented slug to a component', () => {
    for (const slug of Object.keys(EAGER_PAGES)) {
      expect(TOOLS.some((tool) => tool.slug === slug)).toBe(true);
    }
  });

  test('splits tools across several chunks rather than one', () => {
    // If every entry pointed at the same lazy component there would be no
    // splitting at all, just indirection.
    const distinct = new Set(Object.values(LAZY_PAGES));
    expect(distinct.size).toBeGreaterThan(10);
  });
});

describe('the eager registry used by the prerender', () => {
  // Why this matters: React.lazy suspends on its first render, and
  // renderToString emits the Suspense fallback rather than the page. A lazy
  // component reaching the prerender would turn a landing page into an empty
  // shell, and the build would report success.
  //
  // This is asserted structurally rather than by calling renderPath() here.
  // Under vitest, entry-prerender imports StaticRouter from `react-router`
  // while the app's <Link> uses `react-router-dom`; jsdom resolves those to
  // two module instances with two contexts, so the render throws for reasons
  // that have nothing to do with this code. The real build shares one
  // instance. scripts/verify-prerender.mjs checks the actual output.
  test('contains no lazy components', () => {
    for (const [slug, Page] of Object.entries(EAGER_PAGES)) {
      // A React.lazy component is an object with $$typeof lazy, not a function.
      expect(typeof Page, `${slug} is lazy in the eager map`).toBe('function');
    }
  });

  test('the lazy registry is genuinely lazy', () => {
    // The converse: if these were plain functions, nothing would be split.
    const lazyCount = Object.values(LAZY_PAGES).filter(
      (Page) => typeof Page !== 'function',
    ).length;
    expect(lazyCount).toBe(Object.keys(LAZY_PAGES).length);
  });
});

describe('the lazy path a real browser takes', () => {
  // renderTool() uses the eager map so hundreds of behavioural assertions do
  // not each have to await a chunk. That would leave the path users actually
  // get untested, so it is covered here instead.
  test('resolves the chunk and shows the tool', async () => {
    render(
      <MemoryRouter initialEntries={['/jpg-to-png']}>
        <Routes>
          <Route path="/:slug" element={<ToolRoute pages={LAZY_PAGES} />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('Drop image here')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: /convert jpg to png/i }),
    ).toBeInTheDocument();
  });

  test('shows the real heading while the chunk is still loading', async () => {
    // The slug is known from the registry without loading anything, so a
    // navigation should never flash a blank page.
    render(
      <MemoryRouter initialEntries={['/crop-image']}>
        <Routes>
          <Route path="/:slug" element={<ToolRoute pages={LAZY_PAGES} />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { level: 1, name: /crop image/i }),
    ).toBeInTheDocument();

    // And the tool still arrives.
    expect(await screen.findByText('Drop image here')).toBeInTheDocument();
  });
});
