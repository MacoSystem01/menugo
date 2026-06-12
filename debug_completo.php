<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// Debug completo del problema
$tenantRecord = \App\Models\Tenant::all()->first();
\tenancy()->initialize($tenantRecord);

$cfg = \App\Models\CartaSetting::firstOrCreate([]);

echo "=== DEBUG COMPLETO ===" . PHP_EOL . PHP_EOL;

// 1. Horarios en BD
echo "1. HORARIOS EN BASE DE DATOS:" . PHP_EOL;
echo json_encode($cfg->work_schedule, JSON_PRETTY_PRINT) . PHP_EOL . PHP_EOL;

// 2. Hora actual
$now = now('America/Bogota');
echo "2. HORA ACTUAL:" . PHP_EOL;
echo "   Hora: " . $now->format('Y-m-d H:i:s (D)') . PHP_EOL;
echo "   Zona horaria: America/Bogota" . PHP_EOL;
echo "   Timestamp: " . $now->timestamp . PHP_EOL . PHP_EOL;

// 3. Día actual
$dayMap = ['Sun' => 'dom', 'Mon' => 'lun', 'Tue' => 'mar', 'Wed' => 'mie', 'Thu' => 'jue', 'Fri' => 'vie', 'Sat' => 'sab'];
$todayKey = $dayMap[$now->format('D')] ?? null;
echo "3. DÍA ACTUAL:" . PHP_EOL;
echo "   Clave: " . $todayKey . PHP_EOL;
echo "   Formato D: " . $now->format('D') . PHP_EOL;
echo "   Día numérico: " . $now->format('N') . PHP_EOL . PHP_EOL;

// 4. Horario de hoy
if ($cfg->work_schedule && isset($cfg->work_schedule[$todayKey])) {
    $today = $cfg->work_schedule[$todayKey];
    echo "4. HORARIO HOY:" . PHP_EOL;
    echo json_encode($today, JSON_PRETTY_PRINT) . PHP_EOL . PHP_EOL;
} else {
    echo "4. ERROR: No hay horario para hoy" . PHP_EOL . PHP_EOL;
}

// 5. Cálculos de minutos
echo "5. CÁLCULOS DE MINUTOS:" . PHP_EOL;
$horaActual = (int)$now->format('H') * 60 + (int)$now->format('i');
echo "   Hora actual en minutos: " . $horaActual . PHP_EOL;

if ($cfg->work_schedule && isset($cfg->work_schedule[$todayKey])) {
    $today = $cfg->work_schedule[$todayKey];
    [$hApe, $mApe] = array_map('intval', explode(':', $today['apertura']));
    [$hCie, $mCie] = array_map('intval', explode(':', $today['cierre']));
    $minApertura = $hApe * 60 + $mApe;
    $minCierre = $hCie * 60 + $mCie;
    echo "   Apertura en minutos: " . $minApertura . " (" . $today['apertura'] . ")" . PHP_EOL;
    echo "   Cierre en minutos: " . $minCierre . " (" . $today['cierre'] . ")" . PHP_EOL;
    echo "   ¿Hora >= Apertura? " . ($horaActual >= $minApertura ? 'SÍ' : 'NO') . PHP_EOL;
    echo "   ¿Hora <= Cierre? " . ($horaActual <= $minCierre ? 'SÍ' : 'NO') . PHP_EOL;
}
echo PHP_EOL;

// 6. isOpenNow()
echo "6. RESULTADO isOpenNow():" . PHP_EOL;
$isOpen = $cfg->isOpenNow();
echo "   ¿Abierto? " . ($isOpen ? 'SÍ ✓' : 'NO ✗') . PHP_EOL;
echo PHP_EOL;

// 7. Ver el código del método isOpenNow
echo "7. CÓDIGO DEL MÉTODO isOpenNow():" . PHP_EOL;
$reflection = new ReflectionMethod($cfg, 'isOpenNow');
$filename = $reflection->getFileName();
$startLine = $reflection->getStartLine();
$endLine = $reflection->getEndLine();
echo "   Archivo: " . $filename . PHP_EOL;
echo "   Líneas: " . $startLine . "-" . $endLine . PHP_EOL;
$code = file($filename);
for ($i = $startLine - 1; $i < $endLine; $i++) {
    echo "   " . str_pad($i + 1, 4) . ": " . $code[$i];
}
