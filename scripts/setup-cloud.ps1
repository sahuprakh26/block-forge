# Block Forge - fully automated cloud setup (uses existing gh login)
$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
Set-Location $Root

function Save-CloudEnv($gistId, $token, $renderUrl) {
  $lines = @(
    "GITHUB_GIST_ID=$gistId",
    "GITHUB_TOKEN=$token"
  )
  if ($renderUrl) { $lines += "RENDER_URL=$renderUrl" }
  $lines | Set-Content -Path "config\cloud.env" -Encoding UTF8
}

Write-Host ""
Write-Host "=== Block Forge Cloud Setup (Rs 0) ===" -ForegroundColor Cyan

Write-Host ""
Write-Host "[1] Leaderboard gist..." -ForegroundColor Yellow
$gistId = $null
if (Test-Path "config\cloud.env") {
  Get-Content "config\cloud.env" | ForEach-Object {
    if ($_ -match "^GITHUB_GIST_ID=(.+)$") { $gistId = $Matches[1].Trim() }
  }
}
$token = (gh auth token).Trim()
if (-not $gistId) {
  $tmp = Join-Path $env:TEMP "bf-leaderboard.json"
  '{"ok":true}' | Set-Content $tmp -NoNewline -Encoding UTF8
  $gistOut = cmd /c "gh gist create `"$tmp`" -f leaderboard.json -d BlockForgeLB 2>&1"
  Remove-Item $tmp -ErrorAction SilentlyContinue
  $gistText = ($gistOut | Out-String).Trim()
  if ($gistText -match "gist.github.com/(?:[^/]+/)?([a-f0-9]+)") {
    $gistId = $Matches[1]
  } else {
    throw "Gist create failed: $gistText"
  }
  Write-Host "  Gist: https://gist.github.com/$gistId" -ForegroundColor Green
} else {
  Write-Host "  Reusing gist $gistId" -ForegroundColor Green
}

Write-Host ""
Write-Host "[2] GitHub repo..." -ForegroundColor Yellow
if (-not (Test-Path .git)) { git init -b main | Out-Null }
git add -A
if (git status --porcelain) {
  git commit -m "Block Forge v1.1.0 cloud and Android ready" | Out-Null
}
$hasOrigin = $false
try { git remote get-url origin 2>$null | Out-Null; $hasOrigin = $true } catch {}
if (-not $hasOrigin) {
  gh repo create block-forge --private --source=. --remote=origin --push --description "Block Forge puzzle game"
} else {
  git push -u origin HEAD 2>$null
  if ($LASTEXITCODE -ne 0) {
    git branch -M main 2>$null
    git push -u origin main --force 2>$null
  }
}
Write-Host "  https://github.com/sahuprakh26/block-forge" -ForegroundColor Green

Save-CloudEnv $gistId $token $null

Write-Host ""
Write-Host "[3] Testing gist storage..." -ForegroundColor Yellow
$env:GITHUB_GIST_ID = $gistId
$env:GITHUB_TOKEN = $token
node "$PSScriptRoot\test-gist-storage.js"
if ($LASTEXITCODE -ne 0) { throw "Gist storage test failed" }
Write-Host "  Gist storage OK" -ForegroundColor Green

$renderLines = @(
  "Block Forge Render env vars:",
  "GITHUB_GIST_ID=$gistId",
  "GITHUB_TOKEN=$token",
  "NODE_ENV=production",
  "",
  "Repo: https://github.com/sahuprakh26/block-forge"
)
$renderLines | Set-Content "config\render-env.txt" -Encoding UTF8
Write-Host ""
Write-Host "[4] Render env saved: config\render-env.txt" -ForegroundColor Green

Write-Host ""
Write-Host "[5] Opening Render dashboard..." -ForegroundColor Yellow
Start-Process "https://dashboard.render.com/select-repo?type=web"

Write-Host ""
Write-Host "=== Local setup complete ===" -ForegroundColor Cyan
Write-Host "After Render deploy:"
Write-Host "  powershell -File scripts\finish-cloud.ps1 -RenderUrl https://YOUR.onrender.com"
