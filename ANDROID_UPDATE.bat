@echo off
title Block Forge - Android UPDATE (1.2.0)
color 0E
cd /d "%~dp0"
echo.
echo  Naya APK banega + phone par install (USB debugging ON)
echo  Menu par "v1.2.0" dikhe = update OK
echo.
call ANDROID_BUILD.bat
if errorlevel 1 exit /b 1
echo.
echo  USB install...
call INSTALL_APK_USB.bat
