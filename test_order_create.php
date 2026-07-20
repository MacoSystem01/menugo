<?php
$tenant = \App\Models\Tenant::first();
tenancy()->initialize($tenant);

try {
    $order = \App\Models\Order::create([
        'customer_name'     => 'Cliente',
        'customer_phone'    => null,
        'type'              => 'mostrador',
        'table_id'          => null,
        'turn_number'       => 1,
        'tracking_token'    => (string) \Illuminate\Support\Str::uuid(),
        'delivery_address'  => null,
        'delivery_phone'    => null,
        'delivery_fee'      => 0,
        'payment_method'    => 'efectivo',
        'notes'             => null,
        'status'            => 'pending',
        'total'             => 10000,
    ]);
    echo "Order created successfully. ID: " . $order->id . "\n";
} catch (\Exception $e) {
    echo "Exception: " . $e->getMessage() . "\n";
}
