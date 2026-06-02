import { uiTextStyle } from "./textUtil.js";

/** Balanced game-screen type scale (caption < body < heading < stat). */
export const GAME_UI = {
  font: {
    caption: "11px",
    body: "13px",
    heading: "15px",
    stat: "24px",
  },
  color: {
    muted: "#94a3b8",
    title: "#38bdf8",
    accent: "#fb923c",
    moves: "#fbbf24",
    bright: "#cbd5e1",
    stat: "#ffffff",
    goal: "#4ade80",
  },
};

export function gameHudStyle(role, overrides = {}) {
  const base = {
    caption: {
      fontSize: GAME_UI.font.caption,
      fontStyle: "700",
      color: GAME_UI.color.muted,
    },
    body: {
      fontFamily: "Syne, sans-serif",
      fontSize: GAME_UI.font.body,
      fontStyle: "800",
      color: GAME_UI.color.accent,
    },
    heading: {
      fontFamily: "Syne, sans-serif",
      fontSize: GAME_UI.font.heading,
      fontStyle: "800",
      color: GAME_UI.color.title,
      strokeThickness: 2,
    },
    moves: {
      fontFamily: "Syne, sans-serif",
      fontSize: GAME_UI.font.body,
      fontStyle: "800",
      color: GAME_UI.color.moves,
    },
    stat: {
      fontFamily: "Syne, sans-serif",
      fontSize: GAME_UI.font.stat,
      fontStyle: "800",
      color: GAME_UI.color.stat,
      stroke: "#0f172a",
      strokeThickness: 3,
    },
    goalLabel: {
      fontFamily: "Syne, sans-serif",
      fontSize: GAME_UI.font.caption,
      fontStyle: "700",
      color: GAME_UI.color.bright,
    },
    goalStat: {
      fontFamily: "Syne, sans-serif",
      fontSize: GAME_UI.font.stat,
      fontStyle: "800",
      color: GAME_UI.color.goal,
      stroke: "#0f172a",
      strokeThickness: 2,
    },
    trayLabel: {
      fontFamily: "Syne, sans-serif",
      fontSize: GAME_UI.font.body,
      fontStyle: "800",
      color: GAME_UI.color.bright,
      letterSpacing: 1,
    },
  };
  return uiTextStyle({ ...(base[role] || base.body), ...overrides });
}
