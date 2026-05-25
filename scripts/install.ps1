# scripts/install.ps1 — instala todas las dependencias

$root = (Resolve-Path "$PSScriptRoot\..").Path

Write-Host "📦 Instalando dependencias..." -ForegroundColor Cyan

Write-Host "  → Backend (uv sync)..." -ForegroundColor Yellow
Push-Location "$root\backend"
uv sync
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Backend falló" -ForegroundColor Red }
Pop-Location

Write-Host "  → Worker (uv sync)..." -ForegroundColor Yellow
Push-Location "$root\worker"
uv sync
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Worker falló" -ForegroundColor Red }
Pop-Location

Write-Host "  → Frontend (npm install)..." -ForegroundColor Yellow
Push-Location "$root\frontend"
npm install
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Frontend falló" -ForegroundColor Red }
Pop-Location

Write-Host ""
Write-Host "✅ Instalación completa. Configura .env y luego corre scripts\dev.ps1" -ForegroundColor Green
