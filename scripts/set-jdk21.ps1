# Picks JDK 21 (Capacitor 7) or falls back to JDK 17
$candidates = @(
  "$env:ProgramFiles\Eclipse Adoptium\jdk-21*",
  "$env:ProgramFiles\Microsoft\jdk-21*",
  "$env:ProgramFiles\Java\jdk-21*",
  "$env:LOCALAPPDATA\Programs\Eclipse Adoptium\jdk-21*",
  "$env:ProgramFiles\Eclipse Adoptium\jdk-17*",
  "$env:ProgramFiles\Microsoft\jdk-17*",
  "$env:ProgramFiles\Java\jdk-17*",
  "$env:LOCALAPPDATA\Programs\Eclipse Adoptium\jdk-17*",
  "$env:ANDROID_HOME\jbr",
  "$env:LOCALAPPDATA\Android\Sdk\jbr"
)

foreach ($pattern in $candidates) {
  $hit = Get-ChildItem -Path $pattern -ErrorAction SilentlyContinue | Sort-Object Name -Descending | Select-Object -First 1
  if ($hit -and (Test-Path "$($hit.FullName)\bin\java.exe")) {
    $env:JAVA_HOME = $hit.FullName
    $env:Path = "$($hit.FullName)\bin;$env:Path"
    Write-Host "JAVA_HOME=$($hit.FullName)"
    exit 0
  }
}

Write-Host "JDK 21/17 nahi mila. winget install EclipseAdoptium.Temurin.21.JDK"
exit 1
