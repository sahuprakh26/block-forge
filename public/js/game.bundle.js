(() => {
  // public/js/phaser-shim.js
  var Phaser2 = window.Phaser;

  // public/js/config.js
  var GRID = 8;
  var CELL = 50;
  var BOARD_PAD = 12;
  var W = 430;
  var H = 780;
  var COLORS = [
    8490232,
    3718648,
    16020150,
    16638023,
    4906624,
    12616956,
    16478597
  ];
  var SAVE_KEY = "bf-save-v2";

  // public/js/saveGuard.js
  var MAX_LEVEL = 15;
  var MAX_ENDLESS = 25e4;
  var PEPPER = ["bf", "7k", "2m", "9x", "p1", "q4"].join("");
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
    Object.keys(p.stars || {}).sort((a, b) => Number(a) - Number(b)).forEach((k) => {
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
      lp: p.lastPlayDay || ""
    });
  }
  function sealSave(data) {
    return fnv1a(canonical(data) + PEPPER);
  }
  function verifySave(data, hash) {
    return typeof hash === "string" && sealSave(data) === hash;
  }
  function maxUnlockedFromStars(stars) {
    let max = 1;
    for (let l = 1; l < MAX_LEVEL; l++) {
      const s = Math.floor(Number(stars[String(l)]) || 0);
      if (s >= 1) max = Math.max(max, l + 1);
    }
    return max;
  }
  function sanitizeProgress(raw) {
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
    const xp = Math.max(0, Math.min(5e4, Math.floor(Number(raw.xp) || 0)));
    const achievements = Array.isArray(raw.achievements) ? raw.achievements.filter((a) => typeof a === "string").slice(0, 32) : [];
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
      lastPlayDay
    };
  }

  // public/js/shapes.js
  var SHAPES = [
    { id: "I4", cells: [[0, 0], [0, 1], [0, 2], [0, 3]] },
    { id: "I3", cells: [[0, 0], [0, 1], [0, 2]] },
    { id: "I2", cells: [[0, 0], [0, 1]] },
    { id: "O", cells: [[0, 0], [0, 1], [1, 0], [1, 1]] },
    { id: "L3", cells: [[0, 0], [1, 0], [2, 0], [2, 1]] },
    { id: "L4", cells: [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]] },
    { id: "T4", cells: [[0, 0], [0, 1], [0, 2], [1, 1]] },
    { id: "S", cells: [[0, 1], [0, 2], [1, 0], [1, 1]] },
    { id: "Z", cells: [[0, 0], [0, 1], [1, 1], [1, 2]] },
    { id: "dot", cells: [[0, 0]] },
    { id: "penta", cells: [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0]] }
  ];
  function randomShape(rng = Math.random) {
    const s = SHAPES[Math.floor(rng() * SHAPES.length)];
    const color = Math.floor(rng() * 7);
    return { ...s, color, uid: Math.random().toString(36).slice(2) };
  }
  function randomTray(count = 3, rng = Math.random) {
    return Array.from({ length: count }, () => randomShape(rng));
  }
  function mulberry32(a) {
    return function() {
      a |= 0;
      a = a + 1831565813 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function dailySeed() {
    const d = /* @__PURE__ */ new Date();
    return d.getUTCFullYear() * 1e4 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
  }

  // public/js/meta.js
  var RANKS = [
    { name: "Iron", xp: 0, color: 5395035, stroke: 10592682, text: "#f4f4f5", letter: "I", metal: "iron" },
    { name: "Bronze", xp: 50, color: 10105874, stroke: 15357964, text: "#ffedd5", letter: "B", metal: "bronze" },
    { name: "Silver", xp: 120, color: 6583435, stroke: 14870768, text: "#f8fafc", letter: "S", metal: "silver" },
    { name: "Gold", xp: 220, color: 16757504, stroke: 16771584, text: "#422006", letter: "G", metal: "gold" },
    { name: "Platinum", xp: 360, color: 440020, stroke: 6809849, text: "#ecfeff", letter: "P", metal: "platinum" },
    { name: "Diamond", xp: 540, color: 959977, stroke: 8246268, text: "#e0f2fe", letter: "D", metal: "diamond" },
    { name: "Master", xp: 760, color: 9647082, stroke: 12616956, text: "#faf5ff", letter: "M", metal: "master" },
    { name: "Grandmaster", xp: 1020, color: 14362487, stroke: 16020150, text: "#fdf2f8", letter: "GM", metal: "grand" },
    { name: "Champion", xp: 1320, color: 14427686, stroke: 16557477, text: "#fef2f2", letter: "C", metal: "champion" },
    { name: "Legend", xp: 1680, color: 15357964, stroke: 16628340, text: "#fff7ed", letter: "L", metal: "legend" },
    { name: "Mythic", xp: 2100, color: 5195493, stroke: 10859772, text: "#eef2ff", letter: "X", metal: "mythic" },
    { name: "Immortal", xp: 2600, color: 16436245, stroke: 16707722, text: "#422006", letter: "\u2605", metal: "immortal" }
  ];
  var ACHIEVEMENTS = {
    first_clear: { title: "First Spark", desc: "Clear your first line", xp: 30 },
    combo_3: { title: "Triple Threat", desc: "Hit a 3-line combo", xp: 50 },
    combo_4: { title: "Gridquake", desc: "4+ lines at once!", xp: 80 },
    streak_5: { title: "On Fire", desc: "5 clear streak", xp: 60 },
    endless_1k: { title: "Survivor", desc: "Score 1000 in Endless", xp: 70 },
    daily_win: { title: "Daily Grinder", desc: "Beat today's Daily score", xp: 40 },
    three_star: { title: "Perfectionist", desc: "Earn 3 stars on a level", xp: 55 }
  };
  function getRank(xp) {
    let rank = RANKS[0];
    for (const r of RANKS) if (xp >= r.xp) rank = r;
    return rank;
  }
  function getNextRank(xp) {
    for (const r of RANKS) if (r.xp > xp) return r;
    return null;
  }
  function rankProgress(xp) {
    const rank = getRank(xp);
    const next = getNextRank(xp);
    const prevXp = rank.xp;
    const nextXp = next ? next.xp : prevXp + 800;
    const ratio = Math.min(1, (xp - prevXp) / Math.max(1, nextXp - prevXp));
    return { rank, next, prevXp, nextXp, ratio };
  }
  function streakMult(clearStreak) {
    if (clearStreak < 2) return 1;
    return Math.min(2.5, 1 + (clearStreak - 1) * 0.25);
  }
  function yesterdaySeed() {
    const d = /* @__PURE__ */ new Date();
    d.setUTCDate(d.getUTCDate() - 1);
    return d.getUTCFullYear() * 1e4 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
  }
  function todayKey() {
    return String(dailySeed());
  }

  // public/js/progress.js
  var DEFAULT = {
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
    lastPlayDay: ""
  };
  function writeSave(data) {
    const d = sanitizeProgress(data);
    localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 2, d, h: sealSave(d) }));
    return d;
  }
  function loadProgress() {
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
  function saveProgress(p) {
    writeSave(p);
  }
  function getStars(p, levelId) {
    return p.stars[String(levelId)] || 0;
  }
  function setStars(p, levelId, stars) {
    const k = String(levelId);
    const clean2 = Math.max(0, Math.min(3, Math.floor(stars)));
    if ((p.stars[k] || 0) < clean2) p.stars[k] = clean2;
    if (clean2 > 0 && levelId >= p.unlocked) p.unlocked = Math.max(p.unlocked, levelId + 1);
    Object.assign(p, sanitizeProgress(p));
    saveProgress(p);
  }
  function setEndlessBest(p, score) {
    const clean2 = Math.max(0, Math.min(25e4, Math.floor(score)));
    if (clean2 > (p.endlessBest || 0)) {
      p.endlessBest = clean2;
      saveProgress(p);
    }
  }
  function addXp(p, amount) {
    const add = Math.max(0, Math.floor(amount));
    if (!add) return 0;
    p.xp = (p.xp || 0) + add;
    saveProgress(p);
    return add;
  }
  function unlockAchievement(p, id) {
    if (!ACHIEVEMENTS[id]) return null;
    if (!p.achievements) p.achievements = [];
    if (p.achievements.includes(id)) return null;
    p.achievements.push(id);
    const bonus = ACHIEVEMENTS[id].xp;
    p.xp = (p.xp || 0) + bonus;
    saveProgress(p);
    return ACHIEVEMENTS[id];
  }
  function touchDailyStreak(p) {
    const today = todayKey();
    const yday = String(yesterdaySeed());
    if (p.lastPlayDay === today) return p.streakDays || 0;
    if (p.lastPlayDay === yday) p.streakDays = (p.streakDays || 0) + 1;
    else p.streakDays = 1;
    p.lastPlayDay = today;
    saveProgress(p);
    return p.streakDays;
  }
  function recordDailyScore(p, score) {
    const today = todayKey();
    const clean2 = Math.max(0, Math.floor(score));
    let beaten = false;
    if (p.dailyDate !== today) {
      p.dailyDate = today;
      p.dailyBest = 0;
    }
    if (clean2 > (p.dailyBest || 0)) {
      p.dailyBest = clean2;
      beaten = true;
    }
    saveProgress(p);
    return beaten;
  }
  function isDailyFresh(p) {
    return p.dailyDate !== todayKey();
  }
  function getDailyBest(p) {
    if (p.dailyDate !== todayKey()) return 0;
    return p.dailyBest || 0;
  }

  // public/js/audio.js
  var sharedCtx = null;
  function acquireContext() {
    if (!sharedCtx) sharedCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (sharedCtx.state === "suspended") sharedCtx.resume();
    return sharedCtx;
  }
  var Sfx = class {
    constructor() {
      this.ctx = null;
      this.enabled = loadProgress().sound !== false;
    }
    ensure() {
      if (!this.enabled) return false;
      this.ctx = acquireContext();
      return true;
    }
    tone(freq, dur = 0.08, type = "sine", vol = 0.12, slide = 0) {
      if (!this.ensure()) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(1e-3, t + dur);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    }
    noise(dur = 0.06, vol = 0.04) {
      if (!this.ensure()) return;
      const bufferSize = this.ctx.sampleRate * dur;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      const src = this.ctx.createBufferSource();
      src.buffer = buffer;
      const gain = this.ctx.createGain();
      gain.gain.value = vol;
      src.connect(gain);
      gain.connect(this.ctx.destination);
      src.start();
    }
    play(name) {
      switch (name) {
        case "click":
          this.tone(520, 0.05, "triangle", 0.08);
          break;
        case "pickup":
          this.tone(380, 0.06, "sine", 0.1, 80);
          break;
        case "drop":
          this.tone(220, 0.07, "triangle", 0.12, -40);
          this.noise(0.03, 0.025);
          break;
        case "invalid":
          this.tone(140, 0.12, "sawtooth", 0.06, -30);
          break;
        case "clear":
          this.tone(440, 0.1, "sine", 0.1);
          this.timeDelay(() => this.tone(660, 0.12, "sine", 0.1), 60);
          break;
        case "combo":
          this.tone(550, 0.08, "square", 0.08);
          this.timeDelay(() => this.tone(770, 0.1, "square", 0.08), 50);
          this.timeDelay(() => this.tone(990, 0.14, "square", 0.07), 100);
          break;
        case "win":
          [523, 659, 784, 1047].forEach((f, i) => this.timeDelay(() => this.tone(f, 0.18, "sine", 0.1), i * 90));
          break;
        case "lose":
          this.tone(330, 0.2, "sawtooth", 0.08, -120);
          break;
        case "tray":
          this.tone(300, 0.05, "triangle", 0.06, 60);
          break;
        default:
          break;
      }
    }
    timeDelay(fn, ms) {
      setTimeout(fn, ms);
    }
    toggle(on) {
      this.enabled = on;
      const p = loadProgress();
      p.sound = on;
      saveProgress(p);
    }
    isOn() {
      return this.enabled;
    }
  };
  var sfx = new Sfx();

  // public/js/music.js
  var BPM = 108;
  var BEAT = 60 / BPM;
  var BAR = BEAT * 4;
  var BASS_LINE = [
    110,
    110,
    87.31,
    87.31,
    98,
    98,
    82.41,
    82.41,
    110,
    110,
    130.81,
    130.81,
    98,
    98,
    73.42,
    73.42
  ];
  var MELODY = [
    440,
    0,
    523.25,
    0,
    659.25,
    587.33,
    523.25,
    0,
    392,
    0,
    493.88,
    0,
    587.33,
    523.25,
    440,
    0,
    523.25,
    0,
    659.25,
    0,
    783.99,
    659.25,
    587.33,
    0,
    440,
    493.88,
    523.25,
    587.33,
    659.25,
    587.33,
    523.25,
    440
  ];
  var Bgm = class {
    constructor() {
      this.enabled = loadProgress().music !== false;
      this.playing = false;
      this.timer = null;
      this.master = null;
      this.ctx = null;
      this.beatIndex = 0;
      this.unlocked = false;
    }
    ensure() {
      if (!this.enabled) return false;
      this.ctx = acquireContext();
      if (!this.master) {
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.42;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {
        });
      }
      return true;
    }
    /** Call after user gesture — required on mobile browsers */
    unlock() {
      if (!this.ensure()) return;
      this.unlocked = true;
      if (this.ctx.state === "suspended") {
        this.ctx.resume().then(() => {
          if (this.enabled && !this.playing) this.start();
        });
        return;
      }
      if (this.enabled && !this.playing) this.start();
    }
    kick(start, vol = 0.55) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(90, start);
      osc.frequency.exponentialRampToValueAtTime(42, start + 0.08);
      gain.gain.setValueAtTime(vol, start);
      gain.gain.exponentialRampToValueAtTime(1e-3, start + 0.14);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(start);
      osc.stop(start + 0.16);
    }
    hat(start, vol = 0.12) {
      const len = Math.floor(this.ctx.sampleRate * 0.04);
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(vol, start);
      gain.gain.exponentialRampToValueAtTime(1e-3, start + 0.04);
      src.connect(gain);
      gain.connect(this.master);
      src.start(start);
      src.stop(start + 0.05);
    }
    note(freq, start, dur, type = "triangle", vol = 0.14) {
      if (!freq) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(1e-3, start);
      gain.gain.exponentialRampToValueAtTime(vol, start + 0.02);
      gain.gain.setValueAtTime(vol * 0.7, start + dur * 0.6);
      gain.gain.exponentialRampToValueAtTime(1e-3, start + dur);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(start);
      osc.stop(start + dur + 0.02);
    }
    pad(freq, start, dur) {
      if (!freq) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(1e-3, start);
      gain.gain.exponentialRampToValueAtTime(0.06, start + 0.15);
      gain.gain.exponentialRampToValueAtTime(1e-3, start + dur);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(start);
      osc.stop(start + dur + 0.02);
    }
    playBeat() {
      if (!this.playing || !this.ctx) return;
      const t = this.ctx.currentTime + 0.05;
      const i = this.beatIndex;
      this.beatIndex = (i + 1) % BASS_LINE.length;
      if (i % 2 === 0) this.kick(t, 0.5);
      if (i % 2 === 1) this.hat(t, 0.1);
      else this.hat(t + BEAT * 0.5, 0.06);
      const bass = BASS_LINE[i];
      this.note(bass, t, BEAT * 0.9, "sine", 0.2);
      if (i % 4 === 0) this.pad(bass * 0.5, t, BAR * 0.95);
      const mel = MELODY[i];
      if (mel) this.note(mel, t, BEAT * 0.85, "triangle", 0.11);
      this.timer = setTimeout(() => this.playBeat(), BEAT * 1e3);
    }
    start() {
      if (!this.ensure() || this.playing) return;
      this.playing = true;
      this.playBeat();
    }
    stop() {
      this.playing = false;
      if (this.timer) clearTimeout(this.timer);
      this.timer = null;
    }
    toggle(on) {
      this.enabled = on;
      const p = loadProgress();
      p.music = on;
      saveProgress(p);
      if (on) {
        this.unlocked = true;
        this.start();
      } else this.stop();
    }
    isOn() {
      return this.enabled;
    }
  };
  var bgm = new Bgm();

  // public/js/layout.js
  function measureSafeInsets() {
    if (typeof document === "undefined") return { top: 0, bottom: 0, topGame: 0, bottomGame: 0 };
    const el = document.createElement("div");
    el.style.cssText = "position:fixed;left:0;top:0;visibility:hidden;pointer-events:none;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)";
    document.body.appendChild(el);
    const cs = getComputedStyle(el);
    const top = parseFloat(cs.paddingTop) || 0;
    const bottom = parseFloat(cs.paddingBottom) || 0;
    el.remove();
    const game = window.__bfGame;
    const sh = game?.scale?.displaySize?.height || window.innerHeight || H;
    const gh = game?.scale?.gameSize?.height || H;
    const ratio = gh / Math.max(1, sh);
    return {
      top,
      bottom,
      topGame: Math.round(top * ratio),
      bottomGame: Math.round(bottom * ratio)
    };
  }
  function insetY() {
    const ins = window.__bfSafeInsets || { topGame: 0, bottomGame: 0 };
    return {
      top: 14 + (ins.topGame || 0),
      bottom: 18 + (ins.bottomGame || 0)
    };
  }
  function menuLayout(height = H) {
    const { top, bottom } = insetY();
    let y = top;
    const logoY = y + 52;
    y += 108;
    const rankCardH = 128;
    const rankCardY = y + rankCardH / 2;
    y += rankCardH + 14;
    const statsY = y + 14;
    y += 30;
    const btnGap = 58;
    const btnCampaign = y + 30;
    const btnDaily = btnCampaign + btnGap;
    const btnEndless = btnDaily + btnGap;
    const btnRankings = btnEndless + btnGap;
    y = btnRankings + 40;
    const nameY = Math.min(y + 22, height - bottom - 92);
    const audioY = height - bottom - 30;
    const footerY = height - bottom - 62;
    const compact = height - top - bottom < 680;
    return {
      compact,
      logoY,
      rankCardY,
      rankCardH,
      rankCardW: W - 28,
      statsY,
      btnCampaign,
      btnDaily,
      btnEndless,
      btnRankings,
      nameY,
      audioY,
      footerY,
      btnGap,
      btnH: compact ? 50 : 54,
      btnW: W - 32
    };
  }
  var HUD_HEADER = {
    navY: 26,
    titleY: 78,
    scoreLabelY: 70,
    scoreValueY: 90,
    streakY: 70,
    goalY: 80,
    movesY: 106
  };
  function mapLayout(width = W, height = H) {
    const { top } = insetY();
    return {
      titleY: top + 64,
      starsY: top + 98,
      barY: top + 118,
      startY: top + 142,
      width,
      height
    };
  }
  function leaderboardLayout(height = H) {
    const { top, bottom } = insetY();
    const headerBottom = top + 156;
    const listStart = headerBottom + 120;
    const maxRows = Math.max(5, Math.floor((height - listStart - bottom - 16) / 40));
    return {
      headerY: top + 54,
      statusY: top + 104,
      myRankY: top + 124,
      tabsY: top + 144,
      refreshY: top + 144,
      podiumY: headerBottom + 10,
      listStart,
      listRow: 40,
      panelY: listStart + (height - bottom - 8 - listStart) / 2,
      panelH: height - listStart - bottom - 12,
      maxRows
    };
  }

  // public/js/textUtil.js
  function uiResolution() {
    if (typeof window === "undefined") return 1;
    return Math.min(2, Math.max(1, window.devicePixelRatio || 1));
  }
  function applyCrispText(textObj) {
    const r = uiResolution();
    if (r > 1 && textObj.setResolution) textObj.setResolution(r);
    return textObj;
  }
  function uiTextStyle(overrides = {}) {
    return {
      fontFamily: "Outfit, sans-serif",
      color: "#e2e8f0",
      stroke: "#0f172a",
      strokeThickness: 2,
      ...overrides
    };
  }

  // public/js/scenes/BootScene.js
  var BootScene = class extends Phaser.Scene {
    constructor() {
      super("Boot");
    }
    create() {
      this.add.rectangle(W / 2, H / 2, W, H, 395538);
      const loadTxt = this.add.text(W / 2, H / 2, "BLOCK FORGE", {
        fontFamily: "Syne, sans-serif",
        fontSize: "28px",
        fontStyle: "800",
        color: "#38bdf8"
      }).setOrigin(0.5).setAlpha(0.6);
      this.tweens.add({ targets: loadTxt, alpha: 0.95, duration: 600, yoyo: true, repeat: -1 });
      this.time.delayedCall(80, () => {
        try {
          this.generateTextures();
        } catch (e) {
          console.error("Texture gen failed", e);
        }
        loadTxt.destroy();
        this.scene.start("Menu");
      });
    }
    generateTextures() {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      const size = CELL;
      for (let i = 0; i < COLORS.length; i++) {
        const base = COLORS[i];
        const c = Phaser.Display.Color.IntegerToColor(base);
        const dark = Phaser.Display.Color.GetColor(
          Math.max(0, c.red - 55),
          Math.max(0, c.green - 55),
          Math.max(0, c.blue - 55)
        );
        const mid = Phaser.Display.Color.GetColor(
          Math.min(255, c.red + 10),
          Math.min(255, c.green + 10),
          Math.min(255, c.blue + 10)
        );
        const shine = Phaser.Display.Color.GetColor(
          Math.min(255, c.red + 70),
          Math.min(255, c.green + 70),
          Math.min(255, c.blue + 70)
        );
        g.clear();
        g.fillStyle(dark, 1);
        g.fillRoundedRect(5, 8, size - 6, size - 6, 10);
        g.fillStyle(base, 1);
        g.fillRoundedRect(2, 2, size - 6, size - 6, 10);
        g.fillStyle(mid, 0.55);
        g.fillRoundedRect(4, 4, size - 12, size - 14, 9);
        g.fillStyle(shine, 0.5);
        g.fillRoundedRect(6, 5, size - 22, 16, 6);
        g.fillStyle(16777215, 0.65);
        g.fillCircle(12, 11, 5);
        g.fillStyle(16777215, 0.12);
        g.fillRoundedRect(7, 18, size - 22, size - 26, 6);
        g.lineStyle(2, 16777215, 0.28);
        g.strokeRoundedRect(2, 2, size - 6, size - 6, 10);
        g.lineStyle(1, shine, 0.35);
        g.strokeRoundedRect(3, 3, size - 8, size - 8, 9);
        g.generateTexture(`block-${i}`, size, size);
      }
      g.clear();
      g.fillStyle(1186350, 0.92);
      g.fillRoundedRect(0, 0, size, size, 9);
      g.lineStyle(1, 4674921, 0.7);
      g.strokeRoundedRect(0, 0, size, size, 9);
      g.fillStyle(8490232, 0.06);
      g.fillRoundedRect(2, 2, size - 4, size - 4, 8);
      g.fillStyle(16777215, 0.04);
      g.fillCircle(size / 2, size / 3, size * 0.22);
      g.generateTexture("cell-empty", size, size);
      g.clear();
      g.fillStyle(16777215, 1);
      g.fillCircle(4, 4, 4);
      g.generateTexture("particle", 8, 8);
      g.clear();
      g.fillStyle(16777215, 0.2);
      g.fillCircle(16, 16, 14);
      g.generateTexture("glow-soft", 32, 32);
      g.clear();
      g.fillGradientStyle(8490232, 3718648, 12616956, 4906624, 0.4);
      g.fillRect(0, 0, 64, 64);
      g.generateTexture("bg-noise", 64, 64);
    }
  };

  // public/js/fx.js
  function drawBackdrop(scene, width, height) {
    const g = scene.add.graphics().setDepth(-10);
    g.fillGradientStyle(395538, 791080, 1055285, 661032, 1);
    g.fillRect(0, 0, width, height);
    const sheen = scene.add.graphics().setDepth(-9).setAlpha(0.35);
    sheen.fillGradientStyle(6514417, 6514417, 0, 0, 0.12);
    sheen.fillCircle(width * 0.5, height * 0.08, width * 0.45);
    if (scene.textures.exists("bg-noise")) {
      scene.add.image(width / 2, height / 2, "bg-noise").setDepth(-8).setAlpha(0.04).setDisplaySize(width, height);
    }
    for (let i = 0; i < 12; i++) {
      const star = scene.add.circle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        Phaser.Math.FloatBetween(0.6, 1.8),
        16777215,
        Phaser.Math.FloatBetween(0.08, 0.35)
      ).setDepth(-7);
      scene.tweens.add({
        targets: star,
        alpha: { from: star.alpha, to: star.alpha * 0.3 },
        duration: Phaser.Math.Between(1500, 4e3),
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut"
      });
    }
    const orbs = [
      { x: width * 0.15, y: height * 0.12, r: 130, c: 8490232 },
      { x: width * 0.88, y: height * 0.28, r: 90, c: 3718648 },
      { x: width * 0.5, y: height * 0.92, r: 110, c: 12616956 }
    ];
    orbs.forEach((o) => {
      const blob = scene.add.circle(o.x, o.y, o.r, o.c, 0.09).setDepth(-9);
      scene.tweens.add({
        targets: blob,
        scale: { from: 0.92, to: 1.08 },
        alpha: { from: 0.06, to: 0.14 },
        duration: Phaser.Math.Between(3200, 4800),
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut"
      });
    });
    return g;
  }
  function transitionTo(scene, key, data = {}) {
    sfx.play("click");
    scene.cameras.main.fadeOut(220, 10, 14, 26);
    scene.time.delayedCall(220, () => scene.scene.start(key, data));
  }
  function fadeInScene(scene, ms = 320) {
    scene.cameras.main.fadeIn(ms, 10, 14, 26);
  }
  function scorePopup(scene, x, y, pts, color = "#fde047") {
    const t = scene.add.text(x, y, `+${pts}`, {
      fontFamily: "Outfit, sans-serif",
      fontSize: "18px",
      fontStyle: "800",
      color,
      stroke: "#0f172a",
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(55).setAlpha(0.9);
    scene.tweens.add({
      targets: t,
      y: y - 36,
      alpha: 0,
      scale: 1.2,
      duration: 650,
      ease: "Cubic.easeOut",
      onComplete: () => t.destroy()
    });
  }
  function lineSweep(scene, boardX, boardY, cell, grid, rows, cols) {
    const flash = scene.add.graphics().setDepth(15).setAlpha(0.85);
    flash.fillStyle(16777215, 0.65);
    rows.forEach((r) => {
      flash.fillRoundedRect(boardX, boardY + r * cell, grid * cell, cell, 4);
    });
    cols.forEach((c) => {
      flash.fillRoundedRect(boardX + c * cell, boardY, cell, grid * cell, 4);
    });
    scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 280,
      ease: "Quad.easeOut",
      onComplete: () => flash.destroy()
    });
  }
  function confettiBurst(scene, count = 28) {
    const colors = [8490232, 3718648, 16638023, 16020150, 4906624];
    for (let i = 0; i < count; i++) {
      const x = Phaser.Math.Between(40, W - 40);
      const p = scene.add.rectangle(x, -10, Phaser.Math.Between(4, 8), Phaser.Math.Between(8, 14), Phaser.Utils.Array.GetRandom(colors)).setDepth(110);
      scene.tweens.add({
        targets: p,
        y: 820,
        x: x + Phaser.Math.Between(-80, 80),
        angle: Phaser.Math.Between(-360, 360),
        alpha: { from: 1, to: 0.3 },
        duration: Phaser.Math.Between(1200, 2200),
        delay: Phaser.Math.Between(0, 400),
        ease: "Cubic.easeIn",
        onComplete: () => p.destroy()
      });
    }
  }
  function animateStars(scene, x, y, count, depth = 105) {
    const stars = [];
    for (let i = 0; i < 3; i++) {
      const sx = x + (i - 1) * 44;
      const filled = i < count;
      const star = scene.add.text(sx, y, filled ? "\u2605" : "\u2606", {
        fontSize: "36px",
        color: filled ? "#fde047" : "#475569"
      }).setOrigin(0.5).setDepth(depth).setScale(0);
      stars.push(star);
      scene.time.delayedCall(200 + i * 180, () => {
        scene.tweens.add({
          targets: star,
          scale: filled ? 1.25 : 1,
          duration: 350,
          ease: "Back.easeOut",
          onComplete: () => {
            if (filled) sfx.play("click");
          }
        });
        if (filled) {
          scene.tweens.add({
            targets: star,
            scale: 1.1,
            duration: 200,
            yoyo: true,
            delay: 400
          });
        }
      });
    }
    return stars;
  }
  function updateNearFullHints(scene, gridData, boardX, boardY, cell, gridSize, hintGfx) {
    hintGfx.clear();
    hintGfx.fillStyle(3718648, 0.1);
    for (let r = 0; r < gridSize; r++) {
      const empty = gridData[r].filter((v) => v === 0).length;
      if (empty > 0 && empty <= 2) {
        hintGfx.fillRoundedRect(boardX, boardY + r * cell, gridSize * cell, cell, 4);
      }
    }
    for (let c = 0; c < gridSize; c++) {
      let empty = 0;
      for (let r = 0; r < gridSize; r++) if (gridData[r][c] === 0) empty++;
      if (empty > 0 && empty <= 2) {
        hintGfx.fillRoundedRect(boardX + c * cell, boardY, cell, gridSize * cell, 4);
      }
    }
  }
  function achievementToast(scene, title, xp) {
    const box = scene.add.container(W / 2, 120).setDepth(80).setAlpha(0);
    const bg = scene.add.rectangle(0, 0, 300, 56, 1976635, 0.96).setStrokeStyle(2, 16638023);
    const t1 = scene.add.text(0, -8, "\u{1F3C6} " + title, { fontFamily: "Syne, sans-serif", fontSize: "15px", fontStyle: "700", color: "#fde047" }).setOrigin(0.5);
    const t2 = scene.add.text(0, 14, `+${xp} XP`, { fontFamily: "Outfit, sans-serif", fontSize: "12px", color: "#94a3b8" }).setOrigin(0.5);
    box.add([bg, t1, t2]);
    scene.tweens.add({ targets: box, alpha: 1, y: 100, duration: 280, ease: "Back.easeOut" });
    scene.tweens.add({
      targets: box,
      alpha: 0,
      y: 80,
      duration: 300,
      delay: 2200,
      onComplete: () => box.destroy()
    });
  }
  function feverBanner(scene, text, color = "#f97316") {
    const t = scene.add.text(W / 2, 108, text, {
      fontFamily: "Syne, sans-serif",
      fontSize: "20px",
      fontStyle: "800",
      color,
      stroke: "#0f172a",
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(60).setScale(0.6);
    scene.tweens.add({
      targets: t,
      scale: 1.1,
      duration: 200,
      yoyo: true,
      hold: 400,
      onComplete: () => {
        scene.tweens.add({ targets: t, alpha: 0, duration: 300, onComplete: () => t.destroy() });
      }
    });
  }
  function niceClearPop(scene, x, y, label = "NICE!") {
    const t = scene.add.text(x, y, label, {
      fontFamily: "Outfit, sans-serif",
      fontSize: "16px",
      fontStyle: "800",
      color: "#4ade80",
      stroke: "#0f172a",
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(55).setAlpha(0.9);
    scene.tweens.add({
      targets: t,
      y: y - 24,
      alpha: 0,
      duration: 500,
      onComplete: () => t.destroy()
    });
  }

  // public/js/uiTheme.js
  function drawRankEmblem(scene, parent, x, y, rank, radius = 34) {
    const g = scene.add.graphics();
    const r = radius;
    if (rank.metal === "gold") {
      g.fillStyle(11817737, 1);
      g.fillCircle(x, y + 2, r);
      g.fillStyle(16748288, 1);
      g.fillCircle(x, y, r - 2);
      g.fillStyle(16766720, 1);
      g.fillCircle(x, y - 1, r - 6);
      g.fillStyle(16774557, 0.85);
      g.fillCircle(x - r * 0.22, y - r * 0.28, r * 0.38);
      g.lineStyle(3, 16771584, 1);
      g.strokeCircle(x, y, r - 2);
      g.lineStyle(1, 16777215, 0.45);
      g.strokeCircle(x - 2, y - 3, r - 8);
    } else if (rank.metal === "silver") {
      g.fillStyle(4674921, 1);
      g.fillCircle(x, y + 2, r);
      g.fillStyle(9741240, 1);
      g.fillCircle(x, y, r - 2);
      g.fillStyle(14870768, 0.7);
      g.fillCircle(x - r * 0.2, y - r * 0.25, r * 0.32);
      g.lineStyle(3, rank.stroke, 1);
      g.strokeCircle(x, y, r - 2);
    } else if (rank.metal === "bronze") {
      g.fillStyle(7877903, 1);
      g.fillCircle(x, y + 2, r);
      g.fillStyle(rank.color, 1);
      g.fillCircle(x, y, r - 2);
      g.fillStyle(16628340, 0.5);
      g.fillCircle(x - r * 0.18, y - r * 0.22, r * 0.3);
      g.lineStyle(3, rank.stroke, 1);
      g.strokeCircle(x, y, r - 2);
    } else {
      g.fillStyle(988970, 0.5);
      g.fillCircle(x, y + 2, r);
      g.fillStyle(rank.color, 1);
      g.fillCircle(x, y, r - 2);
      g.lineStyle(3, rank.stroke || 16777215, 1);
      g.strokeCircle(x, y, r - 2);
    }
    parent.add(g);
    const letterSize = rank.letter?.length > 1 ? "14px" : "22px";
    const lbl = applyCrispText(
      scene.add.text(x, y, rank.letter || rank.name[0], uiTextStyle({
        fontFamily: "Syne, sans-serif",
        fontSize: letterSize,
        fontStyle: "800",
        color: rank.text || "#fff",
        stroke: rank.metal === "gold" ? "#5c4200" : "#0f172a",
        strokeThickness: rank.metal === "gold" ? 2 : 3
      })).setOrigin(0.5)
    );
    parent.add(lbl);
  }
  function drawMenuLogo(scene, x, y) {
    const c = scene.add.container(x, y).setDepth(4);
    const hasBlocks = scene.textures.exists("block-0");
    if (hasBlocks) {
      c.add(scene.add.image(-28, -6, "block-0").setScale(0.62).setAngle(-8));
      c.add(scene.add.image(30, -10, "block-1").setScale(0.62).setAngle(6));
      c.add(scene.add.image(0, 22, "block-3").setScale(0.68));
    } else {
      const g = scene.add.graphics();
      g.fillStyle(8490232, 1);
      g.fillRoundedRect(-40, -8, 22, 22, 5);
      g.fillStyle(3718648, 1);
      g.fillRoundedRect(18, -12, 22, 22, 5);
      g.fillStyle(16638023, 1);
      g.fillRoundedRect(-8, 14, 24, 24, 6);
      c.add(g);
    }
    const title = applyCrispText(
      scene.add.text(0, 58, "BLOCK FORGE", uiTextStyle({
        fontFamily: "Syne, sans-serif",
        fontSize: "38px",
        fontStyle: "800",
        color: "#38bdf8",
        stroke: "#0f172a",
        strokeThickness: 5
      })).setOrigin(0.5)
    );
    c.add(title);
    return c;
  }
  function drawGlassPanel(scene, x, y, w, h, opts = {}) {
    const depth = opts.depth ?? 4;
    const fill = opts.fill ?? 988970;
    const alpha = opts.alpha ?? 0.92;
    const stroke = opts.stroke ?? 6514417;
    const panel = scene.add.container(x, y).setDepth(depth);
    const outer = scene.add.rectangle(0, 0, w, h, fill, alpha).setStrokeStyle(2, stroke, 0.55);
    panel.add([outer]);
    return panel;
  }
  function drawRankCard(scene, x, y, w, h, progress, xp) {
    const { rank, next, nextXp, ratio } = progress;
    const depth = 6;
    const c = scene.add.container(x, y).setDepth(depth);
    const pad = 16;
    const left = -w / 2 + pad;
    const innerW = w - pad * 2;
    const top = -h / 2 + 12;
    c.add(
      scene.add.rectangle(0, 0, w, h, 791074, 0.96).setStrokeStyle(2, rank.stroke || rank.color, 0.9)
    );
    c.add(scene.add.rectangle(left, top + 4, 6, h - 24, rank.color, 1).setOrigin(0, 0));
    const badgeX = left + 34;
    const badgeY = top + 38;
    drawRankEmblem(scene, c, badgeX, badgeY, rank, 32);
    const textX = left + 76;
    applyCrispText(
      scene.add.text(textX, top + 24, rank.name.toUpperCase(), uiTextStyle({
        fontFamily: "Syne, sans-serif",
        fontSize: "28px",
        fontStyle: "800",
        color: rank.text || "#fff",
        strokeThickness: 3
      })).setOrigin(0, 0.5)
    );
    applyCrispText(
      scene.add.text(textX, top + 52, next ? `Next: ${next.name}` : "Max tier", uiTextStyle({
        fontSize: "16px",
        color: "#94a3b8",
        strokeThickness: 1
      })).setOrigin(0, 0.5)
    );
    const barY = top + 78;
    const barH = 16;
    c.add(scene.add.rectangle(left, barY, innerW, barH, 1976635).setOrigin(0, 0.5));
    const fillW = Math.max(6, innerW * ratio);
    const barColor = rank.metal === "gold" ? 16761095 : rank.color;
    c.add(scene.add.rectangle(left, barY, fillW, barH, barColor).setOrigin(0, 0.5));
    if (rank.metal === "gold" && fillW > 8) {
      c.add(scene.add.rectangle(left, barY - 3, fillW, barH * 0.35, 16775620, 0.35).setOrigin(0, 0.5));
    }
    applyCrispText(
      scene.add.text(left, barY + 24, `${xp} / ${nextXp} XP`, uiTextStyle({
        fontSize: "16px",
        fontStyle: "700",
        color: "#e2e8f0",
        strokeThickness: 1
      })).setOrigin(0, 0.5)
    );
    return c;
  }
  function makeGlowButton(scene, x, y, label, color, onClick, opts = {}) {
    const w = opts.width ?? 300;
    const h = opts.height ?? 54;
    const depth = opts.depth ?? 10;
    const container = scene.add.container(x, y).setDepth(depth);
    const shadow = scene.add.rectangle(2, 5, w, h, 0, 0.35);
    const bg = scene.add.rectangle(0, 0, w, h, color, 1).setStrokeStyle(2, 16777215, 0.18).setInteractive({ useHandCursor: true });
    const gloss = scene.add.rectangle(0, -h * 0.22, w - 12, h * 0.3, 16777215, 0.1);
    const txt = applyCrispText(
      scene.add.text(0, 0, label, uiTextStyle({
        fontSize: opts.fontSize ?? "17px",
        fontStyle: "700",
        color: "#fff",
        align: "center",
        wordWrap: { width: w - 24 },
        strokeThickness: 2
      })).setOrigin(0.5)
    );
    container.add([shadow, bg, gloss, txt]);
    const press = () => {
      sfx.ensure();
      sfx.play("click");
      scene.tweens.add({
        targets: container,
        scaleX: 0.96,
        scaleY: 0.96,
        duration: 70,
        yoyo: true,
        onComplete: onClick
      });
    };
    bg.on("pointerdown", press);
    txt.setInteractive({ useHandCursor: true }).on("pointerdown", press);
    return container;
  }
  function makePillTab(scene, x, y, label, active, onClick) {
    const w = 148;
    const h = 40;
    const bg = scene.add.rectangle(x, y, w, h, active ? 6514417 : 1976635, active ? 1 : 0.92).setStrokeStyle(2, active ? 10859772 : 4674921, active ? 0.9 : 0.5).setInteractive({ useHandCursor: true }).setDepth(15);
    const txt = applyCrispText(
      scene.add.text(x, y, label, uiTextStyle({
        fontSize: "14px",
        fontStyle: "700",
        color: active ? "#fff" : "#94a3b8"
      })).setOrigin(0.5).setDepth(16)
    );
    const fire = () => {
      sfx.play("click");
      onClick();
    };
    bg.on("pointerdown", fire);
    txt.setInteractive({ useHandCursor: true }).on("pointerdown", fire);
    return { bg, txt };
  }
  function drawScreenHeader(scene, x, y, title, subtitle) {
    applyCrispText(
      scene.add.text(x, y, title, uiTextStyle({
        fontFamily: "Syne, sans-serif",
        fontSize: "28px",
        fontStyle: "800",
        color: "#38bdf8",
        strokeThickness: 4
      })).setOrigin(0.5).setDepth(5)
    );
    if (subtitle) {
      applyCrispText(
        scene.add.text(x, y + 34, subtitle, uiTextStyle({
          fontSize: "14px",
          color: "#94a3b8",
          strokeThickness: 1
        })).setOrigin(0.5).setDepth(5)
      );
    }
  }
  function rankColors(i) {
    if (i === 0) return { bg: 16498468, stroke: 16638023, text: "#0f172a", medal: "\u{1F947}" };
    if (i === 1) return { bg: 9741240, stroke: 14870768, text: "#0f172a", medal: "\u{1F948}" };
    if (i === 2) return { bg: 11817737, stroke: 16628340, text: "#fff", medal: "\u{1F949}" };
    return { bg: 1120295, stroke: 3359061, text: "#e2e8f0", medal: `${i + 1}` };
  }

  // public/js/player.js
  var PLAYER_KEY = "bf-player";
  var MIN_NAME_LEN = 2;
  function clean(raw) {
    return String(raw || "").trim().slice(0, 16).replace(/[<>"'&\\]/g, "");
  }
  function isAutoPlayer(name) {
    return clean(name).toLowerCase() === "player";
  }
  function isValidName(name) {
    const n = clean(name);
    return n.length >= MIN_NAME_LEN && !isAutoPlayer(n);
  }
  function getPlayer() {
    try {
      const p = JSON.parse(localStorage.getItem(PLAYER_KEY) || "{}");
      const id = p.id || crypto.randomUUID?.() || "p" + Math.random().toString(36).slice(2, 12);
      let name = clean(p.name);
      let nameSet = !!p.nameSet;
      if (nameSet && isAutoPlayer(name)) {
        nameSet = false;
        name = "";
      }
      if (id && nameSet && isValidName(name)) {
        return { id, name, nameSet: true };
      }
      const out = { id, name: nameSet ? name : "", nameSet: false };
      localStorage.setItem(PLAYER_KEY, JSON.stringify(out));
      return out;
    } catch {
      return { id: "p" + Date.now(), name: "", nameSet: false };
    }
  }
  function setPlayerName(name) {
    const n = clean(name);
    if (!isValidName(n)) return null;
    const p = getPlayer();
    p.name = n;
    p.nameSet = true;
    localStorage.setItem(PLAYER_KEY, JSON.stringify(p));
    return p;
  }
  function hasName() {
    const p = getPlayer();
    return !!p.nameSet && isValidName(p.name);
  }

  // public/js/namePrompt.js
  function pauseGameInput() {
    const game = window.__bfGame;
    if (!game?.input) return null;
    const state = { input: game.input.enabled, keyboard: game.input.keyboard?.enabled };
    game.input.enabled = false;
    if (game.input.keyboard) game.input.keyboard.enabled = false;
    return state;
  }
  function resumeGameInput(state) {
    const game = window.__bfGame;
    if (!game?.input || !state) return;
    game.input.enabled = state.input;
    if (game.input.keyboard && state.keyboard !== void 0) game.input.keyboard.enabled = state.keyboard;
  }
  function stopKeys(el) {
    ["keydown", "keyup", "keypress"].forEach((evt) => {
      el.addEventListener(evt, (e) => e.stopPropagation());
    });
  }
  function initialValue(name) {
    const n = String(name || "").trim();
    if (!n || n.toLowerCase() === "player") return "";
    return n;
  }
  function promptName(initial = "") {
    return new Promise((resolve) => {
      const prevInput = pauseGameInput();
      const wrap = document.createElement("div");
      wrap.id = "name-modal";
      wrap.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.85);display:flex;align-items:center;justify-content:center;z-index:99999;pointer-events:auto";
      const panel = document.createElement("div");
      panel.style.cssText = "background:#1e293b;border:2px solid #6366f1;border-radius:16px;padding:24px;width:min(320px,90vw);text-align:center;font-family:Outfit,sans-serif;pointer-events:auto";
      panel.innerHTML = `
      <h3 style="color:#38bdf8;margin-bottom:8px;font-size:18px">Apna naam likho</h3>
      <p style="color:#94a3b8;font-size:13px;margin-bottom:16px">Yeh naam global rankings par dikhega</p>
      <input id="name-input" type="text" maxlength="16" placeholder="e.g. Rahul, Priya..." autocomplete="nickname"
        style="width:100%;padding:12px;border-radius:8px;border:1px solid #475569;background:#0f172a;color:#fff;font-size:16px;margin-bottom:8px;user-select:text;-webkit-user-select:text;pointer-events:auto;outline:none" />
      <p id="name-err" style="color:#f87171;font-size:12px;margin-bottom:8px;min-height:16px"></p>
      <button type="button" id="name-save" style="width:100%;padding:12px;border:none;border-radius:8px;background:#6366f1;color:#fff;font-weight:700;font-size:16px;cursor:pointer">Save</button>
    `;
      wrap.appendChild(panel);
      document.body.appendChild(wrap);
      const input = panel.querySelector("#name-input");
      const btn = panel.querySelector("#name-save");
      const err = panel.querySelector("#name-err");
      input.value = initialValue(initial);
      stopKeys(input);
      stopKeys(panel);
      const trySave = () => {
        const saved = setPlayerName(input.value);
        if (!saved) {
          err.textContent = "Kam se kam 2 letters \u2014 asli naam likho (Player mat likho)";
          input.style.borderColor = "#f87171";
          input.focus();
          return;
        }
        wrap.remove();
        resumeGameInput(prevInput);
        resolve(saved.name);
      };
      btn.onclick = trySave;
      input.onkeydown = (e) => {
        e.stopPropagation();
        if (e.key === "Enter") {
          e.preventDefault();
          trySave();
        }
      };
      input.oninput = () => {
        err.textContent = "";
        input.style.borderColor = "#475569";
      };
      wrap.addEventListener("pointerdown", (e) => e.stopPropagation());
      setTimeout(() => input.focus(), 50);
    });
  }
  async function ensureName() {
    if (hasName()) return getPlayer().name;
    while (!hasName()) {
      await promptName("");
    }
    return getPlayer().name;
  }

  // public/js/version.js
  var APP_VERSION = "1.2.2";

  // public/js/scenes/MenuScene.js
  var MenuScene = class extends Phaser.Scene {
    constructor() {
      super("Menu");
    }
    create() {
      const L = menuLayout(H);
      drawBackdrop(this, W, H);
      drawMenuLogo(this, W / 2, L.logoY);
      const p = loadProgress();
      const xp = p.xp || 0;
      drawRankCard(this, W / 2, L.rankCardY, L.rankCardW, L.rankCardH, rankProgress(xp), xp);
      const totalStars = Object.values(p.stars || {}).reduce((a, b) => a + b, 0);
      const streak = p.streakDays || 0;
      const streakTxt = streak > 1 ? ` \xB7 \u{1F525} ${streak}d` : "";
      applyCrispText(
        this.add.text(W / 2, L.statsY, `\u2605 ${totalStars}  \xB7  Endless best ${p.endlessBest || 0}${streakTxt}`, uiTextStyle({
          fontSize: "14px",
          color: "#94a3b8",
          strokeThickness: 1
        })).setOrigin(0.5).setDepth(2)
      );
      const go = (fn) => () => {
        bgm.unlock();
        fn();
      };
      const btnOpts = { width: L.btnW, height: L.btnH, fontSize: "17px" };
      makeGlowButton(this, W / 2, L.btnCampaign, "\u25B6  CAMPAIGN", 6514417, go(() => transitionTo(this, "Map")), btnOpts);
      const dailyBest = getDailyBest(p);
      const dailyFresh = isDailyFresh(p);
      const dailyLabel = dailyFresh ? "\u2600  DAILY  \xB7  NEW" : `\u2600  DAILY  \xB7  Best ${dailyBest}`;
      makeGlowButton(
        this,
        W / 2,
        L.btnDaily,
        dailyLabel,
        dailyFresh ? 11817737 : 3359061,
        go(() => transitionTo(this, "Game", { mode: "daily" })),
        btnOpts
      );
      makeGlowButton(this, W / 2, L.btnEndless, "\u221E  ENDLESS", 1982639, go(() => transitionTo(this, "Game", { mode: "endless" })), btnOpts);
      makeGlowButton(
        this,
        W / 2,
        L.btnRankings,
        "\u{1F3C6}  LIVE RANKINGS",
        8141549,
        go(() => transitionTo(this, "Leaderboard", { board: "endless" })),
        btnOpts
      );
      this.makeNameBadge(W / 2, L.nameY);
      this.buildAudioToggles(L.audioY);
      applyCrispText(
        this.add.text(W / 2, L.footerY, `v${APP_VERSION} \xB7 Iron \u2192 Gold \u2192 Immortal`, uiTextStyle({
          fontSize: "12px",
          color: "#64748b",
          strokeThickness: 0
        })).setOrigin(0.5)
      );
      this.input.once("pointerdown", () => bgm.unlock());
      if (bgm.isOn()) bgm.unlock();
      fadeInScene(this);
    }
    makeNameBadge(x, y) {
      const player = getPlayer();
      const named = hasName();
      const label = named ? player.name : "Set your name";
      const w = 260;
      const h = 42;
      const bg = this.add.rectangle(x, y, w, h, named ? 1976635 : 8138002, 1).setInteractive({ useHandCursor: true }).setStrokeStyle(1, named ? 4674921 : 16347926, 0.6).setDepth(8);
      applyCrispText(
        this.add.text(x, y, `\u{1F464}  ${label}`, uiTextStyle({
          fontSize: "16px",
          fontStyle: "600",
          color: named ? "#f1f5f9" : "#fdba74"
        })).setOrigin(0.5).setDepth(9)
      );
      bg.on("pointerdown", () => {
        promptName(named ? player.name : "").then(() => this.scene.restart());
      });
      bg.on("pointerover", () => bg.setFillStyle(named ? 3359061 : 10105874));
      bg.on("pointerout", () => bg.setFillStyle(named ? 1976635 : 8138002));
    }
    buildAudioToggles(y) {
      this.makeToggle(W / 2 - 58, y, sfx.isOn(), "SFX", (on) => {
        sfx.toggle(on);
        sfx.play("click");
      });
      this.makeToggle(W / 2 + 58, y, bgm.isOn(), "MUSIC", (on) => {
        bgm.toggle(on);
        if (on) bgm.unlock();
      });
    }
    makeToggle(x, y, on, label, cb) {
      const w = 100;
      const h = 34;
      const bg = this.add.rectangle(x, y, w, h, on ? 6514417 : 1976635, 1).setInteractive({ useHandCursor: true }).setStrokeStyle(1, on ? 8490232 : 4674921).setDepth(8);
      applyCrispText(
        this.add.text(x, y, `${on ? "ON" : "OFF"} ${label}`, uiTextStyle({
          fontSize: "12px",
          fontStyle: "700",
          color: on ? "#fff" : "#94a3b8"
        })).setOrigin(0.5).setDepth(9)
      );
      bg.on("pointerdown", () => {
        const next = !on;
        cb(next);
        on = next;
        bg.setFillStyle(on ? 6514417 : 1976635);
        bg.setStrokeStyle(1, on ? 8490232 : 4674921);
      });
    }
  };

  // public/js/levels.js
  var WORLDS = [
    {
      id: 1,
      name: "Crystal Caves",
      levels: [
        { id: 1, goal: { type: "score", target: 400 }, moves: null, name: "First Light" },
        { id: 2, goal: { type: "lines", target: 4 }, moves: 20, name: "Line Walker" },
        { id: 3, goal: { type: "score", target: 700 }, moves: 25, name: "Warm Up" },
        { id: 4, goal: { type: "combo", target: 2 }, moves: 22, name: "Double Clear" },
        { id: 5, goal: { type: "lines", target: 8 }, moves: 18, name: "Pressure" },
        { id: 6, goal: { type: "score", target: 1200 }, moves: 28, name: "Deep Cave" },
        { id: 7, goal: { type: "lines", target: 10 }, moves: 22, name: "Grid Master" },
        { id: 8, goal: { type: "combo", target: 3 }, moves: 24, name: "Chain Reaction" },
        { id: 9, goal: { type: "score", target: 1800 }, moves: 30, name: "Crystal Rush" },
        { id: 10, goal: { type: "lines", target: 14 }, moves: 20, name: "Boss Gate" },
        { id: 11, goal: { type: "score", target: 2200 }, moves: 32, name: "Glow Up" },
        { id: 12, goal: { type: "combo", target: 4 }, moves: 26, name: "Overdrive" },
        { id: 13, goal: { type: "lines", target: 16 }, moves: 24, name: "Tunnel Run" },
        { id: 14, goal: { type: "score", target: 2800 }, moves: 35, name: "High Score" },
        { id: 15, goal: { type: "lines", target: 20 }, moves: 22, name: "World 1 Finale" }
      ]
    }
  ];
  function getLevel(id) {
    for (const w of WORLDS) {
      const lv = w.levels.find((l) => l.id === id);
      if (lv) return { ...lv, world: w };
    }
    return null;
  }
  function goalText(goal) {
    if (!goal) return "";
    switch (goal.type) {
      case "score":
        return `Score ${goal.target}`;
      case "lines":
        return `Clear ${goal.target} lines`;
      case "combo":
        return `Hit a ${goal.target}x combo`;
      default:
        return "Complete goal";
    }
  }
  function starThresholds(level, goal) {
    if (goal.type === "score") {
      return [goal.target, Math.round(goal.target * 1.35), Math.round(goal.target * 1.7)];
    }
    return [goal.target, goal.target + 2, goal.target + 4];
  }

  // public/js/navUi.js
  var NAV_DEPTH = 120;
  var MODAL_DEPTH = 200;
  function addNavButton(scene, x, y, label, color, onClick, width = 92) {
    const h = 34;
    const bg = scene.add.rectangle(x, y, width, h, color, 1).setStrokeStyle(1, 16777215, 0.12).setInteractive({ useHandCursor: true }).setDepth(NAV_DEPTH);
    const txt = scene.add.text(x, y, label, {
      fontFamily: "Outfit, sans-serif",
      fontSize: "12px",
      fontStyle: "700",
      color: "#fff"
    }).setOrigin(0.5).setDepth(NAV_DEPTH + 1);
    const press = () => {
      sfx.play("click");
      onClick();
    };
    txt.setInteractive({ useHandCursor: true }).on("pointerdown", press);
    bg.on("pointerdown", press);
    bg.on("pointerover", () => bg.setFillStyle(lighten(color)));
    bg.on("pointerout", () => bg.setFillStyle(color));
    return { bg, txt };
  }
  function lighten(hex) {
    const c = Phaser.Display.Color.IntegerToColor(hex);
    c.lighten(12);
    return c.color;
  }
  function showLeaveDialog(scene, { title = "Leave game?", onLeave }) {
    if (scene._leaveModal) return;
    const items = [];
    const add = (obj) => {
      obj.setDepth(MODAL_DEPTH);
      items.push(obj);
      return obj;
    };
    const close = () => {
      items.forEach((o) => o.destroy());
      scene._leaveModal = null;
      scene.input.enabled = true;
    };
    scene._leaveModal = { close };
    scene.input.enabled = true;
    add(scene.add.rectangle(W / 2, 390, W, 780, 0, 0.72).setInteractive());
    add(
      scene.add.text(W / 2, 298, title, {
        fontFamily: "Syne, sans-serif",
        fontSize: "22px",
        fontStyle: "700",
        color: "#e2e8f0",
        align: "center",
        wordWrap: { width: W - 48 }
      }).setOrigin(0.5)
    );
    add(
      scene.add.text(W / 2, 338, "Progress in this run will be lost.", {
        fontFamily: "Outfit, sans-serif",
        fontSize: "13px",
        color: "#94a3b8"
      }).setOrigin(0.5)
    );
    const quitBg = add(
      scene.add.rectangle(W / 2, 400, 220, 46, 14427686).setInteractive({ useHandCursor: true })
    );
    add(
      scene.add.text(W / 2, 400, "QUIT", {
        fontFamily: "Outfit, sans-serif",
        fontSize: "16px",
        fontStyle: "800",
        color: "#fff"
      }).setOrigin(0.5)
    );
    const stayBg = add(
      scene.add.rectangle(W / 2, 462, 220, 46, 3359061).setInteractive({ useHandCursor: true })
    );
    add(
      scene.add.text(W / 2, 462, "KEEP PLAYING", {
        fontFamily: "Outfit, sans-serif",
        fontSize: "15px",
        fontStyle: "700",
        color: "#e2e8f0"
      }).setOrigin(0.5)
    );
    quitBg.on("pointerdown", () => {
      sfx.play("click");
      close();
      onLeave();
    });
    stayBg.on("pointerdown", () => {
      sfx.play("click");
      close();
    });
  }
  function addGameTopNav(scene, { onBack, onQuit, backLabel = "\u2190 BACK" }) {
    addNavButton(scene, 52, 26, backLabel, 3359061, onBack, 88);
    if (onQuit) addNavButton(scene, W - 52, 26, "QUIT", 12131356, onQuit, 72);
  }

  // public/js/scenes/MapScene.js
  var MapScene = class extends Phaser.Scene {
    constructor() {
      super("Map");
    }
    create() {
      const { width } = this.scale;
      const M = mapLayout(width, H);
      const p = loadProgress();
      const world = WORLDS[0];
      drawBackdrop(this, width, H);
      const totalStars = Object.values(p.stars || {}).reduce((a, b) => a + b, 0);
      const maxStars = world.levels.length * 3;
      const goMenu = () => transitionTo(this, "Menu");
      addGameTopNav(this, { onBack: goMenu, onQuit: goMenu, backLabel: "\u2190 BACK" });
      this.add.text(width / 2, M.titleY, world.name, {
        fontFamily: "Syne, sans-serif",
        fontSize: "24px",
        fontStyle: "700",
        color: "#22d3ee"
      }).setOrigin(0.5);
      this.add.text(width / 2, M.starsY, `${totalStars} / ${maxStars} \u2605`, {
        fontFamily: "Outfit, sans-serif",
        fontSize: "14px",
        color: "#64748b"
      }).setOrigin(0.5);
      this.add.rectangle(width / 2, M.barY, width - 60, 5, 1976635).setOrigin(0.5);
      const progBar = this.add.rectangle(30, M.barY, 0, 5, 16498468).setOrigin(0, 0.5);
      progBar.width = (width - 60) * (totalStars / maxStars);
      const cols = 5;
      const startX = 52;
      const startY = M.startY;
      const gap = 68;
      const nodes = world.levels.map((_, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        return { x: startX + col * gap, y: startY + row * gap };
      });
      const pathGfx = this.add.graphics().setDepth(0);
      pathGfx.lineStyle(2, 3359061, 0.5);
      for (let i = 1; i < nodes.length; i++) {
        const prev = nodes[i - 1];
        const cur = nodes[i];
        pathGfx.lineBetween(prev.x, prev.y, cur.x, cur.y);
      }
      world.levels.forEach((lv, i) => {
        const { x, y } = nodes[i];
        const locked = lv.id > p.unlocked;
        const stars = getStars(p, lv.id);
        const isCurrent = lv.id === p.unlocked;
        if (isCurrent && !locked) {
          const pulse = this.add.circle(x, y, 32, 6514417, 0.15).setDepth(0);
          this.tweens.add({ targets: pulse, scale: 1.35, alpha: 0, duration: 1200, repeat: -1 });
        }
        const node = this.add.circle(x, y, locked ? 24 : 26, locked ? 1976635 : isCurrent ? 8490232 : 6514417, locked ? 0.55 : 1).setDepth(1);
        if (!locked) node.setInteractive({ useHandCursor: true });
        node.setStrokeStyle(2, locked ? 3359061 : 10859772);
        const num = this.add.text(x, y - 2, String(lv.id), {
          fontFamily: "Outfit, sans-serif",
          fontSize: "15px",
          fontStyle: "700",
          color: locked ? "#475569" : "#fff"
        }).setOrigin(0.5).setDepth(2);
        for (let s = 0; s < 3; s++) {
          this.add.text(x - 14 + s * 14, y + 28, s < stars ? "\u2605" : "\u2606", {
            fontSize: "9px",
            color: s < stars ? "#fbbf24" : "#334155"
          }).setOrigin(0.5).setDepth(2);
        }
        if (!locked) {
          node.on("pointerdown", () => {
            sfx.play("click");
            this.showLevelPreview(lv, x, y);
            this.time.delayedCall(
              280,
              () => transitionTo(this, "Game", { mode: "level", levelId: lv.id })
            );
          });
          node.on("pointerover", () => {
            node.setFillStyle(8490232);
            this.tweens.add({ targets: node, scale: 1.12, duration: 100 });
          });
          node.on("pointerout", () => {
            node.setFillStyle(isCurrent ? 8490232 : 6514417);
            this.tweens.add({ targets: node, scale: 1, duration: 100 });
          });
        }
      });
      fadeInScene(this);
      if (bgm.isOn()) bgm.unlock();
    }
    showLevelPreview(lv, x, y) {
      if (this.preview) this.preview.destroy();
      this.preview = this.add.container(x, y - 52).setDepth(20);
      const bg = this.add.rectangle(0, 0, 160, 36, 1976635, 0.95).setStrokeStyle(1, 6514417);
      const txt = this.add.text(0, 0, lv.name, { fontFamily: "Outfit, sans-serif", fontSize: "12px", fontStyle: "600", color: "#e2e8f0" }).setOrigin(0.5);
      this.preview.add([bg, txt]);
      this.tweens.add({ targets: this.preview, alpha: 0, duration: 400, delay: 400, onComplete: () => this.preview?.destroy() });
    }
  };

  // public/js/apiBase.js
  function apiBase() {
    const b = typeof window !== "undefined" ? window.BF_API_BASE : "";
    return typeof b === "string" ? b.replace(/\/$/, "") : "";
  }
  function apiUrl(path) {
    const base = apiBase();
    const p = path.startsWith("/") ? path : `/${path}`;
    return base ? `${base}${p}` : p;
  }

  // public/js/leaderboard.js
  function boardKey(mode) {
    if (mode === "daily") return `daily-${dailySeed()}`;
    if (mode === "endless") return "endless";
    return null;
  }
  function gistId() {
    const id = typeof window !== "undefined" ? window.BF_GIST_ID : "";
    return typeof id === "string" && id.length > 8 ? id : "";
  }
  async function fetchLeaderboardFromGist(board) {
    const id = gistId();
    if (!id) return null;
    try {
      const res = await fetch(`https://api.github.com/gists/${id}`);
      if (!res.ok) return null;
      const g = await res.json();
      const f = g.files?.["leaderboard.json"] || Object.values(g.files || {})[0];
      let data = {};
      if (f?.content) data = JSON.parse(f.content);
      else if (f?.raw_url) {
        const raw = await fetch(f.raw_url);
        data = JSON.parse(await raw.text());
      }
      const key = String(board).slice(0, 32);
      const rows = (data[key] || []).sort((a, b) => b.score - a.score || a.updatedAt - b.updatedAt).slice(0, 50);
      return { board, rows, source: "gist" };
    } catch {
      return null;
    }
  }
  async function fetchLeaderboard(board) {
    try {
      const res = await fetch(apiUrl(`/api/leaderboard/${encodeURIComponent(board)}`));
      if (res.ok) return await res.json();
      if (res.status === 503) {
        const fallback = await fetchLeaderboardFromGist(board);
        if (fallback) return fallback;
      }
      throw new Error(`http_${res.status}`);
    } catch {
      const fallback = await fetchLeaderboardFromGist(board);
      if (fallback) return fallback;
      return { board, rows: [], offline: true };
    }
  }
  async function submitScore(board, playerId, name, score) {
    try {
      const res = await fetch(apiUrl(`/api/leaderboard/${encodeURIComponent(board)}`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, name, score })
      });
      if (!res.ok) throw new Error("submit failed");
      return await res.json();
    } catch {
      return { ok: false, offline: true };
    }
  }
  async function fetchMyRank(board, playerId) {
    try {
      const res = await fetch(
        apiUrl(`/api/leaderboard/${encodeURIComponent(board)}/rank/${encodeURIComponent(playerId)}`)
      );
      if (!res.ok) return null;
      const data = await res.json();
      return data.rank;
    } catch {
      return null;
    }
  }

  // public/js/scenes/GameScene.js
  var TRAY_Y = 562;
  var TRAY_SCALE = 0.72;
  var ENDLESS_MILESTONES = [500, 1e3, 2e3, 5e3, 1e4];
  var GameScene = class extends Phaser.Scene {
    constructor() {
      super("Game");
    }
    init(data) {
      this.mode = data.mode || "level";
      this.levelId = data.levelId || 1;
      this.level = this.mode === "level" ? getLevel(this.levelId) : null;
      this.dailyRng = this.mode === "daily" ? mulberry32(dailySeed()) : null;
      this.progress = loadProgress();
      touchDailyStreak(this.progress);
    }
    create() {
      this.grid = Array.from({ length: GRID }, () => Array(GRID).fill(0));
      this.score = 0;
      this.totalLines = 0;
      this.maxCombo = 0;
      this.movesUsed = 0;
      this.clearStreak = 0;
      this.sessionXp = 0;
      this.milestonesHit = /* @__PURE__ */ new Set();
      this.beatBestShown = false;
      this.closeShown = false;
      this.feverGlow = null;
      this.tray = [];
      this.traySlots = [];
      this.usedSlots = /* @__PURE__ */ new Set();
      this.dragging = null;
      this.ghost = null;
      this.gameEnded = false;
      this.boardW = GRID * CELL + BOARD_PAD * 2;
      this.boardX = (W - this.boardW) / 2 + BOARD_PAD;
      this.boardY = 110;
      drawBackdrop(this, W, 780);
      this.hintGfx = this.add.graphics().setDepth(3);
      this.drawBoardFrame();
      this.cellSprites = [];
      for (let r = 0; r < GRID; r++) {
        this.cellSprites[r] = [];
        for (let c = 0; c < GRID; c++) {
          const x = this.boardX + c * CELL + CELL / 2;
          const y = this.boardY + r * CELL + CELL / 2;
          const empty = this.add.image(x, y, "cell-empty").setAlpha(0.55);
          this.cellSprites[r][c] = { empty, block: null };
        }
      }
      this.ghostGroup = this.add.container(0, 0).setDepth(20);
      this.buildHud();
      this.drawTrayArea();
      this.spawnTray();
      this.setupInput();
      if (this.levelId === 1 && this.mode === "level") {
        this.showToast("Chain line clears for streak bonus \xB7 fill the bar!", 4200);
      }
      if (this.mode === "daily") {
        const best = getDailyBest(this.progress);
        this.showToast(best > 0 ? `Beat today's best: ${best}` : "Same pieces for everyone today \u2014 go!", 3500);
      }
      this.refreshGoalDisplay();
      if (this.boardFrame) {
        this.boardFrame.setScale(0.94);
        this.tweens.add({ targets: this.boardFrame, scale: 1, duration: 400, ease: "Back.easeOut" });
      }
      fadeInScene(this, 280);
      if (bgm.isOn()) bgm.unlock();
    }
    drawTrayArea() {
      this.add.rectangle(W / 2, TRAY_Y + 20, W - 32, 140, 1120295, 0.85).setStrokeStyle(2, 3359061, 0.8).setDepth(1);
      this.add.text(W / 2, TRAY_Y - 52, "NEXT PIECES", {
        fontFamily: "Outfit, sans-serif",
        fontSize: "11px",
        fontStyle: "700",
        color: "#64748b",
        letterSpacing: 2
      }).setOrigin(0.5).setDepth(2);
    }
    drawBoardFrame() {
      const fx = this.boardX - BOARD_PAD;
      const fy = this.boardY - BOARD_PAD;
      const fw = GRID * CELL + BOARD_PAD * 2;
      const fh = GRID * CELL + BOARD_PAD * 2;
      const cx = fx + fw / 2;
      const cy = fy + fh / 2;
      this.boardFrame = this.add.container(cx, cy).setDepth(2);
      const outer = this.add.rectangle(0, 0, fw, fh, 1120295, 0.95).setStrokeStyle(3, 4674921);
      const inner = this.add.rectangle(0, 0, fw - 6, fh - 6, 988970, 0.55);
      this.boardFrame.add([outer, inner]);
    }
    buildHud() {
      const title = this.mode === "endless" ? "ENDLESS" : this.mode === "daily" ? "DAILY CHALLENGE" : `${this.level?.name || "Level"} \xB7 L${this.levelId}`;
      const askLeave = () => {
        if (this.gameEnded) this.exitGame();
        else this.showConfirmExit();
      };
      addGameTopNav(this, { onBack: askLeave, onQuit: askLeave });
      const H2 = HUD_HEADER;
      this.add.text(W / 2, H2.titleY, title, {
        fontFamily: "Syne, sans-serif",
        fontSize: "16px",
        fontStyle: "700",
        color: "#38bdf8"
      }).setOrigin(0.5).setDepth(50);
      this.add.text(24, H2.scoreLabelY, "SCORE", {
        fontFamily: "Outfit, sans-serif",
        fontSize: "10px",
        color: "#64748b"
      }).setDepth(50);
      this.scoreText = this.add.text(24, H2.scoreValueY, "0", {
        fontFamily: "Outfit, sans-serif",
        fontSize: "26px",
        fontStyle: "800",
        color: "#e2e8f0"
      }).setDepth(50);
      this.streakBadge = this.add.text(W / 2, H2.streakY, "", {
        fontFamily: "Outfit, sans-serif",
        fontSize: "12px",
        fontStyle: "700",
        color: "#f97316"
      }).setOrigin(0.5).setAlpha(0).setDepth(50);
      let goalLabel;
      if (this.mode === "endless") {
        const best = this.progress.endlessBest || 0;
        goalLabel = best > 0 ? `Beat best: ${best}` : "Survive \xB7 chase milestones";
      } else if (this.mode === "daily") {
        const db = getDailyBest(this.progress);
        goalLabel = db > 0 ? `Today: beat ${db}` : "Today's run \u2014 score high!";
      } else {
        goalLabel = goalText(this.level?.goal);
      }
      this.goalText = this.add.text(W - 24, H2.goalY, goalLabel, {
        fontFamily: "Outfit, sans-serif",
        fontSize: "12px",
        fontStyle: "600",
        color: "#94a3b8",
        align: "right",
        wordWrap: { width: 160 }
      }).setOrigin(1, 0).setDepth(50);
      if (this.mode === "level" && this.level.moves) {
        this.movesText = this.add.text(W / 2, H2.movesY, `Moves: ${this.level.moves}`, {
          fontFamily: "Outfit, sans-serif",
          fontSize: "14px",
          color: "#fbbf24"
        }).setOrigin(0.5);
      }
      if (this.mode === "level") {
        this.add.rectangle(W / 2, 102, W - 48, 6, 1976635).setOrigin(0.5);
        this.goalBar = this.add.rectangle(24, 102, 0, 6, 2282478).setOrigin(0, 0.5);
        this.goalBarMax = W - 48;
      }
    }
    spawnTray() {
      this.traySlots.forEach((s) => s.container.destroy());
      this.traySlots = [];
      this.usedSlots.clear();
      const rng = this.dailyRng || Math.random;
      this.tray = randomTray(3, rng);
      sfx.play("tray");
      const slotXs = [W * 0.22, W * 0.5, W * 0.78];
      this.tray.forEach((shape, i) => {
        const container = this.makePieceContainer(shape, slotXs[i], TRAY_Y + 40, TRAY_SCALE, true);
        container.setData("slot", i);
        container.setData("shape", shape);
        container.setData("homeX", slotXs[i]);
        container.setData("homeY", TRAY_Y);
        container.setInteractive(
          new Phaser.Geom.Rectangle(-80, -80, 160, 160),
          Phaser.Geom.Rectangle.Contains
        );
        this.input.setDraggable(container);
        this.traySlots.push({ container, shape, index: i });
        this.tweens.add({
          targets: container,
          y: TRAY_Y,
          alpha: { from: 0, to: 1 },
          duration: 280,
          delay: i * 70,
          ease: "Back.easeOut"
        });
        this.tweens.add({
          targets: container,
          y: TRAY_Y - 3,
          duration: 1400 + i * 200,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
          delay: 400 + i * 100
        });
      });
    }
    shapeBounds(shape) {
      const minR = Math.min(...shape.cells.map(([r]) => r));
      const minC = Math.min(...shape.cells.map(([, c]) => c));
      const maxR = Math.max(...shape.cells.map(([r]) => r));
      const maxC = Math.max(...shape.cells.map(([, c]) => c));
      return { minR, minC, maxR, maxC, w: maxC - minC + 1, h: maxR - minR + 1 };
    }
    makePieceContainer(shape, x, y, scale, inTray) {
      const container = this.add.container(x, y).setDepth(inTray ? 10 : 30);
      const { minR, minC, w, h } = this.shapeBounds(shape);
      shape.cells.forEach(([dr, dc]) => {
        const img = this.add.image((dc - minC) * CELL + CELL / 2 - w * CELL / 2, (dr - minR) * CELL + CELL / 2 - h * CELL / 2, `block-${shape.color}`).setScale(scale);
        container.add(img);
      });
      container.setData("minR", minR);
      container.setData("minC", minC);
      container.setData("bounds", { w, h });
      container.setData("pieceScale", scale);
      return container;
    }
    setupInput() {
      this.input.on("dragstart", (_p, go) => {
        if (this.gameEnded || this.usedSlots.has(go.getData("slot"))) return;
        this.dragging = go;
        go.setDepth(40);
        this.tweens.killTweensOf(go);
        go.list.forEach((img) => img.setScale(0.92));
        sfx.play("pickup");
      });
      this.input.on("drag", (pointer, go) => {
        if (!this.dragging) return;
        go.x = pointer.x;
        go.y = pointer.y;
        this.updateGhost(go);
      });
      this.input.on("dragend", (_p, go) => {
        if (!this.dragging) return;
        const shape = go.getData("shape");
        const pos = this.pointerToGrid();
        this.clearGhost();
        if (pos && this.canPlace(shape, pos.row, pos.col)) {
          this.commitPlacement(shape, pos.row, pos.col, go);
        } else {
          this.returnToTray(go);
        }
        this.dragging = null;
      });
    }
    gridFromContainer(go) {
      const { w, h } = go.getData("bounds");
      const anchorX = go.x - w * CELL / 2 + CELL / 2;
      const anchorY = go.y - h * CELL / 2 + CELL / 2;
      const col = Math.round((anchorX - this.boardX - CELL / 2) / CELL);
      const row = Math.round((anchorY - this.boardY - CELL / 2) / CELL);
      return { row, col };
    }
    pointerToGrid() {
      if (!this.dragging) return null;
      const shape = this.dragging.getData("shape");
      const { row, col } = this.gridFromContainer(this.dragging);
      const valid = this.canPlace(shape, row, col);
      return { row, col, valid };
    }
    updateGhost(go) {
      this.clearGhost();
      const shape = go.getData("shape");
      const { minR, minC } = this.shapeBounds(shape);
      const { row, col } = this.gridFromContainer(go);
      const ok = this.canPlace(shape, row, col);
      shape.cells.forEach(([dr, dc]) => {
        const r = row + (dr - minR);
        const c = col + (dc - minC);
        if (r < 0 || r >= GRID || c < 0 || c >= GRID) return;
        const x = this.boardX + c * CELL + CELL / 2;
        const y = this.boardY + r * CELL + CELL / 2;
        const tint = ok ? 3462041 : 16281969;
        const g = this.add.image(x, y, `block-${shape.color}`).setAlpha(ok ? 0.45 : 0.35).setTint(tint);
        this.ghostGroup.add(g);
      });
    }
    clearGhost() {
      this.ghostGroup.removeAll(true);
    }
    canPlace(shape, row, col) {
      const { minR, minC } = this.shapeBounds(shape);
      for (const [dr, dc] of shape.cells) {
        const r = row + (dr - minR);
        const c = col + (dc - minC);
        if (r < 0 || r >= GRID || c < 0 || c >= GRID) return false;
        if (this.grid[r][c] !== 0) return false;
      }
      return true;
    }
    commitPlacement(shape, row, col, go) {
      const slot = go.getData("slot");
      this.usedSlots.add(slot);
      go.setVisible(false);
      go.disableInteractive();
      const { minR, minC } = this.shapeBounds(shape);
      shape.cells.forEach(([dr, dc]) => {
        const r = row + (dr - minR);
        const c = col + (dc - minC);
        this.grid[r][c] = shape.color + 1;
      });
      this.movesUsed++;
      this.refreshBoard(true);
      const placePts = shape.cells.length * 10;
      this.addScore(placePts, false, this.boardX + col * CELL + 20, this.boardY + row * CELL);
      sfx.play("drop");
      updateNearFullHints(this, this.grid, this.boardX, this.boardY, CELL, GRID, this.hintGfx);
      const { rows, cols, count } = this.findClears();
      if (count > 0) {
        this.totalLines += count;
        this.maxCombo = Math.max(this.maxCombo, count);
        this.clearStreak++;
        this.updateStreakHud();
        this.animateClears(rows, cols, count);
      } else {
        if (this.clearStreak > 0) feverBanner(this, "Streak broken!", "#94a3b8");
        this.clearStreak = 0;
        this.updateStreakHud();
        this.setFever(false);
        this.afterPlacement();
      }
    }
    findClears() {
      const rows = [];
      const cols = [];
      for (let r = 0; r < GRID; r++) {
        if (this.grid[r].every((v) => v !== 0)) rows.push(r);
      }
      for (let c = 0; c < GRID; c++) {
        let full = true;
        for (let r = 0; r < GRID; r++) if (this.grid[r][c] === 0) full = false;
        if (full) cols.push(c);
      }
      return { rows, cols, count: rows.length + cols.length };
    }
    animateClears(rows, cols, lineCount) {
      const cells = /* @__PURE__ */ new Set();
      rows.forEach((r) => {
        for (let c = 0; c < GRID; c++) cells.add(`${r},${c}`);
      });
      cols.forEach((c) => {
        for (let r = 0; r < GRID; r++) cells.add(`${r},${c}`);
      });
      const comboMult = lineCount >= 3 ? 2 : lineCount >= 2 ? 1.5 : 1;
      const sm = streakMult(this.clearStreak);
      let lineScore = Math.round(100 * lineCount * comboMult * sm);
      this.addScore(lineScore, true, W / 2, this.boardY + GRID * CELL * 0.5);
      if (lineCount === 1) niceClearPop(this, W / 2, this.boardY + GRID * CELL * 0.35);
      this.showCombo(lineCount);
      if (this.clearStreak >= 3) {
        feverBanner(this, `ON FIRE! x${sm.toFixed(1)}`, "#f97316");
        this.setFever(true);
      }
      lineSweep(this, this.boardX, this.boardY, CELL, GRID, rows, cols);
      sfx.play(lineCount >= 2 ? "combo" : "clear");
      this.cameras.main.shake(120, lineCount >= 3 ? 0.01 : lineCount >= 2 ? 6e-3 : 3e-3);
      this.grantAch("first_clear");
      if (lineCount >= 3) this.grantAch("combo_3");
      if (lineCount >= 4) this.grantAch("combo_4");
      if (this.clearStreak >= 5) this.grantAch("streak_5");
      cells.forEach((key) => {
        const [r, c] = key.split(",").map(Number);
        const block = this.cellSprites[r][c].block;
        if (block) {
          this.tweens.add({
            targets: block,
            scaleX: 1.35,
            scaleY: 1.35,
            alpha: 0,
            duration: 180,
            ease: "Power2",
            onComplete: () => {
              block.destroy();
              this.cellSprites[r][c].block = null;
            }
          });
          this.emitBurst(block.x, block.y, this.grid[r][c] - 1);
        }
        this.grid[r][c] = 0;
      });
      this.time.delayedCall(200, () => {
        updateNearFullHints(this, this.grid, this.boardX, this.boardY, CELL, GRID, this.hintGfx);
        if (this.isBoardEmpty()) {
          const bonus = Math.round(200 * streakMult(this.clearStreak));
          feverBanner(this, `BOARD CLEAR! +${bonus}`, "#fde047");
          this.addScore(bonus, true, W / 2, this.boardY + GRID * CELL * 0.2);
        }
        this.afterPlacement();
      });
    }
    isBoardEmpty() {
      return this.grid.every((row) => row.every((v) => v === 0));
    }
    updateStreakHud() {
      if (!this.streakBadge) return;
      if (this.clearStreak >= 2) {
        const sm = streakMult(this.clearStreak);
        this.streakBadge.setText(`\u{1F525} STREAK x${sm.toFixed(1)} (${this.clearStreak})`).setAlpha(1);
        this.tweens.add({ targets: this.streakBadge, scale: 1.15, duration: 80, yoyo: true });
      } else {
        this.streakBadge.setAlpha(0);
      }
    }
    setFever(on) {
      if (on && !this.feverGlow) {
        const fx = this.boardX - BOARD_PAD;
        const fy = this.boardY - BOARD_PAD;
        const fw = GRID * CELL + BOARD_PAD * 2;
        const fh = GRID * CELL + BOARD_PAD * 2;
        this.feverGlow = this.add.rectangle(fx + fw / 2, fy + fh / 2, fw + 8, fh + 8).setStrokeStyle(3, 16347926, 0.7).setFillStyle(16347926, 0.04).setDepth(4);
        this.tweens.add({
          targets: this.feverGlow,
          alpha: { from: 0.5, to: 1 },
          duration: 400,
          yoyo: true,
          repeat: -1
        });
      } else if (!on && this.feverGlow) {
        this.feverGlow.destroy();
        this.feverGlow = null;
      }
    }
    grantAch(id) {
      const ach = unlockAchievement(this.progress, id);
      if (ach) {
        this.sessionXp += ach.xp;
        achievementToast(this, ach.title, ach.xp);
      }
    }
    emitBurst(x, y, colorIdx) {
      const color = COLORS[colorIdx] ?? 16777215;
      const particles = this.add.particles(x, y, "particle", {
        speed: { min: 60, max: 180 },
        scale: { start: 1.2, end: 0 },
        lifespan: 420,
        quantity: 8,
        tint: color,
        emitting: false
      });
      particles.explode(10);
      this.time.delayedCall(500, () => particles.destroy());
    }
    showCombo(n) {
      if (n < 2) return;
      const label = n >= 4 ? "MEGA!" : n >= 3 ? "TRIPLE!" : "COMBO!";
      const t = this.add.text(W / 2, this.boardY + GRID * CELL * 0.45, `${label}  ${n}x`, {
        fontFamily: "Syne, sans-serif",
        fontSize: n >= 3 ? "32px" : "26px",
        fontStyle: "800",
        color: "#fbbf24",
        stroke: "#0f172a",
        strokeThickness: 4
      }).setOrigin(0.5).setDepth(50).setScale(0.5);
      this.tweens.add({
        targets: t,
        scale: 1,
        y: t.y - 30,
        alpha: { from: 1, to: 0 },
        duration: 900,
        ease: "Back.easeOut",
        onComplete: () => t.destroy()
      });
    }
    addScore(pts, fromLines = false, popX, popY) {
      this.score += pts;
      this.scoreText.setText(String(this.score));
      this.tweens.add({
        targets: this.scoreText,
        scaleX: 1.15,
        scaleY: 1.15,
        duration: 80,
        yoyo: true
      });
      if (popX != null) scorePopup(this, popX, popY, pts, fromLines ? "#38bdf8" : "#fde047");
      if (this.mode === "level") this.refreshGoalDisplay();
      if (this.mode === "endless" || this.mode === "daily") this.checkEndlessMilestones();
    }
    checkEndlessMilestones() {
      for (const m of ENDLESS_MILESTONES) {
        if (this.score >= m && !this.milestonesHit.has(m)) {
          this.milestonesHit.add(m);
          feverBanner(this, `${m} REACHED!`, "#fde047");
          sfx.play("combo");
          if (m >= 1e3) this.grantAch("endless_1k");
        }
      }
      const best = this.mode === "daily" ? getDailyBest(this.progress) : this.progress.endlessBest || 0;
      if (best > 0 && this.score > best && !this.beatBestShown) {
        this.beatBestShown = true;
        feverBanner(this, "NEW BEST!", "#4ade80");
      }
    }
    refreshGoalDisplay() {
      if (this.mode !== "level" || !this.level) return;
      const g = this.level.goal;
      let prog = "";
      let ratio = 0;
      if (g.type === "score") {
        prog = `${this.score} / ${g.target}`;
        ratio = Math.min(1, this.score / g.target);
      } else if (g.type === "lines") {
        prog = `${this.totalLines} / ${g.target} lines`;
        ratio = Math.min(1, this.totalLines / g.target);
      } else {
        prog = `Best combo: ${this.maxCombo} / ${g.target}x`;
        ratio = Math.min(1, this.maxCombo / g.target);
      }
      this.goalText.setText(`${goalText(g)}
${prog}`);
      if (this.goalBar) {
        this.goalBar.width = this.goalBarMax * ratio;
        if (ratio >= 0.85 && ratio < 1) {
          this.tweens.add({ targets: this.goalBar, alpha: 0.6, duration: 100, yoyo: true });
          if (!this.closeShown) {
            this.closeShown = true;
            feverBanner(this, "SO CLOSE!", "#fde047");
          }
        }
      }
    }
    refreshBoard(animate = false) {
      for (let r = 0; r < GRID; r++) {
        for (let c = 0; c < GRID; c++) {
          const val = this.grid[r][c];
          const slot = this.cellSprites[r][c];
          if (val === 0) {
            if (slot.block) {
              slot.block.destroy();
              slot.block = null;
            }
            continue;
          }
          if (!slot.block) {
            const x = this.boardX + c * CELL + CELL / 2;
            const y = this.boardY + r * CELL + CELL / 2;
            slot.block = this.add.image(x, y, `block-${val - 1}`).setDepth(5);
            if (animate) {
              slot.block.setScale(0);
              this.tweens.add({ targets: slot.block, scale: 1, duration: 120, ease: "Back.easeOut" });
            }
          }
        }
      }
    }
    afterPlacement() {
      this.refreshGoalDisplay();
      if (this.mode === "level" && this.level.moves && this.movesText) {
        const left = this.level.moves - this.movesUsed;
        this.movesText.setText(`Moves: ${Math.max(0, left)}`);
        if (left <= 5 && left > 0) {
          this.movesText.setColor("#f87171");
          this.tweens.add({ targets: this.movesText, scale: 1.2, duration: 100, yoyo: true });
        }
        if (left <= 0 && !this.checkWin()) {
          this.endGame(false);
          return;
        }
      }
      if (this.mode === "level" && this.checkWin()) {
        this.endGame(true);
        return;
      }
      if (this.usedSlots.size >= 3) this.spawnTray();
      if (!this.anyPieceFits()) {
        this.endGame(this.mode === "level" ? false : null);
      }
    }
    anyPieceFits() {
      for (let i = 0; i < this.traySlots.length; i++) {
        if (this.usedSlots.has(i)) continue;
        const shape = this.traySlots[i].shape;
        for (let r = 0; r < GRID; r++) {
          for (let c = 0; c < GRID; c++) {
            if (this.canPlace(shape, r, c)) return true;
          }
        }
      }
      return false;
    }
    checkWin() {
      if (this.mode !== "level" || !this.level?.goal) return false;
      const g = this.level.goal;
      if (g.type === "score") return this.score >= g.target;
      if (g.type === "lines") return this.totalLines >= g.target;
      if (g.type === "combo") return this.maxCombo >= g.target;
      return false;
    }
    endGame(won) {
      if (this.gameEnded) return;
      this.gameEnded = true;
      this.clearGhost();
      this.hintGfx?.clear();
      if (won === true) sfx.play("win");
      else if (won === false) sfx.play("lose");
      if (this.mode === "endless") {
        setEndlessBest(this.progress, this.score);
        this.awardSessionXp(Math.round(this.score / 50));
        this.submitToLeaderboard();
        return;
      }
      if (this.mode === "daily") {
        const beaten = recordDailyScore(this.progress, this.score);
        if (beaten) this.grantAch("daily_win");
        this.awardSessionXp(Math.round(this.score / 40));
        this.submitToLeaderboard();
        return;
      }
      let stars = 0;
      if (won) {
        const thresholds = starThresholds(this.level, this.level.goal);
        const val = this.level.goal.type === "score" ? this.score : this.level.goal.type === "lines" ? this.totalLines : this.maxCombo;
        if (val >= thresholds[0]) stars = 1;
        if (val >= thresholds[1]) stars = 2;
        if (val >= thresholds[2]) stars = 3;
        setStars(this.progress, this.levelId, stars);
        if (stars >= 3) this.grantAch("three_star");
        this.awardSessionXp(30 + stars * 25);
      }
      this.showOverlay(won, this.score, stars);
    }
    awardSessionXp(base) {
      const gained = addXp(this.progress, base);
      this.sessionXp += gained;
    }
    async submitToLeaderboard() {
      const score = this.score;
      const mode = this.mode;
      try {
        await ensureName();
        const player = getPlayer();
        if (!hasName()) {
          this.lbResult = null;
        } else {
          const board = boardKey(mode);
          this.lbResult = await submitScore(board, player.id, player.name, score);
        }
      } catch {
        this.lbResult = null;
      }
      this.showOverlay(null, score);
    }
    showOverlay(won, score, stars = 0) {
      const dim = this.add.rectangle(W / 2, 390, W, 780, 0, 0).setDepth(100).setInteractive();
      this.tweens.add({ targets: dim, alpha: 0.78, duration: 250 });
      const panelH = won === null ? 400 : won ? 340 : 320;
      const panel = this.add.rectangle(W / 2, 360, 340, panelH, 1976635).setDepth(101).setStrokeStyle(2, won ? 3462041 : won === null ? 2282478 : 16281969).setScale(0.85).setAlpha(0);
      this.tweens.add({ targets: panel, scale: 1, alpha: 1, duration: 350, ease: "Back.easeOut" });
      let title, sub, color;
      if (won === null) {
        title = "RUN OVER";
        sub = "Keep pushing for a new best!";
        color = "#38bdf8";
        if (this.lbResult?.rank) {
          sub = `Global rank #${this.lbResult.rank.rank} of ${this.lbResult.rank.total}`;
        } else if (this.lbResult?.updated) {
          sub = "Score submitted to global board!";
        }
      } else if (won) {
        title = "LEVEL CLEAR!";
        sub = "";
        color = "#34d399";
        confettiBurst(this);
      } else {
        title = "OUT OF MOVES";
        const g = this.level?.goal;
        let almost = "";
        if (g) {
          if (g.type === "score") almost = `${g.target - this.score} pts short`;
          else if (g.type === "lines") almost = `${g.target - this.totalLines} lines short`;
          else if (this.maxCombo > 0) almost = `Best combo ${this.maxCombo}x \u2014 need ${g.target}x`;
        }
        sub = almost ? `${almost} \xB7 retry!` : "Try again \u2014 plan your clears";
        color = "#f87171";
      }
      const titleTxt = this.add.text(W / 2, 268, title, {
        fontFamily: "Syne, sans-serif",
        fontSize: "28px",
        fontStyle: "800",
        color
      }).setOrigin(0.5).setDepth(102).setAlpha(0);
      this.tweens.add({ targets: titleTxt, alpha: 1, y: 280, duration: 300, delay: 100 });
      if (won) {
        animateStars(this, W / 2, 330, stars);
      } else {
        this.add.text(W / 2, 330, sub, {
          fontFamily: "Outfit, sans-serif",
          fontSize: "16px",
          color: "#94a3b8",
          align: "center",
          wordWrap: { width: 280 }
        }).setOrigin(0.5).setDepth(102);
      }
      this.add.text(W / 2, won ? 378 : 370, `Score: ${score}${this.sessionXp ? `  \xB7  +${this.sessionXp} XP` : ""}`, {
        fontFamily: "Outfit, sans-serif",
        fontSize: "15px",
        fontStyle: "600",
        color: "#e2e8f0"
      }).setOrigin(0.5).setDepth(102);
      if (this.sessionXp > 0) {
        const tier = rankProgress(this.progress.xp || 0).rank;
        this.add.text(W / 2, won ? 402 : 394, `${tier.name} tier`, {
          fontFamily: "Outfit, sans-serif",
          fontSize: "13px",
          fontStyle: "700",
          color: tier.text || "#fde047"
        }).setOrigin(0.5).setDepth(102);
      }
      const btnY = won ? 448 : 430;
      if (won) {
        this.makeOverlayBtn(W / 2, btnY, "Next level \u2192", () => {
          const next = this.levelId + 1;
          if (getLevel(next)) transitionTo(this, "Game", { mode: "level", levelId: next });
          else transitionTo(this, "Map");
        });
        this.makeOverlayBtn(W / 2, btnY + 56, "Map", () => transitionTo(this, "Map"));
      } else if (won === null) {
        this.makeOverlayBtn(W / 2, btnY, "Play again", () => this.scene.restart());
        this.makeOverlayBtn(W / 2, btnY + 56, "Rankings", () => transitionTo(this, "Leaderboard", { board: boardKey(this.mode) || "endless" }));
        this.makeOverlayBtn(W / 2, btnY + 112, "Menu", () => transitionTo(this, "Menu"));
      } else {
        this.makeOverlayBtn(W / 2, btnY, "Retry", () => this.scene.restart());
        this.makeOverlayBtn(W / 2, btnY + 56, "Map", () => transitionTo(this, "Map"));
      }
    }
    makeOverlayBtn(x, y, label, cb) {
      const bg = this.add.rectangle(x, y, 240, 48, 6514417).setDepth(102).setInteractive({ useHandCursor: true }).setStrokeStyle(1, 16777215, 0.1);
      const txt = this.add.text(x, y, label, { fontFamily: "Outfit, sans-serif", fontSize: "16px", fontStyle: "700", color: "#fff" }).setOrigin(0.5).setDepth(103);
      bg.on("pointerover", () => bg.setFillStyle(8490232));
      bg.on("pointerout", () => bg.setFillStyle(6514417));
      bg.on("pointerdown", () => {
        sfx.play("click");
        this.tweens.add({ targets: [bg, txt], scaleX: 0.95, scaleY: 0.95, duration: 60, yoyo: true, onComplete: cb });
      });
    }
    returnToTray(go) {
      const slot = go.getData("slot");
      const homeX = go.getData("homeX");
      const homeY = go.getData("homeY");
      const sc = go.getData("pieceScale");
      go.setDepth(10);
      go.list.forEach((img) => img.setScale(sc));
      sfx.play("invalid");
      this.cameras.main.shake(60, 2e-3);
      this.tweens.add({
        targets: go,
        x: homeX,
        y: homeY,
        duration: 200,
        ease: "Back.easeOut"
      });
    }
    showToast(msg, ms) {
      const t = this.add.text(W / 2, 680, msg, {
        fontFamily: "Outfit, sans-serif",
        fontSize: "13px",
        color: "#cbd5e1",
        align: "center",
        wordWrap: { width: W - 48 },
        backgroundColor: "#1e293bcc",
        padding: { x: 12, y: 8 }
      }).setOrigin(0.5).setDepth(60);
      this.time.delayedCall(ms, () => t.destroy());
    }
    showConfirmExit() {
      const title = this.mode === "level" ? "Leave this level?" : this.mode === "daily" ? "Leave daily run?" : "Leave endless run?";
      showLeaveDialog(this, { title, onLeave: () => this.exitGame() });
    }
    exitGame() {
      if (this.mode === "level") transitionTo(this, "Map");
      else transitionTo(this, "Menu");
    }
  };

  // public/js/scenes/LeaderboardScene.js
  var LeaderboardScene = class extends Phaser.Scene {
    constructor() {
      super("Leaderboard");
    }
    init(data) {
      this.board = data.board || "endless";
    }
    create() {
      const L = leaderboardLayout(H);
      drawBackdrop(this, W, H);
      const goMenu = () => transitionTo(this, "Menu");
      addGameTopNav(this, { onBack: goMenu, onQuit: goMenu, backLabel: "\u2190 BACK" });
      drawScreenHeader(this, W / 2, L.headerY, "GLOBAL RANKINGS", "Live worldwide scores");
      this.liveDot = this.add.circle(W / 2 - 76, L.statusY, 5, 4906624, 1).setDepth(20);
      this.statusText = this.add.text(W / 2 - 58, L.statusY, "Connecting\u2026", {
        fontFamily: "Outfit, sans-serif",
        fontSize: "12px",
        fontStyle: "600",
        color: "#94a3b8"
      }).setOrigin(0, 0.5).setDepth(20);
      this.myRankText = this.add.text(W / 2, L.myRankY, "", {
        fontFamily: "Outfit, sans-serif",
        fontSize: "12px",
        fontStyle: "700",
        color: "#fde047"
      }).setOrigin(0.5).setDepth(20);
      const dailyBoard = `daily-${dailySeed()}`;
      this.makeTab(W / 2 - 90, L.tabsY, "ENDLESS", "endless", this.board === "endless");
      this.makeTab(W / 2 + 90, L.tabsY, "DAILY", dailyBoard, this.board === dailyBoard);
      drawGlassPanel(this, W / 2, L.panelY, W - 28, L.panelH, { depth: 2, stroke: 4674921 });
      this.listContainer = this.add.container(0, 0).setDepth(8);
      this.podiumContainer = this.add.container(0, 0).setDepth(9);
      this.layout = L;
      const refreshBg = this.add.rectangle(W - 36, L.refreshY, 36, 36, 3359061, 1).setStrokeStyle(1, 6583435).setInteractive({ useHandCursor: true }).setDepth(20);
      this.add.text(W - 36, L.refreshY, "\u21BB", { fontSize: "20px", color: "#e2e8f0" }).setOrigin(0.5).setDepth(21);
      refreshBg.on("pointerdown", () => {
        sfx.play("click");
        this.scene.restart({ board: this.board });
      });
      this.initBoard();
      fadeInScene(this);
      this.tweens.add({
        targets: this.liveDot,
        alpha: { from: 1, to: 0.35 },
        duration: 800,
        yoyo: true,
        repeat: -1
      });
    }
    makeTab(x, y, label, board, active) {
      makePillTab(this, x, y, label, active, () => {
        if (this.board !== board) this.scene.restart({ board });
      });
    }
    async initBoard() {
      if (!hasName()) await ensureName();
      await this.loadBoard(this.board);
      const me = getPlayer();
      const rank = await fetchMyRank(this.board, me.id);
      if (rank) {
        this.myRankText.setText(`Your rank: #${rank.rank}  \xB7  ${rank.score} pts  \xB7  ${rank.total} players`);
      } else if (hasName()) {
        this.myRankText.setText("Play endless or daily to claim your rank!");
      }
    }
    drawPodium(rows) {
      this.podiumContainer.removeAll(true);
      const top3 = rows.slice(0, 3);
      if (!top3.length) return;
      const base = this.layout.podiumY;
      const slots = [
        { x: W / 2 - 96, y: base + 28, h: 56, i: 1 },
        { x: W / 2, y: base, h: 72, i: 0 },
        { x: W / 2 + 96, y: base + 32, h: 52, i: 2 }
      ];
      slots.forEach((slot) => {
        const row = top3[slot.i];
        if (!row) return;
        const rc = rankColors(slot.i);
        const block = this.add.rectangle(slot.x, slot.y, 80, slot.h, rc.bg, 0.95).setStrokeStyle(2, rc.stroke);
        this.podiumContainer.add(block);
        this.podiumContainer.add(
          this.add.text(slot.x, slot.y - slot.h * 0.32, rc.medal, { fontSize: "20px" }).setOrigin(0.5)
        );
        this.podiumContainer.add(
          this.add.text(slot.x, slot.y + 2, row.name, {
            fontFamily: "Outfit, sans-serif",
            fontSize: "10px",
            fontStyle: "700",
            color: rc.text
          }).setOrigin(0.5)
        );
        this.podiumContainer.add(
          this.add.text(slot.x, slot.y + slot.h * 0.28, String(row.score), {
            fontFamily: "Outfit, sans-serif",
            fontSize: "13px",
            fontStyle: "800",
            color: rc.text
          }).setOrigin(0.5)
        );
      });
    }
    async loadBoard(board) {
      this.statusText.setText("Loading live scores\u2026");
      const data = await fetchLeaderboard(board);
      this.listContainer.removeAll(true);
      this.podiumContainer.removeAll(true);
      const me = getPlayer();
      const L = this.layout;
      if (data.offline) {
        this.liveDot.setFillStyle(16281969);
        this.statusText.setText("Rankings offline \u2014 check connection");
        this.statusText.setColor("#f87171");
        return;
      }
      this.liveDot.setFillStyle(data.source === "gist" ? 16498468 : 4906624);
      const rows = data.rows || [];
      const src = data.source === "gist" ? "preview" : "live";
      this.statusText.setText(
        rows.length ? `Top ${Math.min(L.maxRows, rows.length)} \xB7 ${src}` : "Be the first on the board!"
      );
      this.statusText.setColor("#94a3b8");
      this.drawPodium(rows);
      const listRows = rows.slice(0, L.maxRows);
      listRows.forEach((row, i) => {
        const y = L.listStart + i * L.listRow;
        const isMe = row.playerId === me.id;
        const rc = rankColors(i);
        const rowW = W - 52;
        const bgColor = isMe ? 4405450 : rc.bg;
        const alpha = isMe ? 0.55 : i < 3 ? 0.2 : 0.9;
        this.listContainer.add(
          this.add.rectangle(W / 2, y, rowW, 34, bgColor, alpha).setStrokeStyle(1, isMe ? 10859772 : rc.stroke, 0.7)
        );
        const rankLabel = i < 3 ? rc.medal : `${i + 1}`;
        this.listContainer.add(
          this.add.text(40, y, rankLabel, { fontSize: i < 3 ? "17px" : "14px", color: "#94a3b8" }).setOrigin(0, 0.5)
        );
        this.listContainer.add(
          this.add.text(80, y, row.name, {
            fontFamily: "Outfit, sans-serif",
            fontSize: "15px",
            fontStyle: isMe ? "800" : "600",
            color: isMe ? "#fde047" : "#f1f5f9",
            stroke: "#0f172a",
            strokeThickness: 1
          }).setOrigin(0, 0.5)
        );
        this.listContainer.add(
          this.add.text(W - 40, y, String(row.score), {
            fontFamily: "Outfit, sans-serif",
            fontSize: "16px",
            fontStyle: "800",
            color: "#38bdf8",
            stroke: "#0f172a",
            strokeThickness: 1
          }).setOrigin(1, 0.5)
        );
      });
    }
  };

  // public/js/main.js
  function setupNative() {
    const cap = window.Capacitor;
    if (!cap?.isNativePlatform?.()) return;
    document.body.classList.add("native-app");
    cap.Plugins?.SplashScreen?.hide?.().catch(() => {
    });
    cap.Plugins?.App?.addListener?.("backButton", () => {
      const g = window.__bfGame;
      const gameSc = g?.scene?.getScene?.("Game");
      if (gameSc?.scene?.isActive?.()) {
        gameSc.showConfirmExit?.();
        return;
      }
      const mapSc = g?.scene?.getScene?.("Map");
      if (mapSc?.scene?.isActive?.()) {
        mapSc.scene.start("Menu");
        return;
      }
      const lbSc = g?.scene?.getScene?.("Leaderboard");
      if (lbSc?.scene?.isActive?.()) {
        lbSc.scene.start("Menu");
        return;
      }
      cap.Plugins?.App?.minimizeApp?.();
    });
  }
  function hideLoading() {
    const el = document.getElementById("loading");
    if (el) el.remove();
  }
  function showBootError(msg) {
    hideLoading();
    const el = document.getElementById("game-container");
    if (!el) return;
    el.innerHTML = `<div style="color:#f87171;padding:24px;font-family:Outfit,sans-serif;max-width:380px;margin:40px auto">
    <h2 style="color:#38bdf8;margin-bottom:12px">Block Forge failed to start</h2>
    <p style="color:#94a3b8;font-size:14px;line-height:1.5;word-break:break-word">${String(msg)}</p>
    <p style="margin-top:16px;font-size:13px;color:#64748b">LAUNCH.bat chalao \u2192 http://localhost:8097 \u2192 Ctrl+Shift+R</p>
  </div>`;
  }
  function startGame() {
    if (typeof Phaser === "undefined") {
      showBootError("Phaser missing \u2014 LAUNCH.bat chalao.");
      return;
    }
    const config = {
      type: Phaser.AUTO,
      width: W,
      height: H,
      parent: "game-container",
      backgroundColor: "#060912",
      scene: [BootScene, MenuScene, MapScene, GameScene, LeaderboardScene],
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: W,
        height: H
      },
      render: {
        antialias: true,
        pixelArt: false,
        transparent: false,
        roundPixels: false,
        powerPreference: "high-performance"
      },
      resolution: uiResolution()
    };
    try {
      const game = new Phaser.Game(config);
      window.__bfGame = game;
      window.__bfReady = true;
      const applyInsets = () => {
        window.__bfSafeInsets = measureSafeInsets();
      };
      applyInsets();
      game.scale.on("resize", applyInsets);
      hideLoading();
      setupNative();
      applyInsets();
    } catch (e) {
      showBootError(e.message || String(e));
    }
  }
  window.addEventListener("error", (e) => {
    if (!window.__bfReady) showBootError(e.message || "Script error");
  });
  startGame();
  function unlockAudio() {
    sfx.ensure();
    bgm.unlock();
  }
  ["pointerdown", "touchstart", "keydown", "click"].forEach((ev) => {
    document.addEventListener(ev, unlockAudio, { once: true, passive: true });
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const gameSc = window.__bfGame?.scene?.getScene?.("Game");
    if (gameSc?.scene?.isActive?.()) gameSc.showConfirmExit?.();
  });
})();
