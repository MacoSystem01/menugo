@echo off
:: ============================================================
::  Menugo — Agregar tenants al archivo hosts
::  INSTRUCCION: Clic derecho en este archivo → 
::               "Ejecutar como administrador"
:: ============================================================

:: Verificar que se ejecuta como Administrador
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  [ERROR] Debes ejecutar este script como Administrador.
    echo  Haz clic derecho en el archivo y elige:
    echo  "Ejecutar como administrador"
    echo.
    pause
    exit /b 1
)

echo.
echo  ============================================================
echo   Menugo - Agregando subdominios al archivo hosts
echo  ============================================================
echo.

:: Directorio del proyecto
set PROJECT_DIR=%~dp0

:: Ejecutar el comando artisan para agregar todos los tenants
cd /d "%PROJECT_DIR%"
echo  Buscando tenants registrados en la base de datos...
echo.
php artisan tenant:host --write

echo.
echo  ============================================================
echo   Verificando entradas actuales de Menugo.local:
echo  ============================================================
findstr /i "Menugo" C:\Windows\System32\drivers\etc\hosts

echo.
echo  ============================================================
echo   Listo. Cierra esta ventana y recarga el navegador.
echo   (Ctrl+Shift+R en Chrome/Edge)
echo  ============================================================
echo.
pause
