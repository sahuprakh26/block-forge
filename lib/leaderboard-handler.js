"use strict";

const MAX = Number(process.env.LB_MAX_ENTRIES) || 5000;
const FILE = "leaderboard.json";

function cleanName(name) {
  const n = String(name || "")
    .trim()
    .slice(0, 16)
    .replace(/[<>"'&\\]/g, "");
  if (n.length < 2 || n.toLowerCase() === "player") return null;
  return n;
}

function corsHeaders(extra = {}) {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    ...extra,
  };
}

function jsonBody(data, status = 200) {
  return {
    statusCode: status,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
    body: JSON.stringify(data),
  };
}

async function ghFetch(path, token, options = {}) {
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

async function readGist(gistId, token) {
  const g = await ghFetch(`/gists/${gistId}`, token);
  const f = g.files?.[FILE] || Object.values(g.files || {})[0];
  if (!f) return { data: {} };
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
  return { data };
}

async function writeGist(gistId, token, data) {
  await ghFetch(`/gists/${gistId}`, token, {
    method: "PATCH",
    body: JSON.stringify({
      files: { [FILE]: { content: JSON.stringify(data, null, 2) } },
    }),
  });
}

function rowsFor(all, board, limit) {
  const key = String(board).slice(0, 32);
  return (all[key] || [])
    .sort((a, b) => b.score - a.score || a.updatedAt - b.updatedAt)
    .slice(0, limit);
}

/** Netlify / serverless entry */
async function handleLeaderboardRequest(method, pathname, bodyJson) {
  const gistId = process.env.GITHUB_GIST_ID || process.env.BF_GIST_ID;
  const token = process.env.GITHUB_TOKEN || process.env.BF_GH_TOKEN;
  if (!gistId || !token) {
    return jsonBody({ ok: false, error: "api_not_configured" }, 503);
  }

  if (pathname === "/api/health") {
    return jsonBody({ ok: true, app: "block-forge", storage: "github-gist", leaderboard: true });
  }

  const lb = pathname.match(/^\/api\/leaderboard\/([^/]+)(?:\/rank\/([^/]+))?$/);
  if (!lb) return jsonBody({ error: "not_found" }, 404);

  const board = decodeURIComponent(lb[1]);

  try {
    if (method === "GET" && lb[2]) {
      const pid = decodeURIComponent(lb[2]);
      const { data } = await readGist(gistId, token);
      const rows = rowsFor(data, board, 9999);
      const idx = rows.findIndex((r) => r.playerId === pid);
      return jsonBody({
        rank: idx < 0 ? null : { rank: idx + 1, score: rows[idx].score, total: rows.length },
      });
    }
    if (method === "GET") {
      const { data } = await readGist(gistId, token);
      return jsonBody({ board, rows: rowsFor(data, board, 50) });
    }
    if (method === "POST") {
      const body = bodyJson || {};
      const pid = String(body.playerId || "").slice(0, 64);
      const sc = Math.max(0, Math.min(250000, Math.floor(Number(body.score) || 0)));
      const name = cleanName(body.name);
      if (!pid || sc <= 0) return jsonBody({ ok: false, error: "invalid" }, 400);
      if (!name) return jsonBody({ ok: false, error: "invalid_name" }, 400);

      const { data } = await readGist(gistId, token);
      const key = String(board).slice(0, 32);
      if (!data[key]) data[key] = [];
      const rows = data[key];
      const now = Date.now();
      const ex = rows.find((r) => r.playerId === pid);
      if (ex) {
        if (sc <= ex.score) return jsonBody({ ok: true, updated: false, best: ex.score });
        ex.score = sc;
        ex.name = name;
        ex.updatedAt = now;
      } else {
        rows.push({ playerId: pid, name, score: sc, updatedAt: now });
      }
      data[key] = rows.sort((a, b) => b.score - a.score || a.updatedAt - b.updatedAt).slice(0, MAX);
      await writeGist(gistId, token, data);
      const ranked = rowsFor(data, board, 9999);
      const idx = ranked.findIndex((r) => r.playerId === pid);
      return jsonBody({
        ok: true,
        updated: true,
        best: sc,
        rank: idx < 0 ? null : { rank: idx + 1, score: sc, total: ranked.length },
      });
    }
  } catch (e) {
    console.error("leaderboard", e.message);
    return jsonBody({ ok: false, error: "server_error" }, 500);
  }

  return jsonBody({ error: "method" }, 405);
}

module.exports = { handleLeaderboardRequest, jsonBody, corsHeaders };
