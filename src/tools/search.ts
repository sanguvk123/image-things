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

    if (matchedEveryTerm) scored.push({ tool, score: total });
  }

  return scored
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // Stable, predictable tie-break: popular tools first, then alphabetical.
      const popularity = Number(!!b.tool.popular) - Number(!!a.tool.popular);
      if (popularity !== 0) return popularity;
      return a.tool.title.localeCompare(b.tool.title);
    })
    .slice(0, limit)
    .map((entry) => entry.tool);
}
