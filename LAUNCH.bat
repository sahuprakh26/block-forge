@echo off
title Block Forge Launcher
color 0B
cd /d "%~dp0"

echo.
echo  BLOCK FORGE - Launcher
echo  ======================
echo.

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8097" ^| findstr "LISTENING"') do (
  taskkill /F /PID %%a >nul 2>&1
)

if not exist node_modules (
  echo Installing...
  call npm install || goto :fail
)

echo Building game...
call npm run build || goto :fail

echo Starting server (naya window khulega)...
start "Block Forge Server - BAND MAT KARO" cmd /k "cd /d %~dp0 && title Block Forge Server && echo. && echo  SERVER CHAL RAHA HAI && echo  http://localhost:8097 && echo  IS WINDOW KO BAND MAT KARO && echo. && node server.js"

echo Server start ho raha hai...
set /a n=0
:waitloop
set /a n+=1
powershell -Command "try { (Invoke-WebRequest -Uri http://localhost:8097/api/health -UseBasicParsing -TimeoutSec 2) | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
if not errorlevel 1 goto :ready
if %n% geq 25 goto :fail
timeout /t 1 /nobreak >nul
goto :waitloop

:ready
echo OK! Browser khol rahe hain...
cmd /c start "" "http://localhost:8097"
echo.
echo  Game khul gaya hona chahiye.
echo  Server alag kaali window mein chal raha hai - USE BAND MAT KARO.
echo  Agar blank ho: http://localhost:8097 + Ctrl+Shift+R
echo.
pause
exit /b 0

:fail
echo.
echo  Kuch galat ho gaya. CHECK.bat chalao ya error upar dekho.
pause
exit /b 1
