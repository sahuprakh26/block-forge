@echo off
title Block Forge — All Emulators Test
color 0E
cd /d "%~dp0"

call scripts\set-jdk17.bat
if errorlevel 1 exit /b 1

set "SDK=%LOCALAPPDATA%\Android\Sdk"
set "ANDROID_HOME=%SDK%"
set "PATH=%SDK%\platform-tools;%SDK%\emulator;%PATH%"

if not exist "%SDK%\emulator\emulator.exe" (
  echo Emulator nahi mila. INSTALL_ANDROID_SDK.bat + ANDROID_EMULATORS.bat chalao.
  pause
  exit /b 1
)

echo.
echo  Pehle LAUNCH.bat alag window mein chalao (server rankings ke liye).
echo  Phir har emulator par APK install + launch hoga.
echo.

call ANDROID_BUILD.bat
if errorlevel 1 exit /b 1

set "APK=android\app\build\outputs\apk\debug\app-debug.apk"
if not exist "%APK%" (
  echo APK missing: %APK%
  pause
  exit /b 1
)

for /f "delims=" %%A in ('"%SDK%\emulator\emulator.exe" -list-avds 2^>nul') do (
  echo.
  echo ===== Testing: %%A =====
  start "Emulator %%A" /wait "%SDK%\emulator\emulator.exe" -avd "%%A" -no-snapshot-load
  "%SDK%\platform-tools\adb.exe" wait-for-device
  timeout /t 10 /nobreak >nul
  "%SDK%\platform-tools\adb.exe" install -r "%APK%"
  "%SDK%\platform-tools\adb.exe" shell am start -n com.blockforge.game/.MainActivity
  echo Press any key for next emulator...
  pause >nul
  "%SDK%\platform-tools\adb.exe" emu kill 2>nul
  timeout /t 3 /nobreak >nul
)

echo All emulators tested.
pause
