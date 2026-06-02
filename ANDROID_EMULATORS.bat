@echo off
title Create Android Emulators
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File scripts\setup-emulators.ps1
pause
