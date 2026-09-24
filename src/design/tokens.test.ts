import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

/**
 * Guards the design vocabulary.
 *
 * A type scale only works if it is the only way to set a size. Once one
 * component reaches for `text-[13.5px]` the scale stops being a scale, and the
 * next person copies that line rather than the token. These tests keep the
 * vocabulary closed, which is the difference between a design system and a pile
 * of CSS that happens to look similar.
 */

function sourceFiles(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) found.push(...sourceFiles(full));
    else if (/\.tsx$/.test(entry) && !/\.test\.tsx$/.test(entry)) found.push(full);
  }
  return found;
}

const FILES = sourceFiles('src');

function offenders(pattern: RegExp): string[] {
  const hits: string[] = [];
  for (const file of FILES) {
    const lines = readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, index) => {
      const match = line.match(pattern);
      if (match) hits.push(`${file}:${index + 1}  ${match[0]}`);
    });
  }
  return hits;
}

describe('type scale', () => {
  test('no component sets a font size outside the scale', () => {
    // text-[15px] and friends: five different ad-hoc sizes were in use,
    // including 13.5px, which no scale would ever contain.
    expect(offenders(/text-\[[0-9.]+px\]/)).toEqual([]);
  });
});

describe('colour', () => {
  test('no component hardcodes a hex colour', () => {
    // Bypassing the palette means the value cannot be themed and will not
    // match anything else that is meant to look the same.
    expect(offenders(/(?:text|bg|border|fill|stroke)-\[#[0-9a-fA-F]{3,8}\]/)).toEqual(
      [],
    );
  });
});

describe('the theme itself', () => {
  const css = readFileSync('src/index.css', 'utf8');

  test('defines every size the components are allowed to use', () => {
    for (const token of ['--text-ui', '--text-meta']) {
      expect(css, `${token} is missing from @theme`).toContain(token);
    }
  });

  test('carries no token that nothing references', () => {
    // --radius-xl2 sat in the theme unused, which is how a vocabulary starts
    // to drift: the file describes intentions the code does not follow.
    const declared = [...css.matchAll(/^\s*(--[a-z0-9-]+):/gm)].map((m) => m[1]);
    const source = FILES.map((f) => readFileSync(f, 'utf8')).join('\n') + css;

    const unused = declared.filter((token) => {
      // A token is used either through its Tailwind utility (--color-ink ->
      // text-ink, bg-ink) or by direct var() reference.
      const bare = token.replace(/^--(color|text|radius|ease|font)-/, '');
      if (source.includes(`var(${token})`)) return false;
      return !new RegExp(`[-\\[]${bare}\\b|\\b${bare}\\b`).test(source);
    });

    expect(unused).toEqual([]);
  });
});
