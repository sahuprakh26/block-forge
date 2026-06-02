import { H, W } from "../config.js";
import { loadProgress, getDailyBest, isDailyFresh } from "../progress.js";
import { rankProgress } from "../meta.js";
import { drawBackdrop, transitionTo, fadeInScene } from "../fx.js";
import { drawRankCard, makeGlowButton } from "../uiTheme.js";
import { hasName, getPlayer } from "../player.js";
import { promptName } from "../namePrompt.js";
import { sfx } from "../audio.js";
import { bgm } from "../music.js";
import { menuLayout } from "../layout.js";
import { APP_VERSION } from "../version.js";

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super("Menu");
  }

  create() {
    const L = menuLayout(H);
    drawBackdrop(this, W, H);

    const logoGlow = this.add.circle(W / 2, (L.logoY1 + L.logoY2) / 2, 64, 0x6366f1, 0.1).setDepth(0);
    this.tweens.add({
      targets: logoGlow,
      scale: { from: 0.94, to: 1.05 },
      alpha: { from: 0.06, to: 0.15 },
      duration: 2400,
      yoyo: true,
      repeat: -1,
    });

    this.add
      .text(W / 2, L.logoY1, "BLOCK", {
        fontFamily: "Syne, sans-serif",
        fontSize: L.logoSize,
        fontStyle: "800",
        color: "#e0e7ff",
      })
      .setOrigin(0.5)
      .setDepth(2);
    this.add
      .text(W / 2, L.logoY2, "FORGE", {
        fontFamily: "Syne, sans-serif",
        fontSize: L.logoSize,
        fontStyle: "800",
        color: "#38bdf8",
      })
      .setOrigin(0.5)
      .setDepth(2);

    const p = loadProgress();
    const xp = p.xp || 0;
    const prog = rankProgress(xp);
    drawRankCard(this, W / 2, L.rankCardY, L.rankCardW, L.rankCardH, prog, xp);

    const totalStars = Object.values(p.stars || {}).reduce((a, b) => a + b, 0);
    const streak = p.streakDays || 0;
    const streakTxt = streak > 1 ? ` · 🔥 ${streak}d` : "";
    this.add
      .text(W / 2, L.statsY, `★ ${totalStars}  ·  Endless best ${p.endlessBest || 0}${streakTxt}`, {
        fontFamily: "Outfit, sans-serif",
        fontSize: "12px",
        color: "#64748b",
      })
      .setOrigin(0.5)
      .setDepth(2);

    const go = (fn) => () => {
      bgm.unlock();
      fn();
    };
    const btnOpts = { width: L.btnW, height: L.btnH, fontSize: L.compact ? "13px" : "15px" };

    makeGlowButton(this, W / 2, L.btnCampaign, "▶  CAMPAIGN", 0x6366f1, go(() => transitionTo(this, "Map")), btnOpts);

    const dailyBest = getDailyBest(p);
    const dailyFresh = isDailyFresh(p);
    const dailyLabel = dailyFresh ? "☀  DAILY  ·  NEW" : `☀  DAILY  ·  Best ${dailyBest}`;
    makeGlowButton(
      this,
      W / 2,
      L.btnDaily,
      dailyLabel,
      dailyFresh ? 0xb45309 : 0x334155,
      go(() => transitionTo(this, "Game", { mode: "daily" })),
      btnOpts
    );

    makeGlowButton(this, W / 2, L.btnEndless, "∞  ENDLESS", 0x1e40af, go(() => transitionTo(this, "Game", { mode: "endless" })), btnOpts);

    makeGlowButton(
      this,
      W / 2,
      L.btnRankings,
      "🏆  LIVE RANKINGS",
      0x7c3aed,
      go(() => transitionTo(this, "Leaderboard", { board: "endless" })),
      btnOpts
    );

    this.makeNameBadge(W / 2, L.nameY);
    this.buildAudioToggles(L.audioY);

    this.add
      .text(W / 2, L.footerY, `v${APP_VERSION} · Iron → Gold → Immortal`, {
        fontFamily: "Outfit, sans-serif",
        fontSize: "10px",
        color: "#475569",
      })
      .setOrigin(0.5);

    this.input.once("pointerdown", () => bgm.unlock());
    if (bgm.isOn()) bgm.unlock();

    fadeInScene(this);
  }

  makeNameBadge(x, y) {
    const player = getPlayer();
    const named = hasName();
    const label = named ? player.name : "Set your name";
    const w = 240;
    const h = 38;
    const bg = this.add
      .rectangle(x, y, w, h, named ? 0x1e293b : 0x7c2d12, 1)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(1, named ? 0x475569 : 0xf97316, 0.6)
      .setDepth(8);
    this.add
      .text(x - w / 2 + 16, y, "👤", { fontSize: "16px" })
      .setOrigin(0, 0.5)
      .setDepth(9);
    this.add
      .text(x - 8, y, label, {
        fontFamily: "Outfit, sans-serif",
        fontSize: "14px",
        fontStyle: "600",
        color: named ? "#e2e8f0" : "#fdba74",
      })
      .setOrigin(0.5)
      .setDepth(9);
    bg.on("pointerdown", () => {
      promptName(named ? player.name : "").then(() => this.scene.restart());
    });
    bg.on("pointerover", () => bg.setFillStyle(named ? 0x334155 : 0x9a3412));
    bg.on("pointerout", () => bg.setFillStyle(named ? 0x1e293b : 0x7c2d12));
  }

  buildAudioToggles(y) {
    this.makeToggle(W / 2 - 54, y, sfx.isOn(), "SFX", (on) => {
      sfx.toggle(on);
      sfx.play("click");
    });
    this.makeToggle(W / 2 + 54, y, bgm.isOn(), "MUSIC", (on) => {
      bgm.toggle(on);
      if (on) bgm.unlock();
    });
  }

  makeToggle(x, y, on, label, cb) {
    const w = 88;
    const h = 28;
    const bg = this.add
      .rectangle(x, y, w, h, on ? 0x6366f1 : 0x1e293b, 1)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(1, on ? 0x818cf8 : 0x475569)
      .setDepth(8);
    const txt = this.add
      .text(x, y, `${on ? "ON" : "OFF"} ${label}`, {
        fontFamily: "Outfit, sans-serif",
        fontSize: "10px",
        fontStyle: "700",
        color: on ? "#fff" : "#64748b",
      })
      .setOrigin(0.5)
      .setDepth(9);
    bg.on("pointerdown", () => {
      const next = !on;
      cb(next);
      on = next;
      bg.setFillStyle(on ? 0x6366f1 : 0x1e293b);
      bg.setStrokeStyle(1, on ? 0x818cf8 : 0x475569);
      txt.setText(`${on ? "ON" : "OFF"} ${label}`);
      txt.setColor(on ? "#fff" : "#64748b");
    });
  }
}
