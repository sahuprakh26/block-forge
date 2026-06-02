import { GRID, CELL, BOARD_PAD, W, COLORS } from "../config.js";
import { randomTray, mulberry32, dailySeed } from "../shapes.js";
import { getLevel, goalText, starThresholds } from "../levels.js";
import {
  loadProgress,
  setStars,
  setEndlessBest,
  addXp,
  unlockAchievement,
  touchDailyStreak,
  recordDailyScore,
  getDailyBest,
} from "../progress.js";
import { streakMult, rankProgress } from "../meta.js";
import {
  drawBackdrop,
  fadeInScene,
  transitionTo,
  scorePopup,
  lineSweep,
  confettiBurst,
  animateStars,
  updateNearFullHints,
  achievementToast,
  feverBanner,
  niceClearPop,
} from "../fx.js";
import { sfx } from "../audio.js";
import { bgm } from "../music.js";
import { addGameTopNav, showLeaveDialog } from "../navUi.js";
import { boardKey, submitScore as submitLb } from "../leaderboard.js";
import { getPlayer, hasName } from "../player.js";
import { ensureName } from "../namePrompt.js";
import { HUD_HEADER } from "../layout.js";

const TRAY_Y = 580;
const TRAY_SCALE = 0.62;
const ENDLESS_MILESTONES = [500, 1000, 2000, 5000, 10000];

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("Game");
  }

  init(data) {
    this.mode = data.mode || "level";
    this.levelId = data.levelId || 1;
    this.level = this.mode === "level" ? getLevel(this.levelId) : null;
    this.dailyRng = this.mode === "daily" ? mulberry32(dailySeed()) : null;
    this.progress = loadProgress();
    touchDailyStreak(this.progress);
  }

  create() {
    this.grid = Array.from({ length: GRID }, () => Array(GRID).fill(0));
    this.score = 0;
    this.totalLines = 0;
    this.maxCombo = 0;
    this.movesUsed = 0;
    this.clearStreak = 0;
    this.sessionXp = 0;
    this.milestonesHit = new Set();
    this.beatBestShown = false;
    this.closeShown = false;
    this.feverGlow = null;
    this.tray = [];
    this.traySlots = [];
    this.usedSlots = new Set();
    this.dragging = null;
    this.ghost = null;
    this.gameEnded = false;
    this.boardW = GRID * CELL + BOARD_PAD * 2;
    this.boardX = (W - this.boardW) / 2 + BOARD_PAD;
    this.boardY = 118;

    drawBackdrop(this, W, 780);
    this.hintGfx = this.add.graphics().setDepth(3);

    this.drawBoardFrame();
    this.cellSprites = [];
    for (let r = 0; r < GRID; r++) {
      this.cellSprites[r] = [];
      for (let c = 0; c < GRID; c++) {
        const x = this.boardX + c * CELL + CELL / 2;
        const y = this.boardY + r * CELL + CELL / 2;
        const empty = this.add.image(x, y, "cell-empty").setAlpha(0.55);
        this.cellSprites[r][c] = { empty, block: null };
      }
    }

    this.ghostGroup = this.add.container(0, 0).setDepth(20);
    this.buildHud();
    this.drawTrayArea();
    this.spawnTray();
    this.setupInput();

    if (this.levelId === 1 && this.mode === "level") {
      this.showToast("Chain line clears for streak bonus · fill the bar!", 4200);
    }
    if (this.mode === "daily") {
      const best = getDailyBest(this.progress);
      this.showToast(best > 0 ? `Beat today's best: ${best}` : "Same pieces for everyone today — go!", 3500);
    }

    this.refreshGoalDisplay();
    if (this.boardFrame) {
      this.boardFrame.setScale(0.94);
      this.tweens.add({ targets: this.boardFrame, scale: 1, duration: 400, ease: "Back.easeOut" });
    }
    fadeInScene(this, 280);
    if (bgm.isOn()) bgm.unlock();
  }

  drawTrayArea() {
    this.add
      .rectangle(W / 2, TRAY_Y + 20, W - 32, 140, 0x111827, 0.85)
      .setStrokeStyle(2, 0x334155, 0.8)
      .setDepth(1);
    this.add
      .text(W / 2, TRAY_Y - 52, "NEXT PIECES", {
        fontFamily: "Outfit, sans-serif",
        fontSize: "11px",
        fontStyle: "700",
        color: "#64748b",
        letterSpacing: 2,
      })
      .setOrigin(0.5)
      .setDepth(2);
  }

  drawBoardFrame() {
    const fx = this.boardX - BOARD_PAD;
    const fy = this.boardY - BOARD_PAD;
    const fw = GRID * CELL + BOARD_PAD * 2;
    const fh = GRID * CELL + BOARD_PAD * 2;
    const cx = fx + fw / 2;
    const cy = fy + fh / 2;
    this.boardFrame = this.add.container(cx, cy).setDepth(2);
    const outer = this.add.rectangle(0, 0, fw, fh, 0x111827, 0.95).setStrokeStyle(3, 0x475569);
    const inner = this.add.rectangle(0, 0, fw - 6, fh - 6, 0x0f172a, 0.55);
    this.boardFrame.add([outer, inner]);
  }

  buildHud() {
    const title =
      this.mode === "endless"
        ? "ENDLESS"
        : this.mode === "daily"
          ? "DAILY CHALLENGE"
          : `${this.level?.name || "Level"} · L${this.levelId}`;

    const askLeave = () => {
      if (this.gameEnded) this.exitGame();
      else this.showConfirmExit();
    };
    addGameTopNav(this, { onBack: askLeave, onQuit: askLeave });

    const H = HUD_HEADER;
    this.add
      .text(W / 2, H.titleY, title, {
        fontFamily: "Syne, sans-serif",
        fontSize: "16px",
        fontStyle: "700",
        color: "#38bdf8",
      })
      .setOrigin(0.5)
      .setDepth(50);

    this.add.text(24, H.scoreLabelY, "SCORE", {
      fontFamily: "Outfit, sans-serif",
      fontSize: "10px",
      color: "#64748b",
    }).setDepth(50);
    this.scoreText = this.add
      .text(24, H.scoreValueY, "0", {
        fontFamily: "Outfit, sans-serif",
        fontSize: "26px",
        fontStyle: "800",
        color: "#e2e8f0",
      })
      .setDepth(50);

    this.streakBadge = this.add
      .text(W / 2, H.streakY, "", {
        fontFamily: "Outfit, sans-serif",
        fontSize: "12px",
        fontStyle: "700",
        color: "#f97316",
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(50);

    let goalLabel;
    if (this.mode === "endless") {
      const best = this.progress.endlessBest || 0;
      goalLabel = best > 0 ? `Beat best: ${best}` : "Survive · chase milestones";
    } else if (this.mode === "daily") {
      const db = getDailyBest(this.progress);
      goalLabel = db > 0 ? `Today: beat ${db}` : "Today's run — score high!";
    } else {
      goalLabel = goalText(this.level?.goal);
    }
    this.goalText = this.add
      .text(W - 24, H.goalY, goalLabel, {
        fontFamily: "Outfit, sans-serif",
        fontSize: "12px",
        fontStyle: "600",
        color: "#94a3b8",
        align: "right",
        wordWrap: { width: 160 },
      })
      .setOrigin(1, 0)
      .setDepth(50);

    if (this.mode === "level" && this.level.moves) {
      this.movesText = this.add
        .text(W / 2, H.movesY, `Moves: ${this.level.moves}`, {
          fontFamily: "Outfit, sans-serif",
          fontSize: "14px",
          color: "#fbbf24",
        })
        .setOrigin(0.5);
    }

    if (this.mode === "level") {
      this.add.rectangle(W / 2, 102, W - 48, 6, 0x1e293b).setOrigin(0.5);
      this.goalBar = this.add.rectangle(24, 102, 0, 6, 0x22d3ee).setOrigin(0, 0.5);
      this.goalBarMax = W - 48;
    }

  }

  spawnTray() {
    this.traySlots.forEach((s) => s.container.destroy());
    this.traySlots = [];
    this.usedSlots.clear();
    const rng = this.dailyRng || Math.random;
    this.tray = randomTray(3, rng);
    sfx.play("tray");

    const slotXs = [W * 0.22, W * 0.5, W * 0.78];
    this.tray.forEach((shape, i) => {
      const container = this.makePieceContainer(shape, slotXs[i], TRAY_Y + 40, TRAY_SCALE, true);
      container.setData("slot", i);
      container.setData("shape", shape);
      container.setData("homeX", slotXs[i]);
      container.setData("homeY", TRAY_Y);
      container.setInteractive(
        new Phaser.Geom.Rectangle(-80, -80, 160, 160),
        Phaser.Geom.Rectangle.Contains
      );
      this.input.setDraggable(container);
      this.traySlots.push({ container, shape, index: i });

      this.tweens.add({
        targets: container,
        y: TRAY_Y,
        alpha: { from: 0, to: 1 },
        duration: 280,
        delay: i * 70,
        ease: "Back.easeOut",
      });
      this.tweens.add({
        targets: container,
        y: TRAY_Y - 3,
        duration: 1400 + i * 200,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
        delay: 400 + i * 100,
      });
    });
  }

  shapeBounds(shape) {
    const minR = Math.min(...shape.cells.map(([r]) => r));
    const minC = Math.min(...shape.cells.map(([, c]) => c));
    const maxR = Math.max(...shape.cells.map(([r]) => r));
    const maxC = Math.max(...shape.cells.map(([, c]) => c));
    return { minR, minC, maxR, maxC, w: maxC - minC + 1, h: maxR - minR + 1 };
  }

  makePieceContainer(shape, x, y, scale, inTray) {
    const container = this.add.container(x, y).setDepth(inTray ? 10 : 30);
    const { minR, minC, w, h } = this.shapeBounds(shape);

    shape.cells.forEach(([dr, dc]) => {
      const img = this.add
        .image((dc - minC) * CELL + CELL / 2 - (w * CELL) / 2, (dr - minR) * CELL + CELL / 2 - (h * CELL) / 2, `block-${shape.color}`)
        .setScale(scale);
      container.add(img);
    });
    container.setData("minR", minR);
    container.setData("minC", minC);
    container.setData("bounds", { w, h });
    container.setData("pieceScale", scale);
    return container;
  }

  setupInput() {
    this.input.on("dragstart", (_p, go) => {
      if (this.gameEnded || this.usedSlots.has(go.getData("slot"))) return;
      this.dragging = go;
      go.setDepth(40);
      this.tweens.killTweensOf(go);
      go.list.forEach((img) => img.setScale(0.92));
      sfx.play("pickup");
    });

    this.input.on("drag", (pointer, go) => {
      if (!this.dragging) return;
      go.x = pointer.x;
      go.y = pointer.y;
      this.updateGhost(go);
    });

    this.input.on("dragend", (_p, go) => {
      if (!this.dragging) return;
      const shape = go.getData("shape");
      const pos = this.pointerToGrid();
      this.clearGhost();

      if (pos && this.canPlace(shape, pos.row, pos.col)) {
        this.commitPlacement(shape, pos.row, pos.col, go);
      } else {
        this.returnToTray(go);
      }
      this.dragging = null;
    });
  }

  gridFromContainer(go) {
    const { w, h } = go.getData("bounds");
    const anchorX = go.x - (w * CELL) / 2 + CELL / 2;
    const anchorY = go.y - (h * CELL) / 2 + CELL / 2;
    const col = Math.round((anchorX - this.boardX - CELL / 2) / CELL);
    const row = Math.round((anchorY - this.boardY - CELL / 2) / CELL);
    return { row, col };
  }

  pointerToGrid() {
    if (!this.dragging) return null;
    const shape = this.dragging.getData("shape");
    const { row, col } = this.gridFromContainer(this.dragging);
    const valid = this.canPlace(shape, row, col);
    return { row, col, valid };
  }

  updateGhost(go) {
    this.clearGhost();
    const shape = go.getData("shape");
    const { minR, minC } = this.shapeBounds(shape);
    const { row, col } = this.gridFromContainer(go);
    const ok = this.canPlace(shape, row, col);

    shape.cells.forEach(([dr, dc]) => {
      const r = row + (dr - minR);
      const c = col + (dc - minC);
      if (r < 0 || r >= GRID || c < 0 || c >= GRID) return;
      const x = this.boardX + c * CELL + CELL / 2;
      const y = this.boardY + r * CELL + CELL / 2;
      const tint = ok ? 0x34d399 : 0xf87171;
      const g = this.add.image(x, y, `block-${shape.color}`).setAlpha(ok ? 0.45 : 0.35).setTint(tint);
      this.ghostGroup.add(g);
    });
  }

  clearGhost() {
    this.ghostGroup.removeAll(true);
  }

  canPlace(shape, row, col) {
    const { minR, minC } = this.shapeBounds(shape);
    for (const [dr, dc] of shape.cells) {
      const r = row + (dr - minR);
      const c = col + (dc - minC);
      if (r < 0 || r >= GRID || c < 0 || c >= GRID) return false;
      if (this.grid[r][c] !== 0) return false;
    }
    return true;
  }

  commitPlacement(shape, row, col, go) {
    const slot = go.getData("slot");
    this.usedSlots.add(slot);
    go.setVisible(false);
    go.disableInteractive();

    const { minR, minC } = this.shapeBounds(shape);
    shape.cells.forEach(([dr, dc]) => {
      const r = row + (dr - minR);
      const c = col + (dc - minC);
      this.grid[r][c] = shape.color + 1;
    });
    this.movesUsed++;
    this.refreshBoard(true);
    const placePts = shape.cells.length * 10;
    this.addScore(placePts, false, this.boardX + col * CELL + 20, this.boardY + row * CELL);
    sfx.play("drop");
    updateNearFullHints(this, this.grid, this.boardX, this.boardY, CELL, GRID, this.hintGfx);

    const { rows, cols, count } = this.findClears();
    if (count > 0) {
      this.totalLines += count;
      this.maxCombo = Math.max(this.maxCombo, count);
      this.clearStreak++;
      this.updateStreakHud();
      this.animateClears(rows, cols, count);
    } else {
      if (this.clearStreak > 0) feverBanner(this, "Streak broken!", "#94a3b8");
      this.clearStreak = 0;
      this.updateStreakHud();
      this.setFever(false);
      this.afterPlacement();
    }
  }

  findClears() {
    const rows = [];
    const cols = [];
    for (let r = 0; r < GRID; r++) {
      if (this.grid[r].every((v) => v !== 0)) rows.push(r);
    }
    for (let c = 0; c < GRID; c++) {
      let full = true;
      for (let r = 0; r < GRID; r++) if (this.grid[r][c] === 0) full = false;
      if (full) cols.push(c);
    }
    return { rows, cols, count: rows.length + cols.length };
  }

  animateClears(rows, cols, lineCount) {
    const cells = new Set();
    rows.forEach((r) => {
      for (let c = 0; c < GRID; c++) cells.add(`${r},${c}`);
    });
    cols.forEach((c) => {
      for (let r = 0; r < GRID; r++) cells.add(`${r},${c}`);
    });

    const comboMult = lineCount >= 3 ? 2 : lineCount >= 2 ? 1.5 : 1;
    const sm = streakMult(this.clearStreak);
    let lineScore = Math.round(100 * lineCount * comboMult * sm);
    this.addScore(lineScore, true, W / 2, this.boardY + GRID * CELL * 0.5);
    if (lineCount === 1) niceClearPop(this, W / 2, this.boardY + GRID * CELL * 0.35);
    this.showCombo(lineCount);
    if (this.clearStreak >= 3) {
      feverBanner(this, `ON FIRE! x${sm.toFixed(1)}`, "#f97316");
      this.setFever(true);
    }
    lineSweep(this, this.boardX, this.boardY, CELL, GRID, rows, cols);
    sfx.play(lineCount >= 2 ? "combo" : "clear");
    this.cameras.main.shake(120, lineCount >= 3 ? 0.01 : lineCount >= 2 ? 0.006 : 0.003);

    this.grantAch("first_clear");
    if (lineCount >= 3) this.grantAch("combo_3");
    if (lineCount >= 4) this.grantAch("combo_4");
    if (this.clearStreak >= 5) this.grantAch("streak_5");

    cells.forEach((key) => {
      const [r, c] = key.split(",").map(Number);
      const block = this.cellSprites[r][c].block;
      if (block) {
        this.tweens.add({
          targets: block,
          scaleX: 1.35,
          scaleY: 1.35,
          alpha: 0,
          duration: 180,
          ease: "Power2",
          onComplete: () => {
            block.destroy();
            this.cellSprites[r][c].block = null;
          },
        });
        this.emitBurst(block.x, block.y, this.grid[r][c] - 1);
      }
      this.grid[r][c] = 0;
    });

    this.time.delayedCall(200, () => {
      updateNearFullHints(this, this.grid, this.boardX, this.boardY, CELL, GRID, this.hintGfx);
      if (this.isBoardEmpty()) {
        const bonus = Math.round(200 * streakMult(this.clearStreak));
        feverBanner(this, `BOARD CLEAR! +${bonus}`, "#fde047");
        this.addScore(bonus, true, W / 2, this.boardY + GRID * CELL * 0.2);
      }
      this.afterPlacement();
    });
  }

  isBoardEmpty() {
    return this.grid.every((row) => row.every((v) => v === 0));
  }

  updateStreakHud() {
    if (!this.streakBadge) return;
    if (this.clearStreak >= 2) {
      const sm = streakMult(this.clearStreak);
      this.streakBadge.setText(`🔥 STREAK x${sm.toFixed(1)} (${this.clearStreak})`).setAlpha(1);
      this.tweens.add({ targets: this.streakBadge, scale: 1.15, duration: 80, yoyo: true });
    } else {
      this.streakBadge.setAlpha(0);
    }
  }

  setFever(on) {
    if (on && !this.feverGlow) {
      const fx = this.boardX - BOARD_PAD;
      const fy = this.boardY - BOARD_PAD;
      const fw = GRID * CELL + BOARD_PAD * 2;
      const fh = GRID * CELL + BOARD_PAD * 2;
      this.feverGlow = this.add
        .rectangle(fx + fw / 2, fy + fh / 2, fw + 8, fh + 8)
        .setStrokeStyle(3, 0xf97316, 0.7)
        .setFillStyle(0xf97316, 0.04)
        .setDepth(4);
      this.tweens.add({
        targets: this.feverGlow,
        alpha: { from: 0.5, to: 1 },
        duration: 400,
        yoyo: true,
        repeat: -1,
      });
    } else if (!on && this.feverGlow) {
      this.feverGlow.destroy();
      this.feverGlow = null;
    }
  }

  grantAch(id) {
    const ach = unlockAchievement(this.progress, id);
    if (ach) {
      this.sessionXp += ach.xp;
      achievementToast(this, ach.title, ach.xp);
    }
  }

  emitBurst(x, y, colorIdx) {
    const color = COLORS[colorIdx] ?? 0xffffff;
    const particles = this.add.particles(x, y, "particle", {
      speed: { min: 60, max: 180 },
      scale: { start: 1.2, end: 0 },
      lifespan: 420,
      quantity: 8,
      tint: color,
      emitting: false,
    });
    particles.explode(10);
    this.time.delayedCall(500, () => particles.destroy());
  }

  showCombo(n) {
    if (n < 2) return;
    const label = n >= 4 ? "MEGA!" : n >= 3 ? "TRIPLE!" : "COMBO!";
    const t = this.add
      .text(W / 2, this.boardY + GRID * CELL * 0.45, `${label}  ${n}x`, {
        fontFamily: "Syne, sans-serif",
        fontSize: n >= 3 ? "32px" : "26px",
        fontStyle: "800",
        color: "#fbbf24",
        stroke: "#0f172a",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(50)
      .setScale(0.5);
    this.tweens.add({
      targets: t,
      scale: 1,
      y: t.y - 30,
      alpha: { from: 1, to: 0 },
      duration: 900,
      ease: "Back.easeOut",
      onComplete: () => t.destroy(),
    });
  }

  addScore(pts, fromLines = false, popX, popY) {
    this.score += pts;
    this.scoreText.setText(String(this.score));
    this.tweens.add({
      targets: this.scoreText,
      scaleX: 1.15,
      scaleY: 1.15,
      duration: 80,
      yoyo: true,
    });
    if (popX != null) scorePopup(this, popX, popY, pts, fromLines ? "#38bdf8" : "#fde047");
    if (this.mode === "level") this.refreshGoalDisplay();
    if (this.mode === "endless" || this.mode === "daily") this.checkEndlessMilestones();
  }

  checkEndlessMilestones() {
    for (const m of ENDLESS_MILESTONES) {
      if (this.score >= m && !this.milestonesHit.has(m)) {
        this.milestonesHit.add(m);
        feverBanner(this, `${m} REACHED!`, "#fde047");
        sfx.play("combo");
        if (m >= 1000) this.grantAch("endless_1k");
      }
    }
    const best = this.mode === "daily" ? getDailyBest(this.progress) : this.progress.endlessBest || 0;
    if (best > 0 && this.score > best && !this.beatBestShown) {
      this.beatBestShown = true;
      feverBanner(this, "NEW BEST!", "#4ade80");
    }
  }

  refreshGoalDisplay() {
    if (this.mode !== "level" || !this.level) return;
    const g = this.level.goal;
    let prog = "";
    let ratio = 0;
    if (g.type === "score") {
      prog = `${this.score} / ${g.target}`;
      ratio = Math.min(1, this.score / g.target);
    } else if (g.type === "lines") {
      prog = `${this.totalLines} / ${g.target} lines`;
      ratio = Math.min(1, this.totalLines / g.target);
    } else {
      prog = `Best combo: ${this.maxCombo} / ${g.target}x`;
      ratio = Math.min(1, this.maxCombo / g.target);
    }
    this.goalText.setText(`${goalText(g)}\n${prog}`);
    if (this.goalBar) {
      this.goalBar.width = this.goalBarMax * ratio;
      if (ratio >= 0.85 && ratio < 1) {
        this.tweens.add({ targets: this.goalBar, alpha: 0.6, duration: 100, yoyo: true });
        if (!this.closeShown) {
          this.closeShown = true;
          feverBanner(this, "SO CLOSE!", "#fde047");
        }
      }
    }
  }

  refreshBoard(animate = false) {
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        const val = this.grid[r][c];
        const slot = this.cellSprites[r][c];
        if (val === 0) {
          if (slot.block) {
            slot.block.destroy();
            slot.block = null;
          }
          continue;
        }
        if (!slot.block) {
          const x = this.boardX + c * CELL + CELL / 2;
          const y = this.boardY + r * CELL + CELL / 2;
          slot.block = this.add.image(x, y, `block-${val - 1}`).setDepth(5);
          if (animate) {
            slot.block.setScale(0);
            this.tweens.add({ targets: slot.block, scale: 1, duration: 120, ease: "Back.easeOut" });
          }
        }
      }
    }
  }

  afterPlacement() {
    this.refreshGoalDisplay();
    if (this.mode === "level" && this.level.moves && this.movesText) {
      const left = this.level.moves - this.movesUsed;
      this.movesText.setText(`Moves: ${Math.max(0, left)}`);
      if (left <= 5 && left > 0) {
        this.movesText.setColor("#f87171");
        this.tweens.add({ targets: this.movesText, scale: 1.2, duration: 100, yoyo: true });
      }
      if (left <= 0 && !this.checkWin()) {
        this.endGame(false);
        return;
      }
    }

    if (this.mode === "level" && this.checkWin()) {
      this.endGame(true);
      return;
    }

    if (this.usedSlots.size >= 3) this.spawnTray();

    if (!this.anyPieceFits()) {
      this.endGame(this.mode === "level" ? false : null);
    }
  }

  anyPieceFits() {
    for (let i = 0; i < this.traySlots.length; i++) {
      if (this.usedSlots.has(i)) continue;
      const shape = this.traySlots[i].shape;
      for (let r = 0; r < GRID; r++) {
        for (let c = 0; c < GRID; c++) {
          if (this.canPlace(shape, r, c)) return true;
        }
      }
    }
    return false;
  }

  checkWin() {
    if (this.mode !== "level" || !this.level?.goal) return false;
    const g = this.level.goal;
    if (g.type === "score") return this.score >= g.target;
    if (g.type === "lines") return this.totalLines >= g.target;
    if (g.type === "combo") return this.maxCombo >= g.target;
    return false;
  }

  endGame(won) {
    if (this.gameEnded) return;
    this.gameEnded = true;
    this.clearGhost();
    this.hintGfx?.clear();

    if (won === true) sfx.play("win");
    else if (won === false) sfx.play("lose");

    if (this.mode === "endless") {
      setEndlessBest(this.progress, this.score);
      this.awardSessionXp(Math.round(this.score / 50));
      this.submitToLeaderboard();
      return;
    }

    if (this.mode === "daily") {
      const beaten = recordDailyScore(this.progress, this.score);
      if (beaten) this.grantAch("daily_win");
      this.awardSessionXp(Math.round(this.score / 40));
      this.submitToLeaderboard();
      return;
    }

    let stars = 0;
    if (won) {
      const thresholds = starThresholds(this.level, this.level.goal);
      const val =
        this.level.goal.type === "score"
          ? this.score
          : this.level.goal.type === "lines"
            ? this.totalLines
            : this.maxCombo;
      if (val >= thresholds[0]) stars = 1;
      if (val >= thresholds[1]) stars = 2;
      if (val >= thresholds[2]) stars = 3;
      setStars(this.progress, this.levelId, stars);
      if (stars >= 3) this.grantAch("three_star");
      this.awardSessionXp(30 + stars * 25);
    }
    this.showOverlay(won, this.score, stars);
  }

  awardSessionXp(base) {
    const gained = addXp(this.progress, base);
    this.sessionXp += gained;
  }

  async submitToLeaderboard() {
    const score = this.score;
    const mode = this.mode;
    try {
      await ensureName();
      const player = getPlayer();
      if (!hasName()) {
        this.lbResult = null;
      } else {
        const board = boardKey(mode);
        this.lbResult = await submitLb(board, player.id, player.name, score);
      }
    } catch {
      this.lbResult = null;
    }
    this.showOverlay(null, score);
  }

  showOverlay(won, score, stars = 0) {
    const dim = this.add.rectangle(W / 2, 390, W, 780, 0x000000, 0).setDepth(100).setInteractive();
    this.tweens.add({ targets: dim, alpha: 0.78, duration: 250 });

    const panelH = won === null ? 400 : won ? 340 : 320;
    const panel = this.add
      .rectangle(W / 2, 360, 340, panelH, 0x1e293b)
      .setDepth(101)
      .setStrokeStyle(2, won ? 0x34d399 : won === null ? 0x22d3ee : 0xf87171)
      .setScale(0.85)
      .setAlpha(0);
    this.tweens.add({ targets: panel, scale: 1, alpha: 1, duration: 350, ease: "Back.easeOut" });

    let title, sub, color;
    if (won === null) {
      title = "RUN OVER";
      sub = "Keep pushing for a new best!";
      color = "#38bdf8";
      if (this.lbResult?.rank) {
        sub = `Global rank #${this.lbResult.rank.rank} of ${this.lbResult.rank.total}`;
      } else if (this.lbResult?.updated) {
        sub = "Score submitted to global board!";
      }
    } else if (won) {
      title = "LEVEL CLEAR!";
      sub = "";
      color = "#34d399";
      confettiBurst(this);
    } else {
      title = "OUT OF MOVES";
      const g = this.level?.goal;
      let almost = "";
      if (g) {
        if (g.type === "score") almost = `${g.target - this.score} pts short`;
        else if (g.type === "lines") almost = `${g.target - this.totalLines} lines short`;
        else if (this.maxCombo > 0) almost = `Best combo ${this.maxCombo}x — need ${g.target}x`;
      }
      sub = almost ? `${almost} · retry!` : "Try again — plan your clears";
      color = "#f87171";
    }

    const titleTxt = this.add
      .text(W / 2, 268, title, {
        fontFamily: "Syne, sans-serif",
        fontSize: "28px",
        fontStyle: "800",
        color,
      })
      .setOrigin(0.5)
      .setDepth(102)
      .setAlpha(0);
    this.tweens.add({ targets: titleTxt, alpha: 1, y: 280, duration: 300, delay: 100 });

    if (won) {
      animateStars(this, W / 2, 330, stars);
    } else {
      this.add
        .text(W / 2, 330, sub, {
          fontFamily: "Outfit, sans-serif",
          fontSize: "16px",
          color: "#94a3b8",
          align: "center",
          wordWrap: { width: 280 },
        })
        .setOrigin(0.5)
        .setDepth(102);
    }

    this.add
      .text(W / 2, won ? 378 : 370, `Score: ${score}${this.sessionXp ? `  ·  +${this.sessionXp} XP` : ""}`, {
        fontFamily: "Outfit, sans-serif",
        fontSize: "15px",
        fontStyle: "600",
        color: "#e2e8f0",
      })
      .setOrigin(0.5)
      .setDepth(102);

    if (this.sessionXp > 0) {
      const tier = rankProgress(this.progress.xp || 0).rank;
      this.add
        .text(W / 2, won ? 402 : 394, `${tier.icon}  ${tier.name} tier`, {
          fontFamily: "Outfit, sans-serif",
          fontSize: "13px",
          fontStyle: "700",
          color: tier.text || "#fde047",
        })
        .setOrigin(0.5)
        .setDepth(102);
    }

    const btnY = won ? 448 : 430;
    if (won) {
      this.makeOverlayBtn(W / 2, btnY, "Next level →", () => {
        const next = this.levelId + 1;
        if (getLevel(next)) transitionTo(this, "Game", { mode: "level", levelId: next });
        else transitionTo(this, "Map");
      });
      this.makeOverlayBtn(W / 2, btnY + 56, "Map", () => transitionTo(this, "Map"));
    } else if (won === null) {
      this.makeOverlayBtn(W / 2, btnY, "Play again", () => this.scene.restart());
      this.makeOverlayBtn(W / 2, btnY + 56, "Rankings", () => transitionTo(this, "Leaderboard", { board: boardKey(this.mode) || "endless" }));
      this.makeOverlayBtn(W / 2, btnY + 112, "Menu", () => transitionTo(this, "Menu"));
    } else {
      this.makeOverlayBtn(W / 2, btnY, "Retry", () => this.scene.restart());
      this.makeOverlayBtn(W / 2, btnY + 56, "Map", () => transitionTo(this, "Map"));
    }
  }

  makeOverlayBtn(x, y, label, cb) {
    const bg = this.add
      .rectangle(x, y, 240, 48, 0x6366f1)
      .setDepth(102)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(1, 0xffffff, 0.1);
    const txt = this.add
      .text(x, y, label, { fontFamily: "Outfit, sans-serif", fontSize: "16px", fontStyle: "700", color: "#fff" })
      .setOrigin(0.5)
      .setDepth(103);
    bg.on("pointerover", () => bg.setFillStyle(0x818cf8));
    bg.on("pointerout", () => bg.setFillStyle(0x6366f1));
    bg.on("pointerdown", () => {
      sfx.play("click");
      this.tweens.add({ targets: [bg, txt], scaleX: 0.95, scaleY: 0.95, duration: 60, yoyo: true, onComplete: cb });
    });
  }

  returnToTray(go) {
    const slot = go.getData("slot");
    const homeX = go.getData("homeX");
    const homeY = go.getData("homeY");
    const sc = go.getData("pieceScale");
    go.setDepth(10);
    go.list.forEach((img) => img.setScale(sc));
    sfx.play("invalid");
    this.cameras.main.shake(60, 0.002);
    this.tweens.add({
      targets: go,
      x: homeX,
      y: homeY,
      duration: 200,
      ease: "Back.easeOut",
    });
  }

  showToast(msg, ms) {
    const t = this.add
      .text(W / 2, 680, msg, {
        fontFamily: "Outfit, sans-serif",
        fontSize: "13px",
        color: "#cbd5e1",
        align: "center",
        wordWrap: { width: W - 48 },
        backgroundColor: "#1e293bcc",
        padding: { x: 12, y: 8 },
      })
      .setOrigin(0.5)
      .setDepth(60);
    this.time.delayedCall(ms, () => t.destroy());
  }

  showConfirmExit() {
    const title =
      this.mode === "level" ? "Leave this level?" : this.mode === "daily" ? "Leave daily run?" : "Leave endless run?";
    showLeaveDialog(this, { title, onLeave: () => this.exitGame() });
  }

  exitGame() {
    if (this.mode === "level") transitionTo(this, "Map");
    else transitionTo(this, "Menu");
  }
}
