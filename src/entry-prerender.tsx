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

export function renderPath(path: string): string {
  return renderToString(
    <StaticRouter location={path}>
      <AppRoutes />
    </StaticRouter>,
  );
}

export { allPageMeta, canonicalUrl, SITE_URL } from './tools/seo';
export {
  buildRobots,
  buildSitemap,
  outputPathFor,
  renderNotFoundHtml,
  renderPageHtml,
} from './seo/html';
