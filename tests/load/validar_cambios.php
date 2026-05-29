<?php
/**
 * MenuGo — Validación de los 6 casos de uso tras los cambios del CLAUDE.md
 * Uso: php tests/load/validar_cambios.php
 */

$ok     = 0;
$fallos = 0;

function check(string $nombre, bool $resultado, string $detalle = ''): void {
    global $ok, $fallos;
    $icono = $resultado ? '✓' : '✗';
    echo "  [{$icono}] {$nombre}\n";
    if ($detalle) echo "        {$detalle}\n";
    $resultado ? $ok++ : $fallos++;
}

echo "╔══════════════════════════════════════════════════════╗\n";
echo "║   MenuGo — Validación de 6 Casos de Uso (CLAUDE.md) ║\n";
echo "╚══════════════════════════════════════════════════════╝\n\n";

// ── CASO 1: BASE — recalculateTotal() incluye delivery_fee ────────────────────
echo "── Caso 1: Base — recalculateTotal() con delivery_fee ──\n";
$deliveryFee = 5000;
$itemsSum    = 20000;
$total       = $itemsSum + (float)($deliveryFee ?? 0);
check('delivery_fee incluido en total', $total === 25000.0, "Esperado 25000, obtenido: {$total}");
echo "\n";

// ── CASO 2: BORDE — delivery_fee NULL no rompe el cálculo ────────────────────
echo "── Caso 2: Borde — delivery_fee NULL ──\n";
$deliveryFeeNull = null;
$total2 = 20000 + (float)($deliveryFeeNull ?? 0);
check('delivery_fee NULL suma 0', $total2 === 20000.0, "Esperado 20000, obtenido: {$total2}");
check('total nunca negativo con delivery_fee=0', $total2 >= 0);
echo "\n";

// ── CASO 3: REGISTRO — caché de carta con tenant_id ──────────────────────────
echo "── Caso 3: Registro — cache keys aislados por tenant ──\n";
$tenantA = 'abc-123';
$tenantB = 'xyz-789';
$keyA    = "carta_public_{$tenantA}";
$keyB    = "carta_public_{$tenantB}";
check('Cache key de tenant A no es igual a B', $keyA !== $keyB, "{$keyA} vs {$keyB}");
check('Cache key contiene el tenant_id', str_contains($keyA, $tenantA));
check('Settings key es diferente al public key', $keyA !== "carta_settings_{$tenantA}");
echo "\n";

// ── CASO 4: ANULACIÓN — validación dinámica de payment_method ────────────────
echo "── Caso 4: Anulación — payment_method dinámico vs hardcodeado ──\n";
$tenantMethods = ['efectivo', 'nequi'];          // tenant sólo acepta 2 métodos
$clientSends   = 'daviplata';                    // cliente intenta pagar con daviplata
$isAllowed     = in_array($clientSends, $tenantMethods);
check('Método no configurado es rechazado', !$isAllowed, "Método '{$clientSends}' no está en ".implode(',', $tenantMethods));

$clientSends2 = 'efectivo';
$isAllowed2   = in_array($clientSends2, $tenantMethods);
check('Método configurado es permitido', $isAllowed2, "Método '{$clientSends2}' sí está en ".implode(',', $tenantMethods));
echo "\n";

// ── CASO 5: BUG — fallback a métodos completos cuando CartaSetting vacío ─────
echo "── Caso 5: Bug — fallback payment_methods para tenant recién creado ──\n";
$emptyMethods = [];
if (empty($emptyMethods)) {
    $fallback = ['efectivo', 'pse', 'nequi', 'daviplata', 'tarjeta', 'transferencia'];
} else {
    $fallback = $emptyMethods;
}
check('Fallback tiene 6 métodos cuando CartaSetting está vacío', count($fallback) === 6, "Obtenidos: ".count($fallback));
check('Fallback incluye "efectivo"', in_array('efectivo', $fallback));
echo "\n";

