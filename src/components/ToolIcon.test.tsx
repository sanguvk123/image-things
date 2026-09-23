import { render } from '@testing-library/react';
import { ToolIcon, categoryStyle } from './ToolIcon';
import { TOOLS, type ToolCategory } from '@/tools/registry';

const CATEGORIES: ToolCategory[] = [
  'optimize',
  'convert',
  'transform',
  'adjust',
  'privacy',
];

describe('ToolIcon', () => {
  test('renders an icon for every tool in the registry', () => {
    // A missing icon would leave a blank tile in the grid, so this is checked
    // across the whole registry rather than a sample.
    for (const tool of TOOLS) {
      const { container, unmount } = render(<ToolIcon tool={tool} />);
      expect(container.querySelector('svg')).not.toBeNull();
      unmount();
    }
  });

  test('hides the icon from screen readers', () => {
    // The tool title sits next to it, so announcing the icon would just make
    // every card read twice.
    const { container } = render(<ToolIcon tool={TOOLS[0]} />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  test('gives tools in the same category the same icon tile colour', () => {
    const compress = TOOLS.find((t) => t.slug === 'compress-image')!;
    const compressJpg = TOOLS.find((t) => t.slug === 'compress-jpg')!;

    expect(categoryStyle(compress.category).tile).toBe(
      categoryStyle(compressJpg.category).tile,
    );
  });

  test('gives each category a visually distinct colour', () => {
    // Colour is meant to carry category meaning. If two categories shared a
    // tint, the grid would imply a grouping that does not exist.
    const tiles = CATEGORIES.map((category) => categoryStyle(category).tile);
    expect(new Set(tiles).size).toBe(CATEGORIES.length);
  });

  test('distinguishes tools within a category by shape', () => {
    // Colour alone is not a safe signal: colour-blind users and greyscale
    // printing both collapse it, so the glyph has to differ too.
    const resize = TOOLS.find((t) => t.slug === 'resize-image')!;
    const rotate = TOOLS.find((t) => t.slug === 'rotate-image')!;
    expect(resize.category).toBe(rotate.category);

    const a = render(<ToolIcon tool={resize} />);
    const pathsA = a.container.querySelector('svg')!.innerHTML;
    a.unmount();

    const b = render(<ToolIcon tool={rotate} />);
    const pathsB = b.container.querySelector('svg')!.innerHTML;
    b.unmount();

    expect(pathsA).not.toBe(pathsB);
  });

  test('falls back to the category glyph for a tool with no specific icon', () => {
    // Landing pages are added as registry data. A new slug must never crash
    // or render an empty tile just because no bespoke glyph was drawn.
    const invented = { ...TOOLS[0], slug: 'some-brand-new-slug-with-no-icon' };
    const { container } = render(<ToolIcon tool={invented} />);
    expect(container.querySelector('svg')).not.toBeNull();
  });
});

describe('categoryStyle', () => {
  test('returns tile, text and ring classes for every category', () => {
    for (const category of CATEGORIES) {
      const style = categoryStyle(category);
      expect(style.tile).toBeTruthy();
      expect(style.text).toBeTruthy();
      expect(style.ring).toBeTruthy();
    }
  });
});
