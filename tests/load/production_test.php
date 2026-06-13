<?php
/**
 * MenuGo — Pruebas de Infraestructura de Producción
 * Ruta: tests/load/production_test.php
 * Uso: php tests/load/production_test.php
 *
 * Verifica que el sistema está listo para pasar a producción:
 * 1. Variables de entorno críticas configuradas
 * 2. APP_DEBUG desactivado
 * 3. APP_ENV = production
 * 4. Claves y secrets seguros
 * 5. Drivers de producción (cache, session, queue)
 * 6. Base de datos configurada correctamente
 * 7. SSL/HTTPS funcionando
 * 8. Headers de seguridad HTTP
 * 9. Archivos sensibles no expuestos públicamente
 * 10. Logs configurados correctamente
 * 11. Optimizaciones de Laravel aplicadas
 */

// ════════════════════════════════════════════════════════
// Credenciales cargadas desde tests/load/.env.test (cifradas con APP_KEY)
// ════════════════════════════════════════════════════════
require_once __DIR__ . '/env_loader.php';
define('ENV_FILE', 'C:/xampp/htdocs/menugo/.env');
$passed = $failed = $warnings = 0;
$resultados = [];
$baseUrl    = 'https://' . TENANT_SLUG . '.' . BASE_HOST;
$centralUrl = 'https://' . BASE_HOST;

function test(string $nombre, bool $paso, string $detalle = '', bool $warn = false): void
{
    global $passed, $failed, $warnings, $resultados;
    if ($paso)     { $passed++;   $icono = '✓'; $estado = 'PASS'; }
    elseif ($warn) { $warnings++; $icono = '⚠'; $estado = 'WARN'; }
    else           { $failed++;   $icono = '✗'; $estado = 'FAIL'; }
    echo "  [{$icono}] {$nombre}\n";
    if ($detalle) echo "        → {$detalle}\n";
    $resultados[] = compact('estado', 'nombre', 'detalle');
}

function fetchUrl(string $url, bool $followRedirects = true): array
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HEADER         => true,
        CURLOPT_FOLLOWLOCATION => $followRedirects,
        CURLOPT_TIMEOUT        => 10,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false,
        CURLOPT_USERAGENT      => 'Mozilla/5.0 (MenuGoProductionTest)',
        CURLOPT_HTTPHEADER     => ['Accept: text/html'],
    ]);
    $response  = curl_exec($ch);
    $code      = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $location  = curl_getinfo($ch, CURLINFO_REDIRECT_URL);
    curl_close($ch);
    $headers = substr($response, 0, $headerSize);
    $body    = substr($response, $headerSize);
    return [
        'code'     => $code,
        'headers'  => strtolower($headers),
        'body'     => $body,
        'location' => $location ?? '',
    ];
}

// Leer .env actual
$envContent = '';
$envVars    = [];
if (file_exists(ENV_FILE)) {
    $envContent = file_get_contents(ENV_FILE);
    foreach (explode("\n", $envContent) as $line) {
        $line = trim($line);
        if (empty($line) || str_starts_with($line, '#')) continue;
        if (str_contains($line, '=')) {
            [$key, $val] = explode('=', $line, 2);
            $envVars[trim($key)] = trim($val, '"\'');
        }
    }
} else {
    echo "[WARN] No se encontró .env en " . ENV_FILE . "\n";
    echo "       Ajusta ENV_FILE en la configuración del script\n\n";
}

$env = fn(string $key, string $default = '') => $envVars[$key] ?? $default;

echo "╔══════════════════════════════════════════════════════╗\n";
echo "║     MenuGo — Pruebas de Infraestructura Producción   ║\n";
echo "╚══════════════════════════════════════════════════════╝\n\n";
echo "Entorno actual: " . $env('APP_ENV', 'no definido') . "\n";
echo "Debug:          " . $env('APP_DEBUG', 'no definido') . "\n\n";

// ══════════════════════════════════════════════════════════
// BLOQUE 1 — VARIABLES DE ENTORNO CRÍTICAS
// ══════════════════════════════════════════════════════════
echo "── 1. Variables de entorno críticas ─────────────────\n";

// APP_ENV
$appEnv = $env('APP_ENV');
test(
    'APP_ENV configurado',
    !empty($appEnv),
    $appEnv ?: 'NO DEFINIDO — debe ser production en producción'
);
test(
    'APP_ENV = production (recomendado para producción)',
    $appEnv === 'production',
    $appEnv === 'production' ? 'OK' : "Actual: '{$appEnv}' — cambiar a 'production' en servidor",
    $appEnv !== 'production'
);

