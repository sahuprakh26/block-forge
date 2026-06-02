# Block Forge - global server (Rs 0, PC band = OK)
@echo off
title Global Server Deploy
cd /d "%~dp0"
echo.
echo  Public game URL: see config\public-url.txt (anonymous Netlify link)
echo  Ab API server Netlify par deploy ho raha hai...
echo  Agar browser khule to GitHub se Authorize dabao (sirf ek baar).
echo.
powershell -ExecutionPolicy Bypass -File scripts\setup-global-server.ps1
pause
