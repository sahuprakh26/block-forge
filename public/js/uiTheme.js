import { W } from "./config.js";
import { sfx } from "./audio.js";
import { applyCrispText, uiTextStyle } from "./textUtil.js";

/** Tier medal — clean metal colours (gold = yellow only, no brown) */
export function drawRankEmblem(scene, parent, x, y, rank, radius = 34) {
  const g = scene.add.graphics();
  const r = radius;
  const metal = rank.metal || "default";

  const layers = (list) => {
    list.forEach((layer, i) => {
      g.fillStyle(layer.color, layer.alpha ?? 1);
      g.fillCircle(x, y + (layer.dy || 0), r - (layer.shrink ?? i * 2));
    });
  };
  const shine = (sx, sy, sr, color = 0xffffff, alpha = 0.8) => {
    g.fillStyle(color, alpha);
    g.fillCircle(x + sx, y + sy, sr);
  };
  const ring = (color, width = 3) => {
    g.lineStyle(width, color, 1);
    g.strokeCircle(x, y, r - 2);
  };

  if (metal === "gold") {
    layers([
      { color: 0xc9a800, dy: 2, shrink: 0 },
      { color: 0xffd700, shrink: 2 },
      { color: 0xffeb3b, shrink: 5 },
      { color: 0xfff59d, shrink: 9 },
    ]);
    shine(-r * 0.28, -r * 0.32, r * 0.4, 0xffffff, 0.92);
    shine(r * 0.12, r * 0.15, r * 0.22, 0xfff9c4, 0.55);
    ring(0xffea00);
    g.lineStyle(2, 0xffffff, 0.55);
    g.strokeCircle(x - 2, y - 3, r - 10);
  } else if (metal === "silver") {
    layers([
      { color: 0x475569, dy: 2, shrink: 0 },
      { color: 0x94a3b8, shrink: 2 },
      { color: 0xe2e8f0, shrink: 6 },
    ]);
    shine(-r * 0.24, -r * 0.28, r * 0.34);
    ring(0xf8fafc);
  } else if (metal === "bronze") {
    layers([
      { color: 0xc2410c, dy: 2, shrink: 0 },
      { color: 0xea580c, shrink: 2 },
      { color: 0xf97316, shrink: 6 },
    ]);
    shine(-r * 0.22, -r * 0.26, r * 0.32, 0xffedd5, 0.7);
    ring(0xfdba74);
  } else if (metal === "iron") {
    layers([
      { color: 0x3f3f46, dy: 2, shrink: 0 },
      { color: 0x71717a, shrink: 2 },
      { color: 0xa1a1aa, shrink: 6 },
    ]);
    shine(-r * 0.2, -r * 0.25, r * 0.3, 0xf4f4f5, 0.65);
    ring(0xd4d4d8);
  } else if (metal === "diamond") {
    layers([
      { color: 0x0369a1, dy: 2, shrink: 0 },
      { color: 0x0ea5e9, shrink: 2 },
      { color: 0x7dd3fc, shrink: 6 },
    ]);
    shine(-r * 0.22, -r * 0.28, r * 0.34, 0xffffff, 0.88);
    ring(0xe0f2fe);
  } else if (metal === "platinum") {
    layers([
      { color: 0x0e7490, dy: 2, shrink: 0 },
      { color: 0x22d3ee, shrink: 2 },
      { color: 0x67e8f9, shrink: 6 },
    ]);
    shine(-r * 0.22, -r * 0.26, r * 0.33, 0xffffff, 0.85);
    ring(0xcffafe);
  } else if (metal === "immortal") {
    layers([
      { color: 0xeab308, dy: 2, shrink: 0 },
      { color: 0xfacc15, shrink: 2 },
      { color: 0xfef08a, shrink: 6 },
    ]);
    shine(-r * 0.26, -r * 0.3, r * 0.38, 0xffffff, 0.9);
    ring(0xfff9c4);
  } else {
    g.fillStyle(0x0f172a, 0.5);
    g.fillCircle(x, y + 2, r);
    g.fillStyle(rank.color, 1);
    g.fillCircle(x, y, r - 2);
    shine(-r * 0.2, -r * 0.24, r * 0.28, 0xffffff, 0.5);
    ring(rank.stroke || 0xffffff);
  }

  parent.add(g);
  const letterSize = rank.letter?.length > 1 ? "15px" : "24px";
  const letterFill = metal === "gold" || metal === "immortal" ? "#1e293b" : rank.text || "#fff";
  const letterStroke = metal === "gold" ? "#ffea00" : metal === "immortal" ? "#fde047" : "#0f172a";
  const lbl = applyCrispText(
    scene.add
      .text(x, y + 1, rank.letter || rank.name[0], uiTextStyle({
        fontFamily: "Syne, sans-serif",
        fontSize: letterSize,
        fontStyle: "800",
        color: letterFill,
        stroke: letterStroke,
        strokeThickness: metal === "gold" || metal === "immortal" ? 2 : 3,
      }))
      .setOrigin(0.5)
  );
  parent.add(lbl);
}

/** Logo footprint for menu layout (center anchor → bottom edge offset) */
export const MENU_LOGO = { height: 118, centerToBottom: 56 };

