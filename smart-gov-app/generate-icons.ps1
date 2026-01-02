# Icon Generator Script for SmartGov App
# This script creates proper app icons from logo.png
# Requires ImageMagick to be installed

# Check if ImageMagick is installed
if (-not (Get-Command magick -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: ImageMagick is not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install ImageMagick from: https://imagemagick.org/script/download.php#windows" -ForegroundColor Yellow
    Write-Host "Or use Chocolatey: choco install imagemagick" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "After installation, restart PowerShell and run this script again." -ForegroundColor Cyan
    exit 1
}

Write-Host "SmartGov Icon Generator" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan
Write-Host ""

# Check if logo.png exists
if (-not (Test-Path "assets/logo.png")) {
    Write-Host "ERROR: assets/logo.png not found!" -ForegroundColor Red
    exit 1
}

Write-Host "Found logo.png" -ForegroundColor Green
Write-Host ""

# Create backup
Write-Host "Creating backup of original logo..." -ForegroundColor Yellow
Copy-Item "assets/logo.png" "assets/logo-original-backup.png" -Force
Write-Host "✓ Backup saved as logo-original-backup.png" -ForegroundColor Green
Write-Host ""

# Step 1: Remove white background and create clean transparent version
Write-Host "Step 1: Removing background..." -ForegroundColor Yellow
& magick assets/logo.png -fuzz 20% -transparent white -trim +repage assets/logo-clean.png
Write-Host "✓ Created logo-clean.png" -ForegroundColor Green
Write-Host ""

# Step 2: Create icon.png (1024x1024, logo at 70% size)
Write-Host "Step 2: Creating icon.png (1024x1024)..." -ForegroundColor Yellow
& magick assets/logo-clean.png -resize 716x716 -gravity center -background none -extent 1024x1024 assets/icon.png
Write-Host "✓ Created icon.png" -ForegroundColor Green
Write-Host ""

# Step 3: Create adaptive-foreground.png (1024x1024, logo at 60% size for safe zone)
Write-Host "Step 3: Creating adaptive-foreground.png (1024x1024)..." -ForegroundColor Yellow
& magick assets/logo-clean.png -resize 614x614 -gravity center -background none -extent 1024x1024 assets/adaptive-foreground.png
Write-Host "✓ Created adaptive-foreground.png" -ForegroundColor Green
Write-Host ""

# Cleanup temporary file
Write-Host "Cleaning up temporary files..." -ForegroundColor Yellow
Remove-Item "assets/logo-clean.png" -ErrorAction SilentlyContinue
Write-Host "✓ Cleanup complete" -ForegroundColor Green
Write-Host ""

# Summary
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✨ Icon generation complete!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "Generated files in assets/:" -ForegroundColor White
Write-Host "  ✓ icon.png (1024x1024)" -ForegroundColor Green
Write-Host "  ✓ adaptive-foreground.png (1024x1024)" -ForegroundColor Green
Write-Host "  ✓ logo-original-backup.png (backup)" -ForegroundColor Gray
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Open icon.png and adaptive-foreground.png in an image viewer" -ForegroundColor White
Write-Host "  2. Verify backgrounds are transparent (checkerboard pattern)" -ForegroundColor White
Write-Host "  3. Check that logo is centered and properly sized" -ForegroundColor White
Write-Host "  4. If manual cleanup needed, use Photoshop/GIMP to refine" -ForegroundColor White
Write-Host "  5. Run: npx expo prebuild --clean" -ForegroundColor White
Write-Host "  6. Test on device: npx expo run:android / npx expo run:ios" -ForegroundColor White
Write-Host ""
Write-Host "Need help? Check ICON_SETUP_INSTRUCTIONS.md" -ForegroundColor Cyan
