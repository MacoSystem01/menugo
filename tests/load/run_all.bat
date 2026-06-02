@echo off
echo ============================================
echo    MENUGO — Suite Completa de Pruebas
echo ============================================
echo.

echo [1/5] Consultando datos reales de BD...
php tests/load/consultar_bd.php
echo.

echo [2/5] Verificando entorno...
php tests/load/verificar_entorno.php
echo.

echo [3/5] Pruebas de produccion...
php tests/load/production_test.php
echo.

echo [4/5] Pruebas de seguridad...
php tests/load/security_test.php
echo.

echo [5/5] Suite maestra completa (10 suites)...
php tests/load/master_test.php
echo.

echo ============================================
echo    PRUEBAS COMPLETADAS
echo ============================================
echo Revisa los resultados arriba.
echo Si hay fallos criticos, NO pasar a produccion.
pause
