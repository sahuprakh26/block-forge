import { W } from "./config.js";
import { sfx } from "./audio.js";
import { applyCrispText, uiTextStyle } from "./textUtil.js";

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
  c.add(scene.add.circle(badgeX, badgeY, 30, rank.color, 1).setStrokeStyle(2, rank.stroke || 0xffffff, 0.7));
  applyCrispText(scene.add.text(badgeX, badgeY, rank.icon, { fontSize: "28px" }).setOrigin(0.5));

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
  c.add(scene.add.rectangle(left, barY, fillW, barH, rank.color).setOrigin(0, 0.5));

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
