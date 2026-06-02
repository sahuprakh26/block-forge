@echo off
setlocal enabledelayedexpansion
title Block Forge — Free Cloud Deploy (Rs 0)
color 0D
cd /d "%~dp0"

echo.
echo  ============================================
echo   Block Forge — PC se independent server
echo   Total cost: Rs 0 (free tiers)
echo  ============================================
echo.
echo  Architecture:
echo    Phone/Browser  --HTTPS--^>  Render (game + API)
echo    Render         --HTTPS--^>  Supabase (rankings DB)
echo.
echo  Tumhara PC band ho — game + rankings chalte rahenge.
echo.
pause

echo.
echo  STEP 1 — Supabase (free database, rankings ke liye)
echo  ---------------------------------------------------
echo  1. https://supabase.com  par free account banao
echo  2. New project banao (region: Mumbai/Singapore)
echo  3. SQL Editor kholo, ye file paste karo:
echo       scripts\supabase-schema.sql
echo  4. Project Settings ^> API se copy karo:
echo       - Project URL  ^(SUPABASE_URL^)
echo       - service_role key ^(secret — kabhi app mein mat daalo^)
echo.
pause

echo.
echo  STEP 2 — GitHub (free, code upload)
echo  -----------------------------------
echo  1. https://github.com/new  par repo banao (private OK)
echo  2. Is folder se push karo:
echo       git init
echo       git add .
echo       git commit -m "Block Forge cloud ready"
echo       git remote add origin YOUR_REPO_URL
echo       git push -u origin main
echo.
pause

echo.
echo  STEP 3 — Render (free server, 750 hrs/month)
echo  --------------------------------------------
echo  1. https://render.com  par free account ^(GitHub se login^)
echo  2. New ^> Web Service ^> apna GitHub repo connect karo
echo  3. Render render.yaml auto-detect karega
echo  4. Environment Variables add karo:
echo       NODE_ENV=production
echo       SUPABASE_URL=https://xxxx.supabase.co
echo       SUPABASE_SERVICE_ROLE_KEY=eyJ...
echo  5. Deploy — URL milega jaise: https://block-forge-xxxx.onrender.com
echo.
echo  Note: 15 min idle ke baad server so jata hai; pehli request ~30 sec
echo        Rankings Supabase mein safe rehte hain.
echo.
pause

echo.
echo  STEP 4 — Android / Play Store URL set karo
echo  -----------------------------------------
echo  1. config\api-url.txt.example ko copy karke config\api-url.txt banao
echo  2. Andar apna Render HTTPS URL likho (bina trailing slash)
echo  3. Test: browser mein https://YOUR-URL/api/health
echo  4. Play Store build: ANDROID_PLAYSTORE.bat
echo.
echo  Emulator local test (optional): config\api-url.txt hatao, LAUNCH.bat + ANDROID_RUN.bat
echo.
pause

if not exist config mkdir config
if not exist config\api-url.txt (
  echo.
  set /p URL=Render URL paste karo (https://...): 
  if not "!URL!"=="" (
    echo !URL!> config\api-url.txt
    echo Saved config\api-url.txt
  )
)

echo.
echo  Health check (agar URL set hai):
if exist config\api-url.txt (
  for /f "usebackq delims=" %%U in (`powershell -NoProfile -Command "(Get-Content config\api-url.txt | Where-Object { $_ -match '^https' } | Select-Object -First 1)"`) do (
    powershell -Command "try { $r = Invoke-WebRequest -Uri '%%U/api/health' -UseBasicParsing -TimeoutSec 20; Write-Host 'OK:' $r.Content } catch { Write-Host 'Not live yet:' $_.Exception.Message }"
  )
)
echo.
pause
