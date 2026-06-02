import { WORLDS } from "../levels.js";
import { loadProgress, getStars } from "../progress.js";
import { drawBackdrop, transitionTo, fadeInScene } from "../fx.js";
import { sfx } from "../audio.js";
import { bgm } from "../music.js";

export default class MapScene extends Phaser.Scene {
  constructor() {
    super("Map");
  }

  create() {
    const { width, height } = this.scale;
    const p = loadProgress();
    const world = WORLDS[0];
    drawBackdrop(this, width, height);

    const totalStars = Object.values(p.stars || {}).reduce((a, b) => a + b, 0);
    const maxStars = world.levels.length * 3;

    this.add
      .text(width / 2, 32, world.name, {
        fontFamily: "Syne, sans-serif",
        fontSize: "26px",
        fontStyle: "700",
        color: "#22d3ee",
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 62, `${totalStars} / ${maxStars} ★`, {
        fontFamily: "Outfit, sans-serif",
        fontSize: "14px",
        color: "#64748b",
      })
      .setOrigin(0.5);

    this.add.rectangle(width / 2, 82, width - 60, 5, 0x1e293b).setOrigin(0.5);
    const progBar = this.add.rectangle(30, 82, 0, 5, 0xfbbf24).setOrigin(0, 0.5);
    progBar.width = (width - 60) * (totalStars / maxStars);

    const cols = 5;
    const startX = 52;
    const startY = 118;
    const gap = 68;

    const nodes = world.levels.map((_, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      return { x: startX + col * gap, y: startY + row * gap };
    });

    const pathGfx = this.add.graphics().setDepth(0);
    pathGfx.lineStyle(2, 0x334155, 0.5);
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
        const pulse = this.add.circle(x, y, 32, 0x6366f1, 0.15).setDepth(0);
        this.tweens.add({ targets: pulse, scale: 1.35, alpha: 0, duration: 1200, repeat: -1 });
      }

      const node = this.add
        .circle(x, y, locked ? 24 : 26, locked ? 0x1e293b : isCurrent ? 0x818cf8 : 0x6366f1, locked ? 0.55 : 1)
        .setDepth(1);
      if (!locked) node.setInteractive({ useHandCursor: true });
      node.setStrokeStyle(2, locked ? 0x334155 : 0xa5b4fc);

      const num = this.add
        .text(x, y - 2, String(lv.id), {
          fontFamily: "Outfit, sans-serif",
          fontSize: "15px",
          fontStyle: "700",
          color: locked ? "#475569" : "#fff",
        })
        .setOrigin(0.5)
        .setDepth(2);

      for (let s = 0; s < 3; s++) {
        this.add
          .text(x - 14 + s * 14, y + 28, s < stars ? "★" : "☆", {
            fontSize: "9px",
            color: s < stars ? "#fbbf24" : "#334155",
          })
          .setOrigin(0.5)
          .setDepth(2);
      }

      if (!locked) {
        node.on("pointerdown", () => {
          sfx.play("click");
          this.showLevelPreview(lv, x, y);
          this.time.delayedCall(280, () =>
            transitionTo(this, "Game", { mode: "level", levelId: lv.id })
          );
        });
        node.on("pointerover", () => {
          node.setFillStyle(0x818cf8);
          this.tweens.add({ targets: node, scale: 1.12, duration: 100 });
        });
        node.on("pointerout", () => {
          node.setFillStyle(isCurrent ? 0x818cf8 : 0x6366f1);
          this.tweens.add({ targets: node, scale: 1, duration: 100 });
        });
      }
    });

    this.makeBack(width / 2, height - 56);
    fadeInScene(this);
    if (bgm.isOn()) bgm.unlock();
  }

  showLevelPreview(lv, x, y) {
    if (this.preview) this.preview.destroy();
    this.preview = this.add.container(x, y - 52).setDepth(20);
    const bg = this.add.rectangle(0, 0, 160, 36, 0x1e293b, 0.95).setStrokeStyle(1, 0x6366f1);
    const txt = this.add
      .text(0, 0, lv.name, { fontFamily: "Outfit, sans-serif", fontSize: "12px", fontStyle: "600", color: "#e2e8f0" })
      .setOrigin(0.5);
    this.preview.add([bg, txt]);
    this.tweens.add({ targets: this.preview, alpha: 0, duration: 400, delay: 400, onComplete: () => this.preview?.destroy() });
  }

  makeBack(x, y) {
    const bg = this.add
      .rectangle(x, y, 200, 46, 0x1e293b)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(1, 0x475569);
    const txt = this.add
      .text(x, y, "← Menu", { fontFamily: "Outfit, sans-serif", fontSize: "16px", fontStyle: "600", color: "#e2e8f0" })
      .setOrigin(0.5);
    bg.on("pointerdown", () => transitionTo(this, "Menu"));
    bg.on("pointerover", () => bg.setFillStyle(0x334155));
    bg.on("pointerout", () => bg.setFillStyle(0x1e293b));
  }
}
