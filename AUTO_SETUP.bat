# Block Forge - one command full automation
@echo off
title Block Forge AUTO SETUP
color 0A
cd /d "%~dp0"

echo.
echo  Block Forge - A to Z setup (tumhe kuch nahi karna)
echo  ==================================================
echo.

echo [1/4] Cloud (GitHub gist + repo)...
powershell -ExecutionPolicy Bypass -File scripts\setup-cloud.ps1
if errorlevel 1 goto :fail

echo.
echo [2/4] GitHub Pages deploy trigger...
git add -A
git diff --quiet && git diff --staged --quiet || git commit -m "ci: pages and render workflows"
git push origin HEAD 2>nul
if errorlevel 1 git push origin master 2>nul

echo.
echo [3/4] Android build (debug APK)...
call scripts\set-jdk17.bat
if exist "%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe" (
  call npm run build:android
  call npx cap sync android
  cd android
  call gradlew.bat assembleDebug
  cd ..
) else (
  echo  Android SDK installing - run INSTALL_ANDROID_SDK.bat background mein chal raha...
  start /min cmd /c "winget install Google.AndroidStudio -e --accept-package-agreements --accept-source-agreements"
  call npm run build:android
  call npx cap sync android
)

echo.
echo [4/4] Summary...
echo.
echo  GitHub:  https://github.com/sahuprakh26/block-forge
echo  Web:     https://sahuprakh26.github.io/block-forge/  (Actions deploy ke baad)
echo  Gist:    config\cloud.env (rankings storage)
echo.
if exist "android\app\build\outputs\apk\debug\app-debug.apk" (
  echo  APK:     android\app\build\outputs\apk\debug\app-debug.apk
) else (
  echo  APK:     SDK ready hone ke baad ANDROID_BUILD.bat
)
echo.
echo  Render server: browser mein login pending (ek baar OAuth)
echo  Dashboard khul gaya hoga - GitHub se sign in dabao wahan.
echo.
pause
exit /b 0

:fail
echo Setup failed.
pause
exit /b 1
