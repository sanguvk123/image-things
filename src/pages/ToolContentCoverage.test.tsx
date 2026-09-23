import { screen } from '@testing-library/react';
import { TOOLS } from '@/tools/registry';
import { installCanvasStubs, type CanvasStub } from '@/test/canvas';
import { renderTool } from '@/test/tool';

let canvas: CanvasStub;

beforeEach(() => {
  canvas = installCanvasStubs();
});

afterEach(() => canvas.restore());

/**
 * Every page must carry its supporting content, not just the ones that happen
 * to use ToolLayout.
 *
 * Crop and the PDF tools render their own layouts, so wiring the content into
 * ToolLayout alone would silently leave them thin -- and a page-by-page check
 * would miss the next custom layout someone adds. Sweeping the registry is the
 * only version of this test that cannot rot.
 */
describe.each(TOOLS.map((tool) => [tool.slug] as const))(
  '/%s',
  (slug) => {
    test('has how-to steps, context and FAQs', () => {
      renderTool(slug);

      expect(
        screen.getByRole('heading', { name: /^how to/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: /frequently asked questions/i }),
      ).toBeInTheDocument();
      expect(
        document.querySelector('script[type="application/ld+json"]'),
      ).not.toBeNull();
    });

    test('has exactly one h1', () => {
      renderTool(slug);
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    });
  },
);
