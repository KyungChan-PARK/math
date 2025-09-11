# Mathpix Integration Setup Script for Windows
# PowerShell script to install dependencies and configure the system

Write-Host " Setting up Mathpix Integration for Math Learning Platform" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green

# Check if .env exists
if (!(Test-Path .env)) {
    Write-Host " Creating .env from template..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "️  Please add your Mathpix API credentials to .env file:" -ForegroundColor Yellow
    Write-Host "   MATHPIX_APP_ID=your_app_id" -ForegroundColor Cyan
    Write-Host "   MATHPIX_APP_KEY=your_app_key" -ForegroundColor Cyan
}

# Install Node.js dependencies
Write-Host "`n Installing Node.js dependencies..." -ForegroundColor Yellow
npm install axios form-data

# Create test directory
Write-Host "`n Creating test directory..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "test\sat_samples" | Out-Null

# Create sample usage script
Write-Host "`n Creating sample usage script..." -ForegroundColor Yellow

$usageScript = @'
// Quick Test Script for Mathpix Integration
const MathpixIntegrationService = require('./mathpix-integration.js').default;

async function quickTest() {
    const service = new MathpixIntegrationService();
    
    console.log(' Testing Mathpix Integration...');
    
    try {
        await service.initialize();
        console.log('✅ Service initialized successfully!');
        
        // Add your Mathpix API credentials to .env first!
        console.log('\n Ready to process SAT exams');
        console.log('Usage: node mathpix-integration.js process <file>');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('\n️  Make sure to add your Mathpix credentials to .env file');
    }
}

quickTest();
'@

$usageScript | Out-File -FilePath "test-mathpix-setup.js" -Encoding UTF8

Write-Host "`n✅ Mathpix Integration Setup Complete!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
Write-Host " Next Steps:" -ForegroundColor Yellow
Write-Host "1. Add your Mathpix API credentials to .env:" -ForegroundColor White
Write-Host "   MATHPIX_APP_ID=your_app_id" -ForegroundColor Cyan
Write-Host "   MATHPIX_APP_KEY=your_app_key" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Test the setup:" -ForegroundColor White
Write-Host "   node test-mathpix-setup.js" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Process a SAT exam:" -ForegroundColor White
Write-Host "   node mathpix-integration.js process exam.pdf" -ForegroundColor Cyan
Write-Host ""
Write-Host " Full Documentation: MATHPIX_INTEGRATION_REPORT.md" -ForegroundColor Green
Write-Host ""

# Open documentation in default browser
$openDocs = Read-Host "Would you like to open the documentation? (Y/N)"
if ($openDocs -eq 'Y' -or $openDocs -eq 'y') {
    Start-Process "notepad.exe" "MATHPIX_INTEGRATION_REPORT.md"
}