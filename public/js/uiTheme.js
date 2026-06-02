import { W } from "./config.js";
import { sfx } from "./audio.js";
import { applyCrispText, uiTextStyle } from "./textUtil.js";

/** Shiny tier medal (replaces emoji) */
export function drawRankEmblem(scene, parent, x, y, rank, radius = 34) {
  const g = scene.add.graphics();
  const r = radius;

  if (rank.metal === "gold") {
    g.fillStyle(0xb45309, 1);
    g.fillCircle(x, y + 2, r);
    g.fillStyle(0xff8f00, 1);
    g.fillCircle(x, y, r - 2);
    g.fillStyle(0xffd700, 1);
    g.fillCircle(x, y - 1, r - 6);
    g.fillStyle(0xfff59d, 0.85);
    g.fillCircle(x - r * 0.22, y - r * 0.28, r * 0.38);
    g.lineStyle(3, 0xffea00, 1);
    g.strokeCircle(x, y, r - 2);
    g.lineStyle(1, 0xffffff, 0.45);
    g.strokeCircle(x - 2, y - 3, r - 8);
  } else if (rank.metal === "silver") {
    g.fillStyle(0x475569, 1);
    g.fillCircle(x, y + 2, r);
    g.fillStyle(0x94a3b8, 1);
    g.fillCircle(x, y, r - 2);
    g.fillStyle(0xe2e8f0, 0.7);
    g.fillCircle(x - r * 0.2, y - r * 0.25, r * 0.32);
    g.lineStyle(3, rank.stroke, 1);
    g.strokeCircle(x, y, r - 2);
  } else if (rank.metal === "bronze") {
    g.fillStyle(0x78350f, 1);
    g.fillCircle(x, y + 2, r);
    g.fillStyle(rank.color, 1);
    g.fillCircle(x, y, r - 2);
    g.fillStyle(0xfdba74, 0.5);
    g.fillCircle(x - r * 0.18, y - r * 0.22, r * 0.3);
    g.lineStyle(3, rank.stroke, 1);
    g.strokeCircle(x, y, r - 2);
  } else {
    g.fillStyle(0x0f172a, 0.5);
    g.fillCircle(x, y + 2, r);
    g.fillStyle(rank.color, 1);
    g.fillCircle(x, y, r - 2);
    g.lineStyle(3, rank.stroke || 0xffffff, 1);
    g.strokeCircle(x, y, r - 2);
  }

  parent.add(g);
  const letterSize = rank.letter?.length > 1 ? "14px" : "22px";
  const lbl = applyCrispText(
    scene.add
      .text(x, y, rank.letter || rank.name[0], uiTextStyle({
        fontFamily: "Syne, sans-serif",
        fontSize: letterSize,
        fontStyle: "800",
        color: rank.text || "#fff",
        stroke: rank.metal === "gold" ? "#5c4200" : "#0f172a",
        strokeThickness: rank.metal === "gold" ? 2 : 3,
      }))
      .setOrigin(0.5)
  );
  parent.add(lbl);
}

/** Block Forge logo — 3 blocks + title */
export function drawMenuLogo(scene, x, y) {
  const c = scene.add.container(x, y).setDepth(4);
  const hasBlocks = scene.textures.exists("block-0");
  if (hasBlocks) {
    c.add(scene.add.image(-28, -6, "block-0").setScale(0.62).setAngle(-8));
    c.add(scene.add.image(30, -10, "block-1").setScale(0.62).setAngle(6));
    c.add(scene.add.image(0, 22, "block-3").setScale(0.68));
  } else {
    const g = scene.add.graphics();
    g.fillStyle(0x818cf8, 1);
    g.fillRoundedRect(-40, -8, 22, 22, 5);
    g.fillStyle(0x38bdf8, 1);
    g.fillRoundedRect(18, -12, 22, 22, 5);
    g.fillStyle(0xfde047, 1);
    g.fillRoundedRect(-8, 14, 24, 24, 6);
    c.add(g);
  }
  const title = applyCrispText(
    scene.add
      .text(0, 58, "BLOCK FORGE", uiTextStyle({
        fontFamily: "Syne, sans-serif",
        fontSize: "38px",
        fontStyle: "800",
        color: "#38bdf8",
        stroke: "#0f172a",
        strokeThickness: 5,
      }))
      .setOrigin(0.5)
  );
  c.add(title);
  return c;
}

export function drawGlassPanel(scene, x, y, w, h, opts = {}) {
  const depth = opts.depth ?? 4;
  const fill = opts.fill ?? 0x0f172a;
  const alpha = opts.alpha ?? 0.92;
  const stroke = opts.stroke ?? 0x6366f1;
  const panel = scene.add.container(x, y).setDepth(depth);
  const outer = scene.add.rectangle(0, 0, w, h, fill, alpha).setStrokeStyle(2, stroke, 0.55);
  panel.add([outer]);
  return panel;
}

