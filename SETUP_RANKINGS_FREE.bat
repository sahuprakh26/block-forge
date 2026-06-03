@echo off
title Block Forge — Free full rankings
color 0B
cd /d "%~dp0"
echo.
echo  FULL RANKINGS = read + submit (free)
echo  Game: GitHub Pages (already live)
echo  API:  Render free OR Cloudflare Worker free
echo.
echo  Tumhare GitHub secrets already: BF_GIST_ID + BF_GH_TOKEN
echo.
echo  ===== OPTION A — Render (recommended, ~5 min) =====
echo  1. https://render.com  — sign up free (GitHub login)
echo  2. New + ^> Web Service ^> connect repo: sahuprakh26/block-forge
echo  3. Render picks render.yaml automatically
echo  4. Environment Variables ADD:
echo       GITHUB_GIST_ID  = same as GitHub secret BF_GIST_ID
echo       GITHUB_TOKEN    = same as GitHub secret BF_GH_TOKEN
echo       NODE_ENV        = production
echo  5. Deploy — copy URL: https://block-forge-xxxx.onrender.com
echo  6. Run:
echo       powershell -File scripts\apply-rankings-api.ps1 -ApiUrl YOUR_RENDER_URL
echo.
echo  ===== OPTION B — Cloudflare Worker =====
echo  1. https://dash.cloudflare.com  free account
echo  2. Create API token (Workers edit) + copy Account ID
echo  3. GitHub repo ^> Settings ^> Secrets:
echo       CF_API_TOKEN, CF_ACCOUNT_ID
echo  4. Actions ^> Deploy Global API (Cloudflare) ^> Run workflow
echo  5. Copy worker URL, then apply-rankings-api.ps1 with that URL
echo.
pause
