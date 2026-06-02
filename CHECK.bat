@echo off
cd /d "%~dp0"
echo Block Forge - Quick Check
echo =========================
echo.

echo [1] Files...
if exist public\js\game.bundle.js (echo   OK game.bundle.js) else (echo   FAIL game.bundle.js - run LAUNCH.bat)
if exist public\vendor\phaser.min.js (echo   OK phaser.min.js) else (echo   FAIL phaser.min.js)
if exist node_modules (echo   OK node_modules) else (echo   FAIL node_modules - run npm install)

echo.
echo [2] Server port 8097...
powershell -Command "try { $r = Invoke-WebRequest -Uri http://localhost:8097/api/health -UseBasicParsing -TimeoutSec 3; Write-Host '   OK Server running:' $r.Content } catch { Write-Host '   FAIL Server NOT running - double-click LAUNCH.bat' }"

echo.
echo [3] Game page...
powershell -Command "try { $r = Invoke-WebRequest -Uri http://localhost:8097/js/game.bundle.js -UseBasicParsing -TimeoutSec 3; Write-Host '   OK Bundle size:' $r.Content.Length 'bytes' } catch { Write-Host '   FAIL Cannot load game bundle' }"

echo.
echo =========================
echo Agar sab OK hai: browser mein http://localhost:8097 kholo
echo Agar FAIL hai: LAUNCH.bat chalao
echo =========================
pause
