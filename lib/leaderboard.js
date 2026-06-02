"use strict";

const fileStore = require("./leaderboard-file");
const supabaseStore = require("./leaderboard-supabase");
const githubStore = require("./leaderboard-github");

function store() {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return supabaseStore;
  }
  if (process.env.GITHUB_GIST_ID && process.env.GITHUB_TOKEN) {
    return githubStore;
  }
  return fileStore;
}

function storageMode() {
  return store().storage || "file";
}

async function getLeaderboard(board, limit) {
  return store().getLeaderboard(board, limit);
}

async function submitScore(board, body) {
  return store().submitScore(board, body);
}

async function getRank(board, playerId) {
  return store().getRank(board, playerId);
}

module.exports = { getLeaderboard, submitScore, getRank, storageMode };
