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

**Optimize** — Compress Image, Compress to Exact Size, and one-tap presets for
50 / 100 / 200 / 500 KB.

**Convert** — JPG ↔ PNG, WebP → JPG, JPG/PNG → WebP, Image → PDF.

**Transform** — Resize (with smart aspect ratio), Crop, Rotate, Flip, Upscale.

**Adjust** — Brightness, Contrast, Saturation, Grayscale, Sharpen, Blur.

**Privacy** — Remove Metadata, Remove Background.

## How it is put together

```
src/
  tools/registry.ts   Every tool: slug, copy, keywords. One source of truth.
  tools/search.ts     Scored search behind the homepage search box.
  image/              Image logic, free of React and individually tested.
    pipeline.ts       Decode, encode, download, canvas helpers.
    operations.ts     One exported function per user intent.
    targetSize.ts     Quality binary search for exact file sizes.
    filters.ts        Filter strings shared by preview and final render.
    sharpen.ts        Unsharp convolution kernel.
    background.ts     Edge-sampled flood fill.
    metadata.ts       EXIF reader for the privacy tool.
    pdf.ts            Minimal PDF writer.
  components/         Shared UI: dropzone, preview, result, controls.
  pages/tools/        One page per tool, composed from the shared shell.
```

Adding a tool means adding an entry to `registry.ts`, a function to
`operations.ts`, and a page wired into `pages/ToolRoute.tsx`. A test asserts
that every registered tool resolves to a real page, so the three cannot drift
apart.

### Notable decisions

- **Decimal kilobytes.** "Compress to 100KB" usually means satisfying an upload
  limit, and 1000-byte KB is under the limit on either reading.
- **Previews share their filter string with the canvas render**, so the file you
  download is the one you were looking at.
- **Background removal flood-fills from the edges** rather than replacing every
  matching pixel, which protects a white shirt in the middle of the subject.
  It works on plain backgrounds and the UI says so.

## Deploying

The build output in `dist/` is static. Because each tool is its own URL, the
host must serve `index.html` for unknown paths — `public/_redirects` covers
Netlify and Cloudflare Pages; other hosts need the equivalent SPA fallback.
