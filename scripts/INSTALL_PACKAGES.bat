@echo off
cls
echo ========================================
echo   Installing Required Packages
echo   Math Learning Platform v4.2
echo ========================================
echo.

cd /d C:\palantir\math

echo [1/2] Setting up Python environment...
if exist venv311\Scripts\python.exe (
    set PYTHON=venv311\Scripts\python.exe
    echo [OK] Using Python 3.11 from venv311
) else (
    echo [ERROR] venv311 not found!
    pause
    exit /b 1
)

echo.
echo [2/2] Installing packages...
echo.

echo Installing numpy...
%PYTHON% -m pip install numpy --upgrade

echo Installing scikit-learn...
%PYTHON% -m pip install scikit-learn --upgrade

echo Installing scipy...
%PYTHON% -m pip install scipy --upgrade

echo Installing fastapi...
%PYTHON% -m pip install fastapi --upgrade

echo Installing uvicorn...
%PYTHON% -m pip install uvicorn --upgrade

echo Installing websockets...
%PYTHON% -m pip install websockets --upgrade

echo Installing opencv-python (optional)...
%PYTHON% -m pip install opencv-python --upgrade

echo.
echo ========================================
echo   Installation Complete!
echo ========================================
echo.
echo Installed packages:
%PYTHON% -m pip list | findstr "numpy scikit-learn scipy fastapi uvicorn websockets"
echo.
pause
