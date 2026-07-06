@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"

title Dotvec Tools - Local Live Preview
color 0B

set "PROJECT_DIR=%CD%"
set "PNPM_CJS=%PROJECT_DIR%\.dotvec-pnpm\bin\pnpm.cjs"
set "LOG_FILE=%PROJECT_DIR%\dotvec-startup.log"
set "NEXT_TELEMETRY_DISABLED=1"
set "CI=false"
set "npm_config_registry=https://registry.npmjs.org/"
set "NPM_CONFIG_REGISTRY=https://registry.npmjs.org/"
set "npm_config_userconfig=%PROJECT_DIR%\.npmrc"
set "NPM_CONFIG_USERCONFIG=%PROJECT_DIR%\.npmrc"

>"%LOG_FILE%" echo Dotvec Tools startup log
>>"%LOG_FILE%" echo Started: %DATE% %TIME%
>>"%LOG_FILE%" echo Project: %PROJECT_DIR%

echo.
echo ============================================================
echo   DOTVEC TOOLS - LOCAL LIVE PREVIEW
echo ============================================================
echo.
echo This window will stay open so every error remains visible.
echo Project folder: %PROJECT_DIR%
echo.

if not exist "%PROJECT_DIR%\package.json" (
  call :FAIL "package.json is missing. Extract the complete ZIP first, then run START_DOTVEC.bat from the extracted folder."
  goto :END
)

where node >nul 2>&1
if errorlevel 1 (
  call :FAIL "Node.js was not found. Install Node.js 22 LTS or 24 LTS, restart Windows, and run this file again."
  goto :END
)

for /f "delims=" %%V in ('node --version 2^>nul') do set "NODE_VERSION=%%V"
echo Node version: !NODE_VERSION!
>>"%LOG_FILE%" echo Node version: !NODE_VERSION!

node -e "const m=Number(process.versions.node.split('.')[0]); process.exit(m>=20&&m<27?0:1)" >nul 2>&1
if errorlevel 1 (
  call :FAIL "Unsupported Node.js version !NODE_VERSION!. Install Node.js 22 LTS or 24 LTS."
  goto :END
)

if not exist "%PNPM_CJS%" (
  call :FAIL "The bundled package manager is missing. Download and extract the complete Dotvec Tools ZIP again."
  goto :END
)

for /f "delims=" %%V in ('node "%PNPM_CJS%" --version 2^>nul') do set "PNPM_VERSION=%%V"
if not defined PNPM_VERSION (
  call :FAIL "The bundled package manager could not start. Check that the ZIP was fully extracted and Windows Security did not remove files."
  goto :END
)
echo Bundled PNPM version: !PNPM_VERSION!
>>"%LOG_FILE%" echo PNPM version: !PNPM_VERSION!

echo Checking source files and admin routes...
node "%PROJECT_DIR%\scripts\validate-project.cjs"
if errorlevel 1 (
  call :FAIL "Project source validation failed. Use the clean final ZIP instead of applying old patches."
  goto :END
)

echo Checking package registry and lockfile...
node "%PROJECT_DIR%\scripts\sanitize-lockfile.cjs"
set "SANITIZE_CODE=!ERRORLEVEL!"
if not "!SANITIZE_CODE!"=="0" (
  call :FAIL "The package lockfile contains an invalid registry URL and could not be repaired automatically."
  goto :END
)
for /f "delims=" %%R in ('node "%PNPM_CJS%" config get registry 2^>nul') do set "ACTIVE_REGISTRY=%%R"
if /i not "!ACTIVE_REGISTRY!"=="https://registry.npmjs.org/" (
  call :FAIL "Package registry override failed. Active registry: !ACTIVE_REGISTRY!"
  goto :END
)
echo Package registry: !ACTIVE_REGISTRY!
>>"%LOG_FILE%" echo Package registry: !ACTIVE_REGISTRY!

if not exist "%PROJECT_DIR%\.env.local" (
  if exist "%PROJECT_DIR%\.env.example" (
    copy /y "%PROJECT_DIR%\.env.example" "%PROJECT_DIR%\.env.local" >nul
    echo Created .env.local from .env.example
  )
)

