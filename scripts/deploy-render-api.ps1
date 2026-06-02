# Deploy Block Forge API to Render via API (after one-time API key in config/cloud.env)
param(
  [string]$ApiKey = $env:RENDER_API_KEY
)

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
Set-Location $Root

if (-not $ApiKey -and (Test-Path "config\cloud.env")) {
  Get-Content "config\cloud.env" | ForEach-Object {
    if ($_ -match "^RENDER_API_KEY=(.+)$") { $ApiKey = $Matches[1].Trim() }
  }
}
if (-not $ApiKey) { throw "RENDER_API_KEY missing — add to config\cloud.env after Render Account Settings > API Keys" }

$gistId = $null
$ghToken = $null
Get-Content "config\cloud.env" | ForEach-Object {
  if ($_ -match "^GITHUB_GIST_ID=(.+)$") { $gistId = $Matches[1].Trim() }
  if ($_ -match "^GITHUB_TOKEN=(.+)$") { $ghToken = $Matches[1].Trim() }
}

$headers = @{
  Authorization = "Bearer $ApiKey"
  Accept        = "application/json"
  "Content-Type" = "application/json"
}

$owner = (Invoke-RestMethod -Uri "https://api.render.com/v1/owners" -Headers $headers)[0]
$ownerId = $owner.owner.id

$body = @{
  type    = "web_service"
  name    = "block-forge"
  ownerId = $ownerId
  repo    = "https://github.com/sahuprakh26/block-forge"
  branch  = "master"
  autoDeploy = "yes"
  serviceDetails = @{
    runtime = "node"
    plan    = "free"
    region  = "singapore"
    envSpecificDetails = @{
      buildCommand = "npm install && npm run build"
      startCommand = "node server.js"
    }
    envVars = @(
      @{ key = "NODE_ENV"; value = "production" },
      @{ key = "GITHUB_GIST_ID"; value = $gistId },
      @{ key = "GITHUB_TOKEN"; value = $ghToken }
    )
  }
} | ConvertTo-Json -Depth 8

Write-Host "Creating Render service..."
try {
  $svc = Invoke-RestMethod -Uri "https://api.render.com/v1/services" -Method POST -Headers $headers -Body $body
} catch {
  $existing = Invoke-RestMethod -Uri "https://api.render.com/v1/services?limit=20" -Headers $headers
  $svc = $existing | Where-Object { $_.service.name -eq "block-forge" } | Select-Object -First 1
  if (-not $svc) { throw $_ }
}

$url = "https://$($svc.service.slug).onrender.com"
Write-Host "Service: $url"

$lines = Get-Content "config\cloud.env" | Where-Object { $_ -notmatch "^RENDER_URL=" }
$lines += "RENDER_URL=$url"
$lines += "RENDER_API_KEY=$ApiKey"
$lines | Set-Content "config\cloud.env" -Encoding UTF8
$url | Set-Content "config\api-url.txt" -Encoding UTF8

Write-Host "Waiting for deploy..."
for ($i = 0; $i -lt 24; $i++) {
  Start-Sleep -Seconds 10
  try {
    $h = Invoke-RestMethod -Uri "$url/api/health" -TimeoutSec 20
    Write-Host "Live:" ($h | ConvertTo-Json -Compress)
    & "$PSScriptRoot\finish-cloud.ps1" -RenderUrl $url
    exit 0
  } catch {
    Write-Host "  ...$($i + 1)/24"
  }
}
Write-Host "Deploy started — check Render dashboard. URL: $url"
