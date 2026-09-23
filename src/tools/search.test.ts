import { searchTools } from './search';
import { TOOLS, getTool, popularTools } from './registry';

const slugs = (query: string, limit?: number) =>
  searchTools(query, limit).map((tool) => tool.slug);

describe('registry integrity', () => {
  test('every slug is unique', () => {
    const seen = new Set(TOOLS.map((t) => t.slug));
    expect(seen.size).toBe(TOOLS.length);
  });

  test('homepage shows between 8 and 12 popular tools', () => {
    // Spec: "Start with 8-12 tools. Do not overwhelm users with 50 tools."
    expect(popularTools().length).toBeGreaterThanOrEqual(8);
    expect(popularTools().length).toBeLessThanOrEqual(12);
  });

  test('getTool resolves a known slug and rejects an unknown one', () => {
    expect(getTool('compress-image')?.title).toBe('Compress Image');
    expect(getTool('not-a-tool')).toBeUndefined();
  });
});

describe('searchTools', () => {
  test('an empty query returns nothing', () => {
    expect(searchTools('')).toEqual([]);
    expect(searchTools('   ')).toEqual([]);
  });

  test('"smaller" surfaces the size-reduction tools', () => {
    // Spec example: smaller -> Compress Image, Resize Image, Compress to Nkb
    const results = slugs('smaller');
    expect(results).toContain('compress-image');
    expect(results).toContain('resize-image');
    expect(results).toContain('compress-image-to-size');
  });

  test('a vague query is not buried under the size-preset family', () => {
    // There are six compress-to-N pages. Without a penalty they fill every
    // slot and hide genuinely different tools.
    const results = slugs('smaller');
    const presets = results.filter((slug) => /compress-image-to-\d/.test(slug));
    expect(presets.length).toBeLessThanOrEqual(2);
    expect(results.indexOf('resize-image')).toBeLessThan(3);
  });

  test('an alias is hidden when the tool it duplicates is already listed', () => {
    // "Make Image Smaller" and Compress Image are the same room with two
    // doors; showing both wastes a slot.
    const results = slugs('smaller');
    expect(results).toContain('compress-image');
    expect(results).not.toContain('make-image-smaller');
    expect(results).not.toContain('reduce-image-size');
  });

  test('an alias still wins when the query uses its wording', () => {
    // The canonical tool may not match these words at all, so suppressing the
    // alias unconditionally would return nothing useful.
    expect(slugs('make image smaller')).toContain('make-image-smaller');
  });

  test('an alias resolves to its canonical tool when that also matches', () => {
    expect(slugs('reduce image size')[0]).toBe('compress-image');
  });

  test('"change image size" reaches the resize tool', () => {
    expect(slugs('change image size')[0]).toBe('resize-image');
  });

  test('"exif" finds the viewer and the removal tool', () => {
    const results = slugs('exif');
    expect(results).toContain('exif-viewer');
    expect(results).toContain('remove-metadata');
  });

  test('"jpg" surfaces the JPG conversion family', () => {
    const results = slugs('jpg');
    expect(results).toContain('jpg-to-png');
    expect(results).toContain('png-to-jpg');
    expect(results).toContain('webp-to-jpg');
  });

  test('a title match outranks a mere keyword match', () => {
    // "crop" is the title of Crop Image; nothing should outrank it.
    expect(slugs('crop')[0]).toBe('crop-image');
  });

  test('matching is case and whitespace insensitive', () => {
    expect(slugs('  ROTATE  ')[0]).toBe('rotate-image');
  });

  test('common misspellings and variants still resolve', () => {
    expect(slugs('greyscale')[0]).toBe('grayscale-image');
    expect(slugs('colour')).toContain('adjust-saturation');
  });

  test('"100kb" finds the exact-size tool', () => {
    expect(slugs('100kb')[0]).toBe('compress-image-to-100kb');
  });

  test('a query naming no format prefers the general tool', () => {
    // "100kb" says nothing about JPG, so the format-specific landing page
    // must not outrank the one the user actually described.
    const results = slugs('100kb');
    expect(results.indexOf('compress-image-to-100kb')).toBeLessThan(
      results.indexOf('compress-jpg-to-100kb'),
    );
  });

  // The search box is how someone who did not arrive from Google finds a
  // tool. These are the phrasings people actually type, rather than the
  // keyword-shaped queries the registry was written against.
  describe('everyday phrasing', () => {
    test('a filler word does not eliminate the right answer', () => {
      // Regression: every term had to match something, so the "to" in
      // "jpg to png" -- a word no tool has a keyword for -- ruled out the
      // JPG -> PNG page and left Image -> PDF as the top result.
      expect(searchTools('jpg to png', 1)[0]?.slug).toBe('jpg-to-png');
    });

    test.each([
      ['photo under 100kb', 'compress-image-to-100kb'],
      ['make background transparent', 'remove-background'],
      ['remove image info', 'remove-metadata'],
      ['make photo square', 'crop-image'],
      // Not resize-image: the square preset is the better answer, and the
      // registry already knows 1080x1080 is the Instagram size.
      ['instagram image', 'resize-image-to-1080x1080'],
    ])('%s finds %s', (query, slug) => {
      expect(searchTools(query, 3).map((tool) => tool.slug)).toContain(slug);
    });

    test('filler words alone match nothing rather than everything', () => {
      // "to" and "my" must not become a wildcard that lists the whole registry.
      expect(searchTools('to my the')).toHaveLength(0);
    });
  });

  test('naming a format promotes that format page', () => {
    expect(slugs('compress jpg')[0]).toBe('compress-jpg');
    expect(slugs('compress png')[0]).toBe('compress-png');
  });

  test('naming both a format and a size finds that exact page', () => {
    expect(slugs('jpg 100kb')[0]).toBe('compress-jpg-to-100kb');
  });

  test('"remove bg" matches across word gaps', () => {
    expect(slugs('remove bg')).toContain('remove-background');
  });

  test('a nonsense query returns nothing rather than noise', () => {
    expect(searchTools('qzxwv')).toEqual([]);
  });

  test('results are capped by the limit', () => {
    expect(searchTools('image', 3)).toHaveLength(3);
  });
});
