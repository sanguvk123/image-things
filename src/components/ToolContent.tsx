/**
 * The supporting content below a tool: how it works, why, and FAQs.
 *
 * It sits *below* the tool, never above it. Someone who arrived from Google
 * searching "jpg to png" wants the converter, not an article -- burying the
 * upload box under prose is the pattern that makes most converter sites
 * unpleasant. This exists so the page can also explain itself to a crawler
 * and to the reader who does want the detail.
 *
 * The FAQ block is mirrored as schema.org JSON-LD. Google reads that directly,
 * and it is generated from the same array that renders the visible list, so
 * the two cannot drift apart -- marking up FAQs that are not on the page is a
 * structured-data violation.
 */

import { actionPhrase, contentFor } from '@/tools/content';
import type { Tool } from '@/tools/registry';
import { categoryStyle } from './ToolIcon';

export function ToolContent({ tool }: { tool: Tool }) {
  const { steps, why, faqs } = contentFor(tool);
  const style = categoryStyle(tool.category);

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };

  return (
    <div className="mt-14 space-y-10 border-t border-line pt-10">
      <section aria-labelledby="how-to">
        <h2 id="how-to" className="text-lg font-semibold text-ink">
          How to {actionPhrase(tool)}
        </h2>
        <ol className="mt-3 space-y-2.5">
          {steps.map((step, index) => (
            <li key={step} className="flex gap-3 text-[15px] text-ink-soft">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold ${style.tile} ${style.text}`}
              >
                {index + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="why">
        <h2 id="why" className="text-lg font-semibold text-ink">
          About this tool
        </h2>
        <div className="mt-3 space-y-3">
          {why.map((paragraph) => (
            <p key={paragraph} className="text-[15px] leading-relaxed text-ink-soft">
              {paragraph}
            </p>
          ))}
        </div>
      </section>

      <section aria-labelledby="faq">
        <h2 id="faq" className="text-lg font-semibold text-ink">
          Frequently asked questions
        </h2>
        <dl className="mt-3 space-y-4">
          {faqs.map((faq) => (
            <div key={faq.question}>
              <dt className="text-[15px] font-medium text-ink">{faq.question}</dt>
              <dd className="mt-1 text-[15px] leading-relaxed text-ink-soft">
                {faq.answer}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <script
        type="application/ld+json"
        // Generated from the same `faqs` array that renders above, so the
        // markup can never describe questions the page does not show.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </div>
  );
}
