"use strict";

const MAX_ROWS = Number(process.env.LB_MAX_ENTRIES) || 5000;
const GIST_ID = process.env.GITHUB_GIST_ID;
const TOKEN = process.env.GITHUB_TOKEN;
const FILE = "leaderboard.json";

function cfg() {
  if (!GIST_ID || !TOKEN) throw new Error("github_gist_not_configured");
  return { gistId: GIST_ID, token: TOKEN };
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

async function ghFetch(path, options = {}) {
  const { token } = cfg();
  const res = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`github_${res.status}:${text.slice(0, 120)}`);
  }
  return res.json();
}

async function readMeta() {
  const { gistId } = cfg();
  const g = await ghFetch(`/gists/${gistId}`);
  const names = Object.keys(g.files || {});
  const fname = names.includes(FILE) ? FILE : names[0];
  const f = fname ? g.files[fname] : null;
  if (!f) return { data: {}, sha: null, fname: FILE };
  let data = {};
  try {
    if (f.content) data = JSON.parse(f.content);
    else if (f.raw_url) {
      const raw = await fetch(f.raw_url);
      data = JSON.parse(await raw.text());
    }
  } catch {
    data = {};
  }
  return { data, sha: f.sha || null, fname };
}

async function writeAll(data, sha, fname) {
  const { gistId } = cfg();
  const name = fname || FILE;
  await ghFetch(`/gists/${gistId}`, {
    method: "PATCH",
    body: JSON.stringify({
      files: {
        [name]: { content: JSON.stringify(data, null, 2) },
      },
    }),
  });
  void sha;
}

function pruneBoard(rows) {
  if (rows.length <= MAX_ROWS) return rows;
  return rows
    .sort((a, b) => b.score - a.score || a.updatedAt - b.updatedAt)
    .slice(0, MAX_ROWS);
}

function getBoard(all, board) {
  const key = boardKey(board);
  if (!all[key]) all[key] = [];
  return all[key];
}

async function getLeaderboard(board, limit = 50) {
  const { data } = await readMeta();
  return getBoard(data, board)
    .sort((a, b) => b.score - a.score || a.updatedAt - b.updatedAt)
    .slice(0, limit);
}

async function submitScore(board, { playerId, name, score }) {
  const pid = String(playerId || "").slice(0, 64);
  const sc = Math.max(0, Math.min(250000, Math.floor(Number(score) || 0)));
  if (!pid || sc <= 0) return { ok: false, error: "invalid" };

  const display = cleanName(name);
  if (!display) return { ok: false, error: "invalid_name" };

  const { data, sha, fname } = await readMeta();
  const key = boardKey(board);
  const rows = getBoard(data, board);
  const now = Date.now();
  const existing = rows.find((r) => r.playerId === pid);

  if (existing) {
    if (sc <= existing.score) return { ok: true, updated: false, best: existing.score };
    existing.score = sc;
    existing.name = display;
    existing.updatedAt = now;
  } else {
    rows.push({ playerId: pid, name: display, score: sc, updatedAt: now });
  }

  data[key] = pruneBoard(rows);
  await writeAll(data, sha);
  return { ok: true, updated: true, best: sc };
}

async function getRank(board, playerId) {
  const rows = await getLeaderboard(board, 9999);
  const idx = rows.findIndex((r) => r.playerId === playerId);
  if (idx < 0) return null;
  return { rank: idx + 1, score: rows[idx].score, total: rows.length };
}

module.exports = { getLeaderboard, submitScore, getRank, storage: "github-gist" };
