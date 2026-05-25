# scripts/dev.ps1 — arranca el stack de dev en ventanas separadas
# Uso: powershell -ExecutionPolicy Bypass -File scripts\dev.ps1

$root = (Resolve-Path "$PSScriptRoot\..").Path

Write-Host "🚀 Arrancando AppSalon v2 stack..." -ForegroundColor Cyan

# 1) Redis vía Docker
Write-Host "📦 Iniciando Redis..." -ForegroundColor Yellow
Push-Location "$root\infra"
docker compose up -d redis flower
Pop-Location

# 2) Backend en nueva ventana
Write-Host "🐍 Backend FastAPI (puerto 8000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "cd '$root\backend'; uv sync; uv run uvicorn app.main:app --reload --port 8000"

# 3) Worker en nueva ventana
Write-Host "⚙️  Celery worker..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "cd '$root\worker'; uv sync; uv run celery -A celery_app worker -l info --pool=solo"

# 4) Frontend en nueva ventana
Write-Host "🅰️  Angular dev server (puerto 4200)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "cd '$root\frontend'; if (-not (Test-Path node_modules)) { npm install }; npm start"

Write-Host ""
Write-Host "✅ Stack iniciado. URLs:" -ForegroundColor Green
Write-Host "   Frontend: http://localhost:4200"
Write-Host "   Backend:  http://localhost:8000/docs"
Write-Host "   Flower:   http://localhost:5555"
Write-Host ""
Write-Host "Para detener Redis: cd infra; docker compose down"
