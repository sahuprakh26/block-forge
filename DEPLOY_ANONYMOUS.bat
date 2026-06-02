@echo off
title Block Forge - Anonymous public host
cd /d "%~dp0"
echo.
echo  Netlify par deploy (URL mein tumhara GitHub username NAHI aayega)
echo  GitHub Actions chalegi - 2-3 min wait
echo.
gh workflow run "Global Netlify Deploy" -R sahuprakh26/block-forge
echo.
echo  Deploy ke baad:
echo    gh variable get BF_GAME_URL -R sahuprakh26/block-forge
echo  Woh URL config\public-url.txt mein save karo
echo.
pause
