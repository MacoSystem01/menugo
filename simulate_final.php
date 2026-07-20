<?php
$tenant = \App\Models\Tenant::first();
tenancy()->initialize($tenant);

$dish = \App\Models\Dish::first();
if (!$dish) {
    die("No dishes found. Cannot simulate.");
}

$request = new \Illuminate\Http\Request();
$request->merge([
    'customer_name' => null,
    'customer_phone' => null,
    'type' => 'mostrador',
    'payment_method' => 'efectivo',
    'items' => [
        ['dish_id' => $dish->id, 'quantity' => 1]
    ]
]);

$controller = new \App\Http\Controllers\CartaController();
try {
    $response = $controller->placeOrder($request);
    echo "Success!\n";
    print_r($response);
} catch (\Illuminate\Validation\ValidationException $e) {
    echo "Validation Errors:\n";
    print_r($e->errors());
} catch (\Exception $e) {
    echo "Exception: " . $e->getMessage() . "\n" . $e->getTraceAsString();
}
