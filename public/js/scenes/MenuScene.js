import { loadProgress, getDailyBest, isDailyFresh } from "../progress.js";
import { getRank, nextRankXp } from "../meta.js";
import { drawBackdrop, transitionTo, fadeInScene } from "../fx.js";
import { drawGlassPanel, makeGlowButton } from "../uiTheme.js";
import { hasName, getPlayer } from "../player.js";
import { promptName } from "../namePrompt.js";
import { sfx } from "../audio.js";
import { bgm } from "../music.js";

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super("Menu");
  }

  create() {
    const { width, height } = this.scale;
    drawBackdrop(this, width, height);

    for (let i = 0; i < 8; i++) {
      const dot = this.add.circle(
        Phaser.Math.Between(20, width - 20),
        Phaser.Math.Between(40, height - 40),
        Phaser.Math.Between(1, 3),
        Phaser.Utils.Array.GetRandom([0x818cf8, 0x38bdf8, 0xc084fc]),
        0.12
      );
      this.tweens.add({
        targets: dot,
        y: dot.y + Phaser.Math.Between(-40, 40),
        alpha: { from: 0.06, to: 0.22 },
        duration: Phaser.Math.Between(2500, 5000),
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }

    const logoGlow = this.add.circle(width / 2, height * 0.17, 90, 0x6366f1, 0.12).setDepth(0);
    this.tweens.add({
      targets: logoGlow,
      scale: { from: 0.9, to: 1.1 },
      alpha: { from: 0.08, to: 0.2 },
      duration: 2400,
      yoyo: true,
      repeat: -1,
    });
    this.add
      .text(width / 2, height * 0.14, "BLOCK", {
        fontFamily: "Syne, sans-serif",
        fontSize: "52px",
        fontStyle: "800",
        color: "#e0e7ff",
      })
      .setOrigin(0.5)
      .setDepth(2);
    this.add
      .text(width / 2, height * 0.2, "FORGE", {
        fontFamily: "Syne, sans-serif",
        fontSize: "52px",
        fontStyle: "800",
        color: "#38bdf8",
      })
      .setOrigin(0.5)
      .setDepth(2);

    const p = loadProgress();
    const rank = getRank(p.xp || 0);
    const nextXp = nextRankXp(p.xp || 0);
    const prevXp = rank.xp;
    const barW = width - 64;
    const ratio = Math.min(1, (p.xp - prevXp) / Math.max(1, nextXp - prevXp));

    drawGlassPanel(this, width / 2, height * 0.31, barW + 24, 72, { depth: 1, stroke: 0x6366f1 });
    this.add
      .text(width / 2, height * 0.275, rank.name, {
        fontFamily: "Syne, sans-serif",
        fontSize: "17px",
        fontStyle: "700",
        color: "#fde047",
      })
      .setOrigin(0.5)
      .setDepth(2);
    this.add.rectangle(width / 2, height * 0.31, barW, 10, 0x1e293b).setOrigin(0.5).setDepth(2);
    this.add.rectangle(32 + barW * ratio * 0.5, height * 0.31, barW * ratio, 10, 0x818cf8).setOrigin(0, 0.5).setDepth(2);
    this.add
      .text(width / 2, height * 0.335, `${p.xp || 0} / ${nextXp} XP`, {
        fontFamily: "Outfit, sans-serif",
        fontSize: "11px",
        color: "#94a3b8",
      })
      .setOrigin(0.5)
      .setDepth(2);

    const totalStars = Object.values(p.stars || {}).reduce((a, b) => a + b, 0);
    const streak = p.streakDays || 0;
    const streakTxt = streak > 1 ? `  ·  🔥 ${streak} day streak` : "";
    this.add
      .text(width / 2, height * 0.355, `★ ${totalStars}  ·  Endless ${p.endlessBest || 0}${streakTxt}`, {
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
    makeGlowButton(this, width / 2, height * 0.42, "▶  CAMPAIGN", 0x6366f1, go(() => transitionTo(this, "Map")));

    const dailyBest = getDailyBest(p);
    const dailyFresh = isDailyFresh(p);
    const dailyLabel = dailyFresh ? "☀  DAILY CHALLENGE  ·  NEW" : `☀  DAILY  ·  Best ${dailyBest}`;
    makeGlowButton(
      this,
      width / 2,
      height * 0.51,
      dailyLabel,
      dailyFresh ? 0xb45309 : 0x334155,
      go(() => transitionTo(this, "Game", { mode: "daily" }))
    );

    makeGlowButton(this, width / 2, height * 0.6, "∞  ENDLESS", 0x1e40af, go(() => transitionTo(this, "Game", { mode: "endless" })));

    makeGlowButton(this, width / 2, height * 0.69, "🏆  LIVE RANKINGS", 0x7c3aed, go(() =>
      transitionTo(this, "Leaderboard", { board: "endless" })
    ));

    this.makeNameBadge(width / 2, height * 0.775);
    this.buildAudioToggles(width, height);

    this.add
      .text(width / 2, height * 0.9, "Chain clears · Daily challenge · global rankings", {
        fontFamily: "Outfit, sans-serif",
        fontSize: "12px",
        color: "#475569",
        align: "center",
        wordWrap: { width: width - 40 },
      })
      .setOrigin(0.5);

    this.input.once("pointerdown", () => bgm.unlock());
    if (bgm.isOn()) bgm.unlock();

    fadeInScene(this);
  }

  makeNameBadge(x, y) {
    const player = getPlayer();
    const named = hasName();
    const label = named ? `👤  ${player.name}` : "👤  Set your name";
    const w = 220;
    const h = 38;
    const bg = this.add
      .rectangle(x, y, w, h, named ? 0x334155 : 0x7c2d12, 1)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(1, named ? 0x475569 : 0xf97316, 0.5);
    this.add
      .text(x, y, label, {
        fontFamily: "Outfit, sans-serif",
        fontSize: "14px",
        fontStyle: "600",
        color: named ? "#e2e8f0" : "#fdba74",
      })
      .setOrigin(0.5);
    bg.on("pointerdown", () => {
      promptName(named ? player.name : "").then(() => this.scene.restart());
    });
    bg.on("pointerover", () => bg.setFillStyle(named ? 0x475569 : 0x9a3412));
    bg.on("pointerout", () => bg.setFillStyle(named ? 0x334155 : 0x7c2d12));
  }

  buildAudioToggles(width, height) {
    const y = height - 28;
    this.makeToggle(width / 2 - 58, y, sfx.isOn(), "SFX", (on) => {
      sfx.toggle(on);
      sfx.play("click");
    });
    this.makeToggle(width / 2 + 58, y, bgm.isOn(), "MUSIC", (on) => {
      bgm.toggle(on);
      if (on) bgm.unlock();
    });
  }

  makeToggle(x, y, on, label, cb) {
    const w = 96;
    const h = 32;
    const bg = this.add
      .rectangle(x, y, w, h, on ? 0x6366f1 : 0x1e293b, 1)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(1, on ? 0x818cf8 : 0x475569);
    const txt = this.add
      .text(x, y, `${on ? "ON" : "OFF"} · ${label}`, {
        fontFamily: "Outfit, sans-serif",
        fontSize: "11px",
        fontStyle: "700",
        color: on ? "#fff" : "#64748b",
      })
      .setOrigin(0.5);
    bg.on("pointerdown", () => {
      const next = !on;
      cb(next);
      on = next;
      bg.setFillStyle(on ? 0x6366f1 : 0x1e293b);
      bg.setStrokeStyle(1, on ? 0x818cf8 : 0x475569);
      txt.setText(`${on ? "ON" : "OFF"} · ${label}`);
      txt.setColor(on ? "#fff" : "#64748b");
    });
  }

}
