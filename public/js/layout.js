import { H, W, GRID, CELL, BOARD_PAD } from "./config.js";
import { MENU_LOGO } from "./uiTheme.js";

export function measureSafeInsets() {
  if (typeof document === "undefined") return { top: 0, bottom: 0, topGame: 0, bottomGame: 0 };

  const el = document.createElement("div");
  el.style.cssText =
    "position:fixed;left:0;top:0;visibility:hidden;pointer-events:none;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)";
  document.body.appendChild(el);
  const cs = getComputedStyle(el);
  const top = parseFloat(cs.paddingTop) || 0;
  const bottom = parseFloat(cs.paddingBottom) || 0;
  el.remove();

  const game = window.__bfGame;
  const sh = game?.scale?.displaySize?.height || window.innerHeight || H;
  const gh = game?.scale?.gameSize?.height || H;
  const ratio = gh / Math.max(1, sh);

  return {
    top,
    bottom,
    topGame: Math.round(top * ratio),
    bottomGame: Math.round(bottom * ratio),
  };
}

function insetY() {
  const ins = window.__bfSafeInsets || { topGame: 0, bottomGame: 0 };
  return {
    top: 14 + (ins.topGame || 0),
    bottom: 18 + (ins.bottomGame || 0),
  };
}

function gameSafeY() {
  const ins = window.__bfSafeInsets || { topGame: 0, bottomGame: 0 };
  return { top: ins.topGame || 0, bottom: ins.bottomGame || 0 };
}

/** Stack-based menu — logo zone then rank card (no overlap) */
export function menuLayout(height = H) {
  const { top, bottom } = insetY();
  let y = top;

  const logoZone = MENU_LOGO.height + 8;
  const logoY = y + MENU_LOGO.centerToBottom;
  y += logoZone + 14;

  const rankCardH = 76;
  const rankCardY = y + rankCardH / 2;
  y += rankCardH + 10;

  const statsY = y + 10;
  y += 24;

  const btnGap = 58;
  const btnCampaign = y + 30;
  const btnDaily = btnCampaign + btnGap;
  const btnEndless = btnDaily + btnGap;
  const btnRankings = btnEndless + btnGap;
  y = btnRankings + 40;

  const nameY = Math.min(y + 22, height - bottom - 92);
  const audioY = height - bottom - 30;
  const footerY = height - bottom - 62;

  const compact = height - top - bottom < 680;

  return {
    compact,
    logoY,
    rankCardY,
    rankCardH,
    rankCardW: W - 56,
    statsY,
    btnCampaign,
    btnDaily,
    btnEndless,
    btnRankings,
    nameY,
    audioY,
    footerY,
    btnGap,
    btnH: compact ? 50 : 54,
    btnW: W - 32,
  };
}

/**
 * Standard block-puzzle layout (Block Blast / Woodoku style):
 * 1) Top nav row — BACK | (spacer) | QUIT
 * 2) Stats strip — SCORE (left) · level info (center) · GOAL (right)
 * 3) Goal progress bar
 * 4) Board — vertically centered in play area
 * 5) Bottom piece dock — label inside, 3 slots
 */
export function gameLayout(height = H) {
  const { top: safeTop, bottom: safeBottom } = gameSafeY();
  const margin = 16;
  const boardH = GRID * CELL + BOARD_PAD * 2;

  const navY = 26 + safeTop;
  const headerTop = 44 + safeTop;
  const headerH = 66;
  const goalBarY = headerTop + headerH + 8;
  const hudBottom = goalBarY + 10;

  const trayH = 116;
  const trayBottom = height - Math.max(10, safeBottom) - 10;
  const trayCenterY = trayBottom - trayH / 2;
  const trayTop = trayCenterY - trayH / 2;
  const trayLabelY = trayTop + 14;
  const trayInnerH = trayH - 36;
  const trayScale = Math.min(0.54, trayInnerH / (5 * CELL));
  const trayPiecesY = trayCenterY + 4;

  const playTop = hudBottom;
  const playBottom = trayTop - 12;
  let boardY = playTop + Math.max(0, (playBottom - playTop - boardH) / 2);
  boardY = Math.max(playTop, Math.min(boardY, playBottom - boardH));

  return {
    margin,
    navY,
    headerTop,
    headerH,
    panelY: headerTop + headerH / 2,
    panelW: W - margin * 2,
    scoreX: margin,
    scoreLabelY: headerTop + 12,
    scoreValueY: headerTop + 36,
    centerX: W / 2,
    levelTitleY: headerTop + 10,
    levelNameY: headerTop + 28,
    movesY: headerTop + 46,
    goalX: W - margin,
    goalLabelY: headerTop + 12,
    goalProgY: headerTop + 36,
    goalBarY,
    goalBarW: W - margin * 2,
    streakY: goalBarY - 4,
    boardY,
    boardH,
    boardBottom: boardY + boardH,
    trayTop,
    trayCenterY,
    trayH,
    trayW: W - margin * 2,
    trayLabelY,
    trayPiecesY,
    trayScale,
    slotXs: [W * 0.2, W * 0.5, W * 0.8],
  };
}

export function mapLayout(width = W, height = H) {
  const { top } = insetY();
  return {
    titleY: top + 64,
    starsY: top + 98,
    barY: top + 118,
    startY: top + 142,
    width,
    height,
  };
}

export function leaderboardLayout(height = H) {
  const { top, bottom } = insetY();
  const headerBottom = top + 156;
  const listStart = headerBottom + 120;
  const maxRows = Math.max(5, Math.floor((height - listStart - bottom - 16) / 40));

  return {
    headerY: top + 54,
    statusY: top + 104,
    myRankY: top + 124,
    tabsY: top + 144,
    refreshY: top + 144,
    podiumY: headerBottom + 10,
    listStart,
    listRow: 40,
    panelY: listStart + ((height - bottom - 8) - listStart) / 2,
    panelH: height - listStart - bottom - 12,
    maxRows,
  };
}
