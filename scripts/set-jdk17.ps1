# Picks JDK 17 for Android Gradle (Java 24 breaks Gradle 8.x)
$candidates = @(
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

Write-Host "JDK 17 nahi mila. INSTALL_ANDROID_SDK.bat chalao (Temurin 17 install hoga)."
exit 1
