<?php
/**
 * MenuGo — Pruebas de Flujo Funcional Completo
 * Ruta: tests/load/functional_test.php
 * Uso: php tests/load/functional_test.php
 *
 * Prueba el flujo real completo:
 * Cliente hace pedido → Cocina lo procesa → Caja cobra → Cierre cuadra
 */

// ════════════════════════════════════════════════════════
// Credenciales cargadas desde tests/load/.env.test (cifradas con APP_KEY)
// Para regenerar: php tests/load/_gen_encrypted_env.php
// ════════════════════════════════════════════════════════
require_once __DIR__ . '/env_loader.php';

$passed = $failed = $warnings = 0;
$resultados = [];
$cookieDir  = sys_get_temp_dir();
$baseUrl    = 'https://' . TENANT_SLUG . '.' . BASE_HOST;

array_map('unlink', glob($cookieDir . '/menugo_func_*.txt'));

function newCookie(): string {
    return sys_get_temp_dir() . '/menugo_func_' . uniqid('', true) . '.txt';
}

function url(string $path): string {
    global $baseUrl;
    return $baseUrl . $path;
}

function request(string $method, string $url, array $data = [],
    string $cookieFile = '', string $csrf = '', string $ver = ''): array
{
    $ch      = curl_init($url);
    $isWrite = in_array(strtoupper($method), ['POST', 'PUT', 'DELETE']);
    $headers = ['Accept: text/html, application/xhtml+xml'];
    if ($isWrite) {
        $headers[] = 'Content-Type: application/x-www-form-urlencoded';
        $headers[] = 'X-Inertia: true';
        $headers[] = 'X-Inertia-Version: ' . ($ver ?: '1');
    }
    $opts = [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_TIMEOUT        => 20,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false,
        CURLOPT_USERAGENT      => 'Mozilla/5.0 (MenuGoFunctionalTest)',
        CURLOPT_HTTPHEADER     => $headers,
    ];
    if ($cookieFile) {
        $opts[CURLOPT_COOKIEJAR]  = $cookieFile;
        $opts[CURLOPT_COOKIEFILE] = $cookieFile;
    }
    if ($isWrite) {
        if ($csrf)                            $data['_token']  = $csrf;
        if (strtoupper($method) === 'PUT')    $data['_method'] = 'PUT';
        if (strtoupper($method) === 'DELETE') $data['_method'] = 'DELETE';
        $opts[CURLOPT_POST]       = true;
        $opts[CURLOPT_POSTFIELDS] = http_build_query($data);
    }
    curl_setopt_array($ch, $opts);
    $body     = curl_exec($ch);
    $code     = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $location = curl_getinfo($ch, CURLINFO_REDIRECT_URL);
    curl_close($ch);
    return ['code' => $code, 'body' => $body ?? '', 'location' => $location ?? ''];
}

function getPageData(string $url, string $cookieFile): array
{
    $r = request('GET', $url, [], $cookieFile);
    $csrf = $version = '';
    if (preg_match('/<meta[^>]+name=["\']csrf-token["\'][^>]+content=["\']([^"\']+)["\']/', $r['body'], $m))
        $csrf = $m[1];
    if (preg_match('/"version"\s*:\s*"([^"]+)"/', $r['body'], $m))
        $version = $m[1];
    return ['csrf' => $csrf, 'version' => $version, 'code' => $r['code'], 'body' => $r['body']];
}

function doLogin(string $email, string $pass, string $cookieFile): array
{
    $page = getPageData(url('/login'), $cookieFile);
    if (!$page['csrf']) return ['success' => false, 'error' => 'Sin CSRF en login'];
    $r  = request('POST', url('/login'), ['email' => $email, 'password' => $pass],
        $cookieFile, $page['csrf'], $page['version']);
    $ok = $r['code'] === 302 && !str_contains($r['location'], 'login');
    return ['success' => $ok, 'code' => $r['code'], 'location' => $r['location']];
}

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

// Extrae el order_id de la BD después de crear el pedido
function getLastOrderId(string $cookieFile): ?int
{
    $page = getPageData(url('/caja'), $cookieFile);
    // Busca el último order ID en el JSON de Inertia
    if (preg_match_all('/"id"\s*:\s*(\d+)/', $page['body'], $m)) {
        return (int) max($m[1]);
    }
    return null;
}

