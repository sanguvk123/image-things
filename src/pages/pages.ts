/**
 * Every tool page, code-split. This is what the browser uses.
 *
 * Someone landing on /jpg-to-png from Google should download the convert UI
 * and nothing else -- not the crop canvas, the PDF encoder or the background
 * remover. Each entry below becomes its own chunk, fetched when the route is
 * actually visited.
 *
 * The eager counterpart lives in `pages.eager.ts` and must stay out of the
 * browser graph: a static and a dynamic import of the same module in the same
 * graph collapse back into one chunk. Both registries are built by
 * `buildPages`, so they cannot cover different slugs.
 */

import { lazy } from 'react';
import { buildPages, type PageMap } from './pageMap';

export type { PageComponent, PageMap } from './pageMap';

export const LAZY_PAGES: PageMap = buildPages({
  compress: lazy(() =>
    import('./tools/CompressImage').then((m) => ({ default: m.CompressImage })),
  ),
  compressToSize: lazy(() =>
    import('./tools/CompressToSize').then((m) => ({ default: m.CompressToSize })),
  ),
  resize: lazy(() =>
    import('./tools/ResizeImage').then((m) => ({ default: m.ResizeImage })),
  ),
  convert: lazy(() =>
    import('./tools/ConvertImage').then((m) => ({ default: m.ConvertImage })),
  ),
  rotate: lazy(() =>
    import('./tools/RotateImage').then((m) => ({ default: m.RotateImage })),
  ),
  flip: lazy(() => import('./tools/FlipImage').then((m) => ({ default: m.FlipImage }))),
  crop: lazy(() => import('./tools/CropImage').then((m) => ({ default: m.CropImage }))),
  brighten: lazy(() =>
    import('./tools/AdjustImage').then((m) => ({ default: m.BrightenImage })),
  ),
  darken: lazy(() =>
    import('./tools/AdjustImage').then((m) => ({ default: m.DarkenImage })),
  ),
  contrast: lazy(() =>
    import('./tools/AdjustImage').then((m) => ({ default: m.AdjustContrast })),
  ),
  increaseContrast: lazy(() =>
    import('./tools/AdjustImage').then((m) => ({ default: m.IncreaseContrast })),
  ),
  saturation: lazy(() =>
    import('./tools/AdjustImage').then((m) => ({ default: m.AdjustSaturation })),
  ),
  blur: lazy(() => import('./tools/AdjustImage').then((m) => ({ default: m.BlurImage }))),
  grayscale: lazy(() =>
    import('./tools/GrayscaleImage').then((m) => ({ default: m.GrayscaleImage })),
  ),
  sharpen: lazy(() =>
    import('./tools/SharpenImage').then((m) => ({ default: m.SharpenImage })),
  ),
  removeMetadata: lazy(() =>
    import('./tools/RemoveMetadata').then((m) => ({ default: m.RemoveMetadata })),
  ),
  viewMetadata: lazy(() =>
    import('./tools/ViewMetadata').then((m) => ({ default: m.ViewMetadata })),
  ),
  pdf: lazy(() => import('./tools/ImageToPdf').then((m) => ({ default: m.ImageToPdf }))),
  upscale: lazy(() =>
    import('./tools/UpscaleImage').then((m) => ({ default: m.UpscaleImage })),
  ),
  removeBackground: lazy(() =>
    import('./tools/RemoveBackground').then((m) => ({ default: m.RemoveBackground })),
  ),
});
