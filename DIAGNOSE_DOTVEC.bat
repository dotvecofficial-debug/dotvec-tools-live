@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title Dotvec Tools - Diagnostics
color 0E
set "REPORT=%~dp0DOTVEC_DIAGNOSTICS.txt"
>"%REPORT%" echo DOTVEC TOOLS DIAGNOSTICS
>>"%REPORT%" echo Date: %DATE% %TIME%
>>"%REPORT%" echo Folder: %CD%

echo ============================================================
echo   DOTVEC TOOLS - DIAGNOSTICS
echo ============================================================
echo.
echo Folder: %CD%
where node >nul 2>&1
if errorlevel 1 (
  echo Node.js: NOT FOUND
  >>"%REPORT%" echo Node.js: NOT FOUND
) else (
  for /f "delims=" %%V in ('node --version 2^>nul') do echo Node.js: %%V&>>"%REPORT%" echo Node.js: %%V
)
if exist "package.json" (echo package.json: OK&>>"%REPORT%" echo package.json: OK) else (echo package.json: MISSING&>>"%REPORT%" echo package.json: MISSING)
if exist ".dotvec-pnpm\bin\pnpm.cjs" (echo Bundled PNPM: OK&>>"%REPORT%" echo Bundled PNPM: OK) else (echo Bundled PNPM: MISSING&>>"%REPORT%" echo Bundled PNPM: MISSING)
findstr /i /c:"internal.api.openai.org" /c:"applied-caas-gateway" "pnpm-lock.yaml" >nul 2>&1
if errorlevel 1 (echo Lockfile registry: CLEAN&>>"%REPORT%" echo Lockfile registry: CLEAN) else (echo Lockfile registry: INVALID INTERNAL URL FOUND&>>"%REPORT%" echo Lockfile registry: INVALID INTERNAL URL FOUND)
echo Expected registry: https://registry.npmjs.org/&>>"%REPORT%" echo Expected registry: https://registry.npmjs.org/
if exist "node_modules\.bin\next.cmd" (echo Dependencies: INSTALLED&>>"%REPORT%" echo Dependencies: INSTALLED) else (echo Dependencies: NOT INSTALLED&>>"%REPORT%" echo Dependencies: NOT INSTALLED)
if exist "dotvec-startup.log" (
  echo.
  echo Last startup log:
  echo ------------------------------------------------------------
  type "dotvec-startup.log"
  echo ------------------------------------------------------------
  >>"%REPORT%" echo.
  >>"%REPORT%" echo STARTUP LOG:
  type "dotvec-startup.log" >>"%REPORT%"
)
echo.
echo Diagnostic report saved to:
echo %REPORT%
echo.
pause
endlocal