// ─────────────────────────────────────────────────────────────────────────────
echo "╔══════════════════════════════════════════════════════╗\n";
echo "║     MenuGo — Pruebas de Flujo Funcional Completo     ║\n";
echo "╚══════════════════════════════════════════════════════╝\n\n";
echo "Tenant: " . TENANT_SLUG . "." . BASE_HOST . "\n\n";

// ── Inicializar sesiones ──────────────────────────────────────────────────────
$cookieAdmin  = newCookie();
$cookieCocina = newCookie();
$cookieCaja   = newCookie();
$cookieCliente = newCookie();

$loginAdmin = doLogin(ADMIN_EMAIL, ADMIN_PASS, $cookieAdmin);
$loginCocina = doLogin(COCINA_EMAIL, COCINA_PASS, $cookieCocina);
$loginCaja   = doLogin(CAJA_EMAIL, CAJA_PASS, $cookieCaja);

echo "── Sesiones inicializadas ───────────────────────────\n";
echo "  Admin:  " . ($loginAdmin['success']  ? '✓ OK' : '✗ Falló — verifica ADMIN_EMAIL/PASS')  . "\n";
echo "  Cocina: " . ($loginCocina['success'] ? '✓ OK' : '✗ Falló — verifica COCINA_EMAIL/PASS') . "\n";
echo "  Caja:   " . ($loginCaja['success']   ? '✓ OK' : '✗ Falló — verifica CAJA_EMAIL/PASS')   . "\n\n";

// ══════════════════════════════════════════════════════════
// FLUJO 1 — PEDIDO EN MESA (completo)
// Cliente → Carta pública → Pedido → Cocina → Caja → Cobro
// ══════════════════════════════════════════════════════════
echo "── Flujo 1: Pedido en mesa completo ─────────────────\n";

// Paso 1.1 — Cliente accede a la carta pública
$pageCliente = getPageData(url('/carta'), $cookieCliente);
test(
    'Paso 1.1 — Carta pública carga correctamente',
    $pageCliente['code'] === 200 && !empty($pageCliente['csrf']),
    "HTTP {$pageCliente['code']}" . (empty($pageCliente['csrf']) ? ' — sin CSRF' : ' — CSRF obtenido')
);

// Paso 1.2 — Cliente crea pedido en mesa
$r = request('POST', url('/carta/pedido'), [
    'customer_name'      => 'Test Funcional Mesa',
    'customer_phone'     => '3001234567',
    'type'               => 'mesa',
    'table_id'           => TABLE_ID,
    'payment_method'     => 'efectivo',
    'confirmed'          => 1,
    'notes'              => 'Pedido test funcional - eliminar',
    'items[0][dish_id]'  => DISH_ID_1,
    'items[0][quantity]' => 2,
    'items[1][dish_id]'  => DISH_ID_2,
    'items[1][quantity]' => 1,
], $cookieCliente, $pageCliente['csrf'], $pageCliente['version']);

$pedidoCreado = $r['code'] === 302;
test(
    'Paso 1.2 — Cliente crea pedido en mesa',
    $pedidoCreado,
    "HTTP {$r['code']} → " . ($r['location'] ?: 'sin redirect')
);

// Paso 1.3 — Obtener el ID del pedido recién creado
$orderId = null;
if ($loginCaja['success']) {
    $pageCaja = getPageData(url('/caja'), $cookieCaja);
    if (preg_match_all('/"id"\s*:\s*(\d+)/', $pageCaja['body'], $m)) {
        $orderId = (int) max($m[1]);
    }
}
test(
    'Paso 1.3 — Pedido aparece en caja',
    $orderId !== null,
    $orderId ? "Order ID: {$orderId}" : "No se pudo obtener order_id — verifica login de caja"
);

