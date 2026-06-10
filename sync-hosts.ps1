# MenuGo — Sincronizar hosts de tenants
# Clic derecho -> "Ejecutar con PowerShell" (acepta el UAC)
# Despues de ejecutar esto UNA VEZ, los proximos tenants se registran automaticamente.

$hostsFile = "C:\Windows\System32\drivers\etc\hosts"

# Paso 1: conceder escritura permanente al grupo Users
Write-Host "Configurando permisos sobre el archivo hosts..." -ForegroundColor Yellow
icacls $hostsFile /grant "BUILTIN\Users:(W)" | Out-Null
Write-Host "Listo." -ForegroundColor Green

# Paso 2: agregar dominios faltantes
$current = Get-Content $hostsFile -Raw
$added   = 0

if ($current -notmatch [regex]::Escape('lilaburger.macosystem.cloud')) {
    Add-Content $hostsFile "`n127.0.0.1 lilaburger.macosystem.cloud"
    Write-Host 'Agregado: 127.0.0.1 lilaburger.macosystem.cloud' -ForegroundColor Green
    $added++
} else { Write-Host 'Ya existe: lilaburger.macosystem.cloud' -ForegroundColor DarkGray }

if ($current -notmatch [regex]::Escape('lasdeliciasdekathe.macosystem.cloud')) {
    Add-Content $hostsFile "`n127.0.0.1 lasdeliciasdekathe.macosystem.cloud"
    Write-Host 'Agregado: 127.0.0.1 lasdeliciasdekathe.macosystem.cloud' -ForegroundColor Green
    $added++
} else { Write-Host 'Ya existe: lasdeliciasdekathe.macosystem.cloud' -ForegroundColor DarkGray }

if ($current -notmatch [regex]::Escape('losmaschimbitas.macosystem.cloud')) {
    Add-Content $hostsFile "`n127.0.0.1 losmaschimbitas.macosystem.cloud"
    Write-Host 'Agregado: 127.0.0.1 losmaschimbitas.macosystem.cloud' -ForegroundColor Green
    $added++
} else { Write-Host 'Ya existe: losmaschimbitas.macosystem.cloud' -ForegroundColor DarkGray }

Write-Host ""
if ($added -gt 0) {
    Write-Host "$added dominio(s) agregado(s). Reinicia el navegador." -ForegroundColor Cyan
} else {
    Write-Host "Todos los dominios ya estaban registrados." -ForegroundColor Green
}
Write-Host ""
Read-Host "Presiona Enter para cerrar"