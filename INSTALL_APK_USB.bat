@echo off
title Block Forge - USB APK Install
cd /d "%~dp0"
set "APK=android\app\build\outputs\apk\debug\app-debug.apk"
if not exist "%APK%" (
  echo  Pehle ANDROID_BUILD.bat chalao.
  pause
  exit /b 1
)
where adb >nul 2>&1
if errorlevel 1 set "PATH=%LOCALAPPDATA%\Android\Sdk\platform-tools;%PATH%"
adb devices
adb install -r "%APK%"
if errorlevel 1 (
  echo  Install fail — USB debugging ON karo, phone unlock karo.
) else (
  echo  Installed: Block Forge
)
pause
