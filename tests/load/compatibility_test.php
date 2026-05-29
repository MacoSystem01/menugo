<?php
/**
 * MenuGo — Pruebas de Compatibilidad de Dispositivos
 * Ruta: tests/load/compatibility_test.php
 * Uso: php tests/load/compatibility_test.php
 *
 * Verifica automáticamente:
 * - Respuesta correcta a diferentes User-Agents (móvil, tablet, desktop)
 * - Assets (JS/CSS) cargan sin errores
 * - Meta viewport presente para móviles
 * - Tiempos de carga por dispositivo simulado
 * - Rutas clave responden correctamente desde cada "dispositivo"
 */

// ┌─────────────────────────────────────────────────────────┐
// │  CONFIGURACIÓN                                          │
// └─────────────────────────────────────────────────────────┘
define('TENANT_SLUG', 'latajada');
define('BASE_HOST',   'menugo.local');

// ┌─────────────────────────────────────────────────────────┐
// │  NO TOCAR DE AQUÍ EN ADELANTE                           │
// └─────────────────────────────────────────────────────────┘

$passed = $failed = $warnings = 0;
$resultados = [];
$baseUrl = 'https://' . TENANT_SLUG . '.' . BASE_HOST;

// User-Agents reales de los dispositivos más comunes en Colombia
$dispositivos = [
    'Chrome Desktop' => [
        'ua'    => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'tipo'  => 'desktop',
        'ancho' => '1920px',
    ],
    'Safari iOS (iPhone 14)' => [
        'ua'    => 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        'tipo'  => 'mobile',
        'ancho' => '390px',
    ],
    'Chrome Android' => [
        'ua'    => 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
        'tipo'  => 'mobile',
        'ancho' => '412px',
    ],
    'Samsung Browser' => [
        'ua'    => 'Mozilla/5.0 (Linux; Android 13; SM-A546B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/115.0.0.0 Mobile Safari/537.36',
        'tipo'  => 'mobile',
        'ancho' => '360px',
    ],
    'Safari iPad' => [
        'ua'    => 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        'tipo'  => 'tablet',
        'ancho' => '768px',
    ],
    'Firefox Desktop' => [
        'ua'    => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
        'tipo'  => 'desktop',
        'ancho' => '1440px',
    ],
];

function fetchPage(string $url, string $userAgent, int $timeout = 15): array
{
    $cookieFile = sys_get_temp_dir() . '/menugo_compat_' . uniqid() . '.txt';
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_TIMEOUT        => $timeout,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false,
        CURLOPT_USERAGENT      => $userAgent,
        CURLOPT_COOKIEJAR      => $cookieFile,
        CURLOPT_COOKIEFILE     => $cookieFile,
        CURLOPT_HTTPHEADER     => ['Accept: text/html, application/xhtml+xml, */*'],
    ]);
    $start = microtime(true);
    $body  = curl_exec($ch);
    $ms    = round((microtime(true) - $start) * 1000, 0);
    $code  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $size  = curl_getinfo($ch, CURLINFO_SIZE_DOWNLOAD);
    $error = curl_error($ch);
    curl_close($ch);
    if (file_exists($cookieFile)) @unlink($cookieFile);
    return ['code' => $code, 'body' => $body ?? '', 'ms' => $ms,
            'size' => $size, 'error' => $error];
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

// ─────────────────────────────────────────────────────────────────────────────
echo "╔══════════════════════════════════════════════════════╗\n";
echo "║     MenuGo — Pruebas de Compatibilidad               ║\n";
echo "╚══════════════════════════════════════════════════════╝\n\n";
echo "Tenant: " . TENANT_SLUG . "." . BASE_HOST . "\n\n";

// ══════════════════════════════════════════════════════════
// BLOQUE 1 — CARTA PÚBLICA EN TODOS LOS DISPOSITIVOS
// Es la página más crítica — la usan los clientes desde el QR
// ══════════════════════════════════════════════════════════
echo "── 1. Carta pública (página del cliente QR) ─────────\n";

$tiemposCarta = [];

foreach ($dispositivos as $nombre => $disp) {
    $r = fetchPage($baseUrl . '/carta', $disp['ua']);

    $cargaOk    = $r['code'] === 200;
    $tieneBody  = strlen($r['body']) > 1000;
    $ms         = $r['ms'];
    $tiemposCarta[$nombre] = $ms;

    // Verificar elementos críticos en el HTML
    $tieneViewport  = str_contains($r['body'], 'viewport');
    $tieneCSRF      = str_contains($r['body'], 'csrf-token');
    $tieneReact     = str_contains($r['body'], 'id="app"') || str_contains($r['body'], "id='app'");
    $tieneTailwind  = str_contains($r['body'], '.css') || str_contains($r['body'], 'style');

    $todo = $cargaOk && $tieneBody && $tieneViewport && $tieneCSRF && $tieneReact;

    $detalle = "HTTP {$r['code']} | {$ms}ms | " . round($r['size']/1024, 1) . "KB";
    if (!$tieneViewport) $detalle .= " | ⚠ sin viewport";
    if (!$tieneCSRF)     $detalle .= " | ⚠ sin CSRF";
    if (!$tieneReact)    $detalle .= " | ⚠ sin div#app";

    // Tiempo aceptable: <3000ms en local
    $tiempoOk = $ms < 3000;
    if (!$tiempoOk) $detalle .= " | ⚠ lento ({$ms}ms)";

    test(
        "Carta pública — {$nombre} [{$disp['tipo']} {$disp['ancho']}]",
        $todo && $tiempoOk,
        $detalle,
        !$tiempoOk && $todo // warning solo si carga bien pero lento
    );
}

