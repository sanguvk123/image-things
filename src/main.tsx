import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import { App } from './App';
import './index.css';

const container = document.getElementById('root');
if (!container) throw new Error('Root container #root not found');

/*
 * Analytics is mounted here rather than inside App, because App is also
 * rendered by the prerender. Firing a beacon at build time would report 64
 * visits nobody made, and there is no browser there to measure anyway.
 *
 * It counts page views only. The images themselves never leave the device,
 * which is the claim the product actually makes and which this does not
 * change.
 */
const tree = (
  <StrictMode>
    <App />
    <Analytics />
  </StrictMode>
);

// Production HTML is prerendered (scripts/prerender.mjs), so the markup is
// already there and we attach to it. The dev server serves an empty shell, so
// there is nothing to hydrate and we render from scratch.
if (container.hasChildNodes()) {
  hydrateRoot(container, tree);
} else {
  createRoot(container).render(tree);
}