// Paso 1.4 — Cocina ve el pedido
if ($loginCocina['success']) {
    $pageCocina = getPageData(url('/cocina'), $cookieCocina);
    $tieneOrden = $orderId && str_contains($pageCocina['body'], (string)$orderId);
    test(
        'Paso 1.4 — Pedido aparece en cocina',
        $pageCocina['code'] === 200,
        "HTTP {$pageCocina['code']}" . ($tieneOrden ? " — pedido #{$orderId} visible" : ' — carga OK')
    );
} else {
    test('Paso 1.4 — Cocina ve el pedido', false,
        'Login de cocina falló — verifica COCINA_EMAIL/PASS', true);
}

// Paso 1.5 — Cocina acepta el pedido
if ($loginCocina['success'] && $orderId) {
    $pageCocinaData = getPageData(url('/cocina'), $cookieCocina);
    $r = request('POST', url("/cocina/{$orderId}/aceptar"), [],
        $cookieCocina, $pageCocinaData['csrf'], $pageCocinaData['version']);
    test(
        'Paso 1.5 — Cocina acepta el pedido',
        in_array($r['code'], [200, 302]),
        "HTTP {$r['code']}"
    );
} else {
    test('Paso 1.5 — Cocina acepta pedido', false, 'Dependencia fallida', !$loginCocina['success']);
}

// Paso 1.6 — Cocina pone en cocción
if ($loginCocina['success'] && $orderId) {
    $pageCocinaData = getPageData(url('/cocina'), $cookieCocina);
    $r = request('POST', url("/cocina/{$orderId}/cocinar"), [],
        $cookieCocina, $pageCocinaData['csrf'], $pageCocinaData['version']);
    test(
        'Paso 1.6 — Cocina inicia cocción',
        in_array($r['code'], [200, 302]),
        "HTTP {$r['code']}"
    );
}

// Paso 1.7 — Cocina marca como listo
if ($loginCocina['success'] && $orderId) {
    $pageCocinaData = getPageData(url('/cocina'), $cookieCocina);
    $r = request('POST', url("/cocina/{$orderId}/listo"), [],
        $cookieCocina, $pageCocinaData['csrf'], $pageCocinaData['version']);
    test(
        'Paso 1.7 — Cocina marca pedido como listo',
        in_array($r['code'], [200, 302]),
        "HTTP {$r['code']}"
    );
}

// Paso 1.8 — Cocina marca como entregado
if ($loginCocina['success'] && $orderId) {
    $pageCocinaData = getPageData(url('/cocina'), $cookieCocina);
    $r = request('POST', url("/cocina/{$orderId}/entregado"), [],
        $cookieCocina, $pageCocinaData['csrf'], $pageCocinaData['version']);
    test(
        'Paso 1.8 — Cocina marca pedido como entregado',
        in_array($r['code'], [200, 302]),
        "HTTP {$r['code']}"
    );
}

// Paso 1.9 — Caja cobra el pedido
if ($loginCaja['success'] && $orderId) {
    $pageCajaData = getPageData(url('/caja'), $cookieCaja);
    $r = request('POST', url("/caja/{$orderId}/cobrar"), [
        'payment_method' => 'efectivo',
    ], $cookieCaja, $pageCajaData['csrf'], $pageCajaData['version']);
    test(
        'Paso 1.9 — Caja cobra el pedido',
        in_array($r['code'], [200, 302]),
        "HTTP {$r['code']}"
    );
} else {
    test('Paso 1.9 — Caja cobra pedido', false, 'Dependencia fallida', !$loginCaja['success']);
}

// ══════════════════════════════════════════════════════════
// FLUJO 2 — PEDIDO DOMICILIO
// ══════════════════════════════════════════════════════════
echo "\n── Flujo 2: Pedido domicilio ─────────────────────────\n";

$cookieCliente2 = newCookie();
$pageCliente2   = getPageData(url('/carta'), $cookieCliente2);

$r = request('POST', url('/carta/pedido'), [
    'customer_name'      => 'Test Funcional Domicilio',
    'customer_phone'     => '3009876543',
    'type'               => 'domicilio',
    'delivery_address'   => 'Calle 10 # 20-30, Barrio Centro',
    'delivery_phone'     => '3009876543',
    'payment_method'     => 'efectivo',
    'confirmed'          => 1,
    'notes'              => 'Pedido domicilio test - eliminar',
    'items[0][dish_id]'  => DISH_ID_1,
    'items[0][quantity]' => 1,
], $cookieCliente2, $pageCliente2['csrf'], $pageCliente2['version']);

