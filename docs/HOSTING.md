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

## Full rankings (read + submit, free)

GitHub Pages is static — scores need a small **API** (same GitHub Gist backend).

1. Deploy **Render** (free): `render.yaml` runs `api-server.js` only.
   - Env: `GITHUB_GIST_ID` = repo secret `BF_GIST_ID`, `GITHUB_TOKEN` = `BF_GH_TOKEN`
2. Run: `powershell -File scripts/apply-rankings-api.ps1 -ApiUrl https://YOUR.onrender.com`
3. Or **Cloudflare Worker**: `.github/workflows/cloudflare-api.yml` + `CF_API_TOKEN` / `CF_ACCOUNT_ID`

Quick guide: `SETUP_RANKINGS_FREE.bat`

## CrazyGames / Poki

Upload `dist-portal/` files or use the GitHub Pages URL in forms.

## Do not use

- Netlify (paid / suspend risk for this project)
