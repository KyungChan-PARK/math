
# Claude Opus 4.1 Activation Script
# Copies the activation prompt to clipboard

$activation = Get-Content "C:\palantir\math\CLAUDE_OPUS_41_ACTIVATION.md" -Raw
Set-Clipboard -Value $activation
Write-Host "✅ Activation prompt copied to clipboard!" -ForegroundColor Green
Write-Host "📋 Just paste (Ctrl+V) in Claude!" -ForegroundColor Cyan
