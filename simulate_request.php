<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

$tenant = \App\Models\Tenant::first();
if ($tenant) {
    tenancy()->initialize($tenant);
}

$request = Illuminate\Http\Request::create('/carta/pedido', 'POST', [
    'customer_name' => null,
    'customer_phone' => null,
    'type' => 'mostrador',
    'payment_method' => 'efectivo',
    'items' => [
        ['dish_id' => \App\Models\Dish::first()->id ?? 1, 'quantity' => 1]
    ]
]);

$response = $kernel->handle($request);
if ($response->getStatusCode() === 500) {
    echo $response->getContent();
} else {
    echo "Status: " . $response->getStatusCode() . "\n";
    echo $response->getContent();
}
