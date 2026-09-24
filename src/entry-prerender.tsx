/**
 * Server entry used only by scripts/prerender.mjs at build time.
 *
 * Renders a given URL to static HTML so crawlers receive the real heading and
 * copy on first response, instead of an empty <div id="root">.
 */

import { renderToString } from 'react-dom/server';
// react-router v7 dropped the /server subpath; StaticRouter ships from the core.
import { StaticRouter } from 'react-router';
import { AppRoutes } from './App';
import { EAGER_PAGES } from './pages/pages.eager';

export function renderPath(path: string): string {
  return renderToString(
    // Eager pages: React.lazy suspends on first render, and renderToString
    // would emit the fallback instead of the page -- turning every
    // prerendered landing page back into an empty shell.
    <StaticRouter location={path}>
      <AppRoutes pages={EAGER_PAGES} />
    </StaticRouter>,
  );
}

export { canonicalUrl, SITE_URL } from './tools/seo';
// The prerender writes pages with their schema.org graphs attached; plain
// allPageMeta() carries none, so using it here would silently ship pages
// without structured data.
export { pageMetaWithStructuredData as allPageMeta } from './seo/structuredData';
export {
  buildRobots,
  buildSitemap,
  outputPathFor,
  renderNotFoundHtml,
  renderPageHtml,
} from './seo/html';
