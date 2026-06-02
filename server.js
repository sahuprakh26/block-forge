"use strict";

require("dotenv").config();

const express = require("express");
const path = require("path");
const lb = require("./lib/leaderboard");

const PORT = Number(process.env.PORT) || 8097;
const IS_PROD = process.env.NODE_ENV === "production";
const app = express();

const publicDir = path.join(__dirname, "public");
const rateMap = new Map();

function clientIp(req) {
  return req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket.remoteAddress || "local";
}

function tooManyRequests(req) {
  if (req.method !== "POST") return false;
  const ip = clientIp(req);
  const now = Date.now();
  let row = rateMap.get(ip);
  if (!row || now - row.t > 60_000) row = { n: 0, t: now };
  row.n += 1;
  rateMap.set(ip, row);
  return row.n > 40;
}

app.disable("x-powered-by");
app.use(express.json({ limit: "16kb" }));

app.use("/api", (req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (IS_PROD) res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  next();
});

app.use((req, res, next) => {
  if (tooManyRequests(req)) return res.status(429).json({ ok: false, error: "rate_limit" });
  next();
});

app.use(
  express.static(publicDir, {
    etag: true,
    maxAge: IS_PROD ? "7d" : 0,
    setHeaders(res, filePath) {
      if (filePath.endsWith("index.html")) res.setHeader("Cache-Control", "no-cache");
      if (filePath.endsWith("game.bundle.js")) res.setHeader("Cache-Control", IS_PROD ? "public, max-age=3600" : "no-cache");
    },
  })
);

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    app: "block-forge",
    version: "1.1.0",
    leaderboard: true,
    storage: lb.storageMode(),
    env: IS_PROD ? "production" : "development",
  });
});

app.get("/api/leaderboard/:board", async (req, res) => {
  try {
    const rows = await lb.getLeaderboard(req.params.board, 50);
    res.json({ board: req.params.board, rows });
  } catch (e) {
    console.error("leaderboard get", e.message);
    res.status(500).json({ ok: false, error: "server_error" });
  }
});

app.get("/api/leaderboard/:board/rank/:playerId", async (req, res) => {
  try {
    const rank = await lb.getRank(req.params.board, req.params.playerId);
    res.json({ rank });
  } catch (e) {
    console.error("leaderboard rank", e.message);
    res.status(500).json({ ok: false, error: "server_error" });
  }
});

app.post("/api/leaderboard/:board", async (req, res) => {
  try {
    const result = await lb.submitScore(req.params.board, req.body || {});
    if (!result.ok) return res.status(400).json(result);
    const rank = await lb.getRank(req.params.board, req.body.playerId);
    res.json({ ...result, rank });
  } catch (e) {
    console.error("leaderboard post", e.message);
    res.status(500).json({ ok: false, error: "server_error" });
  }
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Block Forge v1.1.0 → http://localhost:${PORT}`);
    console.log(`Mode: ${IS_PROD ? "production" : "development"}`);
  });
}

module.exports = app;
