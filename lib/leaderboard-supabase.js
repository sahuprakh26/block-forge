"use strict";

const MAX_ROWS = Number(process.env.LB_MAX_ENTRIES) || 5000;

function cfg() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("supabase_not_configured");
  return { url, key };
}

function cleanName(name) {
  const n = String(name || "")
    .trim()
    .slice(0, 16)
    .replace(/[<>"'&\\]/g, "");
  if (n.length < 2 || n.toLowerCase() === "player") return null;
  return n;
}

function boardKey(board) {
  return String(board).slice(0, 32);
}

async function sbFetch(path, options = {}) {
  const { url, key } = cfg();
  const res = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`supabase_${res.status}:${text.slice(0, 120)}`);
  }
  if (res.status === 204) return null;
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return null;
}

async function getLeaderboard(board, limit = 50) {
  const b = encodeURIComponent(boardKey(board));
  const lim = Math.min(100, Math.max(1, limit));
  const rows = await sbFetch(
    `lb_scores?board=eq.${b}&select=player_id,name,score,updated_at&order=score.desc,updated_at.asc&limit=${lim}`
  );
  return (rows || []).map((r) => ({
    playerId: r.player_id,
    name: r.name,
    score: r.score,
    updatedAt: Number(r.updated_at),
  }));
}

async function submitScore(board, { playerId, name, score }) {
  const pid = String(playerId || "").slice(0, 64);
  const sc = Math.max(0, Math.min(250000, Math.floor(Number(score) || 0)));
  if (!pid || sc <= 0) return { ok: false, error: "invalid" };

  const display = cleanName(name);
  if (!display) return { ok: false, error: "invalid_name" };

  const b = boardKey(board);
  const existing = await sbFetch(
    `lb_scores?board=eq.${encodeURIComponent(b)}&player_id=eq.${encodeURIComponent(pid)}&select=score&limit=1`
  );

  if (existing?.[0]) {
    const best = existing[0].score;
    if (sc <= best) return { ok: true, updated: false, best };
    await sbFetch(`lb_scores?board=eq.${encodeURIComponent(b)}&player_id=eq.${encodeURIComponent(pid)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ name: display, score: sc, updated_at: Date.now() }),
    });
    return { ok: true, updated: true, best: sc };
  }

  await sbFetch("lb_scores", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      board: b,
      player_id: pid,
      name: display,
      score: sc,
      updated_at: Date.now(),
    }),
  });

  trimBoard(b).catch(() => {});
  return { ok: true, updated: true, best: sc };
}

async function trimBoard(board) {
  const rows = await getLeaderboard(board, MAX_ROWS + 500);
  if (rows.length <= MAX_ROWS) return;
  const drop = rows.slice(MAX_ROWS);
  for (const r of drop) {
    await sbFetch(
      `lb_scores?board=eq.${encodeURIComponent(board)}&player_id=eq.${encodeURIComponent(r.playerId)}`,
      { method: "DELETE", headers: { Prefer: "return=minimal" } }
    );
  }
}

async function getRank(board, playerId) {
  const rows = await getLeaderboard(board, 9999);
  const idx = rows.findIndex((r) => r.playerId === playerId);
  if (idx < 0) return null;
  return { rank: idx + 1, score: rows[idx].score, total: rows.length };
}

module.exports = { getLeaderboard, submitScore, getRank, storage: "supabase" };