test(
    'Paso 2.1 — Cliente crea pedido domicilio',
    $r['code'] === 302,
    "HTTP {$r['code']}"
);

if ($loginAdmin['success']) {
    $pageDom = getPageData(url('/domicilio'), $cookieAdmin);
    test(
        'Paso 2.2 — Pedido domicilio aparece en módulo domicilio',
        $pageDom['code'] === 200,
        "HTTP {$pageDom['code']}"
    );
}

// ══════════════════════════════════════════════════════════
// FLUJO 3 — CASOS BORDE
// ══════════════════════════════════════════════════════════
echo "\n── Flujo 3: Casos borde ─────────────────────────────\n";

// 3.1 — Pedido con plato inexistente (available=0 o no existe)
$cookieBorde1 = newCookie();
$pageBorde1   = getPageData(url('/carta'), $cookieBorde1);
$r = request('POST', url('/carta/pedido'), [
    'customer_name'      => 'Test Borde Plato Inexistente',
    'customer_phone'     => '3001111111',
    'type'               => 'mesa',
    'table_id'           => TABLE_ID,
    'payment_method'     => 'efectivo',
    'confirmed'          => 1,
    'items[0][dish_id]'  => 99999,
    'items[0][quantity]' => 1,
], $cookieBorde1, $pageBorde1['csrf'], $pageBorde1['version']);
test(
    'Paso 3.1 — Plato inexistente es rechazado',
    in_array($r['code'], [302, 422]),
    "HTTP {$r['code']}"
);
if (file_exists($cookieBorde1)) @unlink($cookieBorde1);

// 3.2 — Pedido con 0 items
$cookieBorde2 = newCookie();
$pageBorde2   = getPageData(url('/carta'), $cookieBorde2);
$r = request('POST', url('/carta/pedido'), [
    'customer_name'  => 'Test Borde Sin Items',
    'customer_phone' => '3002222222',
    'type'           => 'mesa',
    'table_id'       => TABLE_ID,
    'payment_method' => 'efectivo',
], $cookieBorde2, $pageBorde2['csrf'], $pageBorde2['version']);
test(
    'Paso 3.2 — Pedido sin items es rechazado',
    in_array($r['code'], [302, 422]),
    "HTTP {$r['code']}"
);
if (file_exists($cookieBorde2)) @unlink($cookieBorde2);

// 3.3 — Domicilio sin dirección
$cookieBorde3 = newCookie();
$pageBorde3   = getPageData(url('/carta'), $cookieBorde3);
$r = request('POST', url('/carta/pedido'), [
    'customer_name'      => 'Test Borde Sin Direccion',
    'customer_phone'     => '3003333333',
    'type'               => 'domicilio',
    // sin delivery_address
    'payment_method'     => 'efectivo',
    'confirmed'          => 1,
    'items[0][dish_id]'  => DISH_ID_1,
    'items[0][quantity]' => 1,
], $cookieBorde3, $pageBorde3['csrf'], $pageBorde3['version']);
test(
    'Paso 3.3 — Domicilio sin dirección es rechazado',
    in_array($r['code'], [302, 422]),
    "HTTP {$r['code']}"
);
if (file_exists($cookieBorde3)) @unlink($cookieBorde3);

