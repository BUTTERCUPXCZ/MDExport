/**
 * Fuzzy subsequence match, case-insensitive. Returns a score (higher is better)
 * or null if `query` is not a subsequence of `text`.
 * Rewards matches at the start, after separators, and consecutive runs.
 */
export function fuzzyScore(query: string, text: string): number | null {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  const t = text.toLowerCase();

  let score = 0;
  let ti = 0;
  let previous = -2;
  for (const ch of q) {
    if (ch === " ") continue;
    const found = t.indexOf(ch, ti);
    if (found === -1) return null;

    score += 1;
    if (found === previous + 1) score += 3;
    if (found === 0) score += 4;
    else if (/[\s/_\-.]/.test(t[found - 1]!)) score += 3;

    previous = found;
    ti = found + 1;
  }
  // Prefer shorter texts for equal matches.
  return score - text.length * 0.01;
}
