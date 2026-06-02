@echo off
title Phone Layout Test (Browser)
cd /d "%~dp0"
if not exist release mkdir release
echo Server chalna chahiye — http://localhost:8097
node scripts\test-phone-layouts.js
pause
