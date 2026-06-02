import { dailySeed } from "./shapes.js";
import { apiUrl } from "./apiBase.js";

export function boardKey(mode) {
  if (mode === "daily") return `daily-${dailySeed()}`;
  if (mode === "endless") return "endless";
  return null;
}

function gistId() {
  const id = typeof window !== "undefined" ? window.BF_GIST_ID : "";
  return typeof id === "string" && id.length > 8 ? id : "";
}

/** Public read — works when API is down but gist is public */
async function fetchLeaderboardFromGist(board) {
  const id = gistId();
  if (!id) return null;
  try {
    const res = await fetch(`https://api.github.com/gists/${id}`);
    if (!res.ok) return null;
    const g = await res.json();
    const f = g.files?.["leaderboard.json"] || Object.values(g.files || {})[0];
    let data = {};
    if (f?.content) data = JSON.parse(f.content);
    else if (f?.raw_url) {
      const raw = await fetch(f.raw_url);
      data = JSON.parse(await raw.text());
    }
    const key = String(board).slice(0, 32);
    const rows = (data[key] || [])
      .sort((a, b) => b.score - a.score || a.updatedAt - b.updatedAt)
      .slice(0, 50);
    return { board, rows, source: "gist" };
  } catch {
    return null;
  }
}

export async function fetchLeaderboard(board) {
  try {
    const res = await fetch(apiUrl(`/api/leaderboard/${encodeURIComponent(board)}`));
    if (res.ok) return await res.json();
    if (res.status === 503) {
      const fallback = await fetchLeaderboardFromGist(board);
      if (fallback) return fallback;
    }
    throw new Error(`http_${res.status}`);
  } catch {
    const fallback = await fetchLeaderboardFromGist(board);
    if (fallback) return fallback;
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
    const res = await fetch(
      apiUrl(`/api/leaderboard/${encodeURIComponent(board)}/rank/${encodeURIComponent(playerId)}`)
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.rank;
  } catch {
    return null;
  }
}
