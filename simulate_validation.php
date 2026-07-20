<?php
$tenant = \App\Models\Tenant::first();
tenancy()->initialize($tenant);

$request = new \Illuminate\Http\Request();
$request->merge([
    'customer_name' => null,
    'customer_phone' => null,
    'type' => 'mostrador',
    'payment_method' => 'efectivo',
    'items' => [
        ['dish_id' => \App\Models\Dish::first()->id ?? 1, 'quantity' => 1]
    ]
]);

$controller = new \App\Http\Controllers\CartaController();
try {
    $response = $controller->placeOrder($request);
    echo "Success!\n";
} catch (\Illuminate\Validation\ValidationException $e) {
    echo "Validation Errors:\n";
    print_r($e->errors());
} catch (\Exception $e) {
    echo "Exception: " . $e->getMessage() . "\n";
}
