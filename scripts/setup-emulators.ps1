# Creates 3 phone emulators for Block Forge testing
$sdk = "$env:LOCALAPPDATA\Android\Sdk"
$mgr = "$sdk\cmdline-tools\latest\bin\sdkmanager.bat"
$avd = "$sdk\cmdline-tools\latest\bin\avdmanager.bat"

if (-not (Test-Path $mgr)) {
  Write-Host "sdkmanager nahi mila. Android Studio kholo > SDK Manager > Command-line Tools install karo."
  exit 1
}

$env:ANDROID_HOME = $sdk
$env:ANDROID_SDK_ROOT = $sdk

Write-Host "Installing system image (Android 14)..."
& $mgr "platforms;android-34" "system-images;android-34;google_apis;x86_64" "emulator" | Out-Null

$phones = @(
  @{ Name = "BF_Pixel_6"; Device = "pixel_6" },
  @{ Name = "BF_Pixel_4a"; Device = "pixel_4a" },
  @{ Name = "BF_Small_Phone"; Device = "Nexus 5" }
)

foreach ($p in $phones) {
  $exists = & "$sdk\emulator\emulator.exe" -list-avds 2>$null | Select-String $p.Name
  if ($exists) {
    Write-Host "Skip (exists): $($p.Name)"
    continue
  }
  Write-Host "Creating $($p.Name)..."
  echo "no" | & $avd create avd -n $p.Name -k "system-images;android-34;google_apis;x86_64" -d $p.Device --force
}

Write-Host ""
Write-Host "Done! Emulators:"
& "$sdk\emulator\emulator.exe" -list-avds
