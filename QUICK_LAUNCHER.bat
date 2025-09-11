@echo off
echo ========================================
echo   QUICK LAUNCHER - Math Learning Platform
echo ========================================
echo.
echo [1] Intent Learning
echo [2] Physics Platform  
echo [3] Full System
echo [4] Status Check
echo [5] Exit
echo.
choice /c 12345 /n /m "Select: "

if errorlevel 5 exit
if errorlevel 4 goto status
if errorlevel 3 goto full
if errorlevel 2 goto physics
if errorlevel 1 goto intent

:intent
start-lola-intent.bat
exit

:physics
start-lola-final.bat
exit

:full
start /b start-lola-intent.bat
timeout /t 2 >nul
start /b start-lola-final.bat
timeout /t 3 >nul
start lola-math-intent.html
start lola-platform.html
exit

:status
echo Checking ports...
netstat -an | findstr :8092 && echo Port 8092: LOLA Intent Active || echo Port 8092: Not Active
netstat -an | findstr :8090 && echo Port 8090: LOLA Physics Active || echo Port 8090: Not Active
netstat -an | findstr :8081 && echo Port 8081: Gesture Active || echo Port 8081: Not Active
pause
exit
