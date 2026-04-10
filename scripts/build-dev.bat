@echo off
REM Wrapper script to capture tspc output to a unique log file
REM %1 = log file path
set LOGFILE=%1
if "%LOGFILE%"=="" set LOGFILE=%TEMP%\axiom_build.log

REM Clean dist to force full rebuild
if exist dist rmdir /s /q dist
call npx tspc -p tsconfig.dev.json > "%LOGFILE%" 2>&1
