import { dailySeed } from "./shapes.js";

export const RANKS = [
  { name: "Rookie", xp: 0 },
  { name: "Apprentice", xp: 80 },
  { name: "Smith", xp: 200 },
  { name: "Forge Knight", xp: 400 },
  { name: "Crystal Master", xp: 700 },
  { name: "Grid Legend", xp: 1200 },
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

export function nextRankXp(xp) {
  for (const r of RANKS) if (r.xp > xp) return r.xp;
  return RANKS[RANKS.length - 1].xp + 500;
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
