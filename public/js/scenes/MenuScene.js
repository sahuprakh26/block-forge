import { H, W } from "../config.js";
import { loadProgress, getDailyBest, isDailyFresh } from "../progress.js";
import { rankProgress } from "../meta.js";
import { drawBackdrop, transitionTo, fadeInScene } from "../fx.js";
import { drawRankCard, drawMenuLogo, makeGlowButton } from "../uiTheme.js";
import { hasName, getPlayer } from "../player.js";
import { promptName } from "../namePrompt.js";
import { sfx } from "../audio.js";
import { bgm } from "../music.js";
import { menuLayout } from "../layout.js";
import { APP_VERSION } from "../version.js";
import { applyCrispText, uiTextStyle } from "../textUtil.js";

export default class MenuScene extends Phaser.Scene {
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
    const streakTxt = streak > 1 ? ` · 🔥 ${streak}d` : "";
    applyCrispText(
      this.add
        .text(W / 2, L.statsY, `★ ${totalStars}  ·  Endless best ${p.endlessBest || 0}${streakTxt}`, uiTextStyle({
          fontSize: "12px",
          color: "#94a3b8",
          strokeThickness: 1,
        }))
        .setOrigin(0.5)
        .setDepth(2)
    );

    const go = (fn) => () => {
      bgm.unlock();
      fn();
    };
    const btnOpts = { width: L.btnW, height: L.btnH, fontSize: "17px" };

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
      "LIVE RANKINGS",
      0x7c3aed,
      go(() => transitionTo(this, "Leaderboard", { board: "endless" })),
      { ...btnOpts, live: true }
    );

    this.makeNameBadge(W / 2, L.nameY);
    this.buildAudioToggles(L.audioY);

    applyCrispText(
      this.add
        .text(W / 2, L.footerY, `v${APP_VERSION} · Iron → Gold → Immortal`, uiTextStyle({
          fontSize: "12px",
          color: "#64748b",
          strokeThickness: 0,
        }))
        .setOrigin(0.5)
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
    const bg = this.add
      .rectangle(x, y, w, h, named ? 0x1e293b : 0x7c2d12, 1)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(1, named ? 0x475569 : 0xf97316, 0.6)
      .setDepth(8);
    applyCrispText(
      this.add
        .text(x, y, `👤  ${label}`, uiTextStyle({
          fontSize: "16px",
          fontStyle: "600",
          color: named ? "#f1f5f9" : "#fdba74",
        }))
        .setOrigin(0.5)
        .setDepth(9)
    );
    bg.on("pointerdown", () => {
      promptName(named ? player.name : "").then(() => this.scene.restart());
    });
    bg.on("pointerover", () => bg.setFillStyle(named ? 0x334155 : 0x9a3412));
    bg.on("pointerout", () => bg.setFillStyle(named ? 0x1e293b : 0x7c2d12));
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
    const bg = this.add
      .rectangle(x, y, w, h, on ? 0x6366f1 : 0x1e293b, 1)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(1, on ? 0x818cf8 : 0x475569)
      .setDepth(8);
    applyCrispText(
      this.add
        .text(x, y, `${on ? "ON" : "OFF"} ${label}`, uiTextStyle({
          fontSize: "12px",
          fontStyle: "700",
          color: on ? "#fff" : "#94a3b8",
        }))
        .setOrigin(0.5)
        .setDepth(9)
    );
    bg.on("pointerdown", () => {
      const next = !on;
      cb(next);
      on = next;
      bg.setFillStyle(on ? 0x6366f1 : 0x1e293b);
      bg.setStrokeStyle(1, on ? 0x818cf8 : 0x475569);
    });
  }
}
