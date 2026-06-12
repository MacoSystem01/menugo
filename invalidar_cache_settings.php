<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// Obtener el primer tenant (tajada)
$tenantRecord = \App\Models\Tenant::all()->first();
$tenantId = $tenantRecord->id;

// Invalidar el cache específico de settings
\Illuminate\Support\Facades\Cache::forget("carta_settings_{$tenantId}");
\Illuminate\Support\Facades\Cache::forget("carta_public_{$tenantId}");

echo "✓ Cache invalidado para tenant: {$tenantId}" . PHP_EOL;

// Verificar nuevamente
\tenancy()->initialize($tenantRecord);
$cfg = \App\Models\CartaSetting::first();
echo "¿Abierto ahora? " . ($cfg->isOpenNow() ? 'SÍ ✓' : 'NO ✗') . PHP_EOL;
