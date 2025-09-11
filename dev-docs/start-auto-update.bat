@echo off
echo Starting AE Claude Max Documentation Auto-Update System
echo Date: 2025-09-03
echo.

cd /d C:\palantir\math\dev-docs

echo Installing dependencies...
call npm install

echo.
echo Fixing all document dates...
node scripts/force-update.js

echo.
echo Starting real-time monitoring...
start /B node scripts/monitor-changes.js

echo.
echo Starting auto-update system...
node auto-update-system.js

pause
