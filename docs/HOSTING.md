# Free hosting (no Netlify)

## Live game (GitHub Pages — Rs 0)

**URL:** https://sahuprakh26.github.io/block-forge/

- Push to `master` → GitHub Actions deploys `public/` automatically.
- Enable once: GitHub repo → **Settings** → **Pages** → Source: **GitHub Actions**.

## Config files

| File | Purpose |
|------|---------|
| `config/public-url.txt` | Public game link (GitHub Pages URL) |
| `config/api-url.txt` | Optional leaderboard API (Render / Cloudflare Worker). Empty = gist read-only fallback |

## Rankings without Netlify

1. **Gist** (free): set `BF_GIST_ID` in GitHub repo secrets — read works in game.
2. **Cloudflare Worker** (free): deploy `worker/leaderboard-api.js` via `.github/workflows/cloudflare-api.yml` + CF secrets.
3. **Render** (free tier): `render.yaml` — server sleeps when idle.

## CrazyGames / Poki

Upload `dist-portal/` files or use the GitHub Pages URL in forms.

## Do not use

- Netlify (paid / suspend risk for this project)
