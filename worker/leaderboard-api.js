/** Cloudflare Worker — global rankings API (gist backend) */
const MAX = 5000;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, POST, OPTIONS",
      "access-control-allow-headers": "content-type",
    },
  });
}

function cleanName(name) {
  const n = String(name || "")
    .trim()
    .slice(0, 16)
    .replace(/[<>"'&\\]/g, "");
  if (n.length < 2 || n.toLowerCase() === "player") return null;
  return n;
}

async function readGist(env) {
  const g = await fetch(`https://api.github.com/gists/${env.GITHUB_GIST_ID}`, {
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!g.ok) throw new Error(`gist_${g.status}`);
  const data = await g.json();
  const f = data.files?.leaderboard.json || Object.values(data.files || {})[0];
  if (!f?.content) return {};
  try {
    return JSON.parse(f.content);
  } catch {
    return {};
  }
}

async function writeGist(env, body) {
  const res = await fetch(`https://api.github.com/gists/${env.GITHUB_GIST_ID}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      files: { "leaderboard.json": { content: JSON.stringify(body, null, 2) } },
    }),
  });
  if (!res.ok) throw new Error(`gist_write_${res.status}`);
}

function rowsFor(all, board, limit) {
  const key = String(board).slice(0, 32);
  return (all[key] || [])
    .sort((a, b) => b.score - a.score || a.updatedAt - b.updatedAt)
    .slice(0, limit);
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return json({ ok: true });
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return json({ ok: true, app: "block-forge", storage: "github-gist", env: "production" });
    }

    const lb = url.pathname.match(/^\/api\/leaderboard\/([^/]+)(?:\/rank\/([^/]+))?$/);
    if (!lb) return json({ error: "not_found" }, 404);

    const board = decodeURIComponent(lb[1]);
    try {
      if (request.method === "GET" && lb[2]) {
        const pid = decodeURIComponent(lb[2]);
        const rows = rowsFor(await readGist(env), board, 9999);
        const idx = rows.findIndex((r) => r.playerId === pid);
        return json({
          rank: idx < 0 ? null : { rank: idx + 1, score: rows[idx].score, total: rows.length },
        });
      }
      if (request.method === "GET") {
        const rows = rowsFor(await readGist(env), board, 50);
        return json({ board, rows });
      }
      if (request.method === "POST") {
        const body = await request.json();
        const pid = String(body.playerId || "").slice(0, 64);
        const sc = Math.max(0, Math.min(250000, Math.floor(Number(body.score) || 0)));
        const name = cleanName(body.name);
        if (!pid || sc <= 0) return json({ ok: false, error: "invalid" }, 400);
        if (!name) return json({ ok: false, error: "invalid_name" }, 400);

        const all = await readGist(env);
        const key = String(board).slice(0, 32);
        if (!all[key]) all[key] = [];
        const rows = all[key];
        const now = Date.now();
        const ex = rows.find((r) => r.playerId === pid);
        if (ex) {
          if (sc <= ex.score) return json({ ok: true, updated: false, best: ex.score });
          ex.score = sc;
          ex.name = name;
          ex.updatedAt = now;
        } else {
          rows.push({ playerId: pid, name, score: sc, updatedAt: now });
        }
        all[key] = rows.sort((a, b) => b.score - a.score || a.updatedAt - b.updatedAt).slice(0, MAX);
        await writeGist(env, all);
        const ranked = rowsFor(all, board, 9999);
        const idx = ranked.findIndex((r) => r.playerId === pid);
        return json({
          ok: true,
          updated: true,
          best: sc,
          rank: idx < 0 ? null : { rank: idx + 1, score: sc, total: ranked.length },
        });
      }
    } catch (e) {
      return json({ ok: false, error: "server_error", detail: e.message }, 500);
    }
    return json({ error: "method" }, 405);
  },
};
