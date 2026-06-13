<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Credenciales desde .env.test (cifradas con APP_KEY)
require_once __DIR__ . '/env_loader.php';

echo "Iniciando...\n";

if (!function_exists('curl_init')) {
    echo "ERROR: curl no está habilitado en PHP\n";
    exit(1);
}

echo "curl disponible\n";

$ch = curl_init('https://' . TENANT_SLUG . '.' . BASE_HOST . '/carta');

if (!$ch) {
    echo "ERROR: curl_init falló\n";
    exit(1);
}

curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_TIMEOUT        => 15,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_SSL_VERIFYHOST => false,
    CURLOPT_USERAGENT      => 'Mozilla/5.0 (Test)',
    CURLOPT_HTTPHEADER     => ['Accept: text/html, application/xhtml+xml'],
]);

echo "Enviando request...\n";

$body  = curl_exec($ch);
$code  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

echo "HTTP: " . $code . "\n";
echo "Error cURL: " . ($error ?: 'ninguno') . "\n";
echo "Body recibido: " . strlen($body) . " bytes\n";
echo "Tiene csrf-token: " . (str_contains($body ?: '', 'csrf-token') ? 'SI' : 'NO') . "\n";
echo "Primeros 500 chars:\n" . substr(strip_tags($body ?: ''), 0, 500) . "\n";