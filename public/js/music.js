import { loadProgress, saveProgress } from "./progress.js";
import { acquireContext } from "./audio.js";

/** Puzzle-game loop — procedural, no audio files */
const BPM = 108;
const BEAT = 60 / BPM;
const BAR = BEAT * 4;

const BASS_LINE = [
  110, 110, 87.31, 87.31, 98, 98, 82.41, 82.41,
  110, 110, 130.81, 130.81, 98, 98, 73.42, 73.42,
];

const MELODY = [
  440, 0, 523.25, 0, 659.25, 587.33, 523.25, 0,
  392, 0, 493.88, 0, 587.33, 523.25, 440, 0,
  523.25, 0, 659.25, 0, 783.99, 659.25, 587.33, 0,
  440, 493.88, 523.25, 587.33, 659.25, 587.33, 523.25, 440,
];

class Bgm {
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
      this.ctx.resume().catch(() => {});
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
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.14);
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
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.04);
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
    gain.gain.setValueAtTime(0.001, start);
    gain.gain.exponentialRampToValueAtTime(vol, start + 0.02);
    gain.gain.setValueAtTime(vol * 0.7, start + dur * 0.6);
    gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
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
    gain.gain.setValueAtTime(0.001, start);
    gain.gain.exponentialRampToValueAtTime(0.06, start + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
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

    this.timer = setTimeout(() => this.playBeat(), BEAT * 1000);
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
}

export const bgm = new Bgm();
