// The best rank earned on each level, kept in the browser between visits (when storage is allowed).
import { RANKS } from '../config.js';

const KEY = 'hushwater-best-ranks';

export function loadRanks() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

/** Keep `rank` for the level if it beats the stored one; returns the updated list. */
export function recordRank(ranks, levelIndex, rank) {
  const next = ranks.slice();
  const old = next[levelIndex];
  if (!old || RANKS.indexOf(rank) < RANKS.indexOf(old)) next[levelIndex] = rank;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // storage blocked: the ranks live for this visit only
  }
  return next;
}