/** Metal tier card — XP bar full width, fills left → right */
export function drawRankCard(scene, x, y, w, h, progress, xp) {
  const { rank, next, nextXp, ratio } = progress;
  const depth = 6;
  const c = scene.add.container(x, y).setDepth(depth);
  const pad = 16;
  const left = -w / 2 + pad;
  const innerW = w - pad * 2;
  const top = -h / 2 + 12;

  c.add(
    scene.add
      .rectangle(0, 0, w, h, 0x0c1222, 0.96)
      .setStrokeStyle(2, rank.stroke || rank.color, 0.9)
  );
  c.add(scene.add.rectangle(left, top + 4, 6, h - 24, rank.color, 1).setOrigin(0, 0));

  const badgeX = left + 34;
  const badgeY = top + 38;
  drawRankEmblem(scene, c, badgeX, badgeY, rank, 32);

  const textX = left + 76;
  applyCrispText(
    scene.add
      .text(textX, top + 24, rank.name.toUpperCase(), uiTextStyle({
        fontFamily: "Syne, sans-serif",
        fontSize: "28px",
        fontStyle: "800",
        color: rank.text || "#fff",
        strokeThickness: 3,
      }))
      .setOrigin(0, 0.5)
  );
  applyCrispText(
    scene.add
      .text(textX, top + 52, next ? `Next: ${next.name}` : "Max tier", uiTextStyle({
        fontSize: "16px",
        color: "#94a3b8",
        strokeThickness: 1,
      }))
      .setOrigin(0, 0.5)
  );

  const barY = top + 78;
  const barH = 16;
  c.add(scene.add.rectangle(left, barY, innerW, barH, 0x1e293b).setOrigin(0, 0.5));
  const fillW = Math.max(6, innerW * ratio);
  const barColor = rank.metal === "gold" ? 0xffc107 : rank.color;
  c.add(scene.add.rectangle(left, barY, fillW, barH, barColor).setOrigin(0, 0.5));
  if (rank.metal === "gold" && fillW > 8) {
    c.add(scene.add.rectangle(left, barY - 3, fillW, barH * 0.35, 0xfff9c4, 0.35).setOrigin(0, 0.5));
  }

  applyCrispText(
    scene.add
      .text(left, barY + 24, `${xp} / ${nextXp} XP`, uiTextStyle({
        fontSize: "16px",
        fontStyle: "700",
        color: "#e2e8f0",
        strokeThickness: 1,
      }))
      .setOrigin(0, 0.5)
  );

  return c;
}

export function makeGlowButton(scene, x, y, label, color, onClick, opts = {}) {
  const w = opts.width ?? 300;
  const h = opts.height ?? 54;
  const depth = opts.depth ?? 10;
  const container = scene.add.container(x, y).setDepth(depth);
  const shadow = scene.add.rectangle(2, 5, w, h, 0x000000, 0.35);
  const bg = scene.add
    .rectangle(0, 0, w, h, color, 1)
    .setStrokeStyle(2, 0xffffff, 0.18)
    .setInteractive({ useHandCursor: true });
  const gloss = scene.add.rectangle(0, -h * 0.22, w - 12, h * 0.3, 0xffffff, 0.1);
  const txt = applyCrispText(
    scene.add
      .text(0, 0, label, uiTextStyle({
        fontSize: opts.fontSize ?? "17px",
        fontStyle: "700",
        color: "#fff",
        align: "center",
        wordWrap: { width: w - 24 },
        strokeThickness: 2,
      }))
      .setOrigin(0.5)
  );
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
  return container;
}

export function makePillTab(scene, x, y, label, active, onClick) {
  const w = 148;
  const h = 40;
  const bg = scene.add
    .rectangle(x, y, w, h, active ? 0x6366f1 : 0x1e293b, active ? 1 : 0.92)
    .setStrokeStyle(2, active ? 0xa5b4fc : 0x475569, active ? 0.9 : 0.5)
    .setInteractive({ useHandCursor: true })
    .setDepth(15);
  const txt = applyCrispText(
    scene.add
      .text(x, y, label, uiTextStyle({
        fontSize: "14px",
        fontStyle: "700",
        color: active ? "#fff" : "#94a3b8",
      }))
      .setOrigin(0.5)
      .setDepth(16)
  );
  const fire = () => {
    sfx.play("click");
    onClick();
  };
  bg.on("pointerdown", fire);
  txt.setInteractive({ useHandCursor: true }).on("pointerdown", fire);
  return { bg, txt };
}

export function drawScreenHeader(scene, x, y, title, subtitle) {
  applyCrispText(
    scene.add
      .text(x, y, title, uiTextStyle({
        fontFamily: "Syne, sans-serif",
        fontSize: "28px",
        fontStyle: "800",
        color: "#38bdf8",
        strokeThickness: 4,
      }))
      .setOrigin(0.5)
      .setDepth(5)
  );
  if (subtitle) {
    applyCrispText(
      scene.add
        .text(x, y + 34, subtitle, uiTextStyle({
          fontSize: "14px",
          color: "#94a3b8",
          strokeThickness: 1,
        }))
        .setOrigin(0.5)
        .setDepth(5)
    );
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
