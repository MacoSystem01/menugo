<?php

/**
 * ══════════════════════════════════════════════════════════
 *  MenuGo — Script de Prueba de Carga
 *  Ruta: tests/load/simulate_orders.php
 *  Uso: php tests/load/simulate_orders.php
 * ══════════════════════════════════════════════════════════
 */

// ┌─────────────────────────────────────────────────────────┐
// │  CONFIGURACIÓN — EDITAR ESTOS VALORES                   │
// └─────────────────────────────────────────────────────────┘
define('TENANT_SLUG',  'latajada');
define('BASE_HOST',    'menugo.local');
define('DISH_ID_1',    1);
define('DISH_ID_2',    2);
define('CONCURRENCIA', 50);
define('TAMANO_LOTE',  10);
define('PAUSA_LOTE',   3);

// ┌─────────────────────────────────────────────────────────┐
// │  NO TOCAR DE AQUÍ EN ADELANTE                           │
// └─────────────────────────────────────────────────────────┘

$baseUrl   = 'https://' . TENANT_SLUG . '.' . BASE_HOST;
$cartaUrl  = $baseUrl . '/carta';
$pedidoUrl = $baseUrl . '/carta/pedido';

echo "╔══════════════════════════════════════════════════════╗\n";
echo "║         MenuGo — Prueba de Carga de Pedidos          ║\n";
echo "╚══════════════════════════════════════════════════════╝\n\n";
echo "Tenant:       " . TENANT_SLUG . "." . BASE_HOST . "\n";
echo "URL pedidos:  {$pedidoUrl}\n";
echo "Concurrencia: " . CONCURRENCIA . " pedidos en lotes de " . TAMANO_LOTE . "\n";
echo "Dish IDs:     " . DISH_ID_1 . " y " . DISH_ID_2 . "\n\n";

// ── Función: obtener CSRF y versión real de Inertia ───────────────────────────
// GET sin X-Inertia — simula navegador normal
// Devuelve ['csrf' => '...', 'version' => '...']
function obtenerDatosPagina(string $url, string $cookieFile): array
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_COOKIEJAR      => $cookieFile,
        CURLOPT_COOKIEFILE     => $cookieFile,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_USERAGENT      => 'Mozilla/5.0 (MenuGoLoadTest)',
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false,
        CURLOPT_HTTPHEADER     => ['Accept: text/html, application/xhtml+xml'],
    ]);
    $html  = curl_exec($ch);
    $error = curl_error($ch);
    curl_close($ch);

    if ($error || !$html) return ['csrf' => '', 'version' => ''];

    $csrf    = '';
    $version = '';

    if (preg_match('/<meta[^>]+name=["\']csrf-token["\'][^>]+content=["\']([^"\']+)["\']/', $html, $m)) {
        $csrf = $m[1];
    }
    // Versión de Inertia en el JSON del div#app data-page
    if (preg_match('/"version"\s*:\s*"([^"]+)"/', $html, $m)) {
        $version = $m[1];
    }

    return ['csrf' => $csrf, 'version' => $version];
}

// ── Función: construir payload de pedido ──────────────────────────────────────
function buildPayload(int $numero): array
{
    $esMesa  = ($numero % 3) !== 0;
    $payload = [
        '_token'         => '',
        'customer_name'  => 'Cliente Prueba ' . $numero,
        'customer_phone' => '300' . str_pad($numero % 9999999, 7, '0', STR_PAD_LEFT),
        'type'           => $esMesa ? 'mesa' : 'domicilio',
        'payment_method' => 'efectivo',
        'notes'          => 'Pedido de prueba de carga #' . $numero,
        'confirmed'      => true,
        'items'          => [
            ['dish_id' => DISH_ID_1, 'quantity' => rand(1, 3)],
            ['dish_id' => DISH_ID_2, 'quantity' => 1],
        ],
    ];

    if ($esMesa) {
        $payload['table_id'] = ($numero % 10) + 1;
    } else {
        $payload['delivery_address'] = 'Calle ' . $numero . ' # 10-20, Barrio Centro';
        $payload['delivery_phone']   = '315' . str_pad($numero % 9999999, 7, '0', STR_PAD_LEFT);
    }

    return $payload;
}

// ── Inicializar sesiones ──────────────────────────────────────────────────────
$handles     = [];
$cookieFiles = [];
$inertiaVer  = ''; // se obtiene del primer cliente y se reutiliza

echo "Inicializando sesiones (obteniendo CSRF para cada cliente)...\n";

for ($i = 1; $i <= CONCURRENCIA; $i++) {
    $cookieFile      = sys_get_temp_dir() . '/menugo_test_' . $i . '_' . getmypid() . '.txt';
    $cookieFiles[$i] = $cookieFile;

    $datos = obtenerDatosPagina($cartaUrl, $cookieFile);
    $csrf  = $datos['csrf'];

    // Guardar la versión de Inertia del primer cliente exitoso
    if (empty($inertiaVer) && !empty($datos['version'])) {
        $inertiaVer = $datos['version'];
    }

    if (empty($csrf)) {
        echo "  [WARN] No se pudo obtener CSRF para cliente #{$i}\n";
        continue;
    }

    $payload           = buildPayload($i);
    $payload['_token'] = $csrf;
    $postFields        = http_build_query($payload);

    $ch = curl_init($pedidoUrl);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $postFields,
        CURLOPT_COOKIEJAR      => $cookieFile,
        CURLOPT_COOKIEFILE     => $cookieFile,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_TIMEOUT        => 60,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false,
        CURLOPT_USERAGENT      => 'Mozilla/5.0 (MenuGoLoadTest)',
        CURLOPT_HTTPHEADER     => [
            'Accept: text/html, application/xhtml+xml',
            'Content-Type: application/x-www-form-urlencoded',
            'X-Inertia: true',
            'X-Inertia-Version: ' . ($inertiaVer ?: '1'),
        ],
    ]);

    $handles[$i] = ['handle' => $ch, 'start' => microtime(true), 'tipo' => $payload['type']];
    echo "  Cliente #{$i} listo (CSRF obtenido, tipo: {$payload['type']})\n";
}