if /i "%~1"=="repair" (
  echo.
  echo ============================================================
  echo   CLEAN REPAIR
  echo ============================================================
  echo Closing this project's old build files and dependencies...
  call :REMOVE_DIR "%PROJECT_DIR%\.next"
  call :REMOVE_DIR "%PROJECT_DIR%\node_modules"
  call :REMOVE_DIR "%PROJECT_DIR%\.pnpm-store"
  del /f /q "%PROJECT_DIR%\.dotvec-installed" >nul 2>&1
)

echo.
echo ============================================================
echo   DEPENDENCY CHECK
  echo ============================================================

if not exist "%PROJECT_DIR%\node_modules\.bin\next.cmd" (
  echo Installing project packages. First run can take several minutes.
  echo Keep this window open and keep the internet connected.
  echo.
  >>"%LOG_FILE%" echo Installing dependencies...
  node "%PNPM_CJS%" install --frozen-lockfile --registry=https://registry.npmjs.org/ --reporter=append-only
  set "INSTALL_CODE=!ERRORLEVEL!"
  >>"%LOG_FILE%" echo Install exit code: !INSTALL_CODE!
  if not "!INSTALL_CODE!"=="0" (
    call :FAIL "Package installation failed with exit code !INSTALL_CODE!. See the messages above and dotvec-startup.log."
    goto :END
  )
  >"%PROJECT_DIR%\.dotvec-installed" echo Installed on %DATE% %TIME%
) else (
  echo Dependencies are already installed.
)

if not exist "%PROJECT_DIR%\node_modules\.bin\next.cmd" (
  call :FAIL "Next.js was not installed correctly. Run REPAIR_DOTVEC.bat after closing any other Node.js terminals."
  goto :END
)

for /f "delims=" %%P in ('node "%PROJECT_DIR%\scripts\find-port.cjs" 3000 3099 2^>nul') do set "PORT=%%P"
if not defined PORT (
  call :FAIL "No free local port was found from 3000 to 3099. Close other local servers and try again."
  goto :END
)

set "PREVIEW_URL=http://localhost:!PORT!"
echo.
echo ============================================================
echo   STARTING WEBSITE
  echo ============================================================
echo Preview URL: !PREVIEW_URL!
echo Keep this window open while using the website.
echo Press Ctrl+C once to stop the preview.
echo Code changes refresh automatically.
echo.
>>"%LOG_FILE%" echo Preview URL: !PREVIEW_URL!

start "" /b node "%PROJECT_DIR%\scripts\open-preview.cjs" "!PREVIEW_URL!" >>"%LOG_FILE%" 2>&1

call "%PROJECT_DIR%\node_modules\.bin\next.cmd" dev --turbopack -p !PORT!
set "SERVER_CODE=!ERRORLEVEL!"
>>"%LOG_FILE%" echo Server exit code: !SERVER_CODE!

if not "!SERVER_CODE!"=="0" (
  call :FAIL "The Next.js preview server stopped with exit code !SERVER_CODE!. Review the messages above."
  goto :END
)

echo.
echo The preview server has stopped normally.
goto :END

:REMOVE_DIR
set "TARGET_DIR=%~1"
if exist "%TARGET_DIR%" (
  rmdir /s /q "%TARGET_DIR%" >nul 2>&1
  if exist "%TARGET_DIR%" (
    echo Could not remove: %TARGET_DIR%
    echo Close any terminal or editor using this project, then run repair again.
    >>"%LOG_FILE%" echo Could not remove: %TARGET_DIR%
  ) else (
    echo Removed: %TARGET_DIR%
  )
)
exit /b 0

:FAIL
set "FAIL_MESSAGE=%~1"
echo.
echo [ERROR] !FAIL_MESSAGE!
echo.
echo A startup log is saved here:
echo %LOG_FILE%
>>"%LOG_FILE%" echo ERROR: !FAIL_MESSAGE!
exit /b 0

:END
echo.
echo ============================================================
echo   WINDOW WILL REMAIN OPEN
  echo ============================================================
echo Press any key only when you want to close this window.
pause >nul
endlocal
exit /b 0
