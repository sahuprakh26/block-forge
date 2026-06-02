@echo off
title Block Forge - Install
cd /d "%~dp0"
for /f "delims=" %%U in ('powershell -NoProfile -File scripts\read-public-url.ps1') do set "PLAY=%%U"
if not defined PLAY set "PLAY=https://block-forge.netlify.app"
echo.
echo  Play (browser): %PLAY%
echo  Install page:   %PLAY%/download.html
echo.
start "" "%PLAY%/download.html"
pause
