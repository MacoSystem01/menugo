<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // ── Permisos por módulo ──────────────────────────────────────────
        $permissions = [
            // Usuarios
            'usuarios.ver', 'usuarios.crear', 'usuarios.editar', 'usuarios.eliminar',
            // Menú
            'categorias.ver', 'categorias.crear', 'categorias.editar', 'categorias.eliminar',
            'platos.ver',     'platos.crear',     'platos.editar',     'platos.eliminar',
            // Caja
            'caja.ver', 'caja.gestionar',
            // Pedidos
            'pedidos.ver', 'pedidos.crear', 'pedidos.cancelar',
            // Cocina
            'cocina.ver', 'cocina.gestionar',
            'novedades.ver', 'novedades.crear',
            // Mesa
            'mesa.ver', 'mesa.gestionar',
            // Domicilio
            'domicilio.ver', 'domicilio.gestionar',
            // Inventario
            'inventario.ver', 'inventario.crear', 'inventario.editar', 'inventario.eliminar',
            // Reporte
            'reporte.ver',
            // Config técnica
            'config.tecnica',
        ];

        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm]);
        }

        // ── Roles y sus permisos ─────────────────────────────────────────
        $roles = [
            'administrador' => array_diff($permissions, []),   // acceso total
            'gerente'       => array_diff($permissions, ['config.tecnica']),
            'caja'          => ['caja.ver', 'caja.gestionar', 'pedidos.ver', 'pedidos.crear', 'pedidos.cancelar', 'mesa.ver'],
            'cocina'        => ['cocina.ver', 'cocina.gestionar', 'novedades.ver', 'novedades.crear', 'pedidos.ver'],
            'mesa'          => ['pedidos.ver', 'mesa.ver', 'mesa.gestionar'],
            'domicilio'     => ['domicilio.ver', 'domicilio.gestionar', 'pedidos.ver'],
        ];

        foreach ($roles as $roleName => $rolePerms) {
            $role = Role::firstOrCreate(['name' => $roleName]);
            $role->syncPermissions($rolePerms);
        }
    }
}
