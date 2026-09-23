import { screen, waitFor } from '@testing-library/react';
import { TOOLS, headingFor } from '@/tools/registry';
import { installCanvasStubs, type CanvasStub } from '@/test/canvas';
import { renderTool } from '@/test/tool';

let canvas: CanvasStub;

beforeEach(() => {
  canvas = installCanvasStubs();
});

afterEach(() => canvas.restore());

describe('tool routing', () => {
  test.each(TOOLS.map((tool) => [tool.slug, headingFor(tool)] as const))(
    '/%s renders a working tool page',
    (slug, heading) => {
      renderTool(slug);

      // The h1 must match the search intent the page is built for, not a
      // generic tool name, or the landing page fails the visitor arriving
      // from a very specific query.
      expect(
        screen.getByRole('heading', { level: 1, name: heading }),
      ).toBeInTheDocument();

      // Every tool must be usable, not a placeholder.
      expect(screen.queryByText(/coming next/i)).not.toBeInTheDocument();
      expect(
        screen.getByLabelText(/^Choose images?$/),
      ).toBeInTheDocument();
    },
  );

  test('an unknown slug shows a not-found page with a way back', () => {
    renderTool('does-not-exist');

    expect(
      screen.getByRole('heading', { level: 1, name: /tool not found/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to all tools/i })).toBeInTheDocument();
  });

  test('an unknown slug is marked noindex', async () => {
    renderTool('does-not-exist');

    await waitFor(() =>
      expect(
        document.head
          .querySelector('meta[name="robots"]')
          ?.getAttribute('content'),
      ).toBe('noindex'),
    );
  });

  test.each(
    TOOLS.map((tool) => [tool.slug, tool.seo.title, tool.seo.description] as const),
  )('/%s serves its own title and description', async (slug, title, description) => {
    renderTool(slug);

    // Without this, all 25+ URLs would share the index.html metadata and
    // compete as duplicates of one another.
    await waitFor(() => expect(document.title).toBe(title));
    expect(
      document.head.querySelector('meta[name="description"]')?.getAttribute('content'),
    ).toBe(description);
    expect(
      document.head.querySelector('link[rel="canonical"]')?.getAttribute('href'),
    ).toBe(`https://imageutility.app/${slug}`);
  });
});
