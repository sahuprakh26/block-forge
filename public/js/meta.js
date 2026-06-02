import { dailySeed } from "./shapes.js";

/** Metal tiers — letter badges drawn in-game (no emoji logos). */
export const RANKS = [
  { name: "Iron", xp: 0, color: 0x71717a, stroke: 0xd4d4d8, text: "#f4f4f5", letter: "I", metal: "iron" },
  { name: "Bronze", xp: 50, color: 0xea580c, stroke: 0xfdba74, text: "#fff7ed", letter: "B", metal: "bronze" },
  { name: "Silver", xp: 120, color: 0x94a3b8, stroke: 0xf1f5f9, text: "#f8fafc", letter: "S", metal: "silver" },
  { name: "Gold", xp: 220, color: 0xffd700, stroke: 0xfff59d, text: "#fffef0", letter: "G", metal: "gold" },
  { name: "Platinum", xp: 360, color: 0x22d3ee, stroke: 0xa5f3fc, text: "#ecfeff", letter: "P", metal: "platinum" },
  { name: "Diamond", xp: 540, color: 0x38bdf8, stroke: 0xbae6fd, text: "#f0f9ff", letter: "D", metal: "diamond" },
  { name: "Master", xp: 760, color: 0xa855f7, stroke: 0xe9d5ff, text: "#faf5ff", letter: "M", metal: "master" },
  { name: "Grandmaster", xp: 1020, color: 0xec4899, stroke: 0xfbcfe8, text: "#fdf2f8", letter: "GM", metal: "grand" },
  { name: "Champion", xp: 1320, color: 0xef4444, stroke: 0xfecaca, text: "#fef2f2", letter: "C", metal: "champion" },
  { name: "Legend", xp: 1680, color: 0xf97316, stroke: 0xfed7aa, text: "#fff7ed", letter: "L", metal: "legend" },
  { name: "Mythic", xp: 2100, color: 0x6366f1, stroke: 0xc7d2fe, text: "#eef2ff", letter: "X", metal: "mythic" },
  { name: "Immortal", xp: 2600, color: 0xfde047, stroke: 0xfef9c3, text: "#fffef0", letter: "★", metal: "immortal" },
];

export const ACHIEVEMENTS = {
  first_clear: { title: "First Spark", desc: "Clear your first line", xp: 30 },
  combo_3: { title: "Triple Threat", desc: "Hit a 3-line combo", xp: 50 },
  combo_4: { title: "Gridquake", desc: "4+ lines at once!", xp: 80 },
  streak_5: { title: "On Fire", desc: "5 clear streak", xp: 60 },
  endless_1k: { title: "Survivor", desc: "Score 1000 in Endless", xp: 70 },
  daily_win: { title: "Daily Grinder", desc: "Beat today's Daily score", xp: 40 },
  three_star: { title: "Perfectionist", desc: "Earn 3 stars on a level", xp: 55 },
};

export function getRank(xp) {
  let rank = RANKS[0];
  for (const r of RANKS) if (xp >= r.xp) rank = r;
  return rank;
}

export function getRankIndex(xp) {
  let idx = 0;
  for (let i = 0; i < RANKS.length; i++) {
    if (xp >= RANKS[i].xp) idx = i;
  }
  return idx;
}

export function getNextRank(xp) {
  for (const r of RANKS) if (r.xp > xp) return r;
  return null;
}

export function nextRankXp(xp) {
  const next = getNextRank(xp);
  return next ? next.xp : RANKS[RANKS.length - 1].xp + 800;
}

export function rankProgress(xp) {
  const rank = getRank(xp);
  const next = getNextRank(xp);
  const prevXp = rank.xp;
  const nextXp = next ? next.xp : prevXp + 800;
  const ratio = Math.min(1, (xp - prevXp) / Math.max(1, nextXp - prevXp));
  return { rank, next, prevXp, nextXp, ratio };
}

export function streakMult(clearStreak) {
  if (clearStreak < 2) return 1;
  return Math.min(2.5, 1 + (clearStreak - 1) * 0.25);
}

export function yesterdaySeed() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
}

export function todayKey() {
  return String(dailySeed());
}
