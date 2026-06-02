import { H, W } from "./config.js";

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
    top: 12 + (ins.topGame || 0),
    bottom: 16 + (ins.bottomGame || 0),
  };
}

/** Stack-based menu — fixed gaps, no overlapping fractions. */
export function menuLayout(height = H) {
  const { top, bottom } = insetY();
  let y = top;

  const logoY1 = y + 22;
  y += 44;
  const logoY2 = y + 22;
  y += 52;

  const rankCardY = y + 48;
  const rankCardH = 100;
  y += rankCardH + 10;

  const statsY = y + 12;
  y += 26;

  const btnGap = 52;
  const btnCampaign = y + 28;
  const btnDaily = btnCampaign + btnGap;
  const btnEndless = btnDaily + btnGap;
  const btnRankings = btnEndless + btnGap;
  y = btnRankings + 36;

  const nameY = Math.min(y + 20, height - bottom - 88);
  const audioY = height - bottom - 28;
  const footerY = height - bottom - 58;

  const compact = height - top - bottom < 640;

  return {
    compact,
    logoY1,
    logoY2,
    logoSize: compact ? "34px" : "42px",
    rankCardY,
    rankCardH,
    rankCardW: W - 36,
    statsY,
    btnCampaign,
    btnDaily,
    btnEndless,
    btnRankings,
    nameY,
    audioY,
    footerY,
    btnGap,
    btnH: compact ? 44 : 48,
    btnW: W - 48,
  };
}

export const HUD_HEADER = {
  navY: 26,
  titleY: 76,
  scoreLabelY: 68,
  scoreValueY: 86,
  streakY: 68,
  goalY: 78,
  movesY: 104,
};

export function mapLayout(width = W, height = H) {
  const { top } = insetY();
  return {
    titleY: top + 62,
    starsY: top + 94,
    barY: top + 114,
    startY: top + 138,
    width,
    height,
  };
}

export function leaderboardLayout(height = H) {
  const { top, bottom } = insetY();
  const headerBottom = top + 148;
  const listStart = headerBottom + 118;
  const maxRows = Math.max(5, Math.floor((height - listStart - bottom - 16) / 36));

  return {
    headerY: top + 52,
    statusY: top + 100,
    myRankY: top + 118,
    tabsY: top + 136,
    refreshY: top + 136,
    podiumY: headerBottom + 8,
    listStart,
    listRow: 36,
    panelY: listStart + ((height - bottom - 8) - listStart) / 2,
    panelH: height - listStart - bottom - 12,
    maxRows,
  };
}
