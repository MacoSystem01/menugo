<?php
$validator = \Illuminate\Support\Facades\Validator::make(
    ['customer_phone' => null],
    ['customer_phone' => ['nullable', 'string', 'max:20', 'regex:/^[\d\s\+\-\(\)]+$/']]
);
if ($validator->fails()) {
    echo "Fails!\n";
    print_r($validator->errors());
} else {
    echo "Passes!\n";
}
