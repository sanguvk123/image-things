import { render, waitFor } from '@testing-library/react';
import { DocumentHead } from './DocumentHead';
import { SITE_URL, canonicalUrl } from '@/tools/seo';

function head(selector: string): Element | null {
  return document.head.querySelector(selector);
}

describe('DocumentHead', () => {
  it('sets the document title', async () => {
    render(
      <DocumentHead
        title="Compress Image to 100KB Online — Free Tool"
        description="Compress any image to under 100KB in one click."
        canonical={canonicalUrl('compress-image-to-100kb')}
      />,
    );

    await waitFor(() =>
      expect(document.title).toBe('Compress Image to 100KB Online — Free Tool'),
    );
  });

  it('sets the meta description', async () => {
    render(
      <DocumentHead
        title="Resize Image"
        description="Resize any photo to exact pixel dimensions."
        canonical={canonicalUrl('resize-image')}
      />,
    );

    await waitFor(() =>
      expect(head('meta[name="description"]')?.getAttribute('content')).toBe(
        'Resize any photo to exact pixel dimensions.',
      ),
    );
  });

  it('sets a canonical link so near-duplicate pages are not collapsed', async () => {
    render(
      <DocumentHead
        title="Crop Image"
        description="Crop your photo to the exact area you want."
        canonical={canonicalUrl('crop-image')}
      />,
    );

    await waitFor(() =>
      expect(head('link[rel="canonical"]')?.getAttribute('href')).toBe(
        `${SITE_URL}/crop-image`,
      ),
    );
  });

  it('mirrors the copy into Open Graph tags for link previews', async () => {
    render(
      <DocumentHead
        title="Rotate Image"
        description="Rotate a sideways photo in one click."
        canonical={canonicalUrl('rotate-image')}
      />,
    );

    await waitFor(() =>
      expect(head('meta[property="og:title"]')?.getAttribute('content')).toBe(
        'Rotate Image',
      ),
    );
    expect(head('meta[property="og:description"]')?.getAttribute('content')).toBe(
      'Rotate a sideways photo in one click.',
    );
    expect(head('meta[property="og:url"]')?.getAttribute('content')).toBe(
      `${SITE_URL}/rotate-image`,
    );
  });

  it('replaces metadata when navigating rather than accumulating it', async () => {
    const { rerender } = render(
      <DocumentHead
        title="First"
        description="First description."
        canonical={canonicalUrl('first')}
      />,
    );
    await waitFor(() => expect(document.title).toBe('First'));

    rerender(
      <DocumentHead
        title="Second"
        description="Second description."
        canonical={canonicalUrl('second')}
      />,
    );

    await waitFor(() => expect(document.title).toBe('Second'));
    // A stale canonical pointing at the previous URL would tell Google the
    // wrong thing about the page the user is actually on.
    expect(document.head.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
    expect(head('link[rel="canonical"]')?.getAttribute('href')).toBe(
      `${SITE_URL}/second`,
    );
    expect(document.head.querySelectorAll('meta[name="description"]')).toHaveLength(
      1,
    );
    expect(head('meta[name="description"]')?.getAttribute('content')).toBe(
      'Second description.',
    );
  });
});