// APP_DEBUG
$appDebug = strtolower($env('APP_DEBUG', 'true'));
test(
    'APP_DEBUG = false (crítico en producción)',
    in_array($appDebug, ['false', '0', '']),
    $appDebug === 'false' || $appDebug === '0'
        ? 'OK — debug desactivado'
        : "PELIGRO: APP_DEBUG={$appDebug} — expone stack traces y datos sensibles",
    false // siempre fallo si está en true, nunca warning
);

// APP_KEY
$appKey = $env('APP_KEY');
test(
    'APP_KEY configurada',
    !empty($appKey) && str_starts_with($appKey, 'base64:'),
    !empty($appKey) ? 'Key presente' : 'NO DEFINIDA — ejecutar: php artisan key:generate'
);
test(
    'APP_KEY tiene longitud correcta (base64, 44 chars)',
    strlen(str_replace('base64:', '', $appKey)) >= 44,
    'Longitud: ' . strlen(str_replace('base64:', '', $appKey)) . ' chars'
);

// APP_URL
$appUrl = $env('APP_URL');
test(
    'APP_URL configurada',
    !empty($appUrl),
    $appUrl ?: 'NO DEFINIDA'
);
test(
    'APP_URL usa HTTPS en producción',
    str_starts_with($appUrl, 'https://'),
    str_starts_with($appUrl, 'https://')
        ? $appUrl
        : "Actual: {$appUrl} — debe usar https:// en producción",
    !str_starts_with($appUrl, 'https://')
);

// ADMIN_LOGIN_PATH
$adminPath = $env('ADMIN_LOGIN_PATH');
test(
    'ADMIN_LOGIN_PATH configurado (URL secreta del panel)',
    !empty($adminPath) && $adminPath !== 'admin' && $adminPath !== 'login',
    !empty($adminPath)
        ? "Ruta: /{$adminPath}"
        : 'NO DEFINIDO — usar una ruta no obvia como sistema/acceso-control'
);

// ══════════════════════════════════════════════════════════
// BLOQUE 2 — DRIVERS DE PRODUCCIÓN
// ══════════════════════════════════════════════════════════
echo "\n── 2. Drivers de producción ─────────────────────────\n";

// Cache
$cacheStore = $env('CACHE_STORE', 'file');
$cacheOk    = in_array($cacheStore, ['redis', 'database', 'file']);
test(
    'CACHE_STORE configurado para producción',
    $cacheOk,
    "Actual: {$cacheStore}" . ($cacheStore === 'array'
        ? ' — PELIGRO: array no persiste entre requests (throttle no funciona)'
        : ($cacheStore === 'redis' ? ' ✓ óptimo' : ' ✓ aceptable')),
    $cacheStore === 'array'
);

// Session
$sessionDriver = $env('SESSION_DRIVER', 'database');
$sessionOk     = in_array($sessionDriver, ['redis', 'database', 'file']);
test(
    'SESSION_DRIVER configurado para producción',
    $sessionOk,
    "Actual: {$sessionDriver}" . ($sessionDriver === 'array'
        ? ' — PELIGRO: sessions no persistirán'
        : ($sessionDriver === 'redis' ? ' ✓ óptimo' : ' ✓ aceptable')),
    $sessionDriver === 'array'
);

// Queue
$queueConn = $env('QUEUE_CONNECTION', 'database');
$queueOk   = in_array($queueConn, ['redis', 'database', 'sqs']);
test(
    'QUEUE_CONNECTION configurado',
    $queueOk,
    "Actual: {$queueConn}" . ($queueConn === 'sync'
        ? ' — en producción usar database o redis'
        : ' ✓ OK'),
    $queueConn === 'sync'
);

// Log
$logChannel = $env('LOG_CHANNEL', 'stack');
test(
    'LOG_CHANNEL configurado',
    !empty($logChannel),
    "Actual: {$logChannel}" . ($logChannel === 'daily' ? ' ✓ óptimo para producción' : '')
);

// ══════════════════════════════════════════════════════════
// BLOQUE 3 — BASE DE DATOS
// ══════════════════════════════════════════════════════════
echo "\n── 3. Base de datos ─────────────────────────────────\n";

$dbHost = $env('DB_HOST', '127.0.0.1');
$dbUser = $env('DB_USERNAME', 'root');
$dbPass = $env('DB_PASSWORD', '');
$dbName = $env('DB_DATABASE', 'menugo');

test(
    'DB_HOST configurado',
    !empty($dbHost),
    $dbHost
);

test(
    'DB_USERNAME no es root (recomendado en producción)',
    $dbUser !== 'root',
    $dbUser === 'root'
        ? "Usando 'root' — crear usuario dedicado en producción"
        : "Usuario: {$dbUser} ✓",
    $dbUser === 'root'
);

