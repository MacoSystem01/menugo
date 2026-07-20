<?php
$ch = curl_init('http://127.0.0.1:8080/carta/pedido');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json',
    'Host: restaurante.menugo.local'
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'type' => 'mostrador',
    'payment_method' => 'efectivo',
    'customer_name' => null,
    'customer_phone' => null,
    'items' => [
        ['dish_id' => 1, 'quantity' => 1]
    ]
]));
$response = curl_exec($ch);
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
echo "HTTP $httpcode\n";
echo $response;
