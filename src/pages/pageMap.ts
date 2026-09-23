/**
 * The slug -> page assignment, independent of how the pages are loaded.
 *
 * This file deliberately imports no page components. The eager and lazy
 * registries both call `buildPages`, so they cannot cover different slugs,
 * but neither one drags the other's imports into the bundle.
 */

import type { ComponentType } from 'react';
import type { Tool } from '@/tools/registry';

export type PageComponent = ComponentType<{ tool: Tool }>;
export type PageMap = Record<string, PageComponent>;

/** One component per distinct tool UI. Slugs that share a UI share an entry. */
export interface PageComponents {
  compress: PageComponent;
  compressToSize: PageComponent;
  resize: PageComponent;
  convert: PageComponent;
  rotate: PageComponent;
  flip: PageComponent;
  crop: PageComponent;
  brighten: PageComponent;
  darken: PageComponent;
  contrast: PageComponent;
  increaseContrast: PageComponent;
  saturation: PageComponent;
  blur: PageComponent;
  grayscale: PageComponent;
  sharpen: PageComponent;
  removeMetadata: PageComponent;
  viewMetadata: PageComponent;
  pdf: PageComponent;
  upscale: PageComponent;
  removeBackground: PageComponent;
}

/**
 * Builds the slug map from whichever set of components is passed in, so the
 * eager and lazy registries cannot list different slugs.
 */
export function buildPages(c: PageComponents): PageMap {
  return {
    'compress-image': c.compress,
    // Problem-phrased URLs resolve to the tool that actually solves them.
    'reduce-image-size': c.compress,
    'make-image-smaller': c.compress,
    'make-jpg-smaller': c.compress,
    'compress-jpg': c.compress,
    'compress-png': c.compress,
    'compress-webp': c.compress,
    'compress-image-without-losing-quality': c.compress,
    'compress-image-to-size': c.compressToSize,
    'compress-image-to-50kb': c.compressToSize,
    'compress-image-to-100kb': c.compressToSize,
    'compress-image-to-200kb': c.compressToSize,
    'compress-image-to-300kb': c.compressToSize,
    'compress-image-to-500kb': c.compressToSize,
    'compress-image-to-1mb': c.compressToSize,
    'compress-jpg-to-100kb': c.compressToSize,
    'compress-jpg-to-200kb': c.compressToSize,
    'compress-jpg-to-500kb': c.compressToSize,
    'compress-png-to-100kb': c.compressToSize,
    'resize-image': c.resize,
    'change-image-size': c.resize,
    'resize-jpg': c.resize,
    'resize-png': c.resize,
    'resize-image-by-pixels': c.resize,
    'resize-image-to-1080x1080': c.resize,
    'resize-image-to-1920x1080': c.resize,
    'resize-image-to-1280x720': c.resize,
    'resize-image-to-1200x630': c.resize,
    'resize-image-to-512x512': c.resize,
    'resize-image-to-800x800': c.resize,
    'jpg-to-png': c.convert,
    'png-to-jpg': c.convert,
    'webp-to-jpg': c.convert,
    'webp-to-png': c.convert,
    'jpg-to-webp': c.convert,
    'png-to-webp': c.convert,
    'heic-to-jpg': c.convert,
    'heic-to-png': c.convert,
    'avif-to-jpg': c.convert,
    'avif-to-png': c.convert,
    'bmp-to-jpg': c.convert,
    'tiff-to-jpg': c.convert,
    'rotate-image': c.rotate,
    'flip-image': c.flip,
    'crop-image': c.crop,
    'brighten-image': c.brighten,
    'darken-image': c.darken,
    'adjust-contrast': c.contrast,
    'increase-contrast': c.increaseContrast,
    'adjust-saturation': c.saturation,
    'grayscale-image': c.grayscale,
    'blur-image': c.blur,
    'sharpen-image': c.sharpen,
    'remove-metadata': c.removeMetadata,
    'remove-exif': c.removeMetadata,
    'remove-image-metadata': c.removeMetadata,
    'image-metadata-viewer': c.viewMetadata,
    'exif-viewer': c.viewMetadata,
    'image-to-pdf': c.pdf,
    'jpg-to-pdf': c.pdf,
    'png-to-pdf': c.pdf,
    'upscale-image': c.upscale,
    'remove-background': c.removeBackground,
  };
}
