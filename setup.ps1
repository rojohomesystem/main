# ============================================================
#  Instalador rápido para Windows (PowerShell)
#  Uso:  clic derecho -> "Ejecutar con PowerShell"
#        o en una terminal:  .\setup.ps1
# ============================================================

Write-Host "== Rojo Home Improvement — instalacion ==" -ForegroundColor Yellow

# --- Frontend ---
Write-Host "`n[1/2] Instalando frontend..." -ForegroundColor Cyan
Set-Location "$PSScriptRoot\frontend"
npm install
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "  -> Se creo frontend\.env  (edita tus datos de Supabase)" -ForegroundColor Green
}

# --- Backend ---
Write-Host "`n[2/2] Instalando backend (Python)..." -ForegroundColor Cyan
Set-Location "$PSScriptRoot\backend"
if (-not (Test-Path "venv")) { python -m venv venv }
& ".\venv\Scripts\Activate.ps1"
pip install -r requirements.txt
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "  -> Se creo backend\.env  (pega tu ANTHROPIC_API_KEY si tienes)" -ForegroundColor Green
}

Set-Location $PSScriptRoot
Write-Host "`n== Listo ==" -ForegroundColor Yellow
Write-Host "Para arrancar, abre DOS terminales:" -ForegroundColor White
Write-Host "  1) cd frontend  ;  npm run dev            -> http://localhost:3003"
Write-Host "  2) cd backend   ;  venv\Scripts\activate  ;  uvicorn main:app --reload --port 8000"
