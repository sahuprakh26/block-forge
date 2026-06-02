@echo off
title Block Forge — Play Store Release
color 0D
cd /d "%~dp0"

call scripts\set-jdk17.bat
if errorlevel 1 (
  echo JDK 17 missing — INSTALL_ANDROID_SDK.bat chalao.
  pause
  exit /b 1
)

set "SDK=%LOCALAPPDATA%\Android\Sdk"
set "ANDROID_HOME=%SDK%"
set "PATH=%SDK%\platform-tools;%PATH%"

echo.
echo  Block Forge — Play Store Release (AAB)
echo  ========================================
echo.
echo  Server tumhare PC par nahi — cloud URL chahiye.
echo  Pehle DEPLOY_FREE.bat ^(Render + Supabase, Rs 0^)
echo  Phir config\api-url.txt mein HTTPS URL set karo.
echo.

if not exist "config\api-url.txt" (
  echo  config\api-url.txt missing!
  echo  Copy config\api-url.txt.example and paste your Render URL.
  pause
  exit /b 1
)

if not exist "android\keystore.properties" (
  echo [1] Pehli baar — signing key banao:
  echo.
  if not exist "release" mkdir release
  echo    keytool -genkey -v -keystore release\block-forge.keystore -alias blockforge -keyalg RSA -keysize 2048 -validity 10000
  echo.
  echo    Phir android\keystore.properties.example ko copy karke keystore.properties banao
  echo.
  set /p GO=Key bana li? Enter dabao...
  if not exist "android\keystore.properties" (
    echo keystore.properties missing — abort.
    pause
    exit /b 1
  )
)

echo [2] Building release bundle (cloud API)...
call npm run build:android:release
if errorlevel 1 goto :fail
call npx cap sync android
cd android
call gradlew.bat bundleRelease
if errorlevel 1 goto :fail
cd ..

echo.
echo  SUCCESS!
echo  Upload: android\app\build\outputs\bundle\release\app-release.aab
echo  Play Console: https://play.google.com/console
echo  App ID: com.blockforge.game
echo.
pause
exit /b 0

:fail
pause
exit /b 1
