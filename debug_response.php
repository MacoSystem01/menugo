<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// Simular una request a /carta
$tenantRecord = \App\Models\Tenant::all()->first();
\tenancy()->initialize($tenantRecord);

// Simular lo que hace CartaController::public()
$tenantId = $tenantRecord->id;
$cfg = \App\Models\CartaSetting::firstOrCreate([]);

// Ver qué se está guardando en cache
echo "=== QUÉ SE ENVÍA AL FRONTEND ===" . PHP_EOL . PHP_EOL;

// Verificar lo que está en cache ahora
$cacheKey = "carta_settings_{$tenantId}";
$cached = \Illuminate\Support\Facades\Cache::get($cacheKey);

echo "1. CACHE actual de '{$cacheKey}':" . PHP_EOL;
if ($cached) {
    echo json_encode($cached, JSON_PRETTY_PRINT) . PHP_EOL;
} else {
    echo "   (vacío - será regenerado)" . PHP_EOL;
}
echo PHP_EOL;

// Lo que debería estar en la respuesta
echo "2. VALORES QUE SE ENVIARÍAN:" . PHP_EOL;
$settingsArray = [
    'work_schedule'      => $cfg->work_schedule ?? null,
    'is_open_now'        => $cfg->isOpenNow(),
    'now_iso'            => now('America/Bogota')->toIso8601String(),
];
echo json_encode($settingsArray, JSON_PRETTY_PRINT) . PHP_EOL;
