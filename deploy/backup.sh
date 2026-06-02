#!/bin/bash
# ── MenúGO — Script de Backup Automático ──────────────────────────────────────
# Archivo: /usr/local/bin/menugo-backup.sh
#
# Instalación:
#   cp deploy/backup.sh /usr/local/bin/menugo-backup.sh
#   chmod +x /usr/local/bin/menugo-backup.sh
#
# Programar backup diario a las 2:00 AM:
#   echo "0 2 * * * /usr/local/bin/menugo-backup.sh >> /var/log/menugo-backup.log 2>&1" | crontab -

set -e

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/menugo"
DB_USER="menugo_user"
DB_PASS="TU_PASSWORD_SEGURO_AQUI"   # ← reemplazar con contraseña real
RETENTION_DAYS=7

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Iniciando backup MenúGO..."

# ── Backup BD central ─────────────────────────────────────────────────────────
echo "  → Backup BD central..."
mysqldump -u "$DB_USER" -p"$DB_PASS" menugo \
    | gzip > "$BACKUP_DIR/central_${DATE}.sql.gz"

# ── Backup BDs de tenants ─────────────────────────────────────────────────────
echo "  → Backup BDs de tenants..."
TENANT_DBS=$(mysql -u "$DB_USER" -p"$DB_PASS" -N -e \
    "SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME LIKE 'menugo_%'")

if [ -n "$TENANT_DBS" ]; then
    mysqldump -u "$DB_USER" -p"$DB_PASS" \
        --databases $TENANT_DBS \
        | gzip > "$BACKUP_DIR/tenants_${DATE}.sql.gz"
fi

# ── Backup storage (logos, banners, imágenes de platos) ───────────────────────
echo "  → Backup storage..."
tar -czf "$BACKUP_DIR/storage_${DATE}.tar.gz" \
    /var/www/menugo/storage/app/public 2>/dev/null || true

# ── Limpiar backups antiguos ──────────────────────────────────────────────────
echo "  → Limpiando backups > ${RETENTION_DAYS} días..."
find "$BACKUP_DIR" -name "*.sql.gz"  -mtime +"$RETENTION_DAYS" -delete
find "$BACKUP_DIR" -name "*.tar.gz"  -mtime +"$RETENTION_DAYS" -delete

echo "[$(date)] Backup completado. Archivos en: $BACKUP_DIR"
ls -lh "$BACKUP_DIR" | tail -5
