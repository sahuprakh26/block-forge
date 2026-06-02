"use strict";

const LB_PATH = require("path").join(__dirname, "..", "data", "leaderboard.json");
const fs = require("fs");

function readAll() {
  try {
    return JSON.parse(fs.readFileSync(LB_PATH, "utf8"));
  } catch {
    return {};
  }
}

function writeAll(data) {
  fs.mkdirSync(require("path").dirname(LB_PATH), { recursive: true });
  fs.writeFileSync(LB_PATH, JSON.stringify(data, null, 2));
}

function cleanName(name) {
  const n = String(name || "")
    .trim()
    .slice(0, 16)
    .replace(/[<>"'&\\]/g, "");
  if (n.length < 2 || n.toLowerCase() === "player") return null;
  return n;
}

const MAX_ROWS = Number(process.env.LB_MAX_ENTRIES) || 5000;

function pruneBoard(rows) {
  if (rows.length <= MAX_ROWS) return rows;
  return rows
    .sort((a, b) => b.score - a.score || a.updatedAt - b.updatedAt)
    .slice(0, MAX_ROWS);
}

function boardKey(board) {
  return String(board).slice(0, 32);
}

function getBoard(all, board) {
  const key = boardKey(board);
  if (!all[key]) all[key] = [];
  return all[key];
}

async function getLeaderboard(board, limit = 50) {
  const all = readAll();
  return getBoard(all, board)
    .sort((a, b) => b.score - a.score || a.updatedAt - b.updatedAt)
    .slice(0, limit);
}

async function submitScore(board, { playerId, name, score }) {
  const pid = String(playerId || "").slice(0, 64);
  const sc = Math.max(0, Math.min(250000, Math.floor(Number(score) || 0)));
  if (!pid || sc <= 0) return { ok: false, error: "invalid" };

  const display = cleanName(name);
  if (!display) return { ok: false, error: "invalid_name" };

  const all = readAll();
  const key = boardKey(board);
  const rows = getBoard(all, board);
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

  all[key] = pruneBoard(rows);
  writeAll(all);
  return { ok: true, updated: true, best: sc };
}

async function getRank(board, playerId) {
  const rows = await getLeaderboard(board, 9999);
  const idx = rows.findIndex((r) => r.playerId === playerId);
  if (idx < 0) return null;
  return { rank: idx + 1, score: rows[idx].score, total: rows.length };
}

module.exports = { getLeaderboard, submitScore, getRank, storage: "file" };
