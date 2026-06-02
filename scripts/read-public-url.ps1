# Returns player-facing URL from config/public-url.txt or BF_GAME_URL
$root = Split-Path $PSScriptRoot -Parent
$file = Join-Path $root "config\public-url.txt"
if ($env:BF_GAME_URL) { return $env:BF_GAME_URL.TrimEnd('/') }
if (Test-Path $file) {
  $line = Get-Content $file | Where-Object { $_ -match '\S' -and $_ -notmatch '^\s*#' } | Select-Object -First 1
  if ($line) { return $line.Trim().TrimEnd('/') }
}
return ""