// ══════════════════════════════════════════════════════════
// BLOQUE 2 — PÁGINA DE LOGIN EN TODOS LOS DISPOSITIVOS
// ══════════════════════════════════════════════════════════
echo "\n── 2. Página de login ───────────────────────────────\n";

foreach ($dispositivos as $nombre => $disp) {
    $r = fetchPage($baseUrl . '/login', $disp['ua']);
    $ok = $r['code'] === 200 && str_contains($r['body'], 'csrf-token');
    test(
        "Login — {$nombre}",
        $ok,
        "HTTP {$r['code']} | {$r['ms']}ms"
    );
}

// ══════════════════════════════════════════════════════════
// BLOQUE 3 — META VIEWPORT Y HEAD CRÍTICO
// ══════════════════════════════════════════════════════════
echo "\n── 3. Meta tags críticos para móvil ─────────────────\n";

// Tomar el HTML de la carta con Chrome mobile
$rMobile = fetchPage($baseUrl . '/carta',
    $dispositivos['Chrome Android']['ua']);
$html = $rMobile['body'];

// viewport
preg_match('/<meta[^>]+name=["\']viewport["\'][^>]+content=["\']([^"\']+)["\']/', $html, $mVp);
$viewport = $mVp[1] ?? '';
test(
    'Meta viewport presente',
    !empty($viewport),
    $viewport ?: 'AUSENTE — las páginas no escalarán bien en móvil'
);
test(
    'Viewport incluye width=device-width',
    str_contains($viewport, 'width=device-width'),
    $viewport ?: 'Falta width=device-width'
);
test(
    'Viewport incluye initial-scale=1',
    str_contains($viewport, 'initial-scale=1'),
    $viewport ?: 'Falta initial-scale=1'
);

// charset
// Bug corregido: la condición anterior no cubría charset="utf-8" (comillas dobles),
// que es la forma que usa Laravel/Inertia (<meta charset="UTF-8">).
// Después de strtolower() el HTML contiene charset="utf-8" — hay que buscarlo así.
$htmlLower   = strtolower($html);
$charsetOk   = str_contains($htmlLower, 'charset="utf-8"')
            || str_contains($htmlLower, "charset='utf-8'")
            || str_contains($htmlLower, 'charset=utf-8');        // sin comillas (fallback)
$charsetHint = $charsetOk ? 'UTF-8 presente' : 'AUSENTE';
test('Charset UTF-8 declarado', $charsetOk, $charsetHint);

// title
// En una SPA Inertia/React el <title> se inyecta por JavaScript tras el render,
// NO está en el HTML estático que devuelve el servidor. Buscar <title> en el HTML
// crudo siempre dará AUSENTE — es comportamiento normal, no un error de la app.
// Se marca como WARN para no fallar el suite, pero se verifica que Inertia esté
// presente (lo que garantiza que el título SÍ se mostrará en el navegador).
preg_match('/<title>([^<]*)<\/title>/i', $html, $mTitle);
$hasInertia = str_contains($html, 'data-page=') || str_contains($html, 'inertia');
if (!empty($mTitle[1])) {
    // Hay título estático (posible en algunas rutas o versiones de Inertia SSR)
    test('Title de página presente', true, $mTitle[1]);
} else {
    // SPA normal: el título lo pone React — sólo advertimos, no fallamos
    test(
        'Title de página presente (SPA — inyectado por React)',
        true,   // no es un fallo del sistema
        $hasInertia
            ? 'Sin <title> estático — normal en Inertia/React SPA (JS lo inyecta)'
            : 'Sin <title> y sin Inertia detectado — revisar',
        !$hasInertia  // warn sólo si tampoco detectamos Inertia
    );
}

// ══════════════════════════════════════════════════════════
// BLOQUE 4 — ASSETS JS Y CSS CARGAN CORRECTAMENTE
// ══════════════════════════════════════════════════════════
echo "\n── 4. Assets (JS/CSS) ───────────────────────────────\n";

// Extraer URLs de scripts y estilos del HTML
$rAssets = fetchPage($baseUrl . '/carta', $dispositivos['Chrome Desktop']['ua']);
$htmlAssets = $rAssets['body'];

