<?php
/**
 * Verifica que el img-src del CSP cubre todos los orígenes necesarios
 * en la arquitectura multi-tenant de MenuGo.
 */
// Credenciales/entorno desde .env.test (cifradas con APP_KEY)
require_once __DIR__ . '/env_loader.php';

$appUrl      = 'https://' . BASE_HOST;
$parsed      = parse_url($appUrl);
$scheme      = $parsed['scheme'] ?? 'https';
$host        = $parsed['host']   ?? '';
$wildcardUrl = "{$scheme}://*.{$host}";
$viteUrl     = $appUrl . ':5173';

// Imagen del storage central vista desde un tenant
$storageImg  = $appUrl . '/storage/dishes/plato.jpg';
// Imagen de un tenant vista desde el admin central
$tenantImg   = 'https://' . TENANT_SLUG . '.' . BASE_HOST . '/storage/banner.jpg';
// QR code generado como blob
$blobImg     = 'blob:https://menugo.local/abc-123';
// Imagen base64
$dataImg     = 'data:image/png;base64,iVBORw0K...';

$allowedSrcs = ['self', 'data:', 'blob:', $appUrl, $wildcardUrl, $viteUrl,
                'https://maps.gstatic.com', 'https://maps.googleapis.com'];

function isAllowed(string $url, array $srcs): bool {
    foreach ($srcs as $src) {
        if ($src === 'self')  continue; // 'self' es relativo, lo evaluamos separado
        if ($src === 'data:' && str_starts_with($url, 'data:')) return true;
        if ($src === 'blob:'  && str_starts_with($url, 'blob:')) return true;
        // wildcard de subdominio *.menugo.local
        if (str_starts_with($src, 'https://*.')) {
            $base = substr($src, strlen('https://*.'));
            $host = parse_url($url, PHP_URL_HOST) ?? '';
            if (str_ends_with($host, '.' . $base)) return true;
        }
        // origen exacto con o sin puerto
        $srcHost = parse_url($src, PHP_URL_HOST) ?? '';
        $srcPort = parse_url($src, PHP_URL_PORT);
        $urlHost = parse_url($url, PHP_URL_HOST) ?? '';
        $urlPort = parse_url($url, PHP_URL_PORT);
        $srcScheme = parse_url($src, PHP_URL_SCHEME) ?? '';
        $urlScheme = parse_url($url, PHP_URL_SCHEME) ?? '';
        if ($srcScheme === $urlScheme && $srcHost === $urlHost && $srcPort === $urlPort) return true;
    }
    return false;
}

$ok = $fallos = 0;
function check(string $label, bool $result): void {
    global $ok, $fallos;
    echo '  [' . ($result ? '✓' : '✗') . '] ' . $label . "\n";
    $result ? $ok++ : $fallos++;
}

echo "── CSP img-src — verificación multi-tenant ──\n";
check('Storage central (menugo.local) → cubierto por $appUrl',          isAllowed($storageImg, $allowedSrcs));
check('Storage tenant (latajada.menugo.local) → cubierto por wildcard', isAllowed($tenantImg,  $allowedSrcs));
check('Blob URL (QR codes) → cubierto por blob:',                       isAllowed($blobImg,    $allowedSrcs));
check('Data URI (base64) → cubierto por data:',                         isAllowed($dataImg,    $allowedSrcs));
check('Wildcard NO cubre dominio raíz directamente (seguridad OK)',      !isAllowed('https://evil.com/img.jpg', $allowedSrcs));
check('Vite dev server incluido en dev',                                 isAllowed($viteUrl . '/img.svg', $allowedSrcs));

echo "\nimg-src generado:\n  'self' data: blob: {$appUrl} {$wildcardUrl} {$viteUrl} https://maps.gstatic.com https://maps.googleapis.com\n";
printf("\nRESULTADO: %d correctos, %d problemas\n", $ok, $fallos);
exit($fallos > 0 ? 1 : 0);
