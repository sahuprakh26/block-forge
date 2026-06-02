import { SAVE_KEY } from "./config.js";
import { sealSave, verifySave, sanitizeProgress } from "./saveGuard.js";
import { ACHIEVEMENTS, todayKey, yesterdaySeed } from "./meta.js";

const DEFAULT = {
  unlocked: 1,
  stars: {},
  endlessBest: 0,
  sound: true,
  music: true,
  xp: 0,
  achievements: [],
  dailyDate: "",
  dailyBest: 0,
  streakDays: 0,
  lastPlayDay: "",
};

function writeSave(data) {
  const d = sanitizeProgress(data);
  localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 2, d, h: sealSave(d) }));
  return d;
}

export function loadProgress() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return { ...DEFAULT };

    const parsed = JSON.parse(raw);

    if (parsed?.v === 2 && parsed.d && parsed.h) {
      if (!verifySave(parsed.d, parsed.h)) {
        localStorage.removeItem(SAVE_KEY);
        return { ...DEFAULT };
      }
      return { ...DEFAULT, ...sanitizeProgress(parsed.d) };
    }

    return writeSave({ ...DEFAULT, ...parsed });
  } catch {
    localStorage.removeItem(SAVE_KEY);
    return { ...DEFAULT };
  }
}

export function saveProgress(p) {
  writeSave(p);
}

export function getStars(p, levelId) {
  return p.stars[String(levelId)] || 0;
}

export function setStars(p, levelId, stars) {
  const k = String(levelId);
  const clean = Math.max(0, Math.min(3, Math.floor(stars)));
  if ((p.stars[k] || 0) < clean) p.stars[k] = clean;
  if (clean > 0 && levelId >= p.unlocked) p.unlocked = Math.max(p.unlocked, levelId + 1);
  Object.assign(p, sanitizeProgress(p));
  saveProgress(p);
}

export function setEndlessBest(p, score) {
  const clean = Math.max(0, Math.min(250000, Math.floor(score)));
  if (clean > (p.endlessBest || 0)) {
    p.endlessBest = clean;
    saveProgress(p);
  }
}

export function addXp(p, amount) {
  const add = Math.max(0, Math.floor(amount));
  if (!add) return 0;
  p.xp = (p.xp || 0) + add;
  saveProgress(p);
  return add;
}

export function unlockAchievement(p, id) {
  if (!ACHIEVEMENTS[id]) return null;
  if (!p.achievements) p.achievements = [];
  if (p.achievements.includes(id)) return null;
  p.achievements.push(id);
  const bonus = ACHIEVEMENTS[id].xp;
  p.xp = (p.xp || 0) + bonus;
  saveProgress(p);
  return ACHIEVEMENTS[id];
}

export function touchDailyStreak(p) {
  const today = todayKey();
  const yday = String(yesterdaySeed());
  if (p.lastPlayDay === today) return p.streakDays || 0;
  if (p.lastPlayDay === yday) p.streakDays = (p.streakDays || 0) + 1;
  else p.streakDays = 1;
  p.lastPlayDay = today;
  saveProgress(p);
  return p.streakDays;
}

export function recordDailyScore(p, score) {
  const today = todayKey();
  const clean = Math.max(0, Math.floor(score));
  let beaten = false;
  if (p.dailyDate !== today) {
    p.dailyDate = today;
    p.dailyBest = 0;
  }
  if (clean > (p.dailyBest || 0)) {
    p.dailyBest = clean;
    beaten = true;
  }
  saveProgress(p);
  return beaten;
}

export function isDailyFresh(p) {
  return p.dailyDate !== todayKey();
}

export function getDailyBest(p) {
  if (p.dailyDate !== todayKey()) return 0;
  return p.dailyBest || 0;
}
