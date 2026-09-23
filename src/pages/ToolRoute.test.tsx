import { screen } from '@testing-library/react';
import { TOOLS } from '@/tools/registry';
import { installCanvasStubs, type CanvasStub } from '@/test/canvas';
import { renderTool } from '@/test/tool';

let canvas: CanvasStub;

beforeEach(() => {
  canvas = installCanvasStubs();
});

afterEach(() => canvas.restore());

describe('tool routing', () => {
  test.each(TOOLS.map((tool) => [tool.slug, tool.title] as const))(
    '/%s renders a working tool page',
    (slug, title) => {
      renderTool(slug);

      expect(
        screen.getByRole('heading', { level: 1, name: title }),
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
