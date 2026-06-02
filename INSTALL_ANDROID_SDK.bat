@echo off
title Install Android Studio + SDK
echo.
echo  Block Forge — Android SDK Setup
echo  ================================
echo.
echo  [1] JDK 17 (Gradle ke liye — Java 24 se build fail hota hai)
winget install EclipseAdoptium.Temurin.17.JDK -e --accept-source-agreements --accept-package-agreements
echo.
echo  [2] Android Studio (SDK + Emulator)
echo  Install ke baad Android Studio kholo ^> SDK Manager ^> Android 14/15 install karo.
echo.
pause
winget install --id Google.AndroidStudio -e --accept-source-agreements --accept-package-agreements
echo.
echo  Done. Ab ANDROID_EMULATORS.bat chalao, phir ANDROID_RUN.bat
pause
