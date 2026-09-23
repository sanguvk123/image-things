# Image Tools

Image tools that just work. Resize, compress, convert, edit and optimize images
in seconds.

One problem → one tool → one action → one result. No dashboard, no account, no
editor to learn.

## Privacy

Every image is processed in the browser on a canvas. Nothing is uploaded, which
is both the privacy promise and the reason the tools feel instant — there is no
network round trip.

## Getting started

```bash
npm install
npm run dev
```

| Command             | What it does                        |
| ------------------- | ----------------------------------- |
| `npm run dev`       | Start the dev server                |
| `npm run build`     | Type-check and build for production |
| `npm test`          | Run the test suite                  |
| `npm run typecheck` | Type-check only                     |

## The tools

**Optimize** — Compress Image, Compress to Exact Size, per-format compressors
(JPG / PNG / WebP), and one-tap presets for 50 KB through 1 MB.

**Convert** — JPG ↔ PNG, WebP ↔ JPG/PNG, HEIC → JPG/PNG, AVIF → JPG/PNG,
BMP → JPG, TIFF → JPG, and Image/JPG/PNG → PDF.

**Transform** — Resize (with smart aspect ratio), exact-dimension presets
(1080×1080, 1920×1080, 1280×720, 1200×630, 512×512, 800×800), Crop, Rotate,
Flip, Upscale.

**Adjust** — Brightness (brighten and darken), Contrast, Saturation, Grayscale,
Sharpen, Blur.

**Privacy** — Remove Metadata / EXIF, EXIF and metadata viewers, Remove
Background.

### Formats

JPG, PNG, WebP, GIF, BMP and AVIF decode natively in the browser. HEIC and TIFF
do not, so they are decoded by `heic-to` and `utif2`, imported lazily — a
visitor compressing a JPEG never downloads them. Format is detected from magic
bytes rather than the file extension, because phones routinely export HEIC data
inside a `.jpg`.

## How it is put together

```
src/
  tools/registry.ts   Every tool: slug, copy, keywords, SEO. One source of truth.
  tools/search.ts     Scored search behind the homepage search box.
  tools/seo.ts        Page metadata and canonical URLs, derived from the registry.
  seo/html.ts         Pure helpers the prerender step uses to build each page.
  entry-prerender.tsx Server entry: renders one route to static HTML.
  image/              Image logic, free of React and individually tested.
    pipeline.ts       Decode, encode, download, canvas helpers.
    decode.ts         HEIC and TIFF decoding the browser cannot do itself.
    operations.ts     One exported function per user intent.
    targetSize.ts     Quality binary search for exact file sizes.
    filters.ts        Filter strings shared by preview and final render.
    sharpen.ts        Unsharp convolution kernel.
    background.ts     Edge-sampled flood fill.
    metadata.ts       EXIF reader: categories to strip, values to display.
    pdf.ts            Minimal PDF writer.
  components/         Shared UI: dropzone, preview, result, controls, head.
  pages/tools/        One page per tool, composed from the shared shell.
scripts/prerender.mjs Writes one real HTML file per URL after the build.
```

Adding a tool means adding an entry to `registry.ts`, a function to
`operations.ts`, and a page wired into `pages/ToolRoute.tsx`. A test asserts
that every registered tool resolves to a real page, so the three cannot drift
apart.

## Search landing pages

Around sixty URLs exist to answer one search each — `/compress-image-to-100kb`,
`/resize-image-to-1080x1080`, `/heic-to-jpg`, `/make-image-smaller`. They are
generated from the same registry as everything else, and they follow three
rules.

**A page is the tool, not an article about it.** `/compress-image-to-100kb`
opens with the heading "Compress your image to 100KB" and 100 KB already
selected. `/resize-image-to-1080x1080` opens with both fields filled and the
aspect-ratio lock off, because keeping it on would quietly deliver 1080×810 for
a 4:3 photo. `/darken-image` opens already darkened.

**A page exists only if it can earn its own search result.** `Tool.seo` is
required, and `tools/seo.test.ts` rejects duplicate titles, duplicate
descriptions and copy outside Google's display limits. A slug that cannot
justify distinct copy is duplicate content, not a page.

**A page only ships if the tool genuinely works.** `/heic-to-jpg` and
`/tiff-to-jpg` exist because real decoders were added for them, not because the
URLs looked valuable.

Pages that merely reword an existing tool set `aliasOf`. They earn their place
in Google, where people search in their own words, but the site's own search
hides them when the canonical tool is already in the results — otherwise three
ways of saying "compress" crowd out genuinely different tools.

### Why the build prerenders

A single-page app serves byte-identical HTML for every URL. For a site built on
dozens of narrowly-targeted pages that is fatal: the pages look like duplicates
of each other, and every crawler that does not execute JavaScript sees one
generic title across all of them.

So `npm run build` renders each route to static HTML and writes it to
`<slug>/index.html` with its title, description, canonical and `<h1>` baked in,
plus `sitemap.xml` and `robots.txt`. The client bundle still loads and hydrates,
so behaviour is unchanged. Both the runtime `DocumentHead` and the prerender
step read the same registry, so they cannot disagree.

### Notable decisions

- **Decimal kilobytes.** "Compress to 100KB" usually means satisfying an upload
  limit, and 1000-byte KB is under the limit on either reading.
- **Previews share their filter string with the canvas render**, so the file you
  download is the one you were looking at.
- **Background removal flood-fills from the edges** rather than replacing every
  matching pixel, which protects a white shirt in the middle of the subject.
  It works on plain backgrounds and the UI says so.

## Deploying

The build output in `dist/` is static, and every URL is a real file, so no
rewrite rules are needed for the tool pages themselves. `public/_redirects`
only handles genuinely unknown paths, and returns 404 rather than 200 so that a
mistyped URL is not reported to crawlers as a valid page.

Set the production origin in `src/tools/seo.ts` (`SITE_URL`) before deploying:
it is what canonical URLs and the sitemap are built from.

## Third-party licences

`heic-to` (and the libheif build it wraps) is LGPL-3.0, as is `libheif-js`.
They are loaded as unmodified, separately-distributed chunks, but the licence
still requires attribution — add a notice before launch. `utif2` is MIT.
