# Block Forge — one-shot finish (build + URLs)
$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
Set-Location $Root

$publicUrl = & "$PSScriptRoot\read-public-url.ps1"
if (-not $publicUrl) {
  $publicUrl = "https://sahuprakh26.github.io/block-forge"
  $publicUrl | Set-Content "config\public-url.txt" -Encoding UTF8
}
$publicUrl | Set-Content "config\api-url.txt" -Encoding UTF8

Write-Host "Building..." -ForegroundColor Cyan
cmd /c "call scripts\set-jdk17.bat && npm run build:android && npx cap sync android && cd android && gradlew.bat assembleDebug" | Out-Host
if (-not (Test-Path "public\download")) { New-Item -ItemType Directory "public\download" | Out-Null }
Copy-Item "android\app\build\outputs\apk\debug\app-debug.apk" "public\download\BlockForge.apk" -Force
npm run build | Out-Host

Write-Host ""
Write-Host "=== Block Forge — Ready ===" -ForegroundColor Green
Write-Host "Play:     $publicUrl"
Write-Host "Install:  $publicUrl/download.html"
Write-Host "APK file: $publicUrl/download/BlockForge.apk"
Write-Host "Local:    android\app\build\outputs\apk\debug\app-debug.apk"
