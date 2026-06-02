import { W } from "./config.js";
import { sfx } from "./audio.js";

/** Rich shiny backdrop — gradient, stars, glow orbs */
export function drawBackdrop(scene, width, height) {
  const g = scene.add.graphics().setDepth(-10);
  g.fillGradientStyle(0x060912, 0x0c1228, 0x101a35, 0x0a1628, 1);
  g.fillRect(0, 0, width, height);

  const sheen = scene.add.graphics().setDepth(-9).setAlpha(0.35);
  sheen.fillGradientStyle(0x6366f1, 0x6366f1, 0x000000, 0x000000, 0.12);
  sheen.fillCircle(width * 0.5, height * 0.08, width * 0.45);

  if (scene.textures.exists("bg-noise")) {
    scene.add.image(width / 2, height / 2, "bg-noise").setDepth(-8).setAlpha(0.04).setDisplaySize(width, height);
  }

  for (let i = 0; i < 12; i++) {
    const star = scene.add
      .circle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        Phaser.Math.FloatBetween(0.6, 1.8),
        0xffffff,
        Phaser.Math.FloatBetween(0.08, 0.35)
      )
      .setDepth(-7);
    scene.tweens.add({
      targets: star,
      alpha: { from: star.alpha, to: star.alpha * 0.3 },
      duration: Phaser.Math.Between(1500, 4000),
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  const orbs = [
    { x: width * 0.15, y: height * 0.12, r: 130, c: 0x818cf8 },
    { x: width * 0.88, y: height * 0.28, r: 90, c: 0x38bdf8 },
    { x: width * 0.5, y: height * 0.92, r: 110, c: 0xc084fc },
  ];
  orbs.forEach((o) => {
    const blob = scene.add.circle(o.x, o.y, o.r, o.c, 0.09).setDepth(-9);
    scene.tweens.add({
      targets: blob,
      scale: { from: 0.92, to: 1.08 },
      alpha: { from: 0.06, to: 0.14 },
      duration: Phaser.Math.Between(3200, 4800),
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  });

  return g;
}

export function transitionTo(scene, key, data = {}) {
  sfx.play("click");
  scene.cameras.main.fadeOut(220, 10, 14, 26);
  scene.time.delayedCall(220, () => scene.scene.start(key, data));
}

export function fadeInScene(scene, ms = 320) {
  scene.cameras.main.fadeIn(ms, 10, 14, 26);
}

export function scorePopup(scene, x, y, pts, color = "#fde047") {
  const t = scene.add
    .text(x, y, `+${pts}`, {
      fontFamily: "Outfit, sans-serif",
      fontSize: "18px",
      fontStyle: "800",
      color,
      stroke: "#0f172a",
      strokeThickness: 3,
    })
    .setOrigin(0.5)
    .setDepth(55)
    .setAlpha(0.9);
  scene.tweens.add({
    targets: t,
    y: y - 36,
    alpha: 0,
    scale: 1.2,
    duration: 650,
    ease: "Cubic.easeOut",
    onComplete: () => t.destroy(),
  });
}

export function lineSweep(scene, boardX, boardY, cell, grid, rows, cols) {
  const flash = scene.add.graphics().setDepth(15).setAlpha(0.85);
  flash.fillStyle(0xffffff, 0.65);
  rows.forEach((r) => {
    flash.fillRoundedRect(boardX, boardY + r * cell, grid * cell, cell, 4);
  });
  cols.forEach((c) => {
    flash.fillRoundedRect(boardX + c * cell, boardY, cell, grid * cell, 4);
  });
  scene.tweens.add({
    targets: flash,
    alpha: 0,
    duration: 280,
    ease: "Quad.easeOut",
    onComplete: () => flash.destroy(),
  });
}

export function confettiBurst(scene, count = 28) {
  const colors = [0x818cf8, 0x38bdf8, 0xfde047, 0xf472b6, 0x4ade80];
  for (let i = 0; i < count; i++) {
    const x = Phaser.Math.Between(40, W - 40);
    const p = scene.add
      .rectangle(x, -10, Phaser.Math.Between(4, 8), Phaser.Math.Between(8, 14), Phaser.Utils.Array.GetRandom(colors))
      .setDepth(110);
    scene.tweens.add({
      targets: p,
      y: 820,
      x: x + Phaser.Math.Between(-80, 80),
      angle: Phaser.Math.Between(-360, 360),
      alpha: { from: 1, to: 0.3 },
      duration: Phaser.Math.Between(1200, 2200),
      delay: Phaser.Math.Between(0, 400),
      ease: "Cubic.easeIn",
      onComplete: () => p.destroy(),
    });
  }
}

export function animateStars(scene, x, y, count, depth = 105) {
  const stars = [];
  for (let i = 0; i < 3; i++) {
    const sx = x + (i - 1) * 44;
    const filled = i < count;
    const star = scene.add
      .text(sx, y, filled ? "★" : "☆", {
        fontSize: "36px",
        color: filled ? "#fde047" : "#475569",
      })
      .setOrigin(0.5)
      .setDepth(depth)
      .setScale(0);
    stars.push(star);
    scene.time.delayedCall(200 + i * 180, () => {
      scene.tweens.add({
        targets: star,
        scale: filled ? 1.25 : 1,
        duration: 350,
        ease: "Back.easeOut",
        onComplete: () => {
          if (filled) sfx.play("click");
        },
      });
      if (filled) {
        scene.tweens.add({
          targets: star,
          scale: 1.1,
          duration: 200,
          yoyo: true,
          delay: 400,
        });
      }
    });
  }
  return stars;
}

export function updateNearFullHints(scene, gridData, boardX, boardY, cell, gridSize, hintGfx) {
  hintGfx.clear();
  hintGfx.fillStyle(0x38bdf8, 0.1);
  for (let r = 0; r < gridSize; r++) {
    const empty = gridData[r].filter((v) => v === 0).length;
    if (empty > 0 && empty <= 2) {
      hintGfx.fillRoundedRect(boardX, boardY + r * cell, gridSize * cell, cell, 4);
    }
  }
  for (let c = 0; c < gridSize; c++) {
    let empty = 0;
    for (let r = 0; r < gridSize; r++) if (gridData[r][c] === 0) empty++;
    if (empty > 0 && empty <= 2) {
      hintGfx.fillRoundedRect(boardX + c * cell, boardY, cell, gridSize * cell, 4);
    }
  }
}

export function achievementToast(scene, title, xp) {
  const box = scene.add.container(W / 2, 120).setDepth(80).setAlpha(0);
  const bg = scene.add.rectangle(0, 0, 300, 56, 0x1e293b, 0.96).setStrokeStyle(2, 0xfde047);
  const t1 = scene.add
    .text(0, -8, "🏆 " + title, { fontFamily: "Syne, sans-serif", fontSize: "15px", fontStyle: "700", color: "#fde047" })
    .setOrigin(0.5);
  const t2 = scene.add
    .text(0, 14, `+${xp} XP`, { fontFamily: "Outfit, sans-serif", fontSize: "12px", color: "#94a3b8" })
    .setOrigin(0.5);
  box.add([bg, t1, t2]);
  scene.tweens.add({ targets: box, alpha: 1, y: 100, duration: 280, ease: "Back.easeOut" });
  scene.tweens.add({
    targets: box,
    alpha: 0,
    y: 80,
    duration: 300,
    delay: 2200,
    onComplete: () => box.destroy(),
  });
}

export function feverBanner(scene, text, color = "#f97316") {
  const t = scene.add
    .text(W / 2, 108, text, {
      fontFamily: "Syne, sans-serif",
      fontSize: "20px",
      fontStyle: "800",
      color,
      stroke: "#0f172a",
      strokeThickness: 4,
    })
    .setOrigin(0.5)
    .setDepth(60)
    .setScale(0.6);
  scene.tweens.add({
    targets: t,
    scale: 1.1,
    duration: 200,
    yoyo: true,
    hold: 400,
    onComplete: () => {
      scene.tweens.add({ targets: t, alpha: 0, duration: 300, onComplete: () => t.destroy() });
    },
  });
}

export function niceClearPop(scene, x, y, label = "NICE!") {
  const t = scene.add
    .text(x, y, label, {
      fontFamily: "Outfit, sans-serif",
      fontSize: "16px",
      fontStyle: "800",
      color: "#4ade80",
      stroke: "#0f172a",
      strokeThickness: 3,
    })
    .setOrigin(0.5)
    .setDepth(55)
    .setAlpha(0.9);
  scene.tweens.add({
    targets: t,
    y: y - 24,
    alpha: 0,
    duration: 500,
    onComplete: () => t.destroy(),
  });
}
