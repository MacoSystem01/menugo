<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class TenantDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            'usuarios.ver','usuarios.crear','usuarios.editar','usuarios.eliminar',
            'categorias.ver','categorias.crear','categorias.editar','categorias.eliminar',
            'platos.ver','platos.crear','platos.editar','platos.eliminar',
            'caja.ver','caja.gestionar',
            'pedidos.ver','pedidos.crear','pedidos.cancelar',
            'cocina.ver','cocina.gestionar',
            'novedades.ver','novedades.crear',
            'mesa.ver','mesa.gestionar',
            'domicilio.ver','domicilio.gestionar',
            'inventario.ver','inventario.crear','inventario.editar','inventario.eliminar',
            'reporte.ver',
        ];

        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'web']);
        }

        $roles = [
            'administrador' => $permissions,
            'gerente'       => $permissions,
            'caja'          => ['caja.ver','caja.gestionar','pedidos.ver','pedidos.crear','pedidos.cancelar','mesa.ver'],
            'cocina'        => ['cocina.ver','cocina.gestionar','novedades.ver','novedades.crear','pedidos.ver'],
            'mesa'          => ['pedidos.ver','mesa.ver','mesa.gestionar'],
            'domicilio'     => ['domicilio.ver','domicilio.gestionar','pedidos.ver'],
        ];

        foreach ($roles as $roleName => $rolePerms) {
            $role = Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
            $role->syncPermissions($rolePerms);
        }
    }
}
