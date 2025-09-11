@echo off
cls
echo ========================================================
echo     LOLA v2.0 - Enhanced Mathematical Intent Learning
echo     VAE + Diffusion Model (Based on Official LOLA)
echo ========================================================
echo.

cd /d C:\palantir\math

echo [SETUP] Checking Python environment...
if exist "venv311\Scripts\python.exe" (
    set PYTHON_EXE=venv311\Scripts\python.exe
    echo [OK] Using Python 3.11 from venv311
) else (
    echo [ERROR] Python environment not found!
    pause
    exit /b 1
)

echo.
echo [SETUP] Installing PyTorch and dependencies...
echo This may take a few minutes on first run...
echo.

REM Install PyTorch CPU version (faster for testing)
%PYTHON_EXE% -m pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu --quiet 2>nul

REM Install other dependencies
%PYTHON_EXE% -m pip install scipy scikit-learn numpy --quiet 2>nul

echo.
echo ========================================================
echo     Configuration
echo ========================================================
echo.
echo   Compression Factor: 256x (can go up to 1000x)
echo   Latent Dimension: 64
echo   Model: VAE + Diffusion
echo   Physics Preservation: Enabled
echo   Based on: PolymathicAI/lola
echo.

echo ========================================================
echo     Starting LOLA v2.0 Server
echo ========================================================
echo.

REM Check if v1 server is running and stop it
taskkill /F /FI "WINDOWTITLE eq LOLA*" 2>nul
timeout /t 2 >nul

REM Start enhanced LOLA v2 server
echo [1/2] Starting LOLA v2.0 Server (port 8093)...
start "LOLA v2.0 Enhanced" cmd /c "%PYTHON_EXE% src\lola-integration\lola_v2_enhanced.py"

timeout /t 5 >nul

REM Check if server is running
netstat -an | findstr :8093 >nul
if %errorlevel% equ 0 (
    echo [OK] LOLA v2.0 Server running on port 8093
) else (
    echo [WARNING] Server may not have started properly
    echo Check if PyTorch is installed correctly
)

echo.
echo [2/2] Opening LOLA v2.0 Interface...
echo.

REM Open the enhanced interface
start "" "C:\palantir\math\lola-v2-interface.html"

echo.
echo ========================================================
echo     System Ready!
echo ========================================================
echo.
echo [NEW FEATURES in v2.0]:
echo   - VAE-based encoding (like official LOLA)
echo   - Diffusion model for better suggestions
echo   - Physics-preserving loss functions
echo   - Up to 1000x compression capability
echo   - Gradient matching for smoothness
echo   - Based on PolymathicAI research
echo.
echo [IMPROVEMENTS]:
echo   - Better compression (256x default, 1000x possible)
echo   - More accurate intent understanding
echo   - Smoother generated curves
echo   - Physics properties preserved
echo.
echo Press Ctrl+C to stop the server
echo.

pause
