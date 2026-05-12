<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Detecta si estamos en contexto tenant (BD del restaurante)
        if (tenancy()->initialized) {
            $this->call(TenantDatabaseSeeder::class);
            return;
        }

        // Central: roles + super-admin
        $this->call([
            RolesAndPermissionsSeeder::class,
            AdminUserSeeder::class,
        ]);
    }
}
