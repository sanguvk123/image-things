import { describe, expect, it } from 'vitest';
import { TOOLS, getTool } from './registry';
import { actionPhrase, contentFor, FORMAT_FACTS } from './content';

describe('contentFor', () => {
  it('gives every tool supporting content', () => {
    for (const tool of TOOLS) {
      const content = contentFor(tool);
      expect(content.steps.length).toBeGreaterThanOrEqual(3);
      expect(content.faqs.length).toBeGreaterThanOrEqual(3);
      expect(content.why.length).toBeGreaterThan(0);
    }
  });

  it('names the actual formats in a conversion answer', () => {
    // Generic copy would read the same on all twelve conversion pages.
    const content = contentFor(getTool('jpg-to-png')!);
    const text = JSON.stringify(content);
    expect(text).toContain('JPG');
    expect(text).toContain('PNG');
  });

  it('explains the real trade-off of the target format', () => {
    // PNG is lossless but larger; saying "smaller and better" would be a lie
    // that the user discovers the moment they see the file size.
    const toPng = JSON.stringify(contentFor(getTool('jpg-to-png')!));
    expect(toPng).toMatch(/lossless/i);

    const toJpg = JSON.stringify(contentFor(getTool('png-to-jpg')!));
    expect(toJpg).toMatch(/transparen/i);
  });

  it('states the exact target on a size-preset page', () => {
    const content = JSON.stringify(contentFor(getTool('compress-image-to-100kb')!));
    expect(content).toContain('100');
  });

  it('states the exact dimensions on a resize-preset page', () => {
    const content = JSON.stringify(contentFor(getTool('resize-image-to-1080x1080')!));
    expect(content).toContain('1080');
  });

  it('never claims uploaded files are deleted later', () => {
    // Nothing is uploaded, so "files are deleted after an hour" would be both
    // false and a weaker promise than the truth.
    for (const tool of TOOLS) {
      const text = JSON.stringify(contentFor(tool)).toLowerCase();
      expect(text).not.toMatch(/delet\w* (after|within|from our)/);
      expect(text).not.toMatch(/(files?|images?) (are|is) removed/);
      expect(text).not.toMatch(/our servers? (process|store|receive)/);
    }
  });

  it('gives different tools different first steps', () => {
    // The step list is the most copy-pasted part of a tool page. If every
    // page opened with the same sentence, the set would read as generated.
    const firsts = TOOLS.map((tool) => contentFor(tool).steps[0]);
    const unique = new Set(firsts);
    expect(unique.size).toBeGreaterThan(5);
  });

  it('asks questions specific to the tool, not one shared list', () => {
    const jpgToPng = contentFor(getTool('jpg-to-png')!).faqs[0].question;
    const resize = contentFor(getTool('resize-image')!).faqs[0].question;
    expect(jpgToPng).not.toBe(resize);
  });

  it('answers every question it asks', () => {
    for (const tool of TOOLS) {
      for (const faq of contentFor(tool).faqs) {
        expect(faq.question.length).toBeGreaterThan(10);
        expect(faq.answer.length).toBeGreaterThan(40);
        expect(faq.question.endsWith('?')).toBe(true);
      }
    }
  });

  it('never puts a symbol or a noun phrase where a verb belongs', () => {
    // Lowercasing the title produced "an account to jpg → pdf?" and "an
    // account to exif viewer?". Both were grammatical nonsense that every
    // structural test passed straight over.
    for (const tool of TOOLS) {
      const phrase = actionPhrase(tool);
      expect(phrase).not.toMatch(/[→<>]/);
      expect(phrase).not.toMatch(/viewer$/i);
      // Must start with a verb, so it reads after "an account to ...".
      // Format names stay capitalised: "convert JPG to PNG" is correct.
      expect(phrase[0]).toBe(phrase[0].toLowerCase());
    }
  });

  it('reads as a sentence in every generated question', () => {
    for (const tool of TOOLS) {
      for (const faq of contentFor(tool).faqs) {
        expect(faq.question).not.toMatch(/→/);
        // Two spaces or a space before punctuation means a blank slot was
        // interpolated where a word should be.
        expect(faq.question).not.toMatch(/ {2}| \?/);
        expect(faq.answer).not.toMatch(/ {2}| \./);
      }
    }
  });

  it('is deterministic, so prerender and hydration agree', () => {
    // Anything random here would produce a hydration mismatch, because the
    // build and the browser would generate different text.
    const tool = getTool('compress-image')!;
    expect(contentFor(tool)).toEqual(contentFor(tool));
  });
});

describe('FORMAT_FACTS', () => {
  it('describes every format the converters target', () => {
    const targets = TOOLS.flatMap((tool) =>
      tool.convert ? [tool.convert.fromLabel, tool.convert.to] : [],
    );

    for (const format of new Set(targets)) {
      expect(FORMAT_FACTS[format.toLowerCase()]).toBeDefined();
    }
  });

  it('gives each format a distinct description', () => {
    // Keyed by name, not by key: 'jpg' and 'jpeg' are two spellings of one
    // format and deliberately share their copy.
    const byName = new Map(
      Object.values(FORMAT_FACTS).map((fact) => [fact.name, fact.summary]),
    );
    const summaries = [...byName.values()];
    expect(new Set(summaries).size).toBe(summaries.length);
  });

  it('treats jpg and jpeg as the same format', () => {
    expect(FORMAT_FACTS.jpeg).toEqual(FORMAT_FACTS.jpg);
  });
});
