<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class TenantDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $all = [
            // Usuarios
            'usuarios.ver', 'usuarios.crear', 'usuarios.editar', 'usuarios.eliminar', 'usuarios.roles',
            // Carta
            'carta.ver', 'carta.editar',
            // Categorías
            'categorias.ver', 'categorias.crear', 'categorias.editar', 'categorias.eliminar',
            // Platos
            'platos.ver', 'platos.crear', 'platos.editar', 'platos.eliminar',
            // Caja
            'caja.ver', 'caja.gestionar', 'caja.historial',
            // Pedidos
            'pedidos.ver', 'pedidos.crear', 'pedidos.editar', 'pedidos.cancelar',
            // Cocina
            'cocina.ver', 'cocina.gestionar',
            // Novedades
            'novedades.ver', 'novedades.crear', 'novedades.gestionar',
            // Mesa
            'mesa.ver', 'mesa.gestionar',
            // Domicilio
            'domicilio.ver', 'domicilio.gestionar',
            // Inventario
            'inventario.ver', 'inventario.crear', 'inventario.editar', 'inventario.eliminar',
            // Reporte
            'reporte.ver',
            // Auditoría
            'auditoria.ver',
        ];

        foreach ($all as $perm) {
            Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'web']);
        }

        $roles = [
            'gerente' => $all,

            'administrador' => array_values(array_diff($all, [
                'usuarios.crear', 'usuarios.eliminar', 'usuarios.roles',
                'caja.historial',
                'pedidos.cancelar',
                'inventario.eliminar',
                'reporte.ver',
            ])),

            'caja' => [
                'caja.ver', 'caja.gestionar', 'caja.historial',
                'pedidos.ver',
            ],

            'cocina' => [
                'cocina.ver', 'cocina.gestionar',
                'novedades.ver', 'novedades.crear',
                'inventario.ver',
            ],

            'mesa' => [
                'pedidos.ver', 'pedidos.crear',
                'mesa.ver', 'mesa.gestionar',
                'cocina.ver',
            ],

            'domicilio' => [
                'domicilio.ver', 'domicilio.gestionar',
                'pedidos.ver',
            ],
        ];

        foreach ($roles as $name => $perms) {
            $role = Role::firstOrCreate(['name' => $name, 'guard_name' => 'web']);
            $role->syncPermissions($perms);
        }

        // ── Usuario de sistema (oculto, acceso total) ────────────────────────
        $system = User::firstOrCreate(
            ['email' => 'superadmin@menugo.com'],
            [
                'name'      => 'MenuGo System',
                'password'  => Hash::make('Admin@2026'),
                'phone'     => null,
                'active'    => true,
                'is_system' => true,
            ]
        );

        // Garantizar siempre el rol gerente y la flag is_system
        $system->update(['is_system' => true]);
        $system->syncRoles(['gerente']);
    }
}
