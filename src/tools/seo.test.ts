import { describe, expect, it } from 'vitest';
import { TOOLS } from './registry';
import {
  HOME_META,
  MAX_DESCRIPTION_LENGTH,
  MAX_TITLE_LENGTH,
  MIN_DESCRIPTION_LENGTH,
  SITE_URL,
  allPageMeta,
  canonicalUrl,
  toolMeta,
} from './seo';

describe('canonicalUrl', () => {
  it('maps the home route to the bare origin', () => {
    expect(canonicalUrl('/')).toBe(`${SITE_URL}/`);
    expect(canonicalUrl('')).toBe(`${SITE_URL}/`);
  });

  it('accepts a bare slug or a leading slash and never doubles them', () => {
    expect(canonicalUrl('compress-image')).toBe(`${SITE_URL}/compress-image`);
    expect(canonicalUrl('/compress-image')).toBe(`${SITE_URL}/compress-image`);
    expect(canonicalUrl('/compress-image/')).toBe(`${SITE_URL}/compress-image`);
  });
});

describe('tool metadata', () => {
  it('gives every tool a canonical URL matching its slug', () => {
    for (const tool of TOOLS) {
      expect(toolMeta(tool).canonical).toBe(`${SITE_URL}/${tool.slug}`);
    }
  });

  // These three guards are what stop the SEO page set from decaying into
  // near-duplicate boilerplate, which is exactly how thin-content page farms
  // get filtered out of the index.
  it('gives every page a distinct title', () => {
    const titles = allPageMeta().map((meta) => meta.title);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it('gives every page a distinct description', () => {
    const descriptions = allPageMeta().map((meta) => meta.description);
    expect(new Set(descriptions).size).toBe(descriptions.length);
  });

  it('keeps every title short enough to display in full', () => {
    const tooLong = allPageMeta()
      .filter((meta) => meta.title.length > MAX_TITLE_LENGTH)
      .map((meta) => `${meta.canonical} (${meta.title.length})`);
    expect(tooLong).toEqual([]);
  });

  it('keeps every description within snippet range', () => {
    const outOfRange = allPageMeta()
      .filter(
        (meta) =>
          meta.description.length > MAX_DESCRIPTION_LENGTH ||
          meta.description.length < MIN_DESCRIPTION_LENGTH,
      )
      .map((meta) => `${meta.canonical} (${meta.description.length})`);
    expect(outOfRange).toEqual([]);
  });

  it('includes the homepage and every tool exactly once', () => {
    const pages = allPageMeta();
    expect(pages).toHaveLength(TOOLS.length + 1);
    expect(pages[0]).toBe(HOME_META);
  });
});