test(
    'DB_PASSWORD configurada',
    !empty($dbPass),
    !empty($dbPass) ? '✓ Password presente' : 'SIN PASSWORD — peligro en producción'
);

test(
    'DB_DATABASE configurado',
    !empty($dbName),
    $dbName
);

// Conectividad real
try {
    $pdo = new PDO(
        "mysql:host={$dbHost};port=3306;dbname={$dbName};charset=utf8mb4",
        $dbUser, $dbPass,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    $version = $pdo->query('SELECT VERSION()')->fetchColumn();
    test('Conexión a BD exitosa', true, "MySQL/MariaDB {$version}");

    // Verificar que hay backups (tabla de jobs o registros recientes)
    $stmt = $pdo->query("SELECT COUNT(*) FROM tenants WHERE deleted_at IS NULL");
    $numTenants = (int)$stmt->fetchColumn();
    test(
        'BD central accesible con datos',
        $numTenants > 0,
        "{$numTenants} tenant(s) activos"
    );
} catch (PDOException $e) {
    test('Conexión a BD', false, "Error: " . $e->getMessage());
}

// ══════════════════════════════════════════════════════════
// BLOQUE 4 — HTTPS Y SSL
// ══════════════════════════════════════════════════════════
echo "\n── 4. HTTPS y SSL ───────────────────────────────────\n";

// Verificar que el sitio responde por HTTPS
$rHttps = fetchUrl($baseUrl . '/carta');
test(
    'Sitio responde por HTTPS',
    $rHttps['code'] === 200,
    "HTTP {$rHttps['code']}"
);

// Verificar redirect HTTP → HTTPS (en producción debe redirigir)
$rHttp = fetchUrl('http://' . TENANT_SLUG . '.' . BASE_HOST . '/carta', false);
$redigeAHttps = $rHttp['code'] === 301 &&
                str_contains($rHttp['location'], 'https://');
test(
    'HTTP redirige a HTTPS (producción)',
    $redigeAHttps,
    $redigeAHttps
        ? 'Redirect 301 a HTTPS configurado'
        : "HTTP {$rHttp['code']} — en producción configurar redirect en Apache/Nginx",
    !$redigeAHttps
);

// HSTS Header
$rHsts = fetchUrl($baseUrl . '/carta');
$tieneHsts = str_contains($rHsts['headers'], 'strict-transport-security');
test(
    'HSTS header presente (Strict-Transport-Security)',
    $tieneHsts,
    $tieneHsts
        ? 'HSTS configurado'
        : 'AUSENTE — agregar en producción: Strict-Transport-Security: max-age=31536000',
    !$tieneHsts
);

// ══════════════════════════════════════════════════════════
// BLOQUE 5 — ARCHIVOS SENSIBLES NO EXPUESTOS
// ══════════════════════════════════════════════════════════
echo "\n── 5. Archivos sensibles no expuestos ───────────────\n";

$archivosSecretos = [
    '/.env'              => '.env con credenciales',
    '/.env.backup'       => '.env.backup',
    '/composer.json'     => 'composer.json',
    '/composer.lock'     => 'composer.lock',
    '/package.json'      => 'package.json',
    '/artisan'           => 'artisan CLI',
    '/storage/logs/laravel.log' => 'Laravel logs',
    '/database/database.sqlite' => 'SQLite database',
    '/.git/config'       => 'Git config',
    '/phpinfo.php'       => 'phpinfo',
];

foreach ($archivosSecretos as $ruta => $nombre) {
    $r = fetchUrl($baseUrl . $ruta, false);
    // Debe dar 404, 403 o redirigir — nunca 200 con contenido
    $seguro = in_array($r['code'], [404, 403, 301, 302]);
    test(
        "'{$nombre}' no accesible públicamente",
        $seguro,
        "HTTP {$r['code']}" . ($r['code'] === 200 ? " — PELIGRO: archivo expuesto" : ' — OK')
    );
}

// ══════════════════════════════════════════════════════════
// BLOQUE 6 — HEADERS DE SEGURIDAD HTTP
// ══════════════════════════════════════════════════════════
echo "\n── 6. Headers de seguridad HTTP ─────────────────────\n";

$rHeaders = fetchUrl($baseUrl . '/carta');
$headers  = $rHeaders['headers'];

$headersRequeridos = [
    'x-content-type-options: nosniff'   => 'X-Content-Type-Options',
    'x-frame-options: sameorigin'        => 'X-Frame-Options',
    'referrer-policy:'                   => 'Referrer-Policy',
    'permissions-policy:'                => 'Permissions-Policy',
    'content-security-policy:'           => 'Content-Security-Policy',
];

foreach ($headersRequeridos as $header => $nombre) {
    $presente = str_contains($headers, $header);
    $esCsp    = $nombre === 'Content-Security-Policy';
    test(
        "Header {$nombre}",
        $presente,
        $presente ? 'Presente' : 'AUSENTE' . ($esCsp ? ' — importante para XSS' : ''),
        !$presente && $esCsp // CSP ausente es warning, no fallo crítico
    );
}

// ══════════════════════════════════════════════════════════
// BLOQUE 7 — OPTIMIZACIONES DE LARAVEL
// ══════════════════════════════════════════════════════════
echo "\n── 7. Optimizaciones de Laravel ─────────────────────\n";

// Verificar si existe bootstrap/cache con archivos compilados
$cacheFiles = [
    'C:/xampp/htdocs/menugo/bootstrap/cache/config.php'  => 'Config cacheada (config:cache)',
    'C:/xampp/htdocs/menugo/bootstrap/cache/routes-v7.php' => 'Rutas cacheadas (route:cache)',
    'C:/xampp/htdocs/menugo/bootstrap/cache/services.php' => 'Services cacheados',
];

foreach ($cacheFiles as $path => $nombre) {
    $existe = file_exists($path);
    test(
        $nombre,
        $existe,
        $existe
            ? 'Cache presente — rendimiento optimizado'
            : 'Cache ausente — ejecutar en producción: php artisan optimize',
        !$existe
    );
}

// Verificar que vendor/autoload existe (composer install ejecutado)
test(
    'Vendor autoload presente (composer install)',
    file_exists('C:/xampp/htdocs/menugo/vendor/autoload.php'),
    file_exists('C:/xampp/htdocs/menugo/vendor/autoload.php')
        ? 'vendor/ presente'
        : 'AUSENTE — ejecutar: composer install --no-dev --optimize-autoloader'
);

// ══════════════════════════════════════════════════════════
// BLOQUE 8 — CHECKLIST FINAL DE PRODUCCIÓN
// ══════════════════════════════════════════════════════════
echo "\n── 8. Checklist DNS y servidor (verificación manual) ─\n";

// Estas pruebas no se pueden automatizar — son verificaciones de infraestructura
$checklistManual = [
    'Registro DNS wildcard *.menugo.com apunta al servidor',
    'Certificado SSL válido (Let\'s Encrypt o similar) para *.menugo.com',
    'Apache/Nginx configurado con VirtualHost wildcard',
    'mod_rewrite habilitado en Apache (ya verificado en .htaccess)',
    'Proceso de queue worker corriendo (supervisor o systemd)',
    'Backup automático de BD configurado (cron diario)',
    'Monitoreo de uptime configurado (UptimeRobot, etc.)',
    'Variables de .env de producción NO están en el repositorio git',
    'APP_DEBUG=false en el servidor de producción',
    'CACHE_STORE=redis en el servidor de producción',
];

foreach ($checklistManual as $item) {
    echo "  □ {$item}\n";
}

// ══════════════════════════════════════════════════════════
// REPORTE FINAL
// ══════════════════════════════════════════════════════════
$total = $passed + $failed + $warnings;
echo "\n╔══════════════════════════════════════════════════════╗\n";
echo "║         REPORTE INFRAESTRUCTURA PRODUCCIÓN           ║\n";
echo "╚══════════════════════════════════════════════════════╝\n\n";
echo "Total pruebas:  {$total}\n";
echo "✓ Pasaron:      {$passed}\n";
echo "✗ Fallaron:     {$failed}\n";
echo "⚠ Advertencias: {$warnings}\n\n";

if ($failed > 0) {
    echo "── Pruebas FALLIDAS (corregir antes de producción) ──\n";
    foreach ($resultados as $r) {
        if ($r['estado'] === 'FAIL') {
            echo "  ✗ {$r['nombre']}\n";
            if ($r['detalle']) echo "    → {$r['detalle']}\n";
        }
    }
    echo "\n";
}

if ($warnings > 0) {
    echo "── Advertencias (revisar antes de producción) ───────\n";
    foreach ($resultados as $r) {
        if ($r['estado'] === 'WARN') {
            echo "  ⚠ {$r['nombre']}\n";
            if ($r['detalle']) echo "    → {$r['detalle']}\n";
        }
    }
    echo "\n";
}

echo "── Comandos para optimizar antes de desplegar ───────\n";
echo "  php artisan config:cache\n";
echo "  php artisan route:cache\n";
echo "  php artisan view:cache\n";
echo "  php artisan optimize\n";
echo "  composer install --no-dev --optimize-autoloader\n\n";

echo $failed === 0
    ? "✓ El sistema pasa las pruebas automáticas de producción.\n\n"
    : "✗ Hay {$failed} problema(s) críticos antes de pasar a producción.\n\n";
