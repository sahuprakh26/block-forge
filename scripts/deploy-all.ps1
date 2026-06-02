# Block Forge — one-shot deploy (GitHub already logged in via gh)
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

Write-Host "`n[1/5] GitHub push..." -ForegroundColor Cyan
if (-not (Test-Path .git)) { git init -b main }
git add -A
$status = git status --porcelain
if ($status) {
  git commit -m "Block Forge v1.1.0 — cloud-ready Android game"
}
$remote = git remote get-url origin 2>$null
if (-not $remote) {
  gh repo create block-forge --private --source=. --remote=origin --push --description "Block Forge puzzle game"
} else {
  git push -u origin HEAD 2>$null
  if ($LASTEXITCODE -ne 0) { git push -u origin master 2>$null; git branch -M main 2>$null; git push -u origin main }
}
Write-Host "Repo: https://github.com/sahuprakh26/block-forge" -ForegroundColor Green

Write-Host "`n[2/5] Supabase + Render need browser login (first time only)." -ForegroundColor Yellow
Write-Host "Opening dashboards..."
Start-Process "https://supabase.com/dashboard/new"
Start-Sleep 2
Start-Process "https://dashboard.render.com/select-repo?type=web"

Write-Host "`n[3/5] After Supabase project is created:" -ForegroundColor Cyan
Write-Host "  - SQL Editor: paste scripts/supabase-schema.sql and Run"
Write-Host "  - Settings > API: copy URL + service_role key"
Write-Host "`n[4/5] On Render (block-forge repo):" -ForegroundColor Cyan
Write-Host "  - Env: NODE_ENV=production, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY"
Write-Host "  - Deploy -> copy https URL to config/api-url.txt"

Write-Host "`nDone with automated steps. Run scripts/finish-cloud.ps1 after Render URL is live." -ForegroundColor Green
