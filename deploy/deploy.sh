#!/bin/bash
# ── MenúGO — Script de Deploy Inicial ────────────────────────────────────────
# Ejecutar en el servidor como root (Ubuntu 22.04 LTS)
#
# Uso: bash deploy/deploy.sh
#
# ANTES de ejecutar:
#   1. Apuntar DNS: A @ [IP] y A * [IP]
#   2. Tener el repo en GitHub/GitLab
#   3. Tener el dominio listo (menugo.com.co)

set -e

DOMAIN="menugo.com.co"           # ← reemplazar con dominio real
REPO_URL="https://github.com/TU_USUARIO/menugo.git"  # ← URL del repo
APP_DIR="/var/www/menugo"
PHP_VERSION="8.2"

echo "══════════════════════════════════════════════════"
echo "   MenúGO — Deploy en Producción"
echo "   Dominio: $DOMAIN"
echo "══════════════════════════════════════════════════"

# ── PASO 1: Sistema ───────────────────────────────────────────────────────────
echo ""
echo "[1/8] Actualizando sistema..."
apt update && apt upgrade -y
apt install -y curl wget git unzip software-properties-common

# ── PASO 2: PHP 8.2 ──────────────────────────────────────────────────────────
echo ""
echo "[2/8] Instalando PHP ${PHP_VERSION}..."
add-apt-repository ppa:ondrej/php -y
apt update
apt install -y \
    php${PHP_VERSION} php${PHP_VERSION}-fpm php${PHP_VERSION}-mysql \
    php${PHP_VERSION}-xml php${PHP_VERSION}-mbstring php${PHP_VERSION}-curl \
    php${PHP_VERSION}-zip php${PHP_VERSION}-gd php${PHP_VERSION}-bcmath \
    php${PHP_VERSION}-intl php${PHP_VERSION}-tokenizer php${PHP_VERSION}-fileinfo
php -v

# ── PASO 3: MySQL 8 ──────────────────────────────────────────────────────────
echo ""
echo "[3/8] Instalando MySQL..."
apt install -y mysql-server
echo "  → Configura MySQL: ejecuta mysql_secure_installation"
echo "  → Crea BD y usuario con: deploy/setup-mysql.sql"

# ── PASO 4: Nginx ─────────────────────────────────────────────────────────────
echo ""
echo "[4/8] Instalando Nginx..."
apt install -y nginx
systemctl enable nginx && systemctl start nginx

# ── PASO 5: Composer y Node ───────────────────────────────────────────────────
echo ""
echo "[5/8] Instalando Composer y Node.js 20..."
curl -sS https://getcomposer.org/installer | php
mv composer.phar /usr/local/bin/composer

curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# ── PASO 6: Proyecto ─────────────────────────────────────────────────────────
echo ""
echo "[6/8] Clonando proyecto..."
cd /var/www
git clone "$REPO_URL" menugo
cd "$APP_DIR"

composer install --no-dev --optimize-autoloader
npm ci && npm run build

# Permisos
chown -R www-data:www-data "$APP_DIR"
chmod -R 755 "$APP_DIR"
chmod -R 775 "$APP_DIR/storage"
chmod -R 775 "$APP_DIR/bootstrap/cache"

# ── PASO 7: Laravel ───────────────────────────────────────────────────────────
echo ""
echo "[7/8] Configurando Laravel..."
cp .env.example .env
echo "  → Edita el .env: nano .env"
echo "  → Luego ejecuta:"
echo "      php artisan key:generate"
echo "      php artisan migrate --force"
echo "      php artisan storage:link"
echo "      php artisan optimize"

# ── PASO 8: Nginx + SSL ───────────────────────────────────────────────────────
echo ""
echo "[8/8] Configurando Nginx y SSL..."
cp "$APP_DIR/deploy/nginx.conf" /etc/nginx/sites-available/menugo
sed -i "s/menugo.com.co/$DOMAIN/g" /etc/nginx/sites-available/menugo
ln -sf /etc/nginx/sites-available/menugo /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

apt install -y certbot python3-certbot-nginx
echo ""
echo "  → Ejecuta para obtener SSL wildcard:"
echo "      certbot certonly --manual --preferred-challenges dns \\"
echo "          -d $DOMAIN -d '*.$DOMAIN'"

# ── Cron + Worker ─────────────────────────────────────────────────────────────
echo ""
echo "── Cron del scheduler:"
echo "   crontab -u www-data -e"
echo "   Agregar: * * * * * cd $APP_DIR && php artisan schedule:run >> /dev/null 2>&1"

echo ""
echo "── Queue worker:"
cp "$APP_DIR/deploy/menugo-worker.service" /etc/systemd/system/
systemctl daemon-reload
systemctl enable menugo-worker
echo "   systemctl start menugo-worker"

# ── Backup ────────────────────────────────────────────────────────────────────
cp "$APP_DIR/deploy/backup.sh" /usr/local/bin/menugo-backup.sh
chmod +x /usr/local/bin/menugo-backup.sh
echo ""
echo "── Backup diario (2:00 AM):"
echo "   (echo '0 2 * * * /usr/local/bin/menugo-backup.sh >> /var/log/menugo-backup.log 2>&1') | crontab -"

echo ""
echo "══════════════════════════════════════════════════"
echo "   Deploy base completado."
echo "   Revisa la SECCIÓN 6 del CLAUDE.md para"
echo "   terminar de configurar .env y migrar la BD."
echo "══════════════════════════════════════════════════"
