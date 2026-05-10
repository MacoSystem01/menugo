<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::firstOrCreate(
            ['email' => 'admin@menugo.com'],
            [
                'name'     => 'Administrador',
                'password' => Hash::make('admin1234'),
                'phone'    => null,
                'active'   => true,
            ]
        );
        $admin->assignRole('administrador');
    }
}
