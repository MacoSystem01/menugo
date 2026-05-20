<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$email = 'superadmin@Menugo.com';
$password = 'Admin@2026';

$user = User::firstOrCreate(
    ['email' => $email],
    [
        'name'     => 'Super Admin',
        'password' => Hash::make($password),
        'phone'    => null,
        'active'   => true,
    ]
);

// Asegurar que tiene el rol administrador
if (!$user->hasRole('administrador')) {
    $user->assignRole('administrador');
}

echo "Usuario '{$email}' creado/actualizado con éxito.\n";