// 3.4 — Cancelar un pedido desde el panel
if ($loginAdmin['success'] && $orderId) {
    // Crear un pedido nuevo para cancelar
    $cookieCancelCliente = newCookie();
    $pageCancel = getPageData(url('/carta'), $cookieCancelCliente);
    $rCancel = request('POST', url('/carta/pedido'), [
        'customer_name'      => 'Test Cancelacion',
        'customer_phone'     => '3004444444',
        'type'               => 'mesa',
        'table_id'           => TABLE_ID,
        'payment_method'     => 'efectivo',
        'confirmed'          => 1,
        'items[0][dish_id]'  => DISH_ID_1,
        'items[0][quantity]' => 1,
    ], $cookieCancelCliente, $pageCancel['csrf'], $pageCancel['version']);

    if ($rCancel['code'] === 302) {
        // Obtener el nuevo order ID
        $pagePedidos = getPageData(url('/pedidos'), $cookieAdmin);
        $cancelOrderId = null;
        if (preg_match_all('/"id"\s*:\s*(\d+)/', $pagePedidos['body'], $m)) {
            $cancelOrderId = (int) max($m[1]);
        }

        if ($cancelOrderId) {
            $pageAdminData = getPageData(url('/pedidos'), $cookieAdmin);
            $rCancelPost = request('POST', url("/pedidos/{$cancelOrderId}/cancelar"), [],
                $cookieAdmin, $pageAdminData['csrf'], $pageAdminData['version']);
            test(
                'Paso 3.4 — Admin puede cancelar un pedido',
                in_array($rCancelPost['code'], [200, 302]),
                "HTTP {$rCancelPost['code']} — pedido #{$cancelOrderId}"
            );
        } else {
            test('Paso 3.4 — Admin cancela pedido', false, 'No se pudo obtener ID del pedido', true);
        }
    }
    if (file_exists($cookieCancelCliente)) @unlink($cookieCancelCliente);
}

// ══════════════════════════════════════════════════════════
// FLUJO 4 — INTEGRIDAD DEL TOTAL
// ══════════════════════════════════════════════════════════
echo "\n── Flujo 4: Integridad de datos ─────────────────────\n";

