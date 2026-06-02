import { W } from "./config.js";
import { sfx } from "./audio.js";

export function drawGlassPanel(scene, x, y, w, h, opts = {}) {
  const depth = opts.depth ?? 4;
  const fill = opts.fill ?? 0x0f172a;
  const alpha = opts.alpha ?? 0.9;
  const stroke = opts.stroke ?? 0x6366f1;
  const panel = scene.add.container(x, y).setDepth(depth);
  const outer = scene.add.rectangle(0, 0, w, h, fill, alpha).setStrokeStyle(2, stroke, 0.5);
  const shine = scene.add.rectangle(0, -h * 0.36, w - 10, h * 0.2, 0xffffff, 0.05);
  panel.add([outer, shine]);
  return panel;
}

/** Metal tier card — icon, tier name, XP bar, next tier */
export function drawRankCard(scene, x, y, w, h, progress, xp) {
  const { rank, next, nextXp, ratio } = progress;
  const depth = 6;
  const c = scene.add.container(x, y).setDepth(depth);

  c.add(
    scene.add
      .rectangle(0, 0, w, h, 0x0c1222, 0.94)
      .setStrokeStyle(2, rank.stroke || rank.color, 0.85)
  );
  c.add(scene.add.rectangle(-w / 2 + 5, 0, 5, h - 14, rank.color, 1).setOrigin(0, 0.5));
  c.add(scene.add.circle(-w / 2 + 54, 0, 30, rank.color, 0.18));

  const badgeX = -w / 2 + 54;
  c.add(scene.add.circle(badgeX, 0, 26, rank.color, 1).setStrokeStyle(2, rank.stroke || 0xffffff, 0.55));
  c.add(scene.add.text(badgeX, 0, rank.icon, { fontSize: "20px" }).setOrigin(0.5));

  const textX = -w / 2 + 98;
  c.add(
    scene.add
      .text(textX, -20, rank.name.toUpperCase(), {
        fontFamily: "Syne, sans-serif",
        fontSize: "20px",
        fontStyle: "800",
        color: rank.text || "#fff",
      })
      .setOrigin(0, 0.5)
  );
  c.add(
    scene.add
      .text(textX, 2, next ? `Next → ${next.name}` : "MAX TIER REACHED", {
        fontFamily: "Outfit, sans-serif",
        fontSize: "11px",
        color: "#64748b",
      })
      .setOrigin(0, 0.5)
  );

  const barW = w - 112;
  const barMidX = textX + barW / 2;
  const barY = 26;
  c.add(scene.add.rectangle(barMidX, barY, barW, 9, 0x1e293b).setOrigin(0.5));
  if (ratio > 0.02) {
    c.add(scene.add.rectangle(textX + (barW * ratio) / 2, barY, barW * ratio, 9, rank.color).setOrigin(0, 0.5));
  }
  c.add(
    scene.add
      .text(barMidX, barY + 16, `${xp} / ${nextXp} XP`, {
        fontFamily: "Outfit, sans-serif",
        fontSize: "10px",
        color: "#94a3b8",
      })
      .setOrigin(0.5)
  );

  return c;
}

export function makeGlowButton(scene, x, y, label, color, onClick, opts = {}) {
  const w = opts.width ?? 280;
  const h = opts.height ?? 48;
  const depth = opts.depth ?? 10;
  const container = scene.add.container(x, y).setDepth(depth);
  const shadow = scene.add.rectangle(2, 5, w, h, 0x000000, 0.4);
  const bg = scene.add
    .rectangle(0, 0, w, h, color, 1)
    .setStrokeStyle(2, 0xffffff, 0.16)
    .setInteractive({ useHandCursor: true });
  const gloss = scene.add.rectangle(0, -h * 0.24, w - 14, h * 0.32, 0xffffff, 0.12);
  const txt = scene.add
    .text(0, 0, label, {
      fontFamily: "Outfit, sans-serif",
      fontSize: opts.fontSize ?? (label.length > 20 ? "13px" : "16px"),
      fontStyle: "700",
      color: "#fff",
      align: "center",
      wordWrap: { width: w - 28 },
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
  bg.on("pointerover", () => scene.tweens.add({ targets: container, scaleX: 1.02, scaleY: 1.02, duration: 100 }));
  bg.on("pointerout", () => scene.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 100 }));
  return container;
}

export function makePillTab(scene, x, y, label, active, onClick) {
  const w = 140;
  const h = 36;
  const bg = scene.add
    .rectangle(x, y, w, h, active ? 0x6366f1 : 0x1e293b, active ? 1 : 0.92)
    .setStrokeStyle(2, active ? 0xa5b4fc : 0x475569, active ? 0.9 : 0.5)
    .setInteractive({ useHandCursor: true })
    .setDepth(15);
  const txt = scene.add
    .text(x, y, label, {
      fontFamily: "Outfit, sans-serif",
      fontSize: "12px",
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

export function drawScreenHeader(scene, x, y, title, subtitle) {
  scene.add
    .text(x, y, title, {
      fontFamily: "Syne, sans-serif",
      fontSize: "24px",
      fontStyle: "800",
      color: "#38bdf8",
      stroke: "#0f172a",
      strokeThickness: 4,
    })
    .setOrigin(0.5)
    .setDepth(5);
  if (subtitle) {
    scene.add
      .text(x, y + 30, subtitle, {
        fontFamily: "Outfit, sans-serif",
        fontSize: "12px",
        color: "#64748b",
      })
      .setOrigin(0.5)
      .setDepth(5);
  }
}

export function drawTitleGlow(scene, x, y, title, subtitle) {
  drawScreenHeader(scene, x, y, title, subtitle);
}

export function rankColors(i) {
  if (i === 0) return { bg: 0xfbbf24, stroke: 0xfde047, text: "#0f172a", medal: "🥇" };
  if (i === 1) return { bg: 0x94a3b8, stroke: 0xe2e8f0, text: "#0f172a", medal: "🥈" };
  if (i === 2) return { bg: 0xb45309, stroke: 0xfdba74, text: "#fff", medal: "🥉" };
  return { bg: 0x111827, stroke: 0x334155, text: "#e2e8f0", medal: `${i + 1}` };
}
