<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// Obtener el primer tenant (tajada)
$tenantRecord = \App\Models\Tenant::all()->first();
\tenancy()->initialize($tenantRecord);

$cfg = \App\Models\CartaSetting::firstOrCreate([]);

$newSchedule = [
    "lun" => ["activo" => false, "apertura" => "08:00", "cierre" => "22:00"],
    "mar" => ["activo" => false, "apertura" => "08:00", "cierre" => "22:00"],
    "mie" => ["activo" => true, "apertura" => "17:30", "cierre" => "22:00"],
    "jue" => ["activo" => true, "apertura" => "05:30", "cierre" => "22:00"],
    "vie" => ["activo" => true, "apertura" => "09:30", "cierre" => "22:00"],
    "sab" => ["activo" => true, "apertura" => "17:30", "cierre" => "23:00"],
    "dom" => ["activo" => false, "apertura" => "09:00", "cierre" => "21:00"]
];

$cfg->update(['work_schedule' => $newSchedule]);

echo "✓ Horarios actualizados correctamente" . PHP_EOL;
echo json_encode($newSchedule, JSON_PRETTY_PRINT) . PHP_EOL;
echo PHP_EOL;

// Verificar que ahora está abierto
echo "Abierto ahora: " . ($cfg->fresh()->isOpenNow() ? 'SÍ ✓' : 'NO ✗') . PHP_EOL;
echo "Hora actual: " . now('America/Bogota')->format('H:i') . PHP_EOL;