if (empty($handles)) {
    echo "\n[ERROR] No se pudo inicializar ningún cliente.\n";
    echo "  - Verifica que XAMPP esté corriendo\n";
    echo "  - Verifica que " . TENANT_SLUG . "." . BASE_HOST . " esté en el archivo hosts\n";
    exit(1);
}

echo "\nVersión Inertia detectada: " . ($inertiaVer ?: 'no detectada — usando 1') . "\n";

// ── Disparar pedidos en lotes ─────────────────────────────────────────────────
echo "\nDisparando " . count($handles) . " pedidos en lotes de " . TAMANO_LOTE . "...\n\n";
$startTotal = microtime(true);
$resultados = [];
$lotes      = array_chunk($handles, TAMANO_LOTE, true);

foreach ($lotes as $numLote => $lote) {
    $multiLote = curl_multi_init();

    foreach ($lote as $data) {
        curl_multi_add_handle($multiLote, $data['handle']);
    }

    echo "  Lote " . ($numLote + 1) . "/" . count($lotes) . " — disparando " . count($lote) . " pedidos...\n";

    $running = null;
    do {
        $status = curl_multi_exec($multiLote, $running);
        if ($running) curl_multi_select($multiLote, 1.0);
    } while ($running > 0 && $status === CURLM_OK);

    foreach ($lote as $i => $data) {
        $ch       = $data['handle'];
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $ms       = round((microtime(true) - $data['start']) * 1000, 2);
        $error    = curl_error($ch);
        $body     = curl_multi_getcontent($ch);

        $tieneError = str_contains($body ?? '', '"errors"') || str_contains($body ?? '', 'table_occupied');

        $resultados[] = [
            'num'   => $i,
            'code'  => $httpCode,
            'ms'    => $ms,
            'tipo'  => $data['tipo'],
            'exito' => $httpCode === 302 && !$tieneError,
            'error' => $error ?: ($tieneError ? 'Validación fallida' : ''),
        ];

        curl_multi_remove_handle($multiLote, $ch);
        curl_close($ch);
    }

    curl_multi_close($multiLote);

    if ($numLote + 1 < count($lotes)) {
        echo "  Pausa de " . PAUSA_LOTE . " segundos...\n";
        sleep(PAUSA_LOTE);
    }
}

$tiempoTotal = round((microtime(true) - $startTotal) * 1000, 2);

// Limpiar cookies temporales
foreach ($cookieFiles as $f) {
    if (file_exists($f)) @unlink($f);
}

// ── Reporte final ─────────────────────────────────────────────────────────────
$exitosos = array_filter($resultados, fn($r) => $r['exito']);
$fallidos = array_filter($resultados, fn($r) => !$r['exito']);
$tiempos  = array_column($resultados, 'ms');
sort($tiempos);

echo "╔══════════════════════════════════════════════════════╗\n";
echo "║                    RESULTADOS                        ║\n";
echo "╚══════════════════════════════════════════════════════╝\n\n";
echo "Total requests:    " . count($resultados) . "\n";
echo "Exitosos (302 OK): " . count($exitosos)   . "\n";
echo "Fallidos:          " . count($fallidos)    . "\n";
echo "Tiempo total:      {$tiempoTotal} ms\n\n";

if (!empty($tiempos)) {
    $p50 = $tiempos[(int)(count($tiempos) * 0.50)] ?? 0;
    $p95 = $tiempos[(int)(count($tiempos) * 0.95)] ?? 0;
    $p99 = $tiempos[(int)(count($tiempos) * 0.99)] ?? 0;

    echo "── Tiempos de respuesta ─────────────────────────────\n";
    echo "Mínimo:    " . min($tiempos) . " ms\n";
    echo "Máximo:    " . max($tiempos) . " ms\n";
    echo "Promedio:  " . round(array_sum($tiempos) / count($tiempos), 2) . " ms\n";
    echo "P50:       {$p50} ms\n";
    echo "P95:       {$p95} ms\n";
    echo "P99:       {$p99} ms\n\n";
}

$porCodigo = [];
foreach ($resultados as $r) {
    $porCodigo[$r['code']] = ($porCodigo[$r['code']] ?? 0) + 1;
}

echo "── Respuestas por código HTTP ───────────────────────\n";
foreach ($porCodigo as $code => $cant) {
    $desc = match ($code) {
        302  => '→ Redirect (pedido creado correctamente)',
        429  => '→ Throttle activado (máx 30/min por IP)',
        419  => '→ CSRF expirado (sesión inválida)',
        409  => '→ Conflicto versión Inertia (revisar CACHE_STORE)',
        500  => '→ Error de servidor (revisar storage/logs/laravel.log)',
        0    => '→ Sin respuesta (timeout o Apache saturado)',
        default => '',
    };
    echo "  HTTP {$code}: {$cant} requests {$desc}\n";
}

if (!empty($fallidos)) {
    echo "\n── Detalle de fallidos ──────────────────────────────\n";
    foreach ($fallidos as $r) {
        echo "  Cliente #{$r['num']} ({$r['tipo']}): HTTP {$r['code']}";
        if ($r['error']) echo " — {$r['error']}";
        echo "\n";
    }
}

echo "\n✓ Prueba finalizada.\n";
echo "  Revisa phpMyAdmin → BD menugo_{tenant_id} → tabla orders\n";
echo "  para confirmar los pedidos creados.\n\n";
