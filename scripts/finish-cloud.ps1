param(
  [Parameter(Mandatory = $true)]
  [string]$RenderUrl
)

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
Set-Location $Root

$RenderUrl = $RenderUrl.Trim().TrimEnd("/")
if ($RenderUrl -notmatch "^https://") { throw "URL must start with https://" }

Write-Host "Setting API URL: $RenderUrl" -ForegroundColor Cyan
$RenderUrl | Set-Content "config\api-url.txt" -Encoding UTF8

if (Test-Path "config\cloud.env") {
  $lines = Get-Content "config\cloud.env" | Where-Object { $_ -notmatch "^RENDER_URL=" }
  $lines += "RENDER_URL=$RenderUrl"
  $lines | Set-Content "config\cloud.env" -Encoding UTF8
}

Write-Host "Waiting for server (cold start up to 60s)..." -ForegroundColor Yellow
$ok = $false
for ($i = 0; $i -lt 12; $i++) {
  try {
    $r = Invoke-RestMethod -Uri "$RenderUrl/api/health" -TimeoutSec 15
    Write-Host "Health:" ($r | ConvertTo-Json -Compress) -ForegroundColor Green
    $ok = $true
    break
  } catch {
    Write-Host "  retry $($i + 1)/12..."
    Start-Sleep -Seconds 5
  }
}
if (-not $ok) { Write-Warning "Server not live yet — Render deploy/env check karo" }

Write-Host "`nBuilding Android release bundle..." -ForegroundColor Cyan
& cmd /c "call scripts\set-jdk17.bat && npm run build:android:release && npx cap sync android"
if ($LASTEXITCODE -ne 0) { throw "Android sync failed" }

$sdk = "$env:LOCALAPPDATA\Android\Sdk"
if (Test-Path "$sdk\platform-tools\adb.exe") {
  Write-Host "SDK found — building debug APK..." -ForegroundColor Yellow
  Push-Location android
  & .\gradlew.bat assembleDebug
  Pop-Location
  if ($LASTEXITCODE -eq 0) {
    Write-Host "APK: android\app\build\outputs\apk\debug\app-debug.apk" -ForegroundColor Green
  }
} else {
  Write-Host "Android SDK not ready — run INSTALL_ANDROID_SDK.bat later for APK" -ForegroundColor Yellow
}

Write-Host "`nDone! Cloud URL: $RenderUrl" -ForegroundColor Green
Write-Host "Play Store: ANDROID_PLAYSTORE.bat (needs keystore + Google Play `$25 account)"
