@echo off
title Block Forge Production
cd /d "%~dp0"
if not exist node_modules call npm install
set NODE_ENV=production
call npm run build
echo.
echo  Block Forge PRODUCTION — http://localhost:8097
echo  Ctrl+C to stop
echo.
node server.js
