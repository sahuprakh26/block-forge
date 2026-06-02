/** Signed save + sanity checks — stops casual localStorage edits */

const MAX_LEVEL = 15;
const MAX_ENDLESS = 250000;

const PEPPER = ["bf", "7k", "2m", "9x", "p1", "q4"].join("");

function fnv1a(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

function canonical(p) {
  const stars = {};
  Object.keys(p.stars || {})
    .sort((a, b) => Number(a) - Number(b))
    .forEach((k) => {
      stars[k] = p.stars[k];
    });
  return JSON.stringify({
    u: p.unlocked,
    s: stars,
    e: p.endlessBest || 0,
    a: !!p.sound,
    m: p.music !== false,
    x: p.xp || 0,
    b: (p.achievements || []).slice().sort(),
    dd: p.dailyDate || "",
    db: p.dailyBest || 0,
    st: p.streakDays || 0,
    lp: p.lastPlayDay || "",
  });
}

export function sealSave(data) {
  return fnv1a(canonical(data) + PEPPER);
}

export function verifySave(data, hash) {
  return typeof hash === "string" && sealSave(data) === hash;
}

/** Max level reachable from earned stars only */
export function maxUnlockedFromStars(stars) {
  let max = 1;
  for (let l = 1; l < MAX_LEVEL; l++) {
    const s = Math.floor(Number(stars[String(l)]) || 0);
    if (s >= 1) max = Math.max(max, l + 1);
  }
  return max;
}

export function sanitizeProgress(raw) {
  const stars = {};
  for (let l = 1; l <= MAX_LEVEL; l++) {
    const s = Math.max(0, Math.min(3, Math.floor(Number(raw.stars?.[String(l)]) || 0)));
    if (s > 0) stars[String(l)] = s;
  }

  const fromStars = maxUnlockedFromStars(stars);
  let unlocked = Math.max(1, Math.min(MAX_LEVEL + 1, Math.floor(Number(raw.unlocked) || 1)));
  unlocked = Math.min(unlocked, fromStars);

  for (const k of Object.keys(stars)) {
    if (Number(k) >= unlocked) delete stars[k];
  }

  const endlessBest = Math.max(0, Math.min(MAX_ENDLESS, Math.floor(Number(raw.endlessBest) || 0)));
  const xp = Math.max(0, Math.min(50000, Math.floor(Number(raw.xp) || 0)));
  const achievements = Array.isArray(raw.achievements)
    ? raw.achievements.filter((a) => typeof a === "string").slice(0, 32)
    : [];
  const dailyBest = Math.max(0, Math.min(MAX_ENDLESS, Math.floor(Number(raw.dailyBest) || 0)));
  const dailyDate = typeof raw.dailyDate === "string" ? raw.dailyDate.slice(0, 12) : "";
  const streakDays = Math.max(0, Math.min(999, Math.floor(Number(raw.streakDays) || 0)));
  const lastPlayDay = typeof raw.lastPlayDay === "string" ? raw.lastPlayDay.slice(0, 12) : "";

  return {
    unlocked,
    stars,
    endlessBest,
    sound: raw.sound !== false,
    music: raw.music !== false,
    xp,
    achievements,
    dailyDate,
    dailyBest,
    streakDays,
    lastPlayDay,
  };
}
