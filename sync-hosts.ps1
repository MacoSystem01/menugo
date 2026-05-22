# MenuGo — Sincronizar hosts de tenants
# ─────────────────────────────────────────────────────────────────────────────
# EJECUCIÓN ÚNICA como Administrador:
#   Clic derecho → "Ejecutar con PowerShell"  (acepta el UAC)
#
# Después de ejecutar esto UNA VEZ, cada nuevo tenant se registra
# automáticamente en el archivo hosts sin necesidad de permisos adicionales.
# ─────────────────────────────────────────────────────────────────────────────

$hostsFile = "C:\Windows\System32\drivers\etc\hosts"

# ── PASO 1: conceder escritura permanente a todos los usuarios de Windows ──
Write-Host ""
Write-Host "Configurando permisos sobre el archivo hosts..." -ForegroundColor Yellow
icacls $hostsFile /grant "BUILTIN\Users:(W)" | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Permiso de escritura concedido. Los proximos tenants se registraran automaticamente." -ForegroundColor Green
} else {
    Write-Host "No se pudo configurar el permiso (puede que ya este establecido)." -ForegroundColor DarkGray
}

# ── PASO 2: agregar dominios de tenants que falten ────────────────────────
Write-Host ""
Write-Host "Sincronizando dominios de tenants..." -ForegroundColor Yellow
$current = Get-Content $hostsFile -Raw
$added   = 0

if ($current -notmatch [regex]::Escape('prueba.menugo.local')) {
    Add-Content $hostsFile "`n127.0.0.1 prueba.menugo.local"
    Write-Host 'Agregado: 127.0.0.1 prueba.menugo.local' -ForegroundColor Green
    $added++
} else { Write-Host 'Ya existe: prueba.menugo.local' -ForegroundColor DarkGray }

if ($current -notmatch [regex]::Escape('losmaschimbitas.menugo.local')) {
    Add-Content $hostsFile "`n127.0.0.1 losmaschimbitas.menugo.local"
    Write-Host 'Agregado: 127.0.0.1 losmaschimbitas.menugo.local' -ForegroundColor Green
    $added++
} else { Write-Host 'Ya existe: losmaschimbitas.menugo.local' -ForegroundColor DarkGray }

if ($current -notmatch [regex]::Escape('prueba1.menugo.local')) {
    Add-Content $hostsFile "`n127.0.0.1 prueba1.menugo.local"
    Write-Host 'Agregado: 127.0.0.1 prueba1.menugo.local' -ForegroundColor Green
    $added++
} else { Write-Host 'Ya existe: prueba1.menugo.local' -ForegroundColor DarkGray }

if ($current -notmatch [regex]::Escape('latajada.menugo.local')) {
    Add-Content $hostsFile "`n127.0.0.1 latajada.menugo.local"
    Write-Host 'Agregado: 127.0.0.1 latajada.menugo.local' -ForegroundColor Green
    $added++
} else { Write-Host 'Ya existe: latajada.menugo.local' -ForegroundColor DarkGray }

# ── Resultado ─────────────────────────────────────────────────────────────
Write-Host ""
if ($added -gt 0) {
    Write-Host "$added dominio(s) agregado(s). Reinicia el navegador para aplicar los cambios." -ForegroundColor Cyan
} else {
    Write-Host "Todos los dominios ya estaban registrados." -ForegroundColor Green
}
Write-Host ""
Read-Host "Presiona Enter para cerrar"
