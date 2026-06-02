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
 * Game HUD — stacked rows (no side-by-side cramming).
 * Row 1: BACK / QUIT (nav only)
 * Row 2: level title + name (center)
 * Row 3: score (left) · goal (right)
 * Row 4: progress bar
 */
export const HUD_HEADER = {
  navY: 26,
  panelY: 98,
  panelH: 82,
  levelTitleY: 66,
  levelNameY: 82,
  movesY: 96,
  scoreX: 28,
  scoreLabelY: 114,
  scoreValueY: 132,
  goalX: W - 28,
  goalLabelY: 114,
  goalProgY: 132,
  streakY: 146,
  goalBarY: 150,
};

/** Board + tray — tray box sized to fit pieces; everything stays inside H. */
export function gameLayout(height = H) {
  const boardH = GRID * CELL + BOARD_PAD * 2;
  const hudEndY = 152;
  const bottomPad = 14;
  const trayLabelSpace = 18;
  const boardTrayGap = 10;
  const trayPad = 14;
  const maxPieceCells = 5;

  const trayH = 142;
  const trayW = W - 12;
  const trayInnerH = trayH - trayPad * 2;
  const trayScale = Math.min(0.62, trayInnerH / (maxPieceCells * CELL));
  const pieceHalf = (maxPieceCells * CELL * trayScale) / 2;

  const trayBottom = height - bottomPad;
  let trayCenterY = trayBottom - trayH / 2;
  let trayTop = trayCenterY - trayH / 2;
  let trayLabelY = trayTop - trayLabelSpace / 2 - 4;
  let trayPiecesY = trayCenterY;

  let boardBottom = trayTop - boardTrayGap;
  let boardY = boardBottom - boardH;

  if (boardY < hudEndY) {
    boardY = hudEndY;
    boardBottom = boardY + boardH;
    trayTop = boardBottom + boardTrayGap;
    trayCenterY = trayTop + trayH / 2;
    trayLabelY = trayTop - trayLabelSpace / 2 - 4;
    trayPiecesY = trayCenterY;
  }

  return {
    boardY,
    boardBottom,
    boardH,
    trayLabelY,
    trayCenterY,
    trayH,
    trayW,
    trayPiecesY,
    trayScale,
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
