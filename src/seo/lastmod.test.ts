import { describe, expect, it } from 'vitest';
import { TOOLS, getTool } from '@/tools/registry';
import {
  contentFingerprint,
  homeFingerprint,
  lastmodFor,
  staleEntries,
} from './lastmod';
import manifest from './lastmod.json';

describe('contentFingerprint', () => {
  it('is stable for unchanged content', () => {
    const tool = getTool('jpg-to-png')!;
    expect(contentFingerprint(tool)).toBe(contentFingerprint(tool));
  });

  it('changes when the copy a visitor reads changes', () => {
    const tool = getTool('jpg-to-png')!;
    const edited = { ...tool, seo: { ...tool.seo, title: 'Something else' } };
    expect(contentFingerprint(edited)).not.toBe(contentFingerprint(tool));
  });

  it('changes when a preset changes, since the tool behaves differently', () => {
    const tool = getTool('compress-image-to-100kb')!;
    const edited = { ...tool, targetKB: 250 };
    expect(contentFingerprint(edited)).not.toBe(contentFingerprint(tool));
  });

  it('gives different tools different fingerprints', () => {
    const prints = TOOLS.map(contentFingerprint);
    expect(new Set(prints).size).toBe(prints.length);
  });

  it('ignores fields a visitor never sees', () => {
    // `popular` only controls homepage placement. Toggling it does not change
    // this page, so it must not claim the page was modified.
    const tool = getTool('crop-image')!;
    const edited = { ...tool, popular: !tool.popular };
    expect(contentFingerprint(edited)).toBe(contentFingerprint(tool));
  });
});

describe('the checked-in manifest', () => {
  it('covers every tool plus the homepage', () => {
    for (const tool of TOOLS) {
      expect(manifest[tool.slug as keyof typeof manifest]).toBeDefined();
    }
    expect(manifest['/' as keyof typeof manifest]).toBeDefined();
  });

  it('is in sync with the current content', () => {
    // This is the guard that makes the dates meaningful. Editing page copy
    // without running `npm run lastmod` would leave the sitemap advertising a
    // date older than the change, so the build fails here instead.
    const stale = staleEntries();
    expect(
      stale,
      `Run \`npm run lastmod\` -- these pages changed: ${stale.join(', ')}`,
    ).toEqual([]);
  });

  it('records a valid ISO date for every page', () => {
    for (const entry of Object.values(manifest)) {
      expect(entry.lastmod).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(Date.parse(entry.lastmod))).toBe(false);
    }
  });

  it('never dates a page in the future', () => {
    const today = new Date().toISOString().slice(0, 10);
    for (const [slug, entry] of Object.entries(manifest)) {
      expect(entry.lastmod <= today, `${slug} is dated in the future`).toBe(true);
    }
  });
});

describe('lastmodFor', () => {
  it('returns the recorded date for a known page', () => {
    expect(lastmodFor('jpg-to-png')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns undefined rather than today for an unknown page', () => {
    // Falling back to "now" is the bug this whole module exists to avoid.
    expect(lastmodFor('not-a-real-page')).toBeUndefined();
  });

  it('does not depend on when it is called', () => {
    expect(lastmodFor('crop-image')).toBe(lastmodFor('crop-image'));
  });
});

describe('homeFingerprint', () => {
  it('changes when a tool is added to the directory', () => {
    const before = homeFingerprint(TOOLS);
    const after = homeFingerprint([...TOOLS, { ...TOOLS[0], slug: 'brand-new' }]);
    expect(after).not.toBe(before);
  });
});