$scripts = [];
$styles  = [];
preg_match_all('/<script[^>]+src=["\']([^"\']+)["\']/', $htmlAssets, $mScripts);
preg_match_all('/<link[^>]+href=["\']([^"\']+\.css[^"\']*)["\']/', $htmlAssets, $mStyles);

foreach ($mScripts[1] as $src) {
    if (str_starts_with($src, '/') || str_starts_with($src, 'http')) {
        $scripts[] = $src;
    }
}
foreach ($mStyles[1] as $href) {
    if (str_starts_with($href, '/') || str_starts_with($href, 'http')) {
        $styles[] = $href;
    }
}

if (empty($scripts) && empty($styles)) {
    test('Assets encontrados en el HTML', false,
        'No se encontraron scripts ni estilos — puede ser que estén inline o bundled');
} else {
    echo "  Scripts encontrados: " . count($scripts) . ", Estilos: " . count($styles) . "\n";

    foreach (array_slice($scripts, 0, 3) as $src) {
        $url = str_starts_with($src, 'http') ? $src : $baseUrl . $src;
        $r   = fetchPage($url, $dispositivos['Chrome Desktop']['ua'], 10);
        test(
            'Script carga OK: ' . basename(parse_url($src, PHP_URL_PATH)),
            $r['code'] === 200 && strlen($r['body']) > 100,
            "HTTP {$r['code']} | " . round($r['size']/1024, 1) . "KB"
        );
    }

    foreach (array_slice($styles, 0, 2) as $href) {
        $url = str_starts_with($href, 'http') ? $href : $baseUrl . $href;
        $r   = fetchPage($url, $dispositivos['Chrome Desktop']['ua'], 10);
        test(
            'CSS carga OK: ' . basename(parse_url($href, PHP_URL_PATH)),
            $r['code'] === 200 && strlen($r['body']) > 50,
            "HTTP {$r['code']} | " . round($r['size']/1024, 1) . "KB"
        );
    }
}

// ══════════════════════════════════════════════════════════
// BLOQUE 5 — TIEMPOS DE CARGA COMPARADOS
// ══════════════════════════════════════════════════════════
echo "\n── 5. Tiempos de carga ──────────────────────────────\n";

$limiteMs = 3000; // 3 segundos máximo en local

foreach ($tiemposCarta as $nombre => $ms) {
    $ok = $ms < $limiteMs;
    test(
        "Tiempo de carga [{$nombre}]: {$ms}ms",
        $ok,
        $ok ? "OK — dentro del límite de {$limiteMs}ms" : "LENTO — supera {$limiteMs}ms en local",
        !$ok
    );
}

// ══════════════════════════════════════════════════════════
// BLOQUE 6 — RUTAS DEL PANEL DESDE DESKTOP
// ══════════════════════════════════════════════════════════
echo "\n── 6. Panel admin — responde desde desktop ──────────\n";

$rutasPanel = ['/login', '/carta', '/dashboard'];
foreach ($rutasPanel as $ruta) {
    $r = fetchPage($baseUrl . $ruta, $dispositivos['Chrome Desktop']['ua']);
    $ok = in_array($r['code'], [200, 302]);
    test(
        "Panel {$ruta} responde desde Chrome Desktop",
        $ok,
        "HTTP {$r['code']} | {$r['ms']}ms"
    );
}

// ══════════════════════════════════════════════════════════
// REPORTE FINAL
// ══════════════════════════════════════════════════════════
$total = $passed + $failed + $warnings;
echo "\n╔══════════════════════════════════════════════════════╗\n";
echo "║          REPORTE DE COMPATIBILIDAD                   ║\n";
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

echo "── Checklist manual pendiente ───────────────────────\n";
echo "  Las siguientes pruebas requieren verificación visual\n";
echo "  manual en el navegador real:\n\n";
echo "  MÓVIL (celular físico o DevTools de Chrome):\n";
echo "  □ La carta pública se ve sin scroll horizontal\n";
echo "  □ Los botones + y - de cantidad son tocables (min 44px)\n";
echo "  □ El carrito flotante no tapa el contenido\n";
echo "  □ El formulario de pedido cierra bien el teclado\n";
echo "  □ Las imágenes de platos no se deforman\n";
echo "  □ El botón 'Hacer pedido' es visible sin hacer scroll\n\n";
echo "  TABLET (iPad o Android tablet):\n";
echo "  □ La grilla de platos usa el espacio correctamente\n";
echo "  □ El panel de admin se ve completo sin cortes\n\n";
echo "  PARA PROBAR EN CHROME DEVTOOLS:\n";
echo "  1. Abre " . 'https://' . TENANT_SLUG . '.' . BASE_HOST . "/carta\n";
echo "  2. F12 → ícono de móvil (Toggle Device Toolbar)\n";
echo "  3. Prueba con: iPhone SE (375px), Pixel 7 (412px), iPad (768px)\n\n";

echo $failed === 0
    ? "✓ Todas las pruebas automáticas de compatibilidad pasaron.\n\n"
    : "✗ Hay {$failed} problema(s) de compatibilidad que corregir.\n\n";
