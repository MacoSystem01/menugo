<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$tenant = \App\Models\Tenant::first();
if ($tenant) {
    tenancy()->initialize($tenant);
    $columns = DB::select('SHOW COLUMNS FROM carta_settings');
    echo json_encode($columns, JSON_PRETTY_PRINT);
} else {
    echo "No tenant found";
}
