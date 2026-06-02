"use strict";

const { handleLeaderboardRequest, jsonBody, corsHeaders } = require("../../lib/leaderboard-handler");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders(), body: "" };
  }

  let bodyJson = null;
  if (event.body) {
    try {
      bodyJson = JSON.parse(event.body);
    } catch {
      return jsonBody({ ok: false, error: "bad_json" }, 400);
    }
  }

  const path = event.path || event.rawUrl || "/api/health";
  return handleLeaderboardRequest(event.httpMethod, path.split("?")[0], bodyJson);
};
