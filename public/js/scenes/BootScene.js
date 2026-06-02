import { COLORS, W, H } from "../config.js";

export default class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  create() {
    this.add.rectangle(W / 2, H / 2, W, H, 0x060912);
    const loadTxt = this.add
      .text(W / 2, H / 2, "BLOCK FORGE", {
        fontFamily: "Syne, sans-serif",
        fontSize: "28px",
        fontStyle: "800",
        color: "#38bdf8",
      })
      .setOrigin(0.5)
      .setAlpha(0.6);

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
    const size = 44;

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
      g.fillStyle(shine, 0.45);
      g.fillRoundedRect(5, 4, size - 20, 14, 6);
      g.fillStyle(0xffffff, 0.55);
      g.fillCircle(11, 10, 4);
      g.fillStyle(0xffffff, 0.12);
      g.fillRoundedRect(7, 18, size - 22, size - 26, 6);
      g.lineStyle(2, 0xffffff, 0.28);
      g.strokeRoundedRect(2, 2, size - 6, size - 6, 10);
      g.lineStyle(1, shine, 0.35);
      g.strokeRoundedRect(3, 3, size - 8, size - 8, 9);
      g.generateTexture(`block-${i}`, size, size);
    }

    g.clear();
    g.fillStyle(0x121a2e, 0.92);
    g.fillRoundedRect(0, 0, size, size, 9);
    g.lineStyle(1, 0x475569, 0.7);
    g.strokeRoundedRect(0, 0, size, size, 9);
    g.fillStyle(0x818cf8, 0.06);
    g.fillRoundedRect(2, 2, size - 4, size - 4, 8);
    g.fillStyle(0xffffff, 0.04);
    g.fillCircle(size / 2, size / 3, size * 0.22);
    g.generateTexture("cell-empty", size, size);

    g.clear();
    g.fillStyle(0xffffff, 1);
    g.fillCircle(4, 4, 4);
    g.generateTexture("particle", 8, 8);

    g.clear();
    g.fillStyle(0xffffff, 0.2);
    g.fillCircle(16, 16, 14);
    g.generateTexture("glow-soft", 32, 32);

    g.clear();
    g.fillGradientStyle(0x818cf8, 0x38bdf8, 0xc084fc, 0x4ade80, 0.4);
    g.fillRect(0, 0, 64, 64);
    g.generateTexture("bg-noise", 64, 64);
  }
}
