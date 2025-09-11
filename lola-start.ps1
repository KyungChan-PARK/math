# LOLA Math Platform Launcher - PowerShell Version
Clear-Host
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   LOLA Math Platform Launcher" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Set-Location C:\palantir\math

# Start LOLA Server
Write-Host "Starting LOLA Physics Server..." -ForegroundColor Green
Start-Process -FilePath "venv311\Scripts\python.exe" -ArgumentList "src\lola-integration\lola-server.py" -WindowStyle Minimized

Start-Sleep -Seconds 2

# Start Gesture Controller
Write-Host "Starting Gesture Controller..." -ForegroundColor Green
Start-Process -FilePath "venv311\Scripts\python.exe" -ArgumentList "src\lola-integration\gesture_physics_controller.py" -WindowStyle Minimized

Start-Sleep -Seconds 2

# Check services
$lola = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue
if ($lola) {
    Write-Host "[OK] LOLA Server is running" -ForegroundColor Green
} else {
    Write-Host "[WARNING] LOLA Server may not be running" -ForegroundColor Yellow
}

$gesture = Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue
if ($gesture) {
    Write-Host "[OK] Gesture Controller is running" -ForegroundColor Green
} else {
    Write-Host "[INFO] Gesture Controller in touch-only mode" -ForegroundColor Cyan
}

# Open browser
Write-Host "Opening browser..." -ForegroundColor Green
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "Starting React app..." -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Gray
Write-Host ""

# Start React app
npm start