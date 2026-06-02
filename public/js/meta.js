import { dailySeed } from "./shapes.js";

/** Player progression tiers — metal ladder (not character names). */
export const RANKS = [
  { name: "Iron", xp: 0, color: 0x6b7280, stroke: 0x9ca3af, icon: "⚙", text: "#e5e7eb" },
  { name: "Bronze", xp: 50, color: 0xb45309, stroke: 0xea580c, icon: "🥉", text: "#fed7aa" },
  { name: "Silver", xp: 120, color: 0x94a3b8, stroke: 0xcbd5e1, icon: "🥈", text: "#f1f5f9" },
  { name: "Gold", xp: 220, color: 0xeab308, stroke: 0xfacc15, icon: "🥇", text: "#fef9c3" },
  { name: "Platinum", xp: 360, color: 0x22d3ee, stroke: 0x67e8f9, icon: "💠", text: "#cffafe" },
  { name: "Diamond", xp: 540, color: 0x38bdf8, stroke: 0x7dd3fc, icon: "💎", text: "#e0f2fe" },
  { name: "Master", xp: 760, color: 0xa855f7, stroke: 0xc084fc, icon: "🔮", text: "#f3e8ff" },
  { name: "Grandmaster", xp: 1020, color: 0xf472b6, stroke: 0xf9a8d4, icon: "👑", text: "#fce7f3" },
  { name: "Champion", xp: 1320, color: 0xef4444, stroke: 0xf87171, icon: "🏆", text: "#fee2e2" },
  { name: "Legend", xp: 1680, color: 0xf97316, stroke: 0xfb923c, icon: "🔥", text: "#ffedd5" },
  { name: "Mythic", xp: 2100, color: 0x6366f1, stroke: 0x818cf8, icon: "✦", text: "#e0e7ff" },
  { name: "Immortal", xp: 2600, color: 0xfde047, stroke: 0xfef08a, icon: "☀", text: "#fefce8" },
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

/** 0–1 progress within current tier toward next. */
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
