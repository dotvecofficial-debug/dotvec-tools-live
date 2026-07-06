@echo off
setlocal
cd /d "%~dp0"
title Dotvec Tools - Repair
call "%~dp0RUN_DOTVEC.cmd" repair
endlocal
