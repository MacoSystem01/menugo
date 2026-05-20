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
            ['email' => 'admin@Menugo.com'],
            [
                'name'     => 'Administrador',
                'password' => Hash::make('admin1234'),
                'phone'    => null,
                'active'   => true,
            ]
        );
        $admin->assignRole('administrador');

        $super = User::firstOrCreate(
            ['email' => 'superadmin@Menugo.com'],
            [
                'name'     => 'Super Admin',
                'password' => Hash::make('Admin@2026'),
                'phone'    => null,
                'active'   => true,
            ]
        );
        $super->assignRole('administrador');
    }
}
