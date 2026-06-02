# One-shot: keystore + release build prep (Play Store)
$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
. "$PSScriptRoot\set-jdk17.ps1" | Out-Null
$keytool = if ($env:JAVA_HOME) { Join-Path $env:JAVA_HOME "bin\keytool.exe" } else { "keytool" }
$ksDir = Join-Path $Root "release"
$ksFile = Join-Path $ksDir "block-forge.keystore"
$props = Join-Path $Root "android\keystore.properties"

New-Item -ItemType Directory -Force -Path $ksDir | Out-Null

$storePass = "BlockForge2026!"
$alias = "blockforge"

if (-not (Test-Path $ksFile)) {
  $dname = "CN=Block Forge, OU=Game, O=BlockForge, L=India, ST=India, C=IN"
  & $keytool -genkey -v -keystore $ksFile -alias $alias -keyalg RSA -keysize 2048 -validity 10000 `
    -storepass $storePass -keypass $storePass -dname $dname
  Write-Host "Created keystore: $ksFile"
}

@"
storeFile=../release/block-forge.keystore
storePassword=$storePass
keyAlias=$alias
keyPassword=$storePass
"@ | Set-Content $props -Encoding ASCII

Write-Host "Wrote $props"
