-- ── MenúGO — Setup de base de datos en producción ────────────────────────────
-- Ejecutar como root en MySQL:
--   mysql -u root -p < deploy/setup-mysql.sql
--
-- IMPORTANTE: cambiar TU_PASSWORD_SEGURO_AQUI por una contraseña real

CREATE DATABASE IF NOT EXISTS menugo
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'menugo_user'@'localhost'
    IDENTIFIED BY 'TU_PASSWORD_SEGURO_AQUI';

-- Permisos en la BD central
GRANT ALL PRIVILEGES ON menugo.* TO 'menugo_user'@'localhost';

-- Permiso para crear BDs de tenants (menugo_UUID)
GRANT CREATE ON *.* TO 'menugo_user'@'localhost';

-- Permiso para que el usuario pueda operar en BDs de tenants
GRANT ALL PRIVILEGES ON `menugo\_%`.* TO 'menugo_user'@'localhost';

FLUSH PRIVILEGES;

SELECT 'Setup completado. Usuario: menugo_user | BD: menugo' AS resultado;
