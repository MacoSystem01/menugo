#!/bin/bash
# ── MenúGO — Script de Actualización en Producción ───────────────────────────
# Uso en el servidor: bash deploy/update.sh
# O ejecutar directamente dentro de /var/www/menugo

set -e

APP_DIR="${1:-/var/www/menugo}"

if [ -d "$APP_DIR" ]; then
    cd "$APP_DIR"
fi

echo "══════════════════════════════════════════════════"
echo "   MenúGO — Actualizando en Producción"
echo "══════════════════════════════════════════════════"

# 1. Descargar últimos cambios de git
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "antigravity/gemini")
echo "→ [1/6] Descargando cambios de git (rama: $CURRENT_BRANCH)..."
git pull origin "$CURRENT_BRANCH"

# 2. Instalar/actualizar dependencias de Composer
echo "→ [2/6] Actualizando dependencias de PHP..."
composer install --no-dev --optimize-autoloader --no-interaction

# 3. Compilar frontend (React / Vite)
echo "→ [3/6] Compilando frontend..."
npm install
npm run build

# 4. Ejecutar migraciones en base central y tenants
echo "→ [4/6] Ejecutando migraciones de base de datos..."
php artisan migrate --force
php artisan tenants:migrate --force

# 5. Limpiar y reconstruir cachés de producción
echo "→ [5/6] Optimizando cachés de Laravel..."
php artisan optimize:clear
php artisan optimize

# 6. Permisos y reinicio de servicios
echo "→ [6/6] Ajustando permisos y reiniciando workers..."
chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || true
chmod -R 775 storage bootstrap/cache 2>/dev/null || true

php artisan queue:restart || true
if command -v systemctl >/dev/null 2>&1; then
    if systemctl is-active --quiet menugo-worker 2>/dev/null; then
        systemctl restart menugo-worker || true
    fi
    if systemctl is-active --quiet php8.2-fpm 2>/dev/null; then
        systemctl reload php8.2-fpm || true
    fi
fi

echo "══════════════════════════════════════════════════"
echo "   ✅ ¡Actualización completada exitosamente!"
echo "══════════════════════════════════════════════════"
