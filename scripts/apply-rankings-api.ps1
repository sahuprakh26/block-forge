# Point live game builds at your free rankings API (Render / Cloudflare Worker).
param(
  [Parameter(Mandatory = $true)]
  [string]$ApiUrl
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

$ApiUrl = $ApiUrl.Trim().TrimEnd("/")
if ($ApiUrl -notmatch "^https://") { throw "URL must start with https://" }

Write-Host "API URL: $ApiUrl"
$ApiUrl | Set-Content "config\api-url.txt" -Encoding UTF8

Write-Host "Setting GitHub variable BF_API_URL..."
gh variable set BF_API_URL --body $ApiUrl --repo sahuprakh26/block-forge

Write-Host "Health check..."
try {
  $h = Invoke-RestMethod -Uri "$ApiUrl/api/health" -TimeoutSec 45
  Write-Host "OK:" ($h | ConvertTo-Json -Compress)
} catch {
  Write-Warning "API not ready yet (Render cold start ~30-60s). Retry: $ApiUrl/api/health"
}

Write-Host "Triggering GitHub Pages rebuild..."
gh workflow run "Deploy GitHub Pages" --repo sahuprakh26/block-forge
Write-Host "Done. After ~1 min, game will use full rankings (read + submit)."
