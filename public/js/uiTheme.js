import { W } from "./config.js";
import { sfx } from "./audio.js";

/** Glass panel with border glow */
export function drawGlassPanel(scene, x, y, w, h, opts = {}) {
  const depth = opts.depth ?? 4;
  const fill = opts.fill ?? 0x0f172a;
  const alpha = opts.alpha ?? 0.88;
  const stroke = opts.stroke ?? 0x6366f1;
  const panel = scene.add.container(x, y).setDepth(depth);
  const outer = scene.add.rectangle(0, 0, w, h, fill, alpha).setStrokeStyle(2, stroke, 0.45);
  const shine = scene.add.rectangle(0, -h * 0.38, w - 8, h * 0.22, 0xffffff, 0.04);
  panel.add([outer, shine]);
  return panel;
}

/** Primary menu / CTA button */
export function makeGlowButton(scene, x, y, label, color, onClick, opts = {}) {
  const w = opts.width ?? 280;
  const h = opts.height ?? 52;
  const depth = opts.depth ?? 10;
  const container = scene.add.container(x, y).setDepth(depth);
  const shadow = scene.add.rectangle(2, 4, w, h, 0x000000, 0.35);
  const bg = scene.add
    .rectangle(0, 0, w, h, color, 1)
    .setStrokeStyle(2, 0xffffff, 0.14)
    .setInteractive({ useHandCursor: true });
  const gloss = scene.add.rectangle(0, -h * 0.22, w - 12, h * 0.35, 0xffffff, 0.1);
  const txt = scene.add
    .text(0, 0, label, {
      fontFamily: "Outfit, sans-serif",
      fontSize: opts.fontSize ?? (label.length > 22 ? "14px" : "17px"),
      fontStyle: "700",
      color: "#fff",
      align: "center",
      wordWrap: { width: w - 24 },
    })
    .setOrigin(0.5);
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
      onComplete: onClick,
    });
  };
  bg.on("pointerdown", press);
  txt.setInteractive({ useHandCursor: true }).on("pointerdown", press);
  bg.on("pointerover", () => scene.tweens.add({ targets: container, scaleX: 1.03, scaleY: 1.03, duration: 100 }));
  bg.on("pointerout", () => scene.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 100 }));
  return container;
}

/** Pill tab (leaderboard endless/daily) */
export function makePillTab(scene, x, y, label, active, onClick) {
  const w = 148;
  const h = 38;
  const bg = scene.add
    .rectangle(x, y, w, h, active ? 0x6366f1 : 0x1e293b, active ? 1 : 0.92)
    .setStrokeStyle(2, active ? 0xa5b4fc : 0x475569, active ? 0.9 : 0.5)
    .setInteractive({ useHandCursor: true })
    .setDepth(15);
  if (active) {
    scene.add.rectangle(x, y - 2, w - 8, 10, 0xffffff, 0.08).setDepth(14);
  }
  const txt = scene.add
    .text(x, y, label, {
      fontFamily: "Outfit, sans-serif",
      fontSize: "13px",
      fontStyle: "700",
      color: active ? "#fff" : "#94a3b8",
    })
    .setOrigin(0.5)
    .setDepth(16);
  const fire = () => {
    sfx.play("click");
    onClick();
  };
  bg.on("pointerdown", fire);
  txt.setInteractive({ useHandCursor: true }).on("pointerdown", fire);
  return { bg, txt };
}

export function drawTitleGlow(scene, x, y, title, subtitle) {
  scene.add
    .text(x, y - 2, title, {
      fontFamily: "Syne, sans-serif",
      fontSize: "26px",
      fontStyle: "800",
      color: "#6366f1",
    })
    .setOrigin(0.5)
    .setAlpha(0.35)
    .setDepth(2);
  scene.add
    .text(x, y, title, {
      fontFamily: "Syne, sans-serif",
      fontSize: "26px",
      fontStyle: "800",
      color: "#38bdf8",
    })
    .setOrigin(0.5)
    .setDepth(3);
  if (subtitle) {
    scene.add
      .text(x, y + 28, subtitle, {
        fontFamily: "Outfit, sans-serif",
        fontSize: "12px",
        color: "#64748b",
      })
      .setOrigin(0.5)
      .setDepth(3);
  }
}

export function rankColors(i) {
  if (i === 0) return { bg: 0xfbbf24, stroke: 0xfde047, text: "#0f172a", medal: "🥇" };
  if (i === 1) return { bg: 0x94a3b8, stroke: 0xe2e8f0, text: "#0f172a", medal: "🥈" };
  if (i === 2) return { bg: 0xb45309, stroke: 0xfdba74, text: "#fff", medal: "🥉" };
  return { bg: 0x111827, stroke: 0x334155, text: "#e2e8f0", medal: `${i + 1}` };
}
