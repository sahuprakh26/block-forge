@echo off
title Block Forge Android Build
color 0B
cd /d "%~dp0"

call scripts\set-jdk17.bat
if errorlevel 1 (
  echo  JDK 17 chahiye. INSTALL_ANDROID_SDK.bat chalao.
  pause
  exit /b 1
)

set "SDK=%LOCALAPPDATA%\Android\Sdk"
if exist "%SDK%" (
  set "ANDROID_HOME=%SDK%"
  set "ANDROID_SDK_ROOT=%SDK%"
  set "PATH=%SDK%\platform-tools;%SDK%\emulator;%SDK%\cmdline-tools\latest\bin;%PATH%"
  powershell -NoProfile -ExecutionPolicy Bypass -File scripts\write-local-properties.ps1 >nul 2>&1
)

echo.
echo  Block Forge — Android APK Build
echo  ================================
echo.

if not exist "%SDK%\platform-tools\adb.exe" (
  echo  Android SDK nahi mila. Pehle INSTALL_ANDROID_SDK.bat chalao.
  pause
  exit /b 1
)

echo [1] Web + Android sync...
call npm run cap:sync
if errorlevel 1 goto :fail

echo [2] Gradle debug APK...
cd android
call gradlew.bat assembleDebug
if errorlevel 1 goto :fail
cd ..

echo.
echo  SUCCESS!
echo  APK: android\app\build\outputs\apk\debug\app-debug.apk
echo.
echo  Emulator par test: ANDROID_RUN.bat
echo.
pause
exit /b 0

:fail
echo.
echo  Build fail. Android Studio + SDK check karo.
pause
exit /b 1
