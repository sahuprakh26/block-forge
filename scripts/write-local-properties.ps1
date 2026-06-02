# Auto-writes android/local.properties when SDK is installed
$sdk = "$env:LOCALAPPDATA\Android\Sdk"
$out = Join-Path $PSScriptRoot "..\android\local.properties"
if (-not (Test-Path $sdk)) {
  Write-Host "SDK not found at $sdk — run INSTALL_ANDROID_SDK.bat first."
  exit 1
}
$sdkEsc = $sdk -replace '\\', '\\\\'
"sdk.dir=$sdk" | Set-Content -Path $out -Encoding ASCII
Write-Host "Wrote $out"
exit 0
