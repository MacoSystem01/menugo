<?php

/**
 * MenuGo — Verificador de Entorno
 * Uso: php tests/load/verificar_entorno.php
 */

// ════════════════════════════════════════════════════════
// ⚠️  IMPORTANTE: NO uses 'latajada' (slug de ejemplo).
//    Corre primero: php tests/load/consultar_bd.php
//    para obtener el TENANT_SLUG real de TU instalación.
// ════════════════════════════════════════════════════════
define('TENANT_SLUG', 'latajada');   // ← reemplazar con slug real de consultar_bd.php
define('BASE_HOST',   'menugo.local');
define('DISH_ID_1',   1);            // ← reemplazar con ID real de consultar_bd.php
define('DISH_ID_2',   2);            // ← reemplazar con ID real de consultar_bd.php

// ── NO TOCAR DE AQUÍ EN ADELANTE ─────────────────────────────────────────────

$ok = 0;
$errores = 0;

function check(string $nombre, bool $resultado, string $detalle = ''): void
{
    global $ok, $errores;
    $icono = $resultado ? '✓' : '✗';
    $sufijo = $resultado ? '' : ' ← PROBLEMA';
    echo "  [{$icono}] {$nombre}{$sufijo}\n";
    if ($detalle) echo "        {$detalle}\n";
    $resultado ? $ok++ : $errores++;
}

echo "╔══════════════════════════════════════════════════════╗\n";
echo "║         MenuGo — Verificador de Entorno              ║\n";
echo "╚══════════════════════════════════════════════════════╝\n\n";

echo "── PHP y extensiones ────────────────────────────────\n";
check('PHP versión >= 8.1', PHP_VERSION_ID >= 80100, 'Versión actual: ' . PHP_VERSION);
check('Extensión curl',     extension_loaded('curl'));
check('Extensión json',     extension_loaded('json'));
check('Extensión pdo',      extension_loaded('pdo'));
echo "\n";

$baseUrl   = 'https://' . TENANT_SLUG . '.' . BASE_HOST;
$cartaUrl  = $baseUrl . '/carta';
$pedidoUrl = $baseUrl . '/carta/pedido';
$cookieFile = sys_get_temp_dir() . '/menugo_verify_' . getmypid() . '.txt';

echo "── Conectividad HTTP ────────────────────────────────\n";
echo "  URL a probar: {$cartaUrl}\n\n";

$ch = curl_init($cartaUrl);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_COOKIEJAR      => $cookieFile,
    CURLOPT_COOKIEFILE     => $cookieFile,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_TIMEOUT        => 10,
    CURLOPT_USERAGENT      => 'Mozilla/5.0 (MenuGoVerify)',
    CURLOPT_HTTPHEADER     => ['Accept: text/html'],
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_SSL_VERIFYHOST => false,
]);
$html      = curl_exec($ch);
$httpCode  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

check(
    'GET /carta devuelve HTTP 200',
    $httpCode === 200,
    $curlError ? "Error cURL: {$curlError}" : "HTTP {$httpCode} recibido"
);

$csrf = '';
if ($html && preg_match('/<meta[^>]+name=["\']csrf-token["\'][^>]+content=["\']([^"\']+)["\']/', $html, $m)) {
    $csrf = $m[1];
}
check(
    'Token CSRF encontrado en /carta',
    !empty($csrf),
    $csrf ? 'Token: ' . substr($csrf, 0, 20) . '...' : 'No se encontró <meta name="csrf-token">'
);

$tieneCookie = file_exists($cookieFile) && filesize($cookieFile) > 0;
check('Cookie de sesión generada', $tieneCookie);
echo "\n";

echo "── Pedido de prueba (1 solo) ─────────────────────────\n";

if (!empty($csrf)) {
    // Construir payload respetando la validación real de placeOrder()
    $items = [
        ['dish_id' => DISH_ID_1, 'quantity' => 1],
    ];
    $postFields = '_token=' . urlencode($csrf)
        . '&customer_name=' . urlencode('Verificador Entorno')
        . '&customer_phone=' . urlencode('3001234567')
        . '&type=mesa'
        . '&table_id=1'
        . '&payment_method=efectivo'
        . '&confirmed=1'
        . '&notes=' . urlencode('Pedido de verificacion - eliminar')
        . '&items%5B0%5D%5Bdish_id%5D=' . DISH_ID_1
        . '&items%5B0%5D%5Bquantity%5D=1';

    $ch = curl_init($pedidoUrl);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $postFields,
        CURLOPT_COOKIEJAR      => $cookieFile,
        CURLOPT_COOKIEFILE     => $cookieFile,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_USERAGENT      => 'Mozilla/5.0 (MenuGoVerify)',
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false,
        CURLOPT_HTTPHEADER     => [
            'Accept: text/html, application/xhtml+xml',
            'Content-Type: application/x-www-form-urlencoded',
            'X-Inertia: true',
            'X-Inertia-Version: 1',
        ],
    ]);
    $body     = curl_exec($ch);
    $code     = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $location = curl_getinfo($ch, CURLINFO_REDIRECT_URL);
    curl_close($ch);

    if ($code === 302) {
        $tieneError = str_contains($body, '"errors"') || str_contains($body, 'table_occupied');
        if (!$tieneError) {
            check('POST /carta/pedido → HTTP 302 (pedido creado)', true, "Redirige a: {$location}");
            echo "  ✓ Revisa phpMyAdmin → BD menugo_{uuid} → tabla orders\n";
            echo "    debe aparecer un pedido nuevo de 'Verificador Entorno'\n";
        } else {
            check('POST /carta/pedido → HTTP 302', false, 'Redirige pero con errores de validación');
            echo "  → Posiblemente DISH_ID_1=" . DISH_ID_1 . " no existe o available=0\n";
            echo "    Corre consultar_bd.php para ver los IDs correctos\n";
        }
    } elseif ($code === 429) {
        check('POST /carta/pedido', false, 'HTTP 429 — Throttle activado. Espera 1 minuto.');
    } elseif ($code === 419) {
        check('POST /carta/pedido', false, 'HTTP 419 — CSRF inválido.');
    } else {
        check('POST /carta/pedido → HTTP 302', false, "HTTP {$code} inesperado. Revisa storage/logs/laravel.log");
        if ($body) echo "  Body: " . substr(strip_tags($body), 0, 200) . "\n";
    }
} else {
    echo "  [–] Saltando (no hay CSRF disponible)\n";
}

echo "\n── Límites del sistema ──────────────────────────────\n";
echo "  throttle:60,1 en POST /carta/pedido\n";
echo "  Máximo 60 pedidos por minuto por IP\n";
echo "  Requests > 60 en 1 min recibirán HTTP 429\n\n";

if (file_exists($cookieFile)) @unlink($cookieFile);

echo "╔══════════════════════════════════════════════════════╗\n";
printf(
    "║  RESULTADO: %d correctos, %d problemas%-14s║\n",
    $ok,
    $errores,
    $errores > 0 ? ' ← revisar' : ' ← todo OK'
);
echo "╚══════════════════════════════════════════════════════╝\n\n";

if ($errores > 0) {
    echo "Lista de verificación:\n";
    echo "  □ XAMPP corriendo (Apache + MySQL en verde)\n";
    echo "  □ El archivo hosts tiene: 127.0.0.1  " . TENANT_SLUG . "." . BASE_HOST . "\n";
    echo "  □ DISH_ID_1 y DISH_ID_2 existen en dishes con available=1\n\n";
}
