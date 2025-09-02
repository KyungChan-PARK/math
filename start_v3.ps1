# AE Claude Max v3.0 - PowerShell Launcher
# Updated: 2025-09-02

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   AE Claude Max v3.0 - Enhanced Drop Zones   " -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Change to project directory
Set-Location "C:\Users\packr\AppData\Local\AnthropicClaude\app-0.12.129\AE_Claude_Max_Project"

Write-Host "[1/3] Activating virtual environment..." -ForegroundColor Yellow
$venvPython = ".\venv\Scripts\python.exe"

if (Test-Path $venvPython) {
    Write-Host "[OK] Virtual environment found." -ForegroundColor Green
    $pythonCmd = $venvPython
} else {
    Write-Host "[!] Virtual environment not found. Using system Python..." -ForegroundColor Red
    $pythonCmd = "py"
}

Write-Host ""
Write-Host "[2/3] Checking environment..." -ForegroundColor Yellow
& $pythonCmd run_verify.py
if ($LASTEXITCODE -ne 0) {
    Write-Host "[!] Environment verification failed." -ForegroundColor Red
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

Write-Host ""
Write-Host "[3/3] Starting main system..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Drop Zones are ready at:" -ForegroundColor Green
Write-Host "  - drops\ae_vibe        : Natural language to ExtendScript"
Write-Host "  - drops\video_motion   : Video analysis to AE templates"
Write-Host "  - drops\batch_ops      : Batch operations from CSV/JSON"
Write-Host "  - drops\template_learning : Learn from AEP files"
Write-Host ""
Write-Host "Starting file watcher..." -ForegroundColor Yellow
Write-Host ""

# Run the main system
& $pythonCmd sfs_enhanced_ae_dropzones_v3.py

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
