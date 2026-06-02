# Silent Android SDK install (no Android Studio GUI)
$ErrorActionPreference = "Stop"
$sdk = "$env:LOCALAPPDATA\Android\Sdk"
$zip = "$env:TEMP\cmdline-tools.zip"
$url = "https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip"

if (Test-Path "$sdk\platform-tools\adb.exe") {
  Write-Host "SDK already installed: $sdk"
  exit 0
}

Write-Host "Downloading Android command-line tools..."
New-Item -ItemType Directory -Force -Path $sdk | Out-Null
Invoke-WebRequest -Uri $url -OutFile $zip -UseBasicParsing

$extract = "$env:TEMP\android-cmdline"
if (Test-Path $extract) { Remove-Item $extract -Recurse -Force }
Expand-Archive $zip $extract -Force

New-Item -ItemType Directory -Force -Path "$sdk\cmdline-tools\latest" | Out-Null
Copy-Item "$extract\cmdline-tools\*" "$sdk\cmdline-tools\latest" -Recurse -Force

$env:ANDROID_HOME = $sdk
$env:ANDROID_SDK_ROOT = $sdk
$mgr = "$sdk\cmdline-tools\latest\bin\sdkmanager.bat"

Write-Host "Installing SDK packages (5-10 min)..."
cmd /c "echo y| `"$mgr`" --licenses" | Out-Null
cmd /c "`"$mgr`" `"platform-tools`" `"platforms;android-34`" `"build-tools;34.0.0`" `"emulator`" `"system-images;android-34;google_apis;x86_64`""

if (Test-Path "$sdk\platform-tools\adb.exe") {
  Write-Host "SDK ready: $sdk"
  & "$PSScriptRoot\write-local-properties.ps1"
  exit 0
}
throw "SDK install failed"
