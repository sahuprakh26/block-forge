@echo off
title Block Forge - ZERO CLICK setup
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File scripts\setup-cloud.ps1
if errorlevel 1 exit /b 1
git add -A
git diff --quiet && git diff --staged --quiet || (git commit -m "chore: auto setup" && git push origin master 2>nul)
powershell -ExecutionPolicy Bypass -File scripts\install-android-sdk.ps1
echo.
echo Done. Public URL: config\public-url.txt
pause
