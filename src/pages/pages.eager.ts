/**
 * Every tool page, statically imported.
 *
 * For the prerender and for tests. React.lazy suspends on its first render, so
 * renderToString would emit the Suspense fallback instead of the page and turn
 * every prerendered landing page into an empty shell.
 *
 * Nothing in the browser entry may import this file. A static import here plus
 * a dynamic import in `pages.ts` of the same module puts both in the main
 * chunk and silently undoes the code splitting -- which is exactly what
 * happened when the two registries shared one file. `bundle.test.ts` asserts
 * against the built output so the regression cannot return unnoticed.
 */

import { buildPages, type PageMap } from './pageMap';

import { CompressImage } from './tools/CompressImage';
import { CompressToSize } from './tools/CompressToSize';
import { ResizeImage } from './tools/ResizeImage';
import { ConvertImage } from './tools/ConvertImage';
import { RotateImage } from './tools/RotateImage';
import { FlipImage } from './tools/FlipImage';
import { CropImage } from './tools/CropImage';
import {
  AdjustContrast,
  AdjustSaturation,
  BlurImage,
  BrightenImage,
  DarkenImage,
  IncreaseContrast,
} from './tools/AdjustImage';
import { GrayscaleImage } from './tools/GrayscaleImage';
import { SharpenImage } from './tools/SharpenImage';
import { RemoveMetadata } from './tools/RemoveMetadata';
import { ViewMetadata } from './tools/ViewMetadata';
import { ImageToPdf } from './tools/ImageToPdf';
import { UpscaleImage } from './tools/UpscaleImage';
import { RemoveBackground } from './tools/RemoveBackground';

export const EAGER_PAGES: PageMap = buildPages({
  compress: CompressImage,
  compressToSize: CompressToSize,
  resize: ResizeImage,
  convert: ConvertImage,
  rotate: RotateImage,
  flip: FlipImage,
  crop: CropImage,
  brighten: BrightenImage,
  darken: DarkenImage,
  contrast: AdjustContrast,
  increaseContrast: IncreaseContrast,
  saturation: AdjustSaturation,
  blur: BlurImage,
  grayscale: GrayscaleImage,
  sharpen: SharpenImage,
  removeMetadata: RemoveMetadata,
  viewMetadata: ViewMetadata,
  pdf: ImageToPdf,
  upscale: UpscaleImage,
  removeBackground: RemoveBackground,
});