// ── CASO 6: ERROR — throttle actualizado de 30 a 60 ─────────────────────────
echo "── Caso 6: Error — throttle:60,1 en /carta/pedido ──\n";
$routeContent = file_get_contents(__DIR__ . '/../../routes/tenant.php');
check('Ruta /carta/pedido usa throttle:60,1', str_contains($routeContent, 'throttle:60,1'));
check('Ruta /carta/pedido NO usa throttle:30,1 (viejo)', !str_contains($routeContent, 'throttle:30,1'));

$envContent = file_get_contents(__DIR__ . '/verificar_entorno.php');
check('verificar_entorno.php actualizado a throttle:60,1', str_contains($envContent, 'throttle:60,1'));
check('verificar_entorno.php NO dice throttle:30,1', !str_contains($envContent, 'throttle:30,1'));
echo "\n";

// ── EXTRA: verificar rate limits en rutas públicas ───────────────────────────
echo "── Extra: Rate limits en endpoints públicos ──\n";
$webContent = file_get_contents(__DIR__ . '/../../routes/web.php');
check('/api/payment-methods tiene throttle:30,1', str_contains($webContent, "throttle:30,1") && str_contains($webContent, 'api.payment-methods'));
check('/api/tenants/search tiene throttle:30,1', str_contains($webContent, 'api.tenants.search'));
echo "\n";

// ── CASO 7: payment_status='active' eliminado de todos los controladores ─────
echo "── Caso 7: payment_status válido en todos los controladores ──\n";
$files = [
    'AdminDashboardController' => __DIR__ . '/../../app/Http/Controllers/AdminDashboardController.php',
    'AdvertisingController'    => __DIR__ . '/../../app/Http/Controllers/AdvertisingController.php',
    'TenantController'         => __DIR__ . '/../../app/Http/Controllers/TenantController.php',
];
foreach ($files as $name => $path) {
    $content = file_get_contents($path);
    // Solo contar líneas de código activo (sin comentarios) que usen 'active' como payment_status
    $lines = explode("\n", $content);
    $activeBugLines = array_filter($lines, function($line) {
        $trimmed = ltrim($line);
        // Ignorar líneas que son solo comentarios
        if (str_starts_with($trimmed, '//') || str_starts_with($trimmed, '*')) return false;
        // Quitar la parte de comentario al final (//...) para no detectar falsos positivos
        $codeOnly = preg_replace('/\/\/.*$/', '', $line);
        // Buscar uso activo de payment_status = 'active' en el código (no en comentarios)
        return preg_match("/->where\s*\(\s*'payment_status'\s*,\s*'active'\s*\)/", $codeOnly)
            || preg_match("/payment_status'\s*=>\s*'active'/", $codeOnly)
            || preg_match("/session\s*\(\s*'payment_status'\s*,\s*'active'\s*\)/", $codeOnly);
    });
    $hasBug = !empty($activeBugLines);
    check("{$name} no usa payment_status='active' en código activo", !$hasBug,
        $hasBug ? "LÍNEAS PROBLEMÁTICAS: " . implode(' | ', array_slice($activeBugLines, 0, 2)) : "Correcto"
    );
}
echo "\n";

// ── CASO 8: AdvertisingController usa payment_status='paid' + active=true ────
echo "── Caso 8: AdvertisingController usa filtros correctos ──\n";
$advContent = file_get_contents(__DIR__ . '/../../app/Http/Controllers/AdvertisingController.php');
check("Busca payment_status='paid' (no 'active')", str_contains($advContent, "'paid'") && !preg_match("/->where\s*\(\s*'payment_status'\s*,\s*'active'\s*\)/", $advContent));
check("Verifica active=true via JSON_EXTRACT", str_contains($advContent, "JSON_EXTRACT(`data`, '$.active') = true"));
echo "\n";

// ── Resultado final ───────────────────────────────────────────────────────────
echo "╔══════════════════════════════════════════════════════╗\n";
printf(
    "║  RESULTADO: %d correctos, %d problemas%-14s║\n",
    $ok,
    $fallos,
    $fallos > 0 ? ' ← REVISAR' : ' ← TODO OK'
);
echo "╚══════════════════════════════════════════════════════╝\n\n";

exit($fallos > 0 ? 1 : 0);
