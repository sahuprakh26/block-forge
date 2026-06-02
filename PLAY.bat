@echo off
title Block Forge - PLAY
color 0B
cd /d "%~dp0"

echo.
echo  BLOCK FORGE
echo  ===========
echo.

:: Server already running?
powershell -Command "try { (Invoke-WebRequest -Uri http://localhost:8097/api/health -UseBasicParsing -TimeoutSec 2) | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
if not errorlevel 1 goto :openbrowser

echo Server nahi chal raha — start ho raha hai...
if not exist node_modules (
  echo npm install...
  call npm install || goto :fail
)

call npm run build || goto :fail

start "Block Forge Server - BAND MAT KARO" cmd /k "cd /d %~dp0 && title Block Forge Server && echo. && echo  SERVER CHAL RAHA HAI && echo  http://localhost:8097 && echo  IS WINDOW KO BAND MAT KARO && echo. && node server.js"

set /a n=0
:waitloop
set /a n+=1
powershell -Command "try { (Invoke-WebRequest -Uri http://localhost:8097/api/health -UseBasicParsing -TimeoutSec 2) | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
if not errorlevel 1 goto :openbrowser
if %n% geq 25 goto :fail
timeout /t 1 /nobreak >nul
goto :waitloop

:openbrowser
echo Browser khol rahe hain...
cmd /c start "" "http://localhost:8097"
timeout /t 2 /nobreak >nul
echo.
echo  Agar game nahi dikha:
echo    1) Browser mein ye likho: http://localhost:8097
echo    2) Ctrl+Shift+R dabao (refresh)
echo    3) Server wali kaali window band mat karo
echo.
pause
exit /b 0

:fail
echo.
echo  Error — CHECK.bat chalao ya error upar dekho.
pause
exit /b 1
