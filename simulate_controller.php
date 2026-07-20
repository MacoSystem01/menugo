<?php
$tenant = \App\Models\Tenant::first();
tenancy()->initialize($tenant);

$request = new \Illuminate\Http\Request();
$request->merge([
    'customer_name' => null,
    'customer_phone' => null,
    'type' => 'mostrador',
    'payment_method' => 'Efectivo',
    'items' => [
        ['dish_id' => \App\Models\Dish::first()->id ?? 1, 'quantity' => 1]
    ]
]);

$controller = new \App\Http\Controllers\CartaController();
try {
    $response = $controller->placeOrder($request);
    echo "Success: " . get_class($response);
} catch (\Exception $e) {
    echo "Exception: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString();
}
