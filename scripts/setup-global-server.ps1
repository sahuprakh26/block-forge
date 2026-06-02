# One-time: creates Netlify site + sets GitHub secrets for 24/7 global server
$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
Set-Location $Root

Write-Host "Block Forge - Global Server Setup" -ForegroundColor Cyan
Write-Host "Netlify CLI se login hoga (system browser) - GitHub dabao agar pooche" -ForegroundColor Yellow

npm install -g netlify-cli 2>$null | Out-Null
netlify login
netlify init --yes 2>$null
if ($LASTEXITCODE -ne 0) {
  netlify sites:create --name block-forge-game 2>$null
  netlify link 2>$null
}

# Env vars on Netlify for gist leaderboard
if (Test-Path "config\cloud.env") {
  Get-Content "config\cloud.env" | ForEach-Object {
    if ($_ -match "^([^=]+)=(.*)$") {
      $k = $Matches[1].Trim()
      $v = $Matches[2].Trim()
      if ($k -match "^(GITHUB_GIST_ID|GITHUB_TOKEN)$") {
        netlify env:set $k $v --context production 2>$null
      }
    }
  }
}

netlify env:set NODE_ENV production --context production 2>$null

Write-Host "Deploying..." -ForegroundColor Yellow
netlify deploy --prod --build

$siteUrl = (netlify status --json 2>$null | ConvertFrom-Json).url
if (-not $siteUrl) { $siteUrl = (netlify status 2>&1 | Select-String "https://").Line.Trim() }

if ($siteUrl) {
  $siteUrl = $siteUrl.Trim().TrimEnd("/")
  $siteUrl | Set-Content "config\api-url.txt" -Encoding UTF8
  Write-Host "Live URL: $siteUrl" -ForegroundColor Green

  $token = (netlify status --json 2>$null | ConvertFrom-Json)
  gh secret set GITHUB_GIST_ID --body ((Get-Content config\cloud.env | Where-Object {$_ -match '^GITHUB_GIST_ID='}) -replace 'GITHUB_GIST_ID=','') 2>$null
  gh secret set GITHUB_TOKEN --body (gh auth token) 2>$null

  Write-Host "Android release build..."
  $env:BF_API_URL = $siteUrl
  npm run build:android:release
  npx cap sync android 2>$null
}

Write-Host "Done! Game + API global: $siteUrl" -ForegroundColor Green
