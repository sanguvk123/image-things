import { screen } from '@testing-library/react';
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
});