/** Polished game logo — blocks + BLOCK / FORGE (fits above rank card) */
export function drawMenuLogo(scene, x, y) {
  const c = scene.add.container(x, y).setDepth(8);

  const glow = scene.add.ellipse(0, 4, 180, 64, 0x6366f1, 0.2);
  c.add(glow);
  scene.tweens.add({ targets: glow, alpha: { from: 0.12, to: 0.28 }, duration: 2200, yoyo: true, repeat: -1 });

  const blockScale = 0.82;
  if (scene.textures.exists("block-0")) {
    const b0 = scene.add.image(-30, -18, "block-0").setScale(blockScale).setAngle(-12);
    const b1 = scene.add.image(32, -20, "block-1").setScale(blockScale).setAngle(10);
    const b2 = scene.add.image(0, 4, "block-3").setScale(blockScale * 1.02);
    c.add([b0, b1, b2]);
    scene.tweens.add({ targets: b0, y: b0.y - 3, duration: 1800, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    scene.tweens.add({ targets: b1, y: b1.y - 4, duration: 2000, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    scene.tweens.add({ targets: b2, y: b2.y - 2, duration: 1600, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  }

  c.add(
    applyCrispText(
      scene.add
        .text(0, 38, "BLOCK", uiTextStyle({
          fontFamily: "Syne, sans-serif",
          fontSize: "36px",
          fontStyle: "800",
          color: "#e0e7ff",
          stroke: "#0f172a",
          strokeThickness: 5,
        }))
        .setOrigin(0.5)
    )
  );
  c.add(
    applyCrispText(
      scene.add
        .text(0, 72, "FORGE", uiTextStyle({
          fontFamily: "Syne, sans-serif",
          fontSize: "36px",
          fontStyle: "800",
          color: "#ffeb3b",
          stroke: "#c9a800",
          strokeThickness: 4,
        }))
        .setOrigin(0.5)
    )
  );

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

export function drawRankCard(scene, x, y, w, h, progress, xp) {
  const { rank, next, nextXp, ratio } = progress;
  const depth = 6;
  const c = scene.add.container(x, y).setDepth(depth);
  const pad = 12;
  const left = -w / 2 + pad;
  const innerW = w - pad * 2;
  const top = -h / 2 + 8;

  const frameStroke = rank.stroke || rank.color;
  c.add(
    scene.add
      .rectangle(0, 0, w, h, 0x0c1222, 0.96)
      .setStrokeStyle(2, frameStroke, 0.9)
  );
  c.add(scene.add.rectangle(left, top + 2, 4, h - 16, rank.color, 1).setOrigin(0, 0));

  const badgeX = left + 26;
  const badgeY = top + 28;
  drawRankEmblem(scene, c, badgeX, badgeY, rank, 22);

  const textX = left + 58;
  const titleColor = rank.text || "#fff";
  const titleStroke = rank.metal === "gold" ? "#c9a800" : rank.metal === "immortal" ? "#ca8a04" : "#0f172a";
  applyCrispText(
    scene.add
      .text(textX, top + 18, rank.name.toUpperCase(), uiTextStyle({
        fontFamily: "Syne, sans-serif",
        fontSize: "20px",
        fontStyle: "800",
        color: titleColor,
        stroke: titleStroke,
        strokeThickness: rank.metal === "gold" || rank.metal === "immortal" ? 2 : 2,
      }))
      .setOrigin(0, 0.5)
  );
  applyCrispText(
    scene.add
      .text(textX, top + 36, next ? `Next: ${next.name}` : "Max tier", uiTextStyle({
        fontSize: "12px",
        color: "#94a3b8",
        strokeThickness: 1,
      }))
      .setOrigin(0, 0.5)
  );

  const barY = top + 54;
  const barH = 10;
  c.add(scene.add.rectangle(left, barY, innerW, barH, 0x1e293b).setOrigin(0, 0.5));
  const fillW = Math.max(4, innerW * ratio);
  const barColor = rank.metal === "gold" ? 0xffd700 : rank.metal === "immortal" ? 0xfacc15 : rank.color;
  c.add(scene.add.rectangle(left, barY, fillW, barH, barColor).setOrigin(0, 0.5));
  if ((rank.metal === "gold" || rank.metal === "immortal") && fillW > 6) {
    c.add(scene.add.rectangle(left, barY - 2, fillW, barH * 0.4, 0xfff9c4, 0.45).setOrigin(0, 0.5));
  }

  applyCrispText(
    scene.add
      .text(left, barY + 16, `${xp} / ${nextXp} XP`, uiTextStyle({
        fontSize: "12px",
        fontStyle: "700",
        color: "#cbd5e1",
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

  if (opts.live) {
    const dot = scene.add.circle(-w / 2 + 22, 0, 5, 0x4ade80, 1);
    container.add(dot);
    scene.tweens.add({ targets: dot, alpha: { from: 1, to: 0.35 }, duration: 700, yoyo: true, repeat: -1 });
  }

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

export function drawScreenHeader(scene, x, y, title, subtitle, live = false) {
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
    const subY = y + 34;
    if (live) {
      const dot = scene.add.circle(x - 72, subY, 5, 0x4ade80, 1).setDepth(6);
      scene.tweens.add({ targets: dot, alpha: { from: 1, to: 0.35 }, duration: 800, yoyo: true, repeat: -1 });
    }
    applyCrispText(
      scene.add
        .text(x + (live ? 8 : 0), subY, subtitle, uiTextStyle({
          fontSize: "14px",
          color: live ? "#86efac" : "#94a3b8",
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
  if (i === 0) return { bg: 0xffc107, stroke: 0xffea00, text: "#422006", medal: "1" };
  if (i === 1) return { bg: 0x94a3b8, stroke: 0xe2e8f0, text: "#0f172a", medal: "2" };
  if (i === 2) return { bg: 0xb45309, stroke: 0xfdba74, text: "#fff", medal: "3" };
  return { bg: 0x111827, stroke: 0x334155, text: "#e2e8f0", medal: `${i + 1}` };
}
