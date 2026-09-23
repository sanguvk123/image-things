import { TOOLS, type Tool } from './registry';

/**
 * Tool search.
 *
 * Goal (spec §10): make the platform feel intelligent without an AI chatbot.
 * A user typing "smaller" should be shown the tools that make things smaller,
 * and a user typing "jpg" should be shown the JPG family.
 *
 * This is deliberately a small scored substring match rather than a fuzzy
 * search library: the corpus is ~25 hand-written entries, so relevance comes
 * from good keywords, not from a clever algorithm.
 */

const SCORE = {
  titleExact: 100,
  titlePrefix: 60,
  titleContains: 40,
  keywordExact: 30,
  keywordPrefix: 18,
  keywordContains: 10,
  taglineContains: 6,
  /**
   * Charged to a format-specific page when the query never mentions that
   * format. Someone typing "100kb" has not said JPG, so "Compress to 100KB"
   * must beat "Compress JPG to 100KB" -- otherwise the long tail of landing
   * pages buries the general tool the user actually asked for.
   */
  unmatchedFormat: 15,
  /**
   * Charged to a size-preset page when the query names no size. The
   * compress-to-N family exists for search traffic; on a vague query like
   * "smaller" they would otherwise fill every slot with six near-identical
   * entries and hide genuinely different tools such as Resize.
   */
  unmatchedTarget: 12,
} as const;

/** Lowercase, collapse whitespace, and drop characters users don't mean. */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function scoreField(field: string, term: string, weights: {
  exact: number;
  prefix: number;
  contains: number;
}): number {
  const haystack = normalize(field);
  if (!haystack) return 0;
  if (haystack === term) return weights.exact;
  // Word-boundary prefix: "rot" should hit "rotate image", but "ate" shouldn't.
  if (haystack.startsWith(term) || haystack.includes(` ${term}`)) {
    return weights.prefix;
  }
  if (haystack.includes(term)) return weights.contains;
  return 0;
}

function scoreTool(tool: Tool, term: string): number {
  let score = scoreField(tool.title, term, {
    exact: SCORE.titleExact,
    prefix: SCORE.titlePrefix,
    contains: SCORE.titleContains,
  });

  for (const keyword of tool.keywords) {
    score += scoreField(keyword, term, {
      exact: SCORE.keywordExact,
      prefix: SCORE.keywordPrefix,
      contains: SCORE.keywordContains,
    });
  }

  if (normalize(tool.tagline).includes(term)) score += SCORE.taglineContains;

  return score;
}

/** Whether a term looks like a size the user typed, e.g. "100kb" or "2mb". */
function mentionsASize(term: string): boolean {
  return /\d/.test(term) || term === 'kb' || term === 'mb';
}

/**
 * Returns tools matching `query`, best match first.
 *
 * Multi-word queries are treated as AND: every term must match something, so
 * "remove bg" narrows to Remove Background instead of returning everything
 * that merely mentions "remove".
 */
export function searchTools(query: string, limit = 8): Tool[] {
  const terms = normalize(query).split(' ').filter(Boolean);
  if (terms.length === 0) return [];

  const scored: { tool: Tool; score: number }[] = [];

  for (const tool of TOOLS) {
    let total = 0;
    let matchedEveryTerm = true;

    for (const term of terms) {
      const termScore = scoreTool(tool, term);
      if (termScore === 0) {
        matchedEveryTerm = false;
        break;
      }
      total += termScore;
    }

    if (!matchedEveryTerm) continue;

    // Prefer the general tool unless the query earns the specific one.
    const format = tool.sourceLabel ? normalize(tool.sourceLabel) : null;
    if (format && !terms.includes(format)) total -= SCORE.unmatchedFormat;

    if (tool.targetKB && !terms.some(mentionsASize)) {
      total -= SCORE.unmatchedTarget;
    }

    scored.push({ tool, score: total });
  }

  const ranked = scored
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // Stable, predictable tie-break: popular tools first, then alphabetical.
      const popularity = Number(!!b.tool.popular) - Number(!!a.tool.popular);
      if (popularity !== 0) return popularity;
      return a.tool.title.localeCompare(b.tool.title);
    })
    .map((entry) => entry.tool);

  return withoutRedundantAliases(ranked).slice(0, limit);
}

/**
 * Drop alias pages whose canonical tool is already in the results.
 *
 * "Make Image Smaller" and "Reduce Image Size" are doors into the same room.
 * Listing them next to Compress Image pads the results with three ways of
 * saying one thing and pushes genuinely different tools off the list.
 *
 * They are only dropped when the canonical tool is present: a query phrased
 * the alias's way ("make image smaller") may not match the canonical tool's
 * own wording at all, and returning nothing would be far worse.
 */
function withoutRedundantAliases(tools: Tool[]): Tool[] {
  const present = new Set(tools.map((tool) => tool.slug));
  return tools.filter((tool) => !(tool.aliasOf && present.has(tool.aliasOf)));
}
