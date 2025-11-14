# Backend Connection Test Script
Write-Host "`n🔍 Testing Backend Connection...`n" -ForegroundColor Cyan

# Check if .env file exists
if (-not (Test-Path "backend\.env")) {
    Write-Host "❌ Error: backend\.env file not found!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ .env file found" -ForegroundColor Green

# Check if node_modules exists
if (-not (Test-Path "backend\node_modules")) {
    Write-Host "⚠️  Installing backend dependencies..." -ForegroundColor Yellow
    cd backend
    npm install
    cd ..
}

Write-Host "`n🚀 Starting backend server for testing...`n" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop after testing`n" -ForegroundColor Yellow

cd backend
npm run dev