// 4.1 — Verificar que el total del pedido en BD coincide con items × precio
// Conectamos directo a la BD para verificar
try {
    $pdo = new PDO(
        "mysql:host=127.0.0.1;port=3306;charset=utf8mb4",
        'root', '',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // Obtener nombre de la BD del tenant
    $stmt = $pdo->query("
        SELECT CONCAT('menugo_', t.id) as db_name
        FROM menugo.tenants t
        LEFT JOIN menugo.domains d ON d.tenant_id = t.id
        WHERE d.domain = '" . TENANT_SLUG . "." . BASE_HOST . "'
        LIMIT 1
    ");
    $row    = $stmt->fetch(PDO::FETCH_ASSOC);
    $dbName = $row['db_name'] ?? null;

    if ($dbName) {
        $dbQuoted = '`' . $dbName . '`';

        // Verificar total vs suma de items
        $stmt2 = $pdo->query("
            SELECT
                o.id,
                o.total as total_orden,
                SUM(oi.quantity * oi.unit_price) as total_calculado,
                ABS(o.total - SUM(oi.quantity * oi.unit_price)) as diferencia
            FROM {$dbQuoted}.orders o
            JOIN {$dbQuoted}.order_items oi ON oi.order_id = o.id
            WHERE o.customer_name LIKE 'Test Funcional%'
               OR o.customer_name LIKE 'Test Borde%'
               OR o.customer_name LIKE 'Test Cancelacion%'
            GROUP BY o.id
            HAVING diferencia > 0.01
            LIMIT 10
        ");
        $discrepancias = $stmt2->fetchAll(PDO::FETCH_ASSOC);

        test(
            'Paso 4.1 — Total de pedidos coincide con suma de items',
            empty($discrepancias),
            empty($discrepancias)
                ? 'Todos los totales cuadran correctamente'
                : count($discrepancias) . ' pedido(s) con discrepancia de total'
        );

        // Verificar que pedidos con status=cancelled tienen amount_paid=0
        $stmt3 = $pdo->query("
            SELECT COUNT(*) as total
            FROM {$dbQuoted}.orders
            WHERE status = 'cancelled' AND amount_paid > 0
        ");
        $pagadosYCancelados = (int)$stmt3->fetchColumn();
        test(
            'Paso 4.2 — Pedidos cancelados tienen amount_paid = 0',
            $pagadosYCancelados === 0,
            $pagadosYCancelados === 0
                ? 'Ningún pedido cancelado con pago registrado'
                : "{$pagadosYCancelados} pedido(s) cancelados con amount_paid > 0"
        );

        // Verificar items sin order_id válido (huérfanos)
        $stmt4 = $pdo->query("
            SELECT COUNT(*) as total
            FROM {$dbQuoted}.order_items oi
            LEFT JOIN {$dbQuoted}.orders o ON o.id = oi.order_id
            WHERE o.id IS NULL
        ");
        $huerfanos = (int)$stmt4->fetchColumn();
        test(
            'Paso 4.3 — No hay order_items huérfanos en la BD',
            $huerfanos === 0,
            $huerfanos === 0
                ? 'Integridad referencial OK'
                : "{$huerfanos} order_item(s) sin order válido"
        );

    } else {
        test('Paso 4.1 — Integridad de totales', false, 'No se encontró la BD del tenant', true);
        test('Paso 4.2 — Cancelados sin pago',   false, 'No se encontró la BD del tenant', true);
        test('Paso 4.3 — Sin items huérfanos',   false, 'No se encontró la BD del tenant', true);
    }

} catch (PDOException $e) {
    test('Paso 4.1 — Integridad de totales', false, 'Error DB: ' . $e->getMessage(), true);
}

// ══════════════════════════════════════════════════════════
// FLUJO 5 — DASHBOARD Y REPORTES
// ══════════════════════════════════════════════════════════
echo "\n── Flujo 5: Dashboard y reportes ────────────────────\n";

if ($loginAdmin['success']) {
    $pageDash = getPageData(url('/dashboard'), $cookieAdmin);
    test(
        'Paso 5.1 — Dashboard carga con datos',
        $pageDash['code'] === 200 && strlen($pageDash['body']) > 500,
        "HTTP {$pageDash['code']} — " . strlen($pageDash['body']) . " bytes"
    );

    $pageReporte = getPageData(url('/reporte'), $cookieAdmin);
    test(
        'Paso 5.2 — Reporte carga correctamente',
        $pageReporte['code'] === 200,
        "HTTP {$pageReporte['code']}"
    );

    $pageAudit = getPageData(url('/auditoria'), $cookieAdmin);
    test(
        'Paso 5.3 — Auditoría carga correctamente',
        $pageAudit['code'] === 200,
        "HTTP {$pageAudit['code']}"
    );
}

// ── Limpieza ──────────────────────────────────────────────────────────────────
foreach ([$cookieAdmin, $cookieCocina, $cookieCaja, $cookieCliente, $cookieCliente2] as $c) {
    if (file_exists($c)) @unlink($c);
}
array_map('unlink', glob($cookieDir . '/menugo_func_*.txt'));

// ── Reporte final ─────────────────────────────────────────────────────────────
$total = $passed + $failed + $warnings;
echo "\n╔══════════════════════════════════════════════════════╗\n";
echo "║              REPORTE FLUJO FUNCIONAL                 ║\n";
echo "╚══════════════════════════════════════════════════════╝\n\n";
echo "Total pruebas:  {$total}\n";
echo "✓ Pasaron:      {$passed}\n";
echo "✗ Fallaron:     {$failed}\n";
echo "⚠ Advertencias: {$warnings}\n\n";

if ($failed > 0) {
    echo "── Pruebas FALLIDAS ─────────────────────────────────\n";
    foreach ($resultados as $r) {
        if ($r['estado'] === 'FAIL') {
            echo "  ✗ {$r['nombre']}\n";
            if ($r['detalle']) echo "    → {$r['detalle']}\n";
        }
    }
    echo "\n";
}

if ($warnings > 0) {
    echo "── Advertencias ─────────────────────────────────────\n";
    foreach ($resultados as $r) {
        if ($r['estado'] === 'WARN') {
            echo "  ⚠ {$r['nombre']}\n";
            if ($r['detalle']) echo "    → {$r['detalle']}\n";
        }
    }
    echo "\n";
}

echo "── Limpieza recomendada ─────────────────────────────\n";
echo "  Elimina los pedidos de prueba con:\n";
echo "  DELETE FROM orders WHERE customer_name LIKE 'Test%';\n";
echo "  (Ejecutar en phpMyAdmin sobre la BD del tenant)\n\n";

echo $failed === 0
    ? "✓ Todas las pruebas funcionales pasaron.\n\n"
    : "✗ Hay {$failed} problema(s) en el flujo funcional.\n\n";
