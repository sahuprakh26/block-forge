@echo off
title Block Forge — Emulator Test
color 0E
cd /d "%~dp0"

call scripts\set-jdk17.bat
if errorlevel 1 (
  echo JDK 17 missing — INSTALL_ANDROID_SDK.bat chalao.
  pause
  exit /b 1
)

set "SDK=%LOCALAPPDATA%\Android\Sdk"
set "ANDROID_HOME=%SDK%"
set "PATH=%SDK%\platform-tools;%SDK%\emulator;%PATH%"

if not exist "%SDK%\emulator\emulator.exe" (
  echo Android Emulator nahi mila. INSTALL_ANDROID_SDK.bat chalao.
  pause
  exit /b 1
)

echo.
echo  Pehle PC par game server chalao (rankings ke liye):
echo    LAUNCH.bat  ^(alag window^)
echo.
echo  Emulator 10.0.2.2:8097 se PC server ko dekhega.
echo.

echo Available emulators:
"%SDK%\emulator\emulator.exe" -list-avds
echo.

set /p AVD=AVD name likho (ya Enter = pehla wala): 
if "%AVD%"=="" (
  for /f "delims=" %%i in ('"%SDK%\emulator\emulator.exe" -list-avds 2^>nul ^| findstr /r "."') do (
    set "AVD=%%i"
    goto :run
  )
  echo Koi emulator nahi. ANDROID_EMULATORS.bat chalao.
  pause
  exit /b 1
)

:run
echo Starting emulator: %AVD%
start "Android Emulator" "%SDK%\emulator\emulator.exe" -avd %AVD%

echo Waiting for boot...
:wait
"%SDK%\platform-tools\adb.exe" wait-for-device
timeout /t 8 /nobreak >nul
"%SDK%\platform-tools\adb.exe" shell getprop sys.boot_completed 2>nul | findstr "1" >nul
if errorlevel 1 goto :wait

echo Installing APK...
call ANDROID_BUILD.bat
if errorlevel 1 exit /b 1

"%SDK%\platform-tools\adb.exe" install -r android\app\build\outputs\apk\debug\app-debug.apk
"%SDK%\platform-tools\adb.exe" shell am start -n com.blockforge.game/.MainActivity

echo.
echo  Game emulator mein khul gaya hona chahiye!
pause
