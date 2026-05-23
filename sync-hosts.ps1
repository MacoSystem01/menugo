# MenuGo -- Sincronizar y normalizar hosts de tenants
# Clic derecho -> "Ejecutar con PowerShell" (acepta el UAC)
# Este script normaliza todos los dominios a lowercase y agrega los faltantes.

$hostsFile = "C:\Windows\System32\drivers\etc\hosts"

# Paso 1: conceder escritura permanente al grupo de usuarios actuales
Write-Host "Configurando permisos sobre el archivo hosts..." -ForegroundColor Yellow
icacls $hostsFile /grant "Usuarios:(W)" 2>$null | Out-Null
icacls $hostsFile /grant "Users:(W)" 2>$null | Out-Null
Write-Host "Listo." -ForegroundColor Green

# Paso 2: leer contenido actual y filtrar entradas con mayusculas incorrectas
$lines = Get-Content $hostsFile -Encoding ASCII
$newLines = [System.Collections.Generic.List[string]]::new()

foreach ($line in $lines) {
    # Normalizar entradas .Menugo.local (capital M) -> se omiten y se reemplazan
    if ($line -match '\.menugo\.local' -and $line -cmatch '\.Menugo\.local') {
        Write-Host "Eliminando entrada con case incorrecto: $line" -ForegroundColor Yellow
        continue
    }
    $newLines.Add($line)
}

# Paso 3: agregar dominios requeridos si faltan
$requiredDomains = @(
    "menugo.local",
    "prueba.menugo.local",
    "prueba1.menugo.local",
    "losmaschimbitas.menugo.local",
    "latajada.menugo.local"
)

$currentText = $newLines -join "`n"
$added = 0

foreach ($domain in $requiredDomains) {
    $escaped = [regex]::Escape($domain)
    if ($currentText -notmatch "(?i)$escaped") {
        $newLines.Add("127.0.0.1 $domain")
        Write-Host "Agregado: 127.0.0.1 $domain" -ForegroundColor Green
        $added++
    } else {
        Write-Host "Ya existe: $domain" -ForegroundColor DarkGray
    }
}

# Paso 4: escribir el archivo actualizado
[System.IO.File]::WriteAllLines($hostsFile, $newLines, [System.Text.Encoding]::ASCII)

Write-Host ""
if ($added -gt 0) {
    Write-Host "$added dominio(s) agregado(s). Reinicia el navegador." -ForegroundColor Cyan
} else {
    Write-Host "Todos los dominios ya estaban correctos." -ForegroundColor Green
}
Write-Host ""
Write-Host "=== Entradas MenuGo en hosts ===" -ForegroundColor Cyan
Get-Content $hostsFile | Where-Object { $_ -match 'menugo' }
Write-Host ""
