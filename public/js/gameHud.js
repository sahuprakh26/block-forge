import { W } from "./config.js";
import { goalHudTitle, goalProgress } from "./levels.js";
import { getDailyBest } from "./progress.js";
import { addGameTopNav } from "./navUi.js";
import { gameHudStyle } from "./gameUi.js";
import { applyCrispText } from "./textUtil.js";

function levelSubtitle(mode, level) {
  if (mode === "endless") return "No move limit";
  if (mode === "daily") return "Same pieces for everyone";
  if (!level) return "";
  const parts = [];
  if (level.name) parts.push(level.name);
  if (level.moves) parts.push(`${level.moves} moves`);
  return parts.join(" · ");
}

/** Standard top HUD: nav row → stats card (2 rows) → goal bar */
export function buildGameHud(scene, layout, state) {
  const { mode, levelId, level, progress, onBack, onQuit } = state;
  const L = layout;

  const title =
    mode === "endless" ? "ENDLESS" : mode === "daily" ? "DAILY" : `LEVEL ${levelId}`;

  addGameTopNav(scene, { onBack, onQuit, navY: L.navY });

  scene.add
    .rectangle(W / 2, L.panelY, L.panelW, L.headerH, 0x0f172a, 0.96)
    .setStrokeStyle(2, 0x475569, 0.85)
    .setDepth(45);

  applyCrispText(
    scene.add
      .text(L.scoreX, L.scoreLabelY, "SCORE", gameHudStyle("caption", { letterSpacing: 1 }))
      .setOrigin(0, 0.5)
      .setDepth(50)
  );
  const scoreText = applyCrispText(
    scene.add
      .text(L.scoreX, L.scoreValueY, "0", gameHudStyle("stat"))
      .setOrigin(0, 0.5)
      .setDepth(50)
  );

  applyCrispText(
    scene.add
      .text(L.centerX, L.levelTitleY, title, gameHudStyle("heading"))
      .setOrigin(0.5, 0.5)
      .setDepth(50)
  );

  const sub = levelSubtitle(mode, level);
  let levelSubText = null;
  if (sub) {
    levelSubText = applyCrispText(
      scene.add
        .text(L.centerX, L.levelSubY, sub, gameHudStyle("body", { color: "#fbbf24" }))
        .setOrigin(0.5, 0.5)
        .setDepth(50)
    );
  }

  let goalTitle = "";
  let goalProg = "—";
  if (mode === "endless") {
    const best = progress.endlessBest || 0;
    goalTitle = "BEST";
    goalProg = best > 0 ? `${best}` : "—";
  } else if (mode === "daily") {
    const db = getDailyBest(progress);
    goalTitle = "TODAY";
    goalProg = db > 0 ? `${db}` : "—";
  } else if (level?.goal) {
    goalTitle = goalHudTitle(level.goal);
    goalProg = goalProgress(level.goal, 0, 0, 0);
  }

  applyCrispText(
    scene.add
      .text(L.goalX, L.goalLabelY, goalTitle, gameHudStyle("goalLabel", { align: "right" }))
      .setOrigin(1, 0.5)
      .setDepth(50)
  );
  const goalProgressText = applyCrispText(
    scene.add
      .text(L.goalX, L.goalProgY, goalProg, gameHudStyle("goalStat", { align: "right" }))
      .setOrigin(1, 0.5)
      .setDepth(50)
  );

  const streakBadge = applyCrispText(
    scene.add
      .text(L.centerX, L.streakY, "", gameHudStyle("body"))
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(50)
  );

  scene.add.rectangle(W / 2, L.goalBarY, L.goalBarW, 8, 0x1e293b).setOrigin(0.5).setDepth(50);
  let goalBar = null;
  let goalBarMax = 0;
  if (mode === "level") {
    goalBar = scene.add
      .rectangle(L.margin, L.goalBarY, 0, 8, 0x38bdf8)
      .setOrigin(0, 0.5)
      .setDepth(51);
    goalBarMax = L.goalBarW;
  }

  scene.add
    .rectangle(W / 2, L.hudBottom, L.panelW, 2, 0x334155, 0.5)
    .setOrigin(0.5, 0)
    .setDepth(44);

  return { scoreText, goalProgressText, streakBadge, goalBar, goalBarMax, levelSubText };
}

export function formatLevelSub(level, movesLeft) {
  if (!level) return "";
  const parts = [];
  if (level.name) parts.push(level.name);
  if (level.moves != null && movesLeft != null) parts.push(`${movesLeft} moves`);
  return parts.join(" · ");
}
