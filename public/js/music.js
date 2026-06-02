import { loadProgress, saveProgress } from "./progress.js";
import { acquireContext } from "./audio.js";

/** Ambient crystal-cave loop — no external files needed */
const PROGRESSION = [
  [220.0, 261.63, 329.63],
  [174.61, 220.0, 261.63],
  [261.63, 329.63, 392.0],
  [196.0, 246.94, 293.66],
  [220.0, 277.18, 329.63],
  [196.0, 261.63, 329.63],
];

class Bgm {
  constructor() {
    this.enabled = loadProgress().music !== false;
    this.playing = false;
    this.timer = null;
    this.master = null;
    this.ctx = null;
    this.step = 0;
    this.chordDur = 5.5;
  }

  ensure() {
    if (!this.enabled) return false;
    this.ctx = acquireContext();
    if (!this.master) {
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.2;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
    return true;
  }

  pad(freq, start, dur, vol) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.001, start);
    gain.gain.exponentialRampToValueAtTime(vol, start + 1.2);
    gain.gain.setValueAtTime(vol * 0.85, start + dur - 1.0);
    gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(start);
    osc.stop(start + dur + 0.05);
  }

  sparkle(freq, start, vol) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, start);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, start + 0.35);
    gain.gain.setValueAtTime(vol, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.45);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(start);
    osc.stop(start + 0.5);
  }

  playStep() {
    if (!this.playing || !this.ctx) return;
    const t = this.ctx.currentTime + 0.08;
    const chord = PROGRESSION[this.step % PROGRESSION.length];
    this.step += 1;
    chord.forEach((f, i) => this.pad(f, t, this.chordDur, 0.032 - i * 0.005));
    for (let i = 0; i < 3; i++) {
      this.sparkle(chord[i % chord.length] * 2, t + 1.0 + i * 1.4, 0.018);
    }
    this.timer = setTimeout(() => this.playStep(), (this.chordDur - 0.15) * 1000);
  }

  start() {
    if (!this.ensure() || this.playing) return;
    this.playing = true;
    this.playStep();
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
    if (on) this.start();
    else this.stop();
  }

  isOn() {
    return this.enabled;
  }
}

export const bgm = new Bgm();
