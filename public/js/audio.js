import { loadProgress, saveProgress } from "./progress.js";

let sharedCtx = null;

export function acquireContext() {
  if (!sharedCtx) sharedCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (sharedCtx.state === "suspended") sharedCtx.resume();
  return sharedCtx;
}

class Sfx {
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
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
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
}

export const sfx = new Sfx();
