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

/** Shared top nav row — all non-game screens use this. */
export function topChrome(safeTop = 0) {
  return {
    navY: 22 + safeTop,
    navClearY: 48 + safeTop,
    contentTop: 52 + safeTop,
    margin: 16,
  };
}

/** Stack-based menu — logo zone then rank card (no overlap) */
export function menuLayout(height = H) {
  const { top, bottom } = insetY();
  const safe = gameSafeY();
  let y = top + Math.max(0, safe.top);

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

  const navY = 22 + safeTop;
  const navClearY = 46 + safeTop;
  const headerTop = navClearY + 6;
  const headerH = 68;
  const headerBottom = headerTop + headerH;
  const goalBarY = headerBottom + 10;
  const hudBottom = goalBarY + 10;

  const trayH = 130;
  const trayBottom = height - Math.max(10, safeBottom) - 8;
  const trayTop = trayBottom - trayH;
  const trayCenterY = trayTop + trayH / 2;
  const trayLabelY = trayTop + 16;
  const trayPiecesY = trayTop + trayH * 0.66;
  const trayInnerH = trayH - 34;
  const trayScale = Math.min(0.56, (trayInnerH * 0.92) / (5 * CELL));
  const trayW = W - margin * 2;

  const playTop = hudBottom + 8;
  const playBottom = trayTop - 12;
  let boardY = playTop + (playBottom - playTop - boardH) / 2;
  boardY = Math.max(playTop, Math.min(boardY, playBottom - boardH));

  return {
    margin,
    navY,
    headerTop,
    headerH,
    headerBottom,
    hudBottom,
    panelY: headerTop + headerH / 2,
    panelW: trayW,
    scoreX: margin,
    scoreLabelY: headerTop + 12,
    scoreValueY: headerTop + 36,
    centerX: W / 2,
    levelTitleY: headerTop + 12,
    levelSubY: headerTop + 32,
    goalX: W - margin,
    goalLabelY: headerTop + 12,
    goalProgY: headerTop + 36,
    goalBarY,
    goalBarW: trayW,
    streakY: goalBarY - 6,
    boardY,
    boardH,
    boardBottom: boardY + boardH,
    trayTop,
    trayCenterY,
    trayH,
    trayW,
    trayLabelY,
    trayPiecesY,
    trayScale,
    slotXs: [W * 0.2, W * 0.5, W * 0.8],
  };
}

/** Campaign map — header under nav, level grid centered in remaining space. */
export function mapLayout(width = W, height = H) {
  const { bottom } = insetY();
  const safe = gameSafeY();
  const chrome = topChrome(safe.top);
  const cols = 5;
  const rows = 3;
  const gapX = 66;
  const gapY = 72;
  const gridW = (cols - 1) * gapX;
  const gridH = (rows - 1) * gapY + 52;
  const headerBottom = chrome.contentTop + 74;
  const playBottom = height - bottom - 20;
  const startX = width / 2 - gridW / 2;
  const startY = headerBottom + Math.max(12, (playBottom - headerBottom - gridH) / 2) + 26;

  return {
    ...chrome,
    titleY: chrome.contentTop + 18,
    starsY: chrome.contentTop + 42,
    barY: chrome.contentTop + 58,
    startX,
    startY,
    gapX,
    gapY,
    cols,
    width,
    height,
  };
}

/** Live rankings — compact header, podium + list fill lower screen. */
export function leaderboardLayout(height = H) {
  const { bottom } = insetY();
  const safe = gameSafeY();
  const chrome = topChrome(safe.top);
  const titleY = chrome.contentTop + 12;
  const statusY = chrome.contentTop + 36;
  const myRankY = chrome.contentTop + 52;
  const tabsY = chrome.contentTop + 70;
  const podiumY = chrome.contentTop + 96;
  const listStart = podiumY + 76;
  const panelH = height - listStart - bottom - 10;
  const panelY = listStart + panelH / 2;
  const maxRows = Math.max(4, Math.floor(panelH / 36));

  return {
    ...chrome,
    titleY,
    statusY,
    myRankY,
    tabsY,
    refreshY: tabsY,
    podiumY,
    listStart,
    listRow: 36,
    panelY,
    panelH,
    maxRows,
  };
}
