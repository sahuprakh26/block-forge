"use strict";

/** Rankings API only — free Render host. Game stays on GitHub Pages. */
require("dotenv").config();

const express = require("express");
const { handleLeaderboardRequest } = require("./lib/leaderboard-handler");

const PORT = Number(process.env.PORT) || 8097;
const app = express();

app.disable("x-powered-by");
app.use(express.json({ limit: "16kb" }));

app.use("/api", async (req, res) => {
  const fullPath = `/api${req.url}`.split("?")[0];
  let bodyJson = null;
  if (req.method === "POST" && req.body) bodyJson = req.body;

  const out = await handleLeaderboardRequest(req.method, fullPath, bodyJson);
  for (const [k, v] of Object.entries(out.headers || {})) res.setHeader(k, v);
  res.status(out.statusCode).send(out.body);
});

app.get("/", (_req, res) => {
  res.json({ ok: true, service: "block-forge-rankings-api", health: "/api/health" });
});

app.listen(PORT, () => {
  console.log(`Rankings API http://localhost:${PORT}/api/health`);
});
