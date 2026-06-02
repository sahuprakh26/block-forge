@echo off
set "JAVA_HOME="
for /f "tokens=2 delims==" %%J in ('powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0set-jdk17.ps1"') do set "JAVA_HOME=%%J"
if not defined JAVA_HOME exit /b 1
set "PATH=%JAVA_HOME%\bin;%PATH%"
exit /b 0
