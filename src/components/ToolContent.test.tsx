import { screen, within } from '@testing-library/react';
import { renderTool } from '@/test/tool';
import { contentFor } from '@/tools/content';
import { getTool } from '@/tools/registry';

function faqSchema(): { mainEntity: { name: string; acceptedAnswer: { text: string } }[] } | null {
  const node = document.querySelector('script[type="application/ld+json"]');
  return node?.textContent ? JSON.parse(node.textContent) : null;
}

describe('supporting content', () => {
  test('explains how to use the tool in numbered steps', () => {
    renderTool('jpg-to-png');

    const section = screen.getByRole('heading', { name: /^how to/i }).closest('section')!;
    const steps = within(section).getAllByRole('listitem');

    expect(steps.length).toBeGreaterThanOrEqual(3);
    expect(steps[0]).toHaveTextContent(/upload/i);
  });

  test('names both formats on a conversion page', () => {
    renderTool('heic-to-jpg');
    // Generic copy would be identical across all twelve conversion pages.
    const body = document.body.textContent ?? '';
    expect(body).toContain('HEIC');
    expect(body).toContain('JPG');
    expect(body).toMatch(/iPhone/i);
  });

  test('states the size target on a preset compression page', () => {
    renderTool('compress-image-to-100kb');
    expect(document.body.textContent).toContain('100KB');
  });

  test('answers questions as a description list', () => {
    renderTool('resize-image');

    const section = screen.getByRole('heading', { name: /frequently asked/i }).closest('section')!;
    const questions = section.querySelectorAll('dt');
    const answers = section.querySelectorAll('dd');

    expect(questions.length).toBeGreaterThanOrEqual(3);
    expect(answers.length).toBe(questions.length);
  });
});

describe('FAQ structured data', () => {
  test('publishes the FAQs as schema.org JSON-LD', () => {
    renderTool('jpg-to-png');
    const schema = faqSchema();

    expect(schema).not.toBeNull();
    expect(schema!.mainEntity.length).toBeGreaterThanOrEqual(3);
  });

  test('marks up exactly the questions shown on the page', () => {
    // Marking up FAQs that are not visible is a structured-data violation and
    // can cost the rich result entirely, so the two must come from one source.
    renderTool('png-to-jpg');

    const rendered = contentFor(getTool('png-to-jpg')!).faqs;
    const schema = faqSchema()!;

    expect(schema.mainEntity.map((entry) => entry.name)).toEqual(
      rendered.map((faq) => faq.question),
    );
    expect(schema.mainEntity.map((entry) => entry.acceptedAnswer.text)).toEqual(
      rendered.map((faq) => faq.answer),
    );

    for (const faq of rendered) {
      expect(screen.getByText(faq.question)).toBeInTheDocument();
    }
  });
});

describe('page order', () => {
  test('puts the upload control before the supporting content', () => {
    // Google sends people here to do a job. An article with the tool buried
    // underneath is the failure mode this whole layout exists to avoid.
    renderTool('jpg-to-png');

    const upload = screen.getByText('Drop image here');
    const faq = screen.getByRole('heading', { name: /frequently asked/i });

    expect(upload.compareDocumentPosition(faq)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  test('keeps the h1 the only top-level heading', () => {
    // Supporting sections must be h2s, or the page presents several competing
    // topics to a crawler.
    renderTool('jpg-to-png');
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });
});
