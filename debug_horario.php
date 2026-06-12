<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// Obtener el tenant tajada
$tenantRecord = \App\Models\Tenant::all()->first(); // Obtener el primer tenant
if (!$tenantRecord) {
    die("No hay tenants");
}

\tenancy()->initialize($tenantRecord);

$cfg = \App\Models\CartaSetting::firstOrCreate([]);

echo "=== DEBUG HORARIO TAJADA ===" . PHP_EOL;
echo "ID Tenant: " . $tenantRecord->id . PHP_EOL;
echo "Nombre: " . $tenantRecord->name . PHP_EOL;
echo PHP_EOL;

echo "Horario configurado:" . PHP_EOL;
echo json_encode($cfg->work_schedule, JSON_PRETTY_PRINT) . PHP_EOL;
echo PHP_EOL;

$now = now('America/Bogota');
echo "Hora actual servidor: " . $now->format('Y-m-d H:i:s (D)') . PHP_EOL;

$dayMap = ['Sun' => 'dom', 'Mon' => 'lun', 'Tue' => 'mar', 'Wed' => 'mie', 'Thu' => 'jue', 'Fri' => 'vie', 'Sat' => 'sab'];
$todayKey = $dayMap[$now->format('D')] ?? null;
echo "Día de hoy clave: " . $todayKey . PHP_EOL;

if ($cfg->work_schedule && isset($cfg->work_schedule[$todayKey])) {
    $today = $cfg->work_schedule[$todayKey];
    echo "Horario hoy: " . json_encode($today) . PHP_EOL;
    
    $horaActual = (int)$now->format('H') * 60 + (int)$now->format('i');
    [$hApe, $mApe] = array_map('intval', explode(':', $today['apertura']));
    [$hCie, $mCie] = array_map('intval', explode(':', $today['cierre']));
    $minApertura = $hApe * 60 + $mApe;
    $minCierre = $hCie * 60 + $mCie;
    
    echo "Hora actual en minutos: " . $horaActual . PHP_EOL;
    echo "Apertura en minutos: " . $minApertura . PHP_EOL;
    echo "Cierre en minutos: " . $minCierre . PHP_EOL;
    echo PHP_EOL;
    echo "¿Está abierto ahora? " . ($cfg->isOpenNow() ? 'SÍ ✓' : 'NO ✗') . PHP_EOL;
} else {
    echo "ERROR: No hay horario configurado para hoy" . PHP_EOL;
}
