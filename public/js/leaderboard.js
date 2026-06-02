import { dailySeed } from "./shapes.js";
import { apiUrl } from "./apiBase.js";

export function boardKey(mode) {
  if (mode === "daily") return `daily-${dailySeed()}`;
  if (mode === "endless") return "endless";
  return null;
}

export async function fetchLeaderboard(board) {
  try {
    const res = await fetch(apiUrl(`/api/leaderboard/${encodeURIComponent(board)}`));
    if (!res.ok) throw new Error("fetch failed");
    return await res.json();
  } catch {
    return { board, rows: [], offline: true };
  }
}

export async function submitScore(board, playerId, name, score) {
  try {
    const res = await fetch(apiUrl(`/api/leaderboard/${encodeURIComponent(board)}`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId, name, score }),
    });
    if (!res.ok) throw new Error("submit failed");
    return await res.json();
  } catch {
    return { ok: false, offline: true };
  }
}

export async function fetchMyRank(board, playerId) {
  try {
    const res = await fetch(apiUrl(`/api/leaderboard/${encodeURIComponent(board)}/rank/${encodeURIComponent(playerId)}`));
    if (!res.ok) return null;
    const data = await res.json();
    return data.rank;
  } catch {
    return null;
  }
}
